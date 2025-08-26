export interface StudyGroup {
  id: string
  name: string
  description: string
  category: string
  creatorId: string
  creatorName: string
  memberCount: number
  maxMembers: number
  isPublic: boolean
  tags: string[]
  createdAt: number
  lastActivity: number
  level: "beginner" | "intermediate" | "advanced"
  language: string
}

export interface GroupMember {
  id: string
  groupId: string
  userId: string
  userName: string
  userAvatar: string
  role: "owner" | "moderator" | "member"
  joinedAt: number
  contribution: number
  lastActive: number
}

export interface StudySession {
  id: string
  groupId: string
  title: string
  description: string
  scheduledAt: number
  duration: number // 分钟
  type: "discussion" | "presentation" | "workshop" | "review"
  hostId: string
  hostName: string
  participants: string[]
  maxParticipants: number
  status: "scheduled" | "ongoing" | "completed" | "cancelled"
  recordingUrl?: string
  materials: StudyMaterial[]
}

export interface StudyMaterial {
  id: string
  title: string
  type: "document" | "video" | "link" | "quiz"
  url: string
  description: string
  uploadedBy: string
  uploadedAt: number
}

export interface Mentor {
  id: string
  userId: string
  userName: string
  userAvatar: string
  expertise: string[]
  experience: string
  rating: number
  reviewCount: number
  hourlyRate?: number
  availability: "available" | "busy" | "offline"
  languages: string[]
  timezone: string
  bio: string
  achievements: string[]
}

export interface MentorshipRequest {
  id: string
  studentId: string
  studentName: string
  mentorId: string
  mentorName: string
  topic: string
  description: string
  preferredTime: number
  duration: number
  status: "pending" | "accepted" | "declined" | "completed"
  createdAt: number
  scheduledAt?: number
}

export interface ContentCreator {
  id: string
  userId: string
  userName: string
  userAvatar: string
  specialties: string[]
  followerCount: number
  contentCount: number
  totalViews: number
  averageRating: number
  verified: boolean
  tier: "bronze" | "silver" | "gold" | "platinum"
  earnings: number
  joinedAt: number
}

export interface CreatorIncentive {
  id: string
  creatorId: string
  type: "view_bonus" | "quality_bonus" | "engagement_bonus" | "milestone_reward"
  amount: number
  description: string
  earnedAt: number
  contentId?: string
}

export class CollaborationEnhancedManager {
  private static readonly STUDY_GROUPS_KEY = "ai-search-study-groups"
  private static readonly GROUP_MEMBERS_KEY = "ai-search-group-members"
  private static readonly STUDY_SESSIONS_KEY = "ai-search-study-sessions"
  private static readonly MENTORS_KEY = "ai-search-mentors"
  private static readonly MENTORSHIP_REQUESTS_KEY = "ai-search-mentorship-requests"
  private static readonly CONTENT_CREATORS_KEY = "ai-search-content-creators"
  private static readonly CREATOR_INCENTIVES_KEY = "ai-search-creator-incentives"

  // 学习小组管理
  static getStudyGroups(): StudyGroup[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.STUDY_GROUPS_KEY)
      return stored ? JSON.parse(stored) : this.getDefaultStudyGroups()
    } catch {
      return this.getDefaultStudyGroups()
    }
  }

  private static getDefaultStudyGroups(): StudyGroup[] {
    return [
      {
        id: "group-1",
        name: "AI学习交流群",
        description: "专注于人工智能技术学习和讨论的小组",
        category: "技术",
        creatorId: "user-1",
        creatorName: "AI导师",
        memberCount: 156,
        maxMembers: 200,
        isPublic: true,
        tags: ["AI", "机器学习", "深度学习"],
        createdAt: Date.now() - 86400000 * 30,
        lastActivity: Date.now() - 3600000,
        level: "intermediate",
        language: "中文",
      },
      {
        id: "group-2",
        name: "前端开发实战",
        description: "前端开发技术分享和项目实践",
        category: "编程",
        creatorId: "user-2",
        creatorName: "前端专家",
        memberCount: 89,
        maxMembers: 150,
        isPublic: true,
        tags: ["React", "Vue", "JavaScript"],
        createdAt: Date.now() - 86400000 * 15,
        lastActivity: Date.now() - 1800000,
        level: "beginner",
        language: "中文",
      },
      {
        id: "group-3",
        name: "设计思维工作坊",
        description: "用户体验设计和创意思维训练",
        category: "设计",
        creatorId: "user-3",
        creatorName: "设计师",
        memberCount: 67,
        maxMembers: 100,
        isPublic: true,
        tags: ["UX", "UI", "设计思维"],
        createdAt: Date.now() - 86400000 * 7,
        lastActivity: Date.now() - 7200000,
        level: "advanced",
        language: "中文",
      },
    ]
  }

  static createStudyGroup(
    groupData: Omit<StudyGroup, "id" | "memberCount" | "createdAt" | "lastActivity">,
  ): StudyGroup {
    const newGroup: StudyGroup = {
      ...groupData,
      id: `group-${Date.now()}`,
      memberCount: 1,
      createdAt: Date.now(),
      lastActivity: Date.now(),
    }

    const groups = this.getStudyGroups()
    groups.unshift(newGroup)

    if (typeof window !== "undefined") {
      localStorage.setItem(this.STUDY_GROUPS_KEY, JSON.stringify(groups))
    }

    return newGroup
  }

  static joinStudyGroup(groupId: string, userId: string, userName: string, userAvatar: string): boolean {
    const groups = this.getStudyGroups()
    const group = groups.find((g) => g.id === groupId)

    if (!group || group.memberCount >= group.maxMembers) {
      return false
    }

    // 添加成员
    const members = this.getGroupMembers(groupId)
    const existingMember = members.find((m) => m.userId === userId)

    if (existingMember) {
      return false // 已经是成员
    }

    const newMember: GroupMember = {
      id: `member-${Date.now()}`,
      groupId,
      userId,
      userName,
      userAvatar,
      role: "member",
      joinedAt: Date.now(),
      contribution: 0,
      lastActive: Date.now(),
    }

    members.push(newMember)
    group.memberCount++
    group.lastActivity = Date.now()

    if (typeof window !== "undefined") {
      localStorage.setItem(this.STUDY_GROUPS_KEY, JSON.stringify(groups))
      localStorage.setItem(this.GROUP_MEMBERS_KEY, JSON.stringify(members))
    }

    return true
  }

  static getGroupMembers(groupId: string): GroupMember[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.GROUP_MEMBERS_KEY)
      const allMembers: GroupMember[] = stored ? JSON.parse(stored) : []
      return allMembers.filter((m) => m.groupId === groupId)
    } catch {
      return []
    }
  }

  // 学习会话管理
  static getStudySessions(groupId?: string): StudySession[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.STUDY_SESSIONS_KEY)
      const allSessions: StudySession[] = stored ? JSON.parse(stored) : this.getDefaultStudySessions()
      return groupId ? allSessions.filter((s) => s.groupId === groupId) : allSessions
    } catch {
      return this.getDefaultStudySessions()
    }
  }

  private static getDefaultStudySessions(): StudySession[] {
    return [
      {
        id: "session-1",
        groupId: "group-1",
        title: "ChatGPT应用实战分享",
        description: "分享ChatGPT在日常工作中的实际应用案例",
        scheduledAt: Date.now() + 86400000, // 明天
        duration: 90,
        type: "presentation",
        hostId: "user-1",
        hostName: "AI导师",
        participants: ["user-2", "user-3"],
        maxParticipants: 50,
        status: "scheduled",
        materials: [
          {
            id: "material-1",
            title: "ChatGPT使用指南",
            type: "document",
            url: "/materials/chatgpt-guide.pdf",
            description: "详细的ChatGPT使用教程",
            uploadedBy: "user-1",
            uploadedAt: Date.now() - 3600000,
          },
        ],
      },
      {
        id: "session-2",
        groupId: "group-2",
        title: "React Hooks深度解析",
        description: "深入理解React Hooks的原理和最佳实践",
        scheduledAt: Date.now() + 86400000 * 2, // 后天
        duration: 120,
        type: "workshop",
        hostId: "user-2",
        hostName: "前端专家",
        participants: ["user-4", "user-5"],
        maxParticipants: 30,
        status: "scheduled",
        materials: [],
      },
    ]
  }

  static scheduleStudySession(sessionData: Omit<StudySession, "id" | "participants" | "status">): StudySession {
    const newSession: StudySession = {
      ...sessionData,
      id: `session-${Date.now()}`,
      participants: [],
      status: "scheduled",
    }

    const sessions = this.getStudySessions()
    sessions.unshift(newSession)

    if (typeof window !== "undefined") {
      localStorage.setItem(this.STUDY_SESSIONS_KEY, JSON.stringify(sessions))
    }

    return newSession
  }

  // 导师系统
  static getMentors(expertise?: string): Mentor[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.MENTORS_KEY)
      const allMentors: Mentor[] = stored ? JSON.parse(stored) : this.getDefaultMentors()

      if (expertise) {
        return allMentors.filter((m) => m.expertise.some((e) => e.toLowerCase().includes(expertise.toLowerCase())))
      }

      return allMentors
    } catch {
      return this.getDefaultMentors()
    }
  }

  private static getDefaultMentors(): Mentor[] {
    return [
      {
        id: "mentor-1",
        userId: "user-mentor-1",
        userName: "张教授",
        userAvatar: "/diverse-professor-lecturing.png",
        expertise: ["机器学习", "深度学习", "数据科学"],
        experience: "10年AI研究经验，发表论文50+篇",
        rating: 4.9,
        reviewCount: 127,
        hourlyRate: 200,
        availability: "available",
        languages: ["中文", "英文"],
        timezone: "GMT+8",
        bio: "清华大学计算机系教授，专注于人工智能和机器学习研究",
        achievements: ["IEEE Fellow", "国家杰青", "ACM杰出科学家"],
      },
      {
        id: "mentor-2",
        userId: "user-mentor-2",
        userName: "李工程师",
        userAvatar: "/diverse-engineers-meeting.png",
        expertise: ["前端开发", "React", "Vue", "Node.js"],
        experience: "8年全栈开发经验，曾任职于BAT",
        rating: 4.8,
        reviewCount: 89,
        hourlyRate: 150,
        availability: "available",
        languages: ["中文"],
        timezone: "GMT+8",
        bio: "资深全栈工程师，擅长前端架构设计和性能优化",
        achievements: ["技术专家", "开源贡献者", "技术博主"],
      },
    ]
  }

  static requestMentorship(requestData: Omit<MentorshipRequest, "id" | "status" | "createdAt">): MentorshipRequest {
    const newRequest: MentorshipRequest = {
      ...requestData,
      id: `request-${Date.now()}`,
      status: "pending",
      createdAt: Date.now(),
    }

    const requests = this.getMentorshipRequests()
    requests.unshift(newRequest)

    if (typeof window !== "undefined") {
      localStorage.setItem(this.MENTORSHIP_REQUESTS_KEY, JSON.stringify(requests))
    }

    return newRequest
  }

  static getMentorshipRequests(userId?: string): MentorshipRequest[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.MENTORSHIP_REQUESTS_KEY)
      const allRequests: MentorshipRequest[] = stored ? JSON.parse(stored) : []

      if (userId) {
        return allRequests.filter((r) => r.studentId === userId || r.mentorId === userId)
      }

      return allRequests
    } catch {
      return []
    }
  }

  // 内容创作者激励系统
  static getContentCreators(): ContentCreator[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.CONTENT_CREATORS_KEY)
      return stored ? JSON.parse(stored) : this.getDefaultContentCreators()
    } catch {
      return this.getDefaultContentCreators()
    }
  }

  private static getDefaultContentCreators(): ContentCreator[] {
    return [
      {
        id: "creator-1",
        userId: "user-creator-1",
        userName: "知识分享达人",
        userAvatar: "/the-creator.png",
        specialties: ["学习方法", "效率提升", "时间管理"],
        followerCount: 1250,
        contentCount: 89,
        totalViews: 45600,
        averageRating: 4.7,
        verified: true,
        tier: "gold",
        earnings: 8900,
        joinedAt: Date.now() - 86400000 * 180,
      },
      {
        id: "creator-2",
        userId: "user-creator-2",
        userName: "技术博主",
        userAvatar: "/tech-blogger.png",
        specialties: ["编程技术", "软件开发", "架构设计"],
        followerCount: 890,
        contentCount: 67,
        totalViews: 32100,
        averageRating: 4.5,
        verified: true,
        tier: "silver",
        earnings: 5600,
        joinedAt: Date.now() - 86400000 * 120,
      },
    ]
  }

  static calculateCreatorIncentive(
    creatorId: string,
    contentId: string,
    views: number,
    rating: number,
    engagement: number,
  ): CreatorIncentive | null {
    const creators = this.getContentCreators()
    const creator = creators.find((c) => c.id === creatorId)

    if (!creator) return null

    let amount = 0
    let type: CreatorIncentive["type"] = "view_bonus"
    let description = ""

    // 浏览量奖励
    if (views >= 1000) {
      amount += Math.floor(views / 100) * 2 // 每100浏览量2元
      type = "view_bonus"
      description = `浏览量达到${views}次的奖励`
    }

    // 质量奖励
    if (rating >= 4.5) {
      amount += 50
      type = "quality_bonus"
      description += (description ? "，" : "") + "高质量内容奖励"
    }

    // 互动奖励
    if (engagement >= 50) {
      amount += 30
      type = "engagement_bonus"
      description += (description ? "，" : "") + "高互动度奖励"
    }

    if (amount === 0) return null

    const incentive: CreatorIncentive = {
      id: `incentive-${Date.now()}`,
      creatorId,
      type,
      amount,
      description,
      earnedAt: Date.now(),
      contentId,
    }

    // 更新创作者收益
    creator.earnings += amount

    if (typeof window !== "undefined") {
      const incentives = this.getCreatorIncentives()
      incentives.unshift(incentive)
      localStorage.setItem(this.CREATOR_INCENTIVES_KEY, JSON.stringify(incentives))
      localStorage.setItem(this.CONTENT_CREATORS_KEY, JSON.stringify(creators))
    }

    return incentive
  }

  static getCreatorIncentives(creatorId?: string): CreatorIncentive[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.CREATOR_INCENTIVES_KEY)
      const allIncentives: CreatorIncentive[] = stored ? JSON.parse(stored) : []

      if (creatorId) {
        return allIncentives.filter((i) => i.creatorId === creatorId)
      }

      return allIncentives
    } catch {
      return []
    }
  }

  // 搜索和筛选功能
  static searchStudyGroups(
    query: string,
    filters?: {
      category?: string
      level?: string
      language?: string
    },
  ): StudyGroup[] {
    let groups = this.getStudyGroups()

    // 文本搜索
    if (query) {
      const lowerQuery = query.toLowerCase()
      groups = groups.filter(
        (group) =>
          group.name.toLowerCase().includes(lowerQuery) ||
          group.description.toLowerCase().includes(lowerQuery) ||
          group.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),
      )
    }

    // 应用筛选器
    if (filters) {
      if (filters.category) {
        groups = groups.filter((group) => group.category === filters.category)
      }
      if (filters.level) {
        groups = groups.filter((group) => group.level === filters.level)
      }
      if (filters.language) {
        groups = groups.filter((group) => group.language === filters.language)
      }
    }

    return groups
  }

  static searchMentors(
    query: string,
    filters?: {
      expertise?: string
      availability?: string
      priceRange?: [number, number]
    },
  ): Mentor[] {
    let mentors = this.getMentors()

    // 文本搜索
    if (query) {
      const lowerQuery = query.toLowerCase()
      mentors = mentors.filter(
        (mentor) =>
          mentor.userName.toLowerCase().includes(lowerQuery) ||
          mentor.expertise.some((exp) => exp.toLowerCase().includes(lowerQuery)) ||
          mentor.bio.toLowerCase().includes(lowerQuery),
      )
    }

    // 应用筛选器
    if (filters) {
      if (filters.expertise) {
        mentors = mentors.filter((mentor) =>
          mentor.expertise.some((exp) => exp.toLowerCase().includes(filters.expertise!.toLowerCase())),
        )
      }
      if (filters.availability) {
        mentors = mentors.filter((mentor) => mentor.availability === filters.availability)
      }
      if (filters.priceRange && filters.priceRange[0] >= 0 && filters.priceRange[1] > 0) {
        mentors = mentors.filter(
          (mentor) =>
            mentor.hourlyRate &&
            mentor.hourlyRate >= filters.priceRange![0] &&
            mentor.hourlyRate <= filters.priceRange![1],
        )
      }
    }

    return mentors
  }
}
