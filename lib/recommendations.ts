import { FavoritesManager, type FavoriteItem } from "./favorites"
import { RatingsManager, type RatingData } from "./ratings"
import { HistoryManager, type SearchHistory } from "./history"

export interface RecommendationItem {
  question: string
  score: number
  reason: string
  category: "similar" | "related" | "trending" | "personalized"
}

export class RecommendationEngine {
  private static readonly KEYWORDS_WEIGHT = 0.4
  private static readonly RATING_WEIGHT = 0.3
  private static readonly FREQUENCY_WEIGHT = 0.2
  private static readonly RECENCY_WEIGHT = 0.1

  // 预设的热门问题和相关问题库
  private static readonly QUESTION_DATABASE = [
    {
      question: "如何提高学习效率？",
      keywords: ["学习", "效率", "方法", "技巧"],
      category: "学习方法",
    },
    {
      question: "时间管理的最佳实践是什么？",
      keywords: ["时间", "管理", "规划", "效率"],
      category: "时间管理",
    },
    {
      question: "如何克服拖延症？",
      keywords: ["拖延", "克服", "习惯", "自律"],
      category: "自我管理",
    },
    {
      question: "建立良好学习习惯的方法",
      keywords: ["习惯", "学习", "坚持", "培养"],
      category: "习惯养成",
    },
    {
      question: "如何保持学习动力？",
      keywords: ["动力", "坚持", "学习", "激励"],
      category: "学习动力",
    },
    {
      question: "有效的记忆技巧有哪些？",
      keywords: ["记忆", "技巧", "方法", "学习"],
      category: "记忆方法",
    },
    {
      question: "如何制定学习计划？",
      keywords: ["计划", "学习", "规划", "目标"],
      category: "学习规划",
    },
    {
      question: "面对学习困难时如何调整心态？",
      keywords: ["困难", "心态", "调整", "学习"],
      category: "心理调节",
    },
    {
      question: "如何平衡工作和学习？",
      keywords: ["平衡", "工作", "学习", "时间"],
      category: "工作学习",
    },
    {
      question: "在线学习的优势和挑战",
      keywords: ["在线", "学习", "优势", "挑战"],
      category: "在线教育",
    },
  ]

  static generateRecommendations(currentQuestion?: string, limit = 5): RecommendationItem[] {
    const favorites = FavoritesManager.getFavorites()
    const ratings = RatingsManager.getRatings()
    const history = HistoryManager.getHistory()

    const recommendations: RecommendationItem[] = []

    // 1. 基于收藏内容的相似推荐
    const similarRecommendations = this.getSimilarRecommendations(favorites, currentQuestion)
    recommendations.push(...similarRecommendations)

    // 2. 基于评价历史的个性化推荐
    const personalizedRecommendations = this.getPersonalizedRecommendations(ratings, favorites)
    recommendations.push(...personalizedRecommendations)

    // 3. 基于搜索历史的相关推荐
    const relatedRecommendations = this.getRelatedRecommendations(history, currentQuestion)
    recommendations.push(...relatedRecommendations)

    // 4. 热门推荐（当用户数据不足时）
    if (recommendations.length < limit) {
      const trendingRecommendations = this.getTrendingRecommendations(currentQuestion)
      recommendations.push(...trendingRecommendations)
    }

    // 去重并按分数排序
    const uniqueRecommendations = this.deduplicateAndSort(recommendations, currentQuestion)

    return uniqueRecommendations.slice(0, limit)
  }

  private static getSimilarRecommendations(favorites: FavoriteItem[], currentQuestion?: string): RecommendationItem[] {
    if (favorites.length === 0) return []

    const recommendations: RecommendationItem[] = []
    const likedFavorites = favorites.filter((f) => f.rating === "like")

    // 基于点赞的收藏内容生成相似推荐
    likedFavorites.forEach((favorite) => {
      const keywords = this.extractKeywords(favorite.question)
      const similarQuestions = this.findSimilarQuestions(keywords, currentQuestion)

      similarQuestions.forEach((q) => {
        recommendations.push({
          question: q.question,
          score: this.calculateSimilarityScore(keywords, q.keywords) * this.KEYWORDS_WEIGHT + 0.6,
          reason: `因为您收藏了"${favorite.question.slice(0, 20)}..."`,
          category: "similar",
        })
      })
    })

    return recommendations
  }

  private static getPersonalizedRecommendations(
    ratings: RatingData[],
    favorites: FavoriteItem[],
  ): RecommendationItem[] {
    const recommendations: RecommendationItem[] = []
    const likedRatings = ratings.filter((r) => r.rating === "like")

    if (likedRatings.length === 0) return recommendations

    // 分析用户偏好的主题
    const preferredTopics = this.analyzePreferredTopics(likedRatings, favorites)

    preferredTopics.forEach((topic) => {
      const relatedQuestions = this.QUESTION_DATABASE.filter((q) => q.category === topic.category)

      relatedQuestions.forEach((q) => {
        recommendations.push({
          question: q.question,
          score: topic.score * this.RATING_WEIGHT + 0.5,
          reason: `基于您对${topic.category}类问题的偏好`,
          category: "personalized",
        })
      })
    })

    return recommendations
  }

  private static getRelatedRecommendations(history: SearchHistory[], currentQuestion?: string): RecommendationItem[] {
    if (history.length === 0) return []

    const recommendations: RecommendationItem[] = []
    const recentHistory = history.slice(0, 10) // 最近10个搜索

    // 基于搜索频率和时间衰减
    const questionFrequency = new Map<string, { count: number; lastTime: number }>()

    recentHistory.forEach((item) => {
      const keywords = this.extractKeywords(item.question)
      keywords.forEach((keyword) => {
        const current = questionFrequency.get(keyword) || { count: 0, lastTime: 0 }
        questionFrequency.set(keyword, {
          count: current.count + 1,
          lastTime: Math.max(current.lastTime, item.timestamp),
        })
      })
    })

    // 基于高频关键词推荐相关问题
    const topKeywords = Array.from(questionFrequency.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)

    topKeywords.forEach(([keyword, data]) => {
      const relatedQuestions = this.QUESTION_DATABASE.filter((q) => q.keywords.includes(keyword))

      relatedQuestions.forEach((q) => {
        const recencyScore = this.calculateRecencyScore(data.lastTime)
        const frequencyScore = Math.min(data.count / 5, 1) // 标准化频率分数

        recommendations.push({
          question: q.question,
          score: frequencyScore * this.FREQUENCY_WEIGHT + recencyScore * this.RECENCY_WEIGHT + 0.4,
          reason: `基于您经常搜索"${keyword}"相关内容`,
          category: "related",
        })
      })
    })

    return recommendations
  }

  private static getTrendingRecommendations(currentQuestion?: string): RecommendationItem[] {
    // 模拟热门推荐，实际应用中可以从服务器获取
    const trending = this.QUESTION_DATABASE.slice(0, 8).map((q) => ({
      question: q.question,
      score: 0.3 + Math.random() * 0.2, // 随机分数模拟热度
      reason: "热门推荐",
      category: "trending" as const,
    }))

    return trending
  }

  private static extractKeywords(text: string): string[] {
    // 简单的中文关键词提取
    const commonWords = ["如何", "什么", "为什么", "怎么", "哪些", "是否", "能否", "可以", "应该", "需要"]
    const words = text.replace(/[？。！，、；：""''（）【】]/g, " ").split(/\s+/)

    return words.filter((word) => word.length > 1 && !commonWords.includes(word)).slice(0, 5)
  }

  private static findSimilarQuestions(keywords: string[], excludeQuestion?: string) {
    return this.QUESTION_DATABASE.filter((q) => {
      if (excludeQuestion && q.question === excludeQuestion) return false
      return keywords.some((keyword) => q.keywords.includes(keyword))
    })
  }

  private static calculateSimilarityScore(keywords1: string[], keywords2: string[]): number {
    const intersection = keywords1.filter((k) => keywords2.includes(k))
    const union = [...new Set([...keywords1, ...keywords2])]
    return union.length > 0 ? intersection.length / union.length : 0
  }

  private static analyzePreferredTopics(ratings: RatingData[], favorites: FavoriteItem[]) {
    const topicScores = new Map<string, number>()

    // 分析点赞的问题
    ratings
      .filter((r) => r.rating === "like")
      .forEach((rating) => {
        const matchedQuestions = this.QUESTION_DATABASE.filter((q) =>
          this.extractKeywords(rating.question).some((keyword) => q.keywords.includes(keyword)),
        )

        matchedQuestions.forEach((q) => {
          const current = topicScores.get(q.category) || 0
          topicScores.set(q.category, current + 1)
        })
      })

    return Array.from(topicScores.entries())
      .map(([category, score]) => ({ category, score: score / ratings.length }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
  }

  private static calculateRecencyScore(timestamp: number): number {
    const now = Date.now()
    const daysDiff = (now - timestamp) / (1000 * 60 * 60 * 24)
    return Math.max(0, 1 - daysDiff / 30) // 30天内的搜索有效
  }

  private static deduplicateAndSort(recommendations: RecommendationItem[], excludeQuestion?: string) {
    const seen = new Set<string>()
    const unique: RecommendationItem[] = []

    recommendations
      .sort((a, b) => b.score - a.score)
      .forEach((rec) => {
        if (!seen.has(rec.question) && rec.question !== excludeQuestion) {
          seen.add(rec.question)
          unique.push(rec)
        }
      })

    return unique
  }
}
