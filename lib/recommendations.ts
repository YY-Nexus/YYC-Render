export interface RecommendationItem {
  id: string
  title: string
  description: string
  category: string
  relevanceScore: number
  tags: string[]
  timestamp: number
  source: "history" | "favorites" | "trending" | "ai"
}

export class RecommendationsManager {
  private static readonly STORAGE_KEY = "ai-search-recommendations"
  private static readonly MAX_RECOMMENDATIONS = 50

  static getRecommendations(): RecommendationItem[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("获取推荐失败:", error)
      return []
    }
  }

  static generateRecommendations(userHistory: any[], userFavorites: any[]): RecommendationItem[] {
    const recommendations: RecommendationItem[] = []

    // 基于历史记录生成推荐
    const historyCategories = this.analyzeCategories(userHistory)
    historyCategories.forEach((category, index) => {
      recommendations.push({
        id: `hist_rec_${Date.now()}_${index}`,
        title: `探索更多${category.name}相关内容`,
        description: `基于您的搜索历史，为您推荐${category.name}领域的深度内容`,
        category: category.name,
        relevanceScore: category.count / userHistory.length,
        tags: [category.name, "历史推荐"],
        timestamp: Date.now(),
        source: "history",
      })
    })

    // 基于收藏生成推荐
    const favoriteTopics = this.extractTopics(userFavorites)
    favoriteTopics.forEach((topic, index) => {
      recommendations.push({
        id: `fav_rec_${Date.now()}_${index}`,
        title: `深入了解${topic}`,
        description: `您收藏了关于${topic}的内容，这里有更多相关资源`,
        category: "收藏扩展",
        relevanceScore: 0.8,
        tags: [topic, "收藏推荐"],
        timestamp: Date.now(),
        source: "favorites",
      })
    })

    // 添加热门推荐
    const trendingTopics = this.getTrendingTopics()
    trendingTopics.forEach((topic, index) => {
      recommendations.push({
        id: `trend_rec_${Date.now()}_${index}`,
        title: `热门话题：${topic.title}`,
        description: topic.description,
        category: "热门推荐",
        relevanceScore: topic.popularity,
        tags: topic.tags,
        timestamp: Date.now(),
        source: "trending",
      })
    })

    // 按相关性排序并限制数量
    return recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, this.MAX_RECOMMENDATIONS)
  }

  private static analyzeCategories(history: any[]): { name: string; count: number }[] {
    const categoryMap = new Map<string, number>()

    history.forEach((item) => {
      const category = item.category || this.categorizeQuestion(item.question)
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1)
    })

    return Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }

  private static categorizeQuestion(question: string): string {
    const lowerQuestion = question.toLowerCase()

    if (lowerQuestion.includes("编程") || lowerQuestion.includes("代码")) return "编程技术"
    if (lowerQuestion.includes("设计") || lowerQuestion.includes("UI")) return "设计创意"
    if (lowerQuestion.includes("学习") || lowerQuestion.includes("教育")) return "学习方法"
    if (lowerQuestion.includes("管理") || lowerQuestion.includes("效率")) return "效率管理"
    if (lowerQuestion.includes("健康") || lowerQuestion.includes("运动")) return "健康生活"
    if (lowerQuestion.includes("科技") || lowerQuestion.includes("AI")) return "科技前沿"

    return "综合知识"
  }

  private static extractTopics(favorites: any[]): string[] {
    const topics = new Set<string>()

    favorites.forEach((item) => {
      if (item.tags) {
        item.tags.forEach((tag: string) => topics.add(tag))
      }
      if (item.category) {
        topics.add(item.category)
      }
    })

    return Array.from(topics).slice(0, 10)
  }

  private static getTrendingTopics(): { title: string; description: string; popularity: number; tags: string[] }[] {
    return [
      {
        title: "人工智能与机器学习",
        description: "探索AI技术的最新发展和应用场景",
        popularity: 0.9,
        tags: ["AI", "机器学习", "深度学习"],
      },
      {
        title: "可持续发展与环保",
        description: "了解环保技术和可持续发展的创新方案",
        popularity: 0.8,
        tags: ["环保", "可持续发展", "绿色科技"],
      },
      {
        title: "数字化转型",
        description: "企业数字化转型的策略和实践案例",
        popularity: 0.7,
        tags: ["数字化", "转型", "企业管理"],
      },
      {
        title: "健康生活方式",
        description: "现代人的健康管理和生活方式优化",
        popularity: 0.6,
        tags: ["健康", "生活方式", "养生"],
      },
    ]
  }

  static saveRecommendations(recommendations: RecommendationItem[]): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recommendations))
    } catch (error) {
      console.error("保存推荐失败:", error)
    }
  }

  static getRecommendationsByCategory(category: string): RecommendationItem[] {
    const recommendations = this.getRecommendations()
    return recommendations.filter((item) => item.category === category)
  }

  static markRecommendationAsViewed(id: string): void {
    // 可以在这里添加查看记录的逻辑
    console.log(`推荐项目 ${id} 已被查看`)
  }
}
