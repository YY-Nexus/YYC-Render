export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  role: "admin" | "moderator" | "user"
  reputation: number
  joinedAt: Date
  lastActiveAt: Date
  preferences: {
    notifications: boolean
    publicProfile: boolean
    language: string
    theme: "light" | "dark" | "auto"
  }
  stats: {
    postsCount: number
    commentsCount: number
    likesReceived: number
    helpfulVotes: number
  }
}

export interface CommunityPost {
  id: string
  title: string
  content: string
  type: "question" | "discussion" | "tutorial" | "showcase" | "announcement"
  category: string
  tags: string[]
  authorId: string
  createdAt: Date
  updatedAt: Date
  status: "active" | "closed" | "pinned" | "archived"
  votes: {
    upvotes: number
    downvotes: number
    userVotes: Record<string, "up" | "down"> // userId -> vote
  }
  views: number
  comments: Comment[]
  attachments: Attachment[]
  isResolved?: boolean
  acceptedAnswerId?: string
}

export interface Comment {
  id: string
  content: string
  authorId: string
  postId: string
  parentId?: string // for nested comments
  createdAt: Date
  updatedAt: Date
  votes: {
    upvotes: number
    downvotes: number
    userVotes: Record<string, "up" | "down">
  }
  isAccepted?: boolean
  isHelpful?: boolean
  replies: Comment[]
  attachments: Attachment[]
}

export interface Attachment {
  id: string
  filename: string
  type: "image" | "document" | "code" | "link"
  url: string
  size?: number
  uploadedAt: Date
  uploadedBy: string
}

export interface Notification {
  id: string
  userId: string
  type: "comment" | "vote" | "mention" | "follow" | "system"
  title: string
  message: string
  data?: any
  isRead: boolean
  createdAt: Date
  actionUrl?: string
}

export interface Team {
  id: string
  name: string
  description: string
  ownerId: string
  members: TeamMember[]
  createdAt: Date
  settings: {
    isPublic: boolean
    allowInvites: boolean
    requireApproval: boolean
  }
  stats: {
    memberCount: number
    projectCount: number
    activityScore: number
  }
}

export interface TeamMember {
  userId: string
  role: "owner" | "admin" | "member"
  joinedAt: Date
  permissions: string[]
  isActive: boolean
}

export interface SharedContent {
  id: string
  title: string
  description: string
  type: "search-result" | "learning-path" | "mindmap" | "conversation" | "knowledge-graph"
  contentId: string
  sharedBy: string
  sharedAt: Date
  visibility: "public" | "team" | "private"
  teamId?: string
  tags: string[]
  stats: {
    views: number
    likes: number
    shares: number
    comments: number
  }
  metadata: Record<string, any>
}

export class CollaborationManager {
  private users: Map<string, User> = new Map()
  private posts: Map<string, CommunityPost> = new Map()
  private comments: Map<string, Comment> = new Map()
  private notifications: Map<string, Notification[]> = new Map() // userId -> notifications
  private teams: Map<string, Team> = new Map()
  private sharedContent: Map<string, SharedContent> = new Map()
  private follows: Map<string, Set<string>> = new Map() // userId -> Set of followed userIds

  // 用户管理
  createUser(userData: Omit<User, "id" | "joinedAt" | "lastActiveAt" | "reputation" | "stats">): User {
    const user: User = {
      ...userData,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reputation: 0,
      joinedAt: new Date(),
      lastActiveAt: new Date(),
      stats: {
        postsCount: 0,
        commentsCount: 0,
        likesReceived: 0,
        helpfulVotes: 0,
      },
    }

    this.users.set(user.id, user)
    this.notifications.set(user.id, [])
    return user
  }

  // 发布帖子
  createPost(
    postData: Omit<CommunityPost, "id" | "createdAt" | "updatedAt" | "votes" | "views" | "comments" | "attachments">,
  ): CommunityPost {
    const post: CommunityPost = {
      ...postData,
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      votes: {
        upvotes: 0,
        downvotes: 0,
        userVotes: {},
      },
      views: 0,
      comments: [],
      attachments: [],
    }

    this.posts.set(post.id, post)

    // 更新用户统计
    const author = this.users.get(post.authorId)
    if (author) {
      author.stats.postsCount++
    }

    return post
  }

  // 添加评论
  addComment(
    commentData: Omit<Comment, "id" | "createdAt" | "updatedAt" | "votes" | "replies" | "attachments">,
  ): Comment {
    const comment: Comment = {
      ...commentData,
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      votes: {
        upvotes: 0,
        downvotes: 0,
        userVotes: {},
      },
      replies: [],
      attachments: [],
    }

    this.comments.set(comment.id, comment)

    // 添加到帖子的评论列表
    const post = this.posts.get(comment.postId)
    if (post) {
      if (comment.parentId) {
        // 嵌套评论
        const parentComment = this.findCommentInPost(post, comment.parentId)
        if (parentComment) {
          parentComment.replies.push(comment)
        }
      } else {
        // 顶级评论
        post.comments.push(comment)
      }
    }

    // 更新用户统计
    const author = this.users.get(comment.authorId)
    if (author) {
      author.stats.commentsCount++
    }

    // 发送通知给帖子作者
    if (post && post.authorId !== comment.authorId) {
      this.createNotification(post.authorId, {
        type: "comment",
        title: "新评论",
        message: `${author?.username || "用户"} 评论了您的帖子`,
        data: { postId: post.id, commentId: comment.id },
        actionUrl: `/community/content/${post.id}#comment-${comment.id}`,
      })
    }

    return comment
  }

  // 投票功能
  votePost(postId: string, userId: string, voteType: "up" | "down"): boolean {
    const post = this.posts.get(postId)
    if (!post) return false

    const currentVote = post.votes.userVotes[userId]

    // 移除之前的投票
    if (currentVote === "up") {
      post.votes.upvotes--
    } else if (currentVote === "down") {
      post.votes.downvotes--
    }

    // 添加新投票（如果不是取消投票）
    if (currentVote !== voteType) {
      post.votes.userVotes[userId] = voteType
      if (voteType === "up") {
        post.votes.upvotes++
      } else {
        post.votes.downvotes++
      }
    } else {
      // 取消投票
      delete post.votes.userVotes[userId]
    }

    // 更新作者声誉
    const author = this.users.get(post.authorId)
    if (author && userId !== post.authorId) {
      if (voteType === "up" && currentVote !== "up") {
        author.reputation += 5
        author.stats.likesReceived++
      } else if (voteType === "down" && currentVote !== "down") {
        author.reputation -= 2
      }
    }

    return true
  }

  // 搜索帖子
  searchPosts(
    query: string,
    filters: {
      type?: CommunityPost["type"]
      category?: string
      tags?: string[]
      authorId?: string
      status?: CommunityPost["status"]
      sortBy?: "newest" | "oldest" | "popular" | "votes"
    } = {},
  ): CommunityPost[] {
    let results = Array.from(this.posts.values())

    // 应用过滤器
    if (filters.type) {
      results = results.filter((post) => post.type === filters.type)
    }
    if (filters.category) {
      results = results.filter((post) => post.category === filters.category)
    }
    if (filters.tags && filters.tags.length > 0) {
      results = results.filter((post) => filters.tags!.some((tag) => post.tags.includes(tag)))
    }
    if (filters.authorId) {
      results = results.filter((post) => post.authorId === filters.authorId)
    }
    if (filters.status) {
      results = results.filter((post) => post.status === filters.status)
    }

    // 文本搜索
    if (query) {
      results = results.filter(
        (post) =>
          post.title.toLowerCase().includes(query.toLowerCase()) ||
          post.content.toLowerCase().includes(query.toLowerCase()) ||
          post.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase())),
      )
    }

    // 排序
    switch (filters.sortBy) {
      case "oldest":
        results.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        break
      case "popular":
        results.sort((a, b) => b.views - a.views)
        break
      case "votes":
        results.sort((a, b) => b.votes.upvotes - b.votes.downvotes - (a.votes.upvotes - a.votes.downvotes))
        break
      case "newest":
      default:
        results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        break
    }

    return results
  }

  // 创建团队
  createTeam(teamData: Omit<Team, "id" | "members" | "createdAt" | "stats">): Team {
    const team: Team = {
      ...teamData,
      id: `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      members: [
        {
          userId: teamData.ownerId,
          role: "owner",
          joinedAt: new Date(),
          permissions: ["all"],
          isActive: true,
        },
      ],
      createdAt: new Date(),
      stats: {
        memberCount: 1,
        projectCount: 0,
        activityScore: 0,
      },
    }

    this.teams.set(team.id, team)
    return team
  }

  // 邀请用户加入团队
  inviteToTeam(teamId: string, userId: string, invitedBy: string): boolean {
    const team = this.teams.get(teamId)
    const user = this.users.get(userId)
    const inviter = this.users.get(invitedBy)

    if (!team || !user || !inviter) return false

    // 检查权限
    const inviterMember = team.members.find((m) => m.userId === invitedBy)
    if (!inviterMember || (inviterMember.role !== "owner" && inviterMember.role !== "admin")) {
      return false
    }

    // 检查用户是否已经是成员
    if (team.members.some((m) => m.userId === userId)) {
      return false
    }

    // 发送邀请通知
    this.createNotification(userId, {
      type: "follow",
      title: "团队邀请",
      message: `${inviter.username} 邀请您加入团队 "${team.name}"`,
      data: { teamId, invitedBy },
      actionUrl: `/teams/${teamId}/invite`,
    })

    return true
  }

  // 分享内容
  shareContent(contentData: Omit<SharedContent, "id" | "sharedAt" | "stats">): SharedContent {
    const shared: SharedContent = {
      ...contentData,
      id: `shared_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sharedAt: new Date(),
      stats: {
        views: 0,
        likes: 0,
        shares: 0,
        comments: 0,
      },
    }

    this.sharedContent.set(shared.id, shared)
    return shared
  }

  // 获取用户通知
  getUserNotifications(userId: string, unreadOnly = false): Notification[] {
    const notifications = this.notifications.get(userId) || []

    if (unreadOnly) {
      return notifications.filter((n) => !n.isRead)
    }

    return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  // 标记通知为已读
  markNotificationAsRead(userId: string, notificationId: string): boolean {
    const notifications = this.notifications.get(userId) || []
    const notification = notifications.find((n) => n.id === notificationId)

    if (notification) {
      notification.isRead = true
      return true
    }

    return false
  }

  // 关注用户
  followUser(followerId: string, followeeId: string): boolean {
    if (followerId === followeeId) return false

    if (!this.follows.has(followerId)) {
      this.follows.set(followerId, new Set())
    }

    const following = this.follows.get(followerId)!
    if (following.has(followeeId)) return false

    following.add(followeeId)

    // 发送通知
    const follower = this.users.get(followerId)
    if (follower) {
      this.createNotification(followeeId, {
        type: "follow",
        title: "新关注者",
        message: `${follower.username} 开始关注您`,
        data: { followerId },
        actionUrl: `/users/${followerId}`,
      })
    }

    return true
  }

  // 获取热门内容
  getTrendingContent(timeframe: "day" | "week" | "month" = "week"): {
    posts: CommunityPost[]
    sharedContent: SharedContent[]
    activeUsers: User[]
  } {
    const now = new Date()
    const cutoff = new Date()

    switch (timeframe) {
      case "day":
        cutoff.setDate(now.getDate() - 1)
        break
      case "week":
        cutoff.setDate(now.getDate() - 7)
        break
      case "month":
        cutoff.setMonth(now.getMonth() - 1)
        break
    }

    // 热门帖子
    const posts = Array.from(this.posts.values())
      .filter((post) => post.createdAt >= cutoff)
      .sort((a, b) => {
        const scoreA = a.votes.upvotes * 2 + a.views * 0.1 + a.comments.length * 3
        const scoreB = b.votes.upvotes * 2 + b.views * 0.1 + b.comments.length * 3
        return scoreB - scoreA
      })
      .slice(0, 10)

    // 热门分享内容
    const sharedContent = Array.from(this.sharedContent.values())
      .filter((content) => content.sharedAt >= cutoff)
      .sort((a, b) => {
        const scoreA = a.stats.likes * 2 + a.stats.views * 0.1 + a.stats.shares * 3
        const scoreB = b.stats.likes * 2 + b.stats.views * 0.1 + b.stats.shares * 3
        return scoreB - scoreA
      })
      .slice(0, 10)

    // 活跃用户
    const activeUsers = Array.from(this.users.values())
      .filter((user) => user.lastActiveAt >= cutoff)
      .sort((a, b) => b.reputation - a.reputation)
      .slice(0, 10)

    return { posts, sharedContent, activeUsers }
  }

  // 获取用户统计
  getUserStats(userId: string): {
    posts: number
    comments: number
    reputation: number
    followers: number
    following: number
    teamMemberships: number
    sharedContent: number
  } {
    const user = this.users.get(userId)
    if (!user) {
      return {
        posts: 0,
        comments: 0,
        reputation: 0,
        followers: 0,
        following: 0,
        teamMemberships: 0,
        sharedContent: 0,
      }
    }

    // 计算关注者数量
    let followers = 0
    this.follows.forEach((following) => {
      if (following.has(userId)) {
        followers++
      }
    })

    const following = this.follows.get(userId)?.size || 0

    // 计算团队成员身份
    const teamMemberships = Array.from(this.teams.values()).filter((team) =>
      team.members.some((member) => member.userId === userId),
    ).length

    // 计算分享内容数量
    const sharedContent = Array.from(this.sharedContent.values()).filter(
      (content) => content.sharedBy === userId,
    ).length

    return {
      posts: user.stats.postsCount,
      comments: user.stats.commentsCount,
      reputation: user.reputation,
      followers,
      following,
      teamMemberships,
      sharedContent,
    }
  }

  // 私有方法
  private createNotification(
    userId: string,
    notificationData: Omit<Notification, "id" | "userId" | "isRead" | "createdAt">,
  ): void {
    const notification: Notification = {
      ...notificationData,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      isRead: false,
      createdAt: new Date(),
    }

    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, [])
    }

    this.notifications.get(userId)!.push(notification)
  }

  private findCommentInPost(post: CommunityPost, commentId: string): Comment | null {
    // 递归查找评论
    const findInComments = (comments: Comment[]): Comment | null => {
      for (const comment of comments) {
        if (comment.id === commentId) {
          return comment
        }
        const found = findInComments(comment.replies)
        if (found) return found
      }
      return null
    }

    return findInComments(post.comments)
  }

  // 获取所有帖子
  getAllPosts(): CommunityPost[] {
    return Array.from(this.posts.values())
  }

  // 获取帖子详情
  getPost(postId: string): CommunityPost | undefined {
    const post = this.posts.get(postId)
    if (post) {
      post.views++
    }
    return post
  }

  // 获取用户信息
  getUser(userId: string): User | undefined {
    return this.users.get(userId)
  }

  // 获取团队信息
  getTeam(teamId: string): Team | undefined {
    return this.teams.get(teamId)
  }

  // 获取分享内容
  getSharedContent(contentId: string): SharedContent | undefined {
    const content = this.sharedContent.get(contentId)
    if (content) {
      content.stats.views++
    }
    return content
  }
}

// 单例实例
export const collaborationManager = new CollaborationManager()
