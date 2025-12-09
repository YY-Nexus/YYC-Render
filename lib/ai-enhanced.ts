import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { FavoriteItem } from "./favorites"
import type { SearchHistory } from "./history"

export interface AIInsight {
  id: string
  type: "learning_suggestion" | "knowledge_gap" | "skill_recommendation" | "study_plan"
  title: string
  content: string
  confidence: number
  actionable: boolean
  relatedTopics: string[]
  createdAt: number
}

export interface PersonalizedRecommendation {
  id: string
  question: string
  reason: string
  confidence: number
  category: string
  difficulty: 1 | 2 | 3 | 4 | 5
  estimatedTime: number
  prerequisites: string[]
}

export interface LearningStyle {
  visual: number
  auditory: number
  kinesthetic: number
  reading: number
  dominant: "visual" | "auditory" | "kinesthetic" | "reading"
}

export class AIEnhancedEngine {
  private static readonly INSIGHTS_STORAGE_KEY = "ai-search-insights"
  private static readonly LEARNING_STYLE_KEY = "ai-search-learning-style"

  // AI洞察生成
  static async generateLearningInsights(history: SearchHistory[], favorites: FavoriteItem[]): Promise<AIInsight[]> {
    try {
      const recentQuestions = history
        .slice(0, 10)
        .map((h) => h.question)
        .join("\n")
      const favoriteTopics = favorites.map((f) => f.question).join("\n")

      const { text } = await generateText({
        model: openai("gpt-4o"),
        system: `你是一个专业的学习分析师。基于用户的搜索历史和收藏内容，生成个性化的学习洞察和建议。
        
        请分析用户的学习模式，识别：
        1. 学习偏好和兴趣领域
        2. 知识盲点和改进空间
        3. 技能发展建议
        4. 个性化学习计划
        
        返回JSON格式的洞察列表，每个洞察包含type、title、content、confidence等字段。`,
        prompt: `用户最近搜索的问题：
${recentQuestions}

用户收藏的内容：
${favoriteTopics}

请生成4-6个个性化学习洞察。`,
      })

      const insights = this.parseAIInsights(text)
      this.saveInsights(insights)
      return insights
    } catch (error) {
      console.error("AI洞察生成失败:", error)
      return this.getFallbackInsights(history, favorites)
    }
  }

  private static parseAIInsights(aiResponse: string): AIInsight[] {
    try {
      const parsed = JSON.parse(aiResponse)
      return parsed.map((insight: any, index: number) => ({
        id: `insight-${Date.now()}-${index}`,
        type: insight.type || "learning_suggestion",
        title: insight.title || "学习建议",
        content: insight.content || "",
        confidence: insight.confidence || 0.8,
        actionable: insight.actionable !== false,
        relatedTopics: insight.relatedTopics || [],
        createdAt: Date.now(),
      }))
    } catch {
      return []
    }
  }

  private static getFallbackInsights(history: SearchHistory[], favorites: FavoriteItem[]): AIInsight[] {
    const insights: AIInsight[] = []

    // 基于搜索频率的建议
    if (history.length > 10) {
      insights.push({
        id: `insight-${Date.now()}-1`,
        type: "learning_suggestion",
        title: "建立系统化学习习惯",
        content: "您的搜索活跃度很高，建议建立更系统化的学习计划，将零散的知识点整合成完整的知识体系。",
        confidence: 0.9,
        actionable: true,
        relatedTopics: ["学习方法", "知识管理"],
        createdAt: Date.now(),
      })
    }

    // 基于收藏内容的建议
    if (favorites.length > 5) {
      insights.push({
        id: `insight-${Date.now()}-2`,
        type: "knowledge_gap",
        title: "深化已收藏内容的理解",
        content: "您收藏了很多有价值的内容，建议定期回顾并实践这些知识，将理论转化为实际技能。",
        confidence: 0.85,
        actionable: true,
        relatedTopics: ["复习策略", "实践应用"],
        createdAt: Date.now(),
      })
    }

    return insights
  }

  // 个性化推荐生成
  static async generatePersonalizedRecommendations(userProfile: {
    interests: string[]
    skillLevel: Record<string, number>
    learningGoals: string[]
    timeAvailable: number
  }): Promise<PersonalizedRecommendation[]> {
    try {
      const { text } = await generateText({
        model: openai("gpt-4o"),
        system: `你是一个个性化学习推荐专家。基于用户的兴趣、技能水平和学习目标，推荐最适合的学习内容。
        
        考虑因素：
        1. 用户当前技能水平
        2. 学习兴趣和偏好
        3. 可用学习时间
        4. 学习目标的优先级
        
        返回JSON格式的推荐列表。`,
        prompt: `用户档案：
兴趣领域: ${userProfile.interests.join(", ")}
技能水平: ${JSON.stringify(userProfile.skillLevel)}
学习目标: ${userProfile.learningGoals.join(", ")}
可用时间: ${userProfile.timeAvailable}小时/周

请推荐5-8个个性化学习问题。`,
      })

      return this.parseRecommendations(text)
    } catch (error) {
      console.error("个性化推荐生成失败:", error)
      return this.getFallbackRecommendations(userProfile)
    }
  }

  private static parseRecommendations(aiResponse: string): PersonalizedRecommendation[] {
    try {
      const parsed = JSON.parse(aiResponse)
      return parsed.map((rec: any, index: number) => ({
        id: `rec-${Date.now()}-${index}`,
        question: rec.question || "",
        reason: rec.reason || "",
        confidence: rec.confidence || 0.8,
        category: rec.category || "通用",
        difficulty: rec.difficulty || 3,
        estimatedTime: rec.estimatedTime || 30,
        prerequisites: rec.prerequisites || [],
      }))
    } catch {
      return []
    }
  }

  private static getFallbackRecommendations(userProfile: any): PersonalizedRecommendation[] {
    const recommendations: PersonalizedRecommendation[] = []

    userProfile.interests.forEach((interest: string, index: number) => {
      recommendations.push({
        id: `rec-${Date.now()}-${index}`,
        question: `如何深入学习${interest}？`,
        reason: `基于您对${interest}的兴趣`,
        confidence: 0.7,
        category: interest,
        difficulty: 3 as 1 | 2 | 3 | 4 | 5,
        estimatedTime: 45,
        prerequisites: [],
      })
    })

    return recommendations
  }

  // 学习风格分析
  static analyzeLearningStyle(history: SearchHistory[], favorites: FavoriteItem[]): LearningStyle {
    let visual = 0
    let auditory = 0
    let kinesthetic = 0
    let reading = 0

    // 分析搜索内容偏好
    history.forEach((item) => {
      const question = item.question.toLowerCase()

      if (question.includes("图") || question.includes("视频") || question.includes("演示")) {
        visual += 1
      }
      if (question.includes("听") || question.includes("音频") || question.includes("讲解")) {
        auditory += 1
      }
      if (question.includes("实践") || question.includes("操作") || question.includes("练习")) {
        kinesthetic += 1
      }
      if (question.includes("文档") || question.includes("阅读") || question.includes("书")) {
        reading += 1
      }
    })

    // 分析收藏内容偏好
    favorites.forEach((item) => {
      const content = (item.question + " " + item.answer).toLowerCase()

      if (content.includes("图表") || content.includes("可视化")) {
        visual += 2
      }
      if (content.includes("音频") || content.includes("播客")) {
        auditory += 2
      }
      if (content.includes("实验") || content.includes("项目")) {
        kinesthetic += 2
      }
      if (content.includes("理论") || content.includes("概念")) {
        reading += 2
      }
    })

    const total = visual + auditory + kinesthetic + reading || 1
    const style: LearningStyle = {
      visual: visual / total,
      auditory: auditory / total,
      kinesthetic: kinesthetic / total,
      reading: reading / total,
      dominant: "reading",
    }

    // 确定主导学习风格
    const max = Math.max(style.visual, style.auditory, style.kinesthetic, style.reading)
    if (style.visual === max) style.dominant = "visual"
    else if (style.auditory === max) style.dominant = "auditory"
    else if (style.kinesthetic === max) style.dominant = "kinesthetic"
    else style.dominant = "reading"

    this.saveLearningStyle(style)
    return style
  }

  // 智能学习路径优化
  static async optimizeLearningPath(currentPath: any, userProgress: any, learningStyle: LearningStyle): Promise<any> {
    try {
      const { text } = await generateText({
        model: openai("gpt-4o"),
        system: `你是一个学习路径优化专家。基于用户的学习风格、当前进度和路径效果，优化学习路径。
        
        优化原则：
        1. 适应用户的学习风格
        2. 根据进度调整难度
        3. 提高学习效率
        4. 保持学习动机
        
        返回优化后的学习步骤建议。`,
        prompt: `当前学习路径: ${JSON.stringify(currentPath)}
用户进度: ${JSON.stringify(userProgress)}
学习风格: ${JSON.stringify(learningStyle)}

请提供路径优化建议。`,
      })

      return this.parsePathOptimization(text)
    } catch (error) {
      console.error("学习路径优化失败:", error)
      return this.getFallbackOptimization(currentPath, learningStyle)
    }
  }

  private static parsePathOptimization(aiResponse: string): any {
    try {
      return JSON.parse(aiResponse)
    } catch {
      return null
    }
  }

  private static getFallbackOptimization(currentPath: any, learningStyle: LearningStyle): any {
    const optimizations = []

    // 基于学习风格的建议
    switch (learningStyle.dominant) {
      case "visual":
        optimizations.push({
          type: "resource_suggestion",
          content: "建议增加更多图表、视频和可视化资源",
        })
        break
      case "auditory":
        optimizations.push({
          type: "resource_suggestion",
          content: "建议增加音频讲解和讨论环节",
        })
        break
      case "kinesthetic":
        optimizations.push({
          type: "resource_suggestion",
          content: "建议增加实践练习和动手项目",
        })
        break
      case "reading":
        optimizations.push({
          type: "resource_suggestion",
          content: "建议增加深度阅读材料和理论学习",
        })
        break
    }

    return { optimizations }
  }

  // 存储和获取方法
  private static saveInsights(insights: AIInsight[]): void {
    if (typeof window === "undefined") return

    try {
      const existing = this.getStoredInsights()
      const combined = [...insights, ...existing].slice(0, 20) // 保留最新20个
      localStorage.setItem(this.INSIGHTS_STORAGE_KEY, JSON.stringify(combined))
    } catch (error) {
      console.error("保存洞察失败:", error)
    }
  }

  static getStoredInsights(): AIInsight[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.INSIGHTS_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  private static saveLearningStyle(style: LearningStyle): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(this.LEARNING_STYLE_KEY, JSON.stringify(style))
    } catch (error) {
      console.error("保存学习风格失败:", error)
    }
  }

  static getLearningStyle(): LearningStyle | null {
    if (typeof window === "undefined") return null

    try {
      const stored = localStorage.getItem(this.LEARNING_STYLE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  // 清理过期数据
  static cleanupOldData(): void {
    const insights = this.getStoredInsights()
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

    const validInsights = insights.filter((insight) => insight.createdAt > oneWeekAgo)

    if (validInsights.length !== insights.length) {
      this.saveInsights(validInsights)
    }
  }
}
