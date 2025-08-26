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

export interface ContentGenerationRequest {
  type: "article" | "summary" | "quiz" | "flashcards" | "outline" | "explanation"
  topic: string
  difficulty: "beginner" | "intermediate" | "advanced"
  length: "short" | "medium" | "long"
  style: "formal" | "casual" | "academic" | "conversational"
  language: "zh-CN" | "en-US"
  additionalRequirements?: string
}

export interface GeneratedContent {
  id: string
  type: ContentGenerationRequest["type"]
  title: string
  content: string
  metadata: {
    wordCount: number
    readingTime: number
    difficulty: string
    topics: string[]
    generatedAt: number
  }
}

export interface SmartQARequest {
  question: string
  context?: string
  domain?: string
  responseStyle: "detailed" | "concise" | "step-by-step" | "examples"
  includeReferences: boolean
}

export interface SmartQAResponse {
  id: string
  question: string
  answer: string
  confidence: number
  sources: string[]
  relatedQuestions: string[]
  followUpSuggestions: string[]
  metadata: {
    responseTime: number
    tokensUsed: number
    domain: string
    complexity: number
  }
}

export class AIEnhancedEngine {
  private static readonly INSIGHTS_STORAGE_KEY = "ai-search-insights"
  private static readonly LEARNING_STYLE_KEY = "ai-search-learning-style"
  private static readonly GENERATED_CONTENT_KEY = "ai-generated-content"
  private static readonly QA_HISTORY_KEY = "ai-qa-history"

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

  // 智能问答系统
  static async smartQA(request: SmartQARequest): Promise<SmartQAResponse> {
    const startTime = Date.now()

    try {
      const systemPrompt = `你是一个专业的AI助手，专门回答用户的问题。请根据以下要求回答：

响应风格: ${this.getResponseStylePrompt(request.responseStyle)}
${request.domain ? `专业领域: ${request.domain}` : ""}
${request.context ? `上下文信息: ${request.context}` : ""}

要求：
1. 回答要准确、有用、结构清晰
2. 根据问题复杂度调整回答深度
3. 提供相关的后续问题建议
4. 如果需要引用，请提供可靠来源
5. 使用中文回答`

      const { text } = await generateText({
        model: openai("gpt-4o"),
        system: systemPrompt,
        prompt: request.question,
      })

      // 生成相关问题和后续建议
      const relatedQuestions = await this.generateRelatedQuestions(request.question, request.domain)
      const followUpSuggestions = await this.generateFollowUpSuggestions(request.question, text)

      const response: SmartQAResponse = {
        id: `qa-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        question: request.question,
        answer: text,
        confidence: this.calculateConfidence(text, request.question),
        sources: request.includeReferences ? this.extractSources(text) : [],
        relatedQuestions,
        followUpSuggestions,
        metadata: {
          responseTime: Date.now() - startTime,
          tokensUsed: this.estimateTokens(request.question + text),
          domain: request.domain || "通用",
          complexity: this.calculateComplexity(request.question),
        },
      }

      this.saveQAHistory(response)
      return response
    } catch (error) {
      console.error("智能问答失败:", error)
      throw new Error("智能问答服务暂时不可用，请稍后重试")
    }
  }

  // 内容生成系统
  static async generateContent(request: ContentGenerationRequest): Promise<GeneratedContent> {
    try {
      const systemPrompt = this.buildContentGenerationPrompt(request)

      const { text } = await generateText({
        model: openai("gpt-4o"),
        system: systemPrompt,
        prompt: `请为主题"${request.topic}"生成${request.type}内容。
        
要求：
- 难度级别：${request.difficulty}
- 内容长度：${request.length}
- 写作风格：${request.style}
- 语言：${request.language === "zh-CN" ? "中文" : "英文"}
${request.additionalRequirements ? `- 额外要求：${request.additionalRequirements}` : ""}`,
      })

      const content: GeneratedContent = {
        id: `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: request.type,
        title: this.extractTitle(text, request.topic),
        content: text,
        metadata: {
          wordCount: this.countWords(text),
          readingTime: this.calculateReadingTime(text),
          difficulty: request.difficulty,
          topics: this.extractTopics(text),
          generatedAt: Date.now(),
        },
      }

      this.saveGeneratedContent(content)
      return content
    } catch (error) {
      console.error("内容生成失败:", error)
      throw new Error("内容生成服务暂时不可用，请稍后重试")
    }
  }

  // 智能摘要生成
  static async generateSummary(content: string, maxLength = 200): Promise<string> {
    try {
      const { text } = await generateText({
        model: openai("gpt-4o"),
        system: `你是一个专业的内容摘要专家。请为给定的内容生成简洁、准确的摘要。
        
要求：
1. 摘要长度不超过${maxLength}字
2. 保留核心信息和关键点
3. 语言简洁明了
4. 结构清晰`,
        prompt: `请为以下内容生成摘要：

${content}`,
      })

      return text
    } catch (error) {
      console.error("摘要生成失败:", error)
      return content.slice(0, maxLength) + "..."
    }
  }

  // 智能标签生成
  static async generateTags(content: string, maxTags = 10): Promise<string[]> {
    try {
      const { text } = await generateText({
        model: openai("gpt-4o"),
        system: `你是一个专业的内容标签生成专家。请为给定的内容生成相关的标签。
        
要求：
1. 标签数量不超过${maxTags}个
2. 标签要准确反映内容主题
3. 使用简洁的词汇
4. 返回JSON数组格式`,
        prompt: `请为以下内容生成标签：

${content}`,
      })

      try {
        return JSON.parse(text)
      } catch {
        // 如果解析失败，尝试提取标签
        return text
          .split(/[,，\n]/)
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
          .slice(0, maxTags)
      }
    } catch (error) {
      console.error("标签生成失败:", error)
      return []
    }
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

  // 辅助方法
  private static getResponseStylePrompt(style: SmartQARequest["responseStyle"]): string {
    switch (style) {
      case "detailed":
        return "提供详细、全面的回答，包含背景信息、详细解释和相关例子"
      case "concise":
        return "提供简洁、直接的回答，重点突出核心信息"
      case "step-by-step":
        return "提供分步骤的回答，按逻辑顺序组织内容"
      case "examples":
        return "通过具体例子和案例来解释概念和方法"
      default:
        return "提供平衡的回答，既有深度又保持清晰"
    }
  }

  private static async generateRelatedQuestions(question: string, domain?: string): Promise<string[]> {
    try {
      const { text } = await generateText({
        model: openai("gpt-4o"),
        system: `基于用户的问题，生成3-5个相关的问题。这些问题应该：
1. 与原问题相关但角度不同
2. 能够帮助用户深入理解主题
3. 适合进一步探索
返回JSON数组格式。`,
        prompt: `原问题: ${question}
${domain ? `领域: ${domain}` : ""}

请生成相关问题：`,
      })

      try {
        return JSON.parse(text)
      } catch {
        return []
      }
    } catch {
      return []
    }
  }

  private static async generateFollowUpSuggestions(question: string, answer: string): Promise<string[]> {
    try {
      const { text } = await generateText({
        model: openai("gpt-4o"),
        system: `基于问题和回答，生成3-5个后续行动建议。建议应该：
1. 实用且可执行
2. 帮助用户应用所学知识
3. 促进进一步学习
返回JSON数组格式。`,
        prompt: `问题: ${question}
回答: ${answer}

请生成后续建议：`,
      })

      try {
        return JSON.parse(text)
      } catch {
        return []
      }
    } catch {
      return []
    }
  }

  private static buildContentGenerationPrompt(request: ContentGenerationRequest): string {
    const typePrompts = {
      article: "你是一个专业的文章写作专家，擅长创作结构清晰、内容丰富的文章。",
      summary: "你是一个专业的摘要写作专家，擅长提取核心信息并简洁表达。",
      quiz: "你是一个专业的测验设计专家，擅长创建有效的学习评估工具。",
      flashcards: "你是一个专业的学习卡片设计专家，擅长创建便于记忆的学习材料。",
      outline: "你是一个专业的内容大纲设计专家，擅长创建逻辑清晰的结构框架。",
      explanation: "你是一个专业的概念解释专家，擅长用简单易懂的方式解释复杂概念。",
    }

    return typePrompts[request.type] || typePrompts.article
  }

  private static extractTitle(content: string, topic: string): string {
    const lines = content.split("\n")
    const firstLine = lines[0].trim()

    if (firstLine.startsWith("#")) {
      return firstLine.replace(/^#+\s*/, "")
    }

    if (firstLine.length > 0 && firstLine.length < 100) {
      return firstLine
    }

    return `关于${topic}的内容`
  }

  private static countWords(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
    return chineseChars + englishWords
  }

  private static calculateReadingTime(text: string): number {
    const wordCount = this.countWords(text)
    // 中文阅读速度约300字/分钟，英文约200词/分钟
    return Math.ceil(wordCount / 250)
  }

  private static extractTopics(text: string): string[] {
    // 简化的主题提取
    const topics = []
    const lines = text.split("\n")

    lines.forEach((line) => {
      if (line.startsWith("#")) {
        const topic = line.replace(/^#+\s*/, "").trim()
        if (topic.length > 0) {
          topics.push(topic)
        }
      }
    })

    return topics.slice(0, 5)
  }

  private static calculateConfidence(answer: string, question: string): number {
    // 简化的置信度计算
    let confidence = 0.7 // 基础置信度

    if (answer.length > 100) confidence += 0.1
    if (answer.includes("例如") || answer.includes("比如")) confidence += 0.1
    if (answer.includes("具体来说") || answer.includes("详细地说")) confidence += 0.1
    if (answer.match(/\d+/)) confidence += 0.05 // 包含数据

    return Math.min(confidence, 0.95)
  }

  private static calculateComplexity(question: string): number {
    let complexity = 1 // 基础复杂度

    if (question.includes("为什么") || question.includes("如何")) complexity += 1
    if (question.includes("分析") || question.includes("比较")) complexity += 1
    if (question.includes("原理") || question.includes("机制")) complexity += 1
    if (question.length > 50) complexity += 1

    return Math.min(complexity, 5)
  }

  private static extractSources(text: string): string[] {
    // 简化的来源提取
    const sources = []
    const lines = text.split("\n")

    lines.forEach((line) => {
      if (line.includes("参考") || line.includes("来源") || line.includes("引用")) {
        sources.push(line.trim())
      }
    })

    return sources.slice(0, 3)
  }

  private static estimateTokens(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
    return Math.ceil(chineseChars * 1.5 + englishWords)
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

  private static saveGeneratedContent(content: GeneratedContent): void {
    if (typeof window === "undefined") return

    try {
      const existing = this.getGeneratedContent()
      const combined = [content, ...existing].slice(0, 50) // 保留最新50个
      localStorage.setItem(this.GENERATED_CONTENT_KEY, JSON.stringify(combined))
    } catch (error) {
      console.error("保存生成内容失败:", error)
    }
  }

  static getGeneratedContent(): GeneratedContent[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.GENERATED_CONTENT_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  private static saveQAHistory(qa: SmartQAResponse): void {
    if (typeof window === "undefined") return

    try {
      const existing = this.getQAHistory()
      const combined = [qa, ...existing].slice(0, 100) // 保留最新100个
      localStorage.setItem(this.QA_HISTORY_KEY, JSON.stringify(combined))
    } catch (error) {
      console.error("保存问答历史失败:", error)
    }
  }

  static getQAHistory(): SmartQAResponse[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.QA_HISTORY_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
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
