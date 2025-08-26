export interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: number
  metadata?: {
    tokens?: number
    model?: string
    temperature?: number
    sources?: string[]
    relatedTopics?: string[]
  }
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
  tags: string[]
  summary?: string
  context: {
    topic: string
    domain: string
    difficulty: "beginner" | "intermediate" | "advanced"
    keywords: string[]
  }
  metadata: {
    totalMessages: number
    totalTokens: number
    averageResponseTime: number
    satisfaction?: number
    isBookmarked: boolean
    isShared: boolean
  }
}

export interface ConversationBranch {
  id: string
  conversationId: string
  parentMessageId: string
  messages: Message[]
  title: string
  createdAt: number
}

export class ConversationManager {
  private static readonly STORAGE_KEY = "ai-search-conversations"
  private static readonly BRANCHES_KEY = "ai-search-conversation-branches"
  private static readonly CONTEXT_KEY = "ai-search-conversation-context"

  static getConversations(): Conversation[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  static getConversation(id: string): Conversation | null {
    const conversations = this.getConversations()
    return conversations.find((conv) => conv.id === id) || null
  }

  static createConversation(initialMessage: string, topic = "通用对话"): Conversation {
    const conversation: Conversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: initialMessage.length > 50 ? initialMessage.slice(0, 50) + "..." : initialMessage,
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: "user",
          content: initialMessage,
          timestamp: Date.now(),
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: this.extractTags(initialMessage),
      context: {
        topic,
        domain: this.inferDomain(initialMessage),
        difficulty: "beginner",
        keywords: this.extractKeywords(initialMessage),
      },
      metadata: {
        totalMessages: 1,
        totalTokens: this.estimateTokens(initialMessage),
        averageResponseTime: 0,
        isBookmarked: false,
        isShared: false,
      },
    }

    this.saveConversation(conversation)
    return conversation
  }

  static addMessage(conversationId: string, message: Omit<Message, "id" | "timestamp">): void {
    const conversations = this.getConversations()
    const conversation = conversations.find((conv) => conv.id === conversationId)

    if (!conversation) return

    const newMessage: Message = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    }

    conversation.messages.push(newMessage)
    conversation.updatedAt = Date.now()
    conversation.metadata.totalMessages = conversation.messages.length
    conversation.metadata.totalTokens += this.estimateTokens(message.content)

    // 更新上下文
    if (message.role === "user") {
      const newKeywords = this.extractKeywords(message.content)
      conversation.context.keywords = [...new Set([...conversation.context.keywords, ...newKeywords])]
      conversation.tags = [...new Set([...conversation.tags, ...this.extractTags(message.content)])]
    }

    this.saveConversations(conversations)
  }

  static createBranch(conversationId: string, parentMessageId: string, title: string): ConversationBranch {
    const conversation = this.getConversation(conversationId)
    if (!conversation) throw new Error("对话不存在")

    const parentIndex = conversation.messages.findIndex((msg) => msg.id === parentMessageId)
    if (parentIndex === -1) throw new Error("父消息不存在")

    const branch: ConversationBranch = {
      id: `branch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      parentMessageId,
      messages: conversation.messages.slice(0, parentIndex + 1),
      title,
      createdAt: Date.now(),
    }

    this.saveBranch(branch)
    return branch
  }

  static getBranches(conversationId: string): ConversationBranch[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.BRANCHES_KEY)
      const branches: ConversationBranch[] = stored ? JSON.parse(stored) : []
      return branches.filter((branch) => branch.conversationId === conversationId)
    } catch {
      return []
    }
  }

  static updateConversationContext(conversationId: string, context: Partial<Conversation["context"]>): void {
    const conversations = this.getConversations()
    const conversation = conversations.find((conv) => conv.id === conversationId)

    if (!conversation) return

    conversation.context = { ...conversation.context, ...context }
    conversation.updatedAt = Date.now()

    this.saveConversations(conversations)
  }

  static generateSummary(conversationId: string): string {
    const conversation = this.getConversation(conversationId)
    if (!conversation) return ""

    const userMessages = conversation.messages.filter((msg) => msg.role === "user")
    const topics = conversation.context.keywords.slice(0, 5)

    return `关于${topics.join("、")}的对话，包含${conversation.metadata.totalMessages}条消息`
  }

  static searchConversations(query: string): Conversation[] {
    const conversations = this.getConversations()
    const lowerQuery = query.toLowerCase()

    return conversations
      .filter(
        (conv) =>
          conv.title.toLowerCase().includes(lowerQuery) ||
          conv.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
          conv.context.keywords.some((keyword) => keyword.toLowerCase().includes(lowerQuery)) ||
          conv.messages.some((msg) => msg.content.toLowerCase().includes(lowerQuery)),
      )
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }

  static getRelatedConversations(conversationId: string, limit = 5): Conversation[] {
    const conversation = this.getConversation(conversationId)
    if (!conversation) return []

    const allConversations = this.getConversations().filter((conv) => conv.id !== conversationId)
    const targetKeywords = new Set(conversation.context.keywords)
    const targetTags = new Set(conversation.tags)

    return allConversations
      .map((conv) => ({
        conversation: conv,
        score: this.calculateSimilarity(targetKeywords, targetTags, conv),
      }))
      .filter((item) => item.score > 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.conversation)
  }

  private static calculateSimilarity(
    targetKeywords: Set<string>,
    targetTags: Set<string>,
    conversation: Conversation,
  ): number {
    const convKeywords = new Set(conversation.context.keywords)
    const convTags = new Set(conversation.tags)

    const keywordIntersection = new Set([...targetKeywords].filter((k) => convKeywords.has(k)))
    const tagIntersection = new Set([...targetTags].filter((t) => convTags.has(t)))

    const keywordSimilarity = keywordIntersection.size / Math.max(targetKeywords.size, convKeywords.size)
    const tagSimilarity = tagIntersection.size / Math.max(targetTags.size, convTags.size)

    return keywordSimilarity * 0.7 + tagSimilarity * 0.3
  }

  private static extractTags(content: string): string[] {
    const tags = []

    // 学习相关标签
    if (/学习|教育|知识|技能/.test(content)) tags.push("学习")
    if (/编程|代码|开发|技术/.test(content)) tags.push("技术")
    if (/工作|职业|事业|管理/.test(content)) tags.push("工作")
    if (/生活|日常|健康|娱乐/.test(content)) tags.push("生活")
    if (/问题|解决|方案|建议/.test(content)) tags.push("问题解决")

    return tags
  }

  private static extractKeywords(content: string): string[] {
    // 简化的关键词提取
    const words = content.match(/[\u4e00-\u9fa5]{2,}/g) || []
    const commonWords = new Set(["这个", "那个", "什么", "怎么", "为什么", "如何", "可以", "应该", "需要"])

    return words.filter((word) => !commonWords.has(word) && word.length >= 2).slice(0, 10)
  }

  private static inferDomain(content: string): string {
    if (/编程|代码|开发|技术|算法|数据/.test(content)) return "技术"
    if (/学习|教育|知识|课程|考试/.test(content)) return "教育"
    if (/工作|职业|管理|商业|创业/.test(content)) return "商业"
    if (/健康|医疗|运动|养生/.test(content)) return "健康"
    if (/旅游|美食|娱乐|文化/.test(content)) return "生活"
    return "通用"
  }

  private static estimateTokens(content: string): number {
    // 简化的token估算：中文字符约1.5个token，英文单词约1个token
    const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = (content.match(/[a-zA-Z]+/g) || []).length
    return Math.ceil(chineseChars * 1.5 + englishWords)
  }

  private static saveConversation(conversation: Conversation): void {
    const conversations = this.getConversations()
    const existingIndex = conversations.findIndex((conv) => conv.id === conversation.id)

    if (existingIndex >= 0) {
      conversations[existingIndex] = conversation
    } else {
      conversations.unshift(conversation)
    }

    // 限制保存的对话数量
    if (conversations.length > 100) {
      conversations.splice(100)
    }

    this.saveConversations(conversations)
  }

  private static saveConversations(conversations: Conversation[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(conversations))
  }

  private static saveBranch(branch: ConversationBranch): void {
    const branches = this.getBranches(branch.conversationId)
    branches.push(branch)

    try {
      const allBranches = JSON.parse(localStorage.getItem(this.BRANCHES_KEY) || "[]")
      const otherBranches = allBranches.filter((b: ConversationBranch) => b.conversationId !== branch.conversationId)
      localStorage.setItem(this.BRANCHES_KEY, JSON.stringify([...otherBranches, ...branches]))
    } catch {
      localStorage.setItem(this.BRANCHES_KEY, JSON.stringify(branches))
    }
  }

  static deleteConversation(conversationId: string): void {
    const conversations = this.getConversations().filter((conv) => conv.id !== conversationId)
    this.saveConversations(conversations)

    // 同时删除相关分支
    try {
      const allBranches = JSON.parse(localStorage.getItem(this.BRANCHES_KEY) || "[]")
      const remainingBranches = allBranches.filter((b: ConversationBranch) => b.conversationId !== conversationId)
      localStorage.setItem(this.BRANCHES_KEY, JSON.stringify(remainingBranches))
    } catch {}
  }

  static exportConversation(conversationId: string): string {
    const conversation = this.getConversation(conversationId)
    if (!conversation) return ""

    const exportData = {
      title: conversation.title,
      createdAt: new Date(conversation.createdAt).toLocaleString(),
      messages: conversation.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp).toLocaleString(),
      })),
      tags: conversation.tags,
      context: conversation.context,
    }

    return JSON.stringify(exportData, null, 2)
  }
}
