export interface ConversationMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
  parentId?: string
  metadata?: {
    sources?: string[]
    confidence?: number
    processingTime?: number
  }
}

export interface ConversationThread {
  id: string
  title: string
  messages: ConversationMessage[]
  createdAt: number
  updatedAt: number
  tags?: string[]
}

export class ConversationManager {
  private static readonly STORAGE_KEY = "ai-search-conversations"
  private static readonly MAX_CONVERSATIONS = 50
  private static readonly MAX_MESSAGES_PER_THREAD = 100

  static getConversations(): ConversationThread[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  static getConversation(id: string): ConversationThread | null {
    const conversations = this.getConversations()
    return conversations.find((conv) => conv.id === id) || null
  }

  static createConversation(initialQuestion: string): ConversationThread {
    const newConversation: ConversationThread = {
      id: Date.now().toString(),
      title: this.generateTitle(initialQuestion),
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: "user",
          content: initialQuestion,
          timestamp: Date.now(),
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    const conversations = this.getConversations()
    conversations.unshift(newConversation)

    // 限制对话数量
    if (conversations.length > this.MAX_CONVERSATIONS) {
      conversations.splice(this.MAX_CONVERSATIONS)
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(conversations))
    return newConversation
  }

  static addMessage(
    conversationId: string,
    role: "user" | "assistant",
    content: string,
    parentId?: string,
    metadata?: ConversationMessage["metadata"],
  ): ConversationMessage | null {
    const conversations = this.getConversations()
    const conversation = conversations.find((conv) => conv.id === conversationId)

    if (!conversation) return null

    const newMessage: ConversationMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: Date.now(),
      parentId,
      metadata,
    }

    conversation.messages.push(newMessage)
    conversation.updatedAt = Date.now()

    // 限制消息数量
    if (conversation.messages.length > this.MAX_MESSAGES_PER_THREAD) {
      conversation.messages.splice(0, conversation.messages.length - this.MAX_MESSAGES_PER_THREAD)
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(conversations))
    return newMessage
  }

  static updateConversationTitle(conversationId: string, title: string): void {
    const conversations = this.getConversations()
    const conversation = conversations.find((conv) => conv.id === conversationId)

    if (conversation) {
      conversation.title = title
      conversation.updatedAt = Date.now()
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(conversations))
    }
  }

  static deleteConversation(conversationId: string): void {
    const conversations = this.getConversations()
    const filtered = conversations.filter((conv) => conv.id !== conversationId)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered))
  }

  static getConversationContext(conversationId: string, maxMessages = 10): ConversationMessage[] {
    const conversation = this.getConversation(conversationId)
    if (!conversation) return []

    // 返回最近的消息作为上下文
    return conversation.messages.slice(-maxMessages)
  }

  static searchConversations(query: string): ConversationThread[] {
    const conversations = this.getConversations()
    const lowerQuery = query.toLowerCase()

    return conversations.filter(
      (conv) =>
        conv.title.toLowerCase().includes(lowerQuery) ||
        conv.messages.some((msg) => msg.content.toLowerCase().includes(lowerQuery)),
    )
  }

  private static generateTitle(question: string): string {
    // 生成对话标题，取问题的前30个字符
    const title = question.trim()
    return title.length > 30 ? title.slice(0, 30) + "..." : title
  }

  static clearAllConversations(): void {
    if (typeof window === "undefined") return
    localStorage.removeItem(this.STORAGE_KEY)
  }

  static exportConversation(conversationId: string): string {
    const conversation = this.getConversation(conversationId)
    if (!conversation) return ""

    const exportData = {
      title: conversation.title,
      createdAt: new Date(conversation.createdAt).toISOString(),
      messages: conversation.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp).toISOString(),
      })),
    }

    return JSON.stringify(exportData, null, 2)
  }
}
