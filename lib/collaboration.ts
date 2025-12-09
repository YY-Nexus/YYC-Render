export interface SharedContent {
  id: string
  type: "question" | "answer" | "conversation" | "mindmap" | "learning_path"
  title: string
  content: string
  authorId: string
  authorName: string
  createdAt: number
  updatedAt: number
  isPublic: boolean
  tags: string[]
  likes: number
  views: number
  comments: Comment[]
  metadata?: {
    originalId?: string
    difficulty?: number
    estimatedTime?: number
  }
}

export interface Comment {
  id: string
  contentId: string
  authorId: string
  authorName: string
  content: string
  createdAt: number
  likes: number
  replies: Reply[]
}

export interface Reply {
  id: string
  commentId: string
  authorId: string
  authorName: string
  content: string
  createdAt: number
  likes: number
}

export interface UserProfile {
  id: string
  name: string
  avatar?: string
  bio?: string
  joinedAt: number
  stats: {
    sharedContent: number
    totalLikes: number
    totalViews: number
    commentsCount: number
  }
  preferences: {
    allowComments: boolean
    allowDirectMessages: boolean
    publicProfile: boolean
  }
}

export class CollaborationManager {
  private static readonly SHARED_CONTENT_KEY = "ai-search-shared-content"
  private static readonly USER_PROFILE_KEY = "ai-search-user-profile"
  private static readonly CURRENT_USER_ID = "user-" + Date.now() // 简化的用户ID

  // 用户管理
  static getCurrentUser(): UserProfile {
    if (typeof window === "undefined") {
      return this.createDefaultUser()
    }

    try {
      const stored = localStorage.getItem(this.USER_PROFILE_KEY)
      return stored ? JSON.parse(stored) : this.createDefaultUser()
    } catch {
      return this.createDefaultUser()
    }
  }

  private static createDefaultUser(): UserProfile {
    const user: UserProfile = {
      id: this.CURRENT_USER_ID,
      name: "学习者",
      bio: "热爱学习，乐于分享",
      joinedAt: Date.now(),
      stats: {
        sharedContent: 0,
        totalLikes: 0,
        totalViews: 0,
        commentsCount: 0,
      },
      preferences: {
        allowComments: true,
        allowDirectMessages: true,
        publicProfile: true,
      },
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(this.USER_PROFILE_KEY, JSON.stringify(user))
    }

    return user
  }

  static updateUserProfile(updates: Partial<UserProfile>): void {
    const user = this.getCurrentUser()
    const updatedUser = { ...user, ...updates }
    localStorage.setItem(this.USER_PROFILE_KEY, JSON.stringify(updatedUser))
  }

  // 内容分享
  static getSharedContent(): SharedContent[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.SHARED_CONTENT_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  static shareContent(
    type: SharedContent["type"],
    title: string,
    content: string,
    isPublic = true,
    tags: string[] = [],
    metadata?: SharedContent["metadata"],
  ): SharedContent {
    const user = this.getCurrentUser()
    const sharedContent: SharedContent = {
      id: `shared-${Date.now()}`,
      type,
      title,
      content,
      authorId: user.id,
      authorName: user.name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPublic,
      tags,
      likes: 0,
      views: 0,
      comments: [],
      metadata,
    }

    const allContent = this.getSharedContent()
    allContent.unshift(sharedContent)

    // 限制存储的内容数量
    if (allContent.length > 100) {
      allContent.splice(100)
    }

    localStorage.setItem(this.SHARED_CONTENT_KEY, JSON.stringify(allContent))

    // 更新用户统计
    user.stats.sharedContent++
    this.updateUserProfile(user)

    return sharedContent
  }

  static likeContent(contentId: string): void {
    const allContent = this.getSharedContent()
    const content = allContent.find((c) => c.id === contentId)

    if (content) {
      content.likes++
      localStorage.setItem(this.SHARED_CONTENT_KEY, JSON.stringify(allContent))
    }
  }

  static viewContent(contentId: string): void {
    const allContent = this.getSharedContent()
    const content = allContent.find((c) => c.id === contentId)

    if (content) {
      content.views++
      localStorage.setItem(this.SHARED_CONTENT_KEY, JSON.stringify(allContent))
    }
  }

  // 评论系统
  static addComment(contentId: string, commentContent: string): Comment {
    const user = this.getCurrentUser()
    const comment: Comment = {
      id: `comment-${Date.now()}`,
      contentId,
      authorId: user.id,
      authorName: user.name,
      content: commentContent,
      createdAt: Date.now(),
      likes: 0,
      replies: [],
    }

    const allContent = this.getSharedContent()
    const content = allContent.find((c) => c.id === contentId)

    if (content) {
      content.comments.push(comment)
      localStorage.setItem(this.SHARED_CONTENT_KEY, JSON.stringify(allContent))

      // 更新用户统计
      user.stats.commentsCount++
      this.updateUserProfile(user)
    }

    return comment
  }

  static addReply(commentId: string, replyContent: string): Reply {
    const user = this.getCurrentUser()
    const reply: Reply = {
      id: `reply-${Date.now()}`,
      commentId,
      authorId: user.id,
      authorName: user.name,
      content: replyContent,
      createdAt: Date.now(),
      likes: 0,
    }

    const allContent = this.getSharedContent()
    for (const content of allContent) {
      const comment = content.comments.find((c) => c.id === commentId)
      if (comment) {
        comment.replies.push(reply)
        localStorage.setItem(this.SHARED_CONTENT_KEY, JSON.stringify(allContent))
        break
      }
    }

    return reply
  }

  // 搜索和筛选
  static searchSharedContent(
    query: string,
    filters?: {
      type?: SharedContent["type"]
      tags?: string[]
      authorId?: string
    },
  ): SharedContent[] {
    let content = this.getSharedContent().filter((c) => c.isPublic)

    // 文本搜索
    if (query.trim()) {
      const lowerQuery = query.toLowerCase()
      content = content.filter(
        (c) =>
          c.title.toLowerCase().includes(lowerQuery) ||
          c.content.toLowerCase().includes(lowerQuery) ||
          c.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),
      )
    }

    // 应用筛选器
    if (filters) {
      if (filters.type) {
        content = content.filter((c) => c.type === filters.type)
      }
      if (filters.tags && filters.tags.length > 0) {
        content = content.filter((c) => filters.tags!.some((tag) => c.tags.includes(tag)))
      }
      if (filters.authorId) {
        content = content.filter((c) => c.authorId === filters.authorId)
      }
    }

    return content.sort((a, b) => b.createdAt - a.createdAt)
  }

  static getTrendingContent(limit = 10): SharedContent[] {
    const content = this.getSharedContent().filter((c) => c.isPublic)

    // 基于点赞数和浏览量的简单热度算法
    return content
      .sort((a, b) => {
        const scoreA = a.likes * 2 + a.views * 0.1 + a.comments.length * 1.5
        const scoreB = b.likes * 2 + b.views * 0.1 + b.comments.length * 1.5
        return scoreB - scoreA
      })
      .slice(0, limit)
  }

  static getMySharedContent(): SharedContent[] {
    const user = this.getCurrentUser()
    return this.getSharedContent().filter((c) => c.authorId === user.id)
  }

  // 导出功能
  static exportSharedContent(contentId: string): string {
    const content = this.getSharedContent().find((c) => c.id === contentId)
    if (!content) return ""

    const exportData = {
      title: content.title,
      content: content.content,
      author: content.authorName,
      createdAt: new Date(content.createdAt).toISOString(),
      tags: content.tags,
      stats: {
        likes: content.likes,
        views: content.views,
        comments: content.comments.length,
      },
    }

    return JSON.stringify(exportData, null, 2)
  }
}
