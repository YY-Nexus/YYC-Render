export interface LearningStep {
  id: string
  title: string
  description: string
  type: "concept" | "practice" | "assessment" | "project" | "reading"
  difficulty: number
  estimatedTime: number // 分钟
  prerequisites: string[]
  resources: LearningResource[]
  status: "not-started" | "in-progress" | "completed" | "skipped"
  progress: number // 0-100
  completedAt?: Date
  notes?: string
  tags: string[]
}

export interface LearningResource {
  id: string
  title: string
  type: "video" | "article" | "book" | "course" | "exercise" | "quiz"
  url?: string
  content?: string
  duration?: number
  difficulty: number
  rating?: number
  provider?: string
}

export interface LearningPath {
  id: string
  title: string
  description: string
  category: string
  difficulty: "beginner" | "intermediate" | "advanced"
  estimatedDuration: number // 小时
  steps: LearningStep[]
  prerequisites: string[]
  objectives: string[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
  isPublic: boolean
  tags: string[]
  stats: {
    totalSteps: number
    completedSteps: number
    totalTime: number
    completedTime: number
    averageRating: number
    enrollments: number
  }
}

export interface LearningProgress {
  pathId: string
  userId: string
  currentStepId: string
  completedSteps: string[]
  totalTimeSpent: number
  startedAt: Date
  lastAccessedAt: Date
  completionPercentage: number
  notes: Record<string, string> // stepId -> note
  ratings: Record<string, number> // stepId -> rating
}

export class LearningPathManager {
  private paths: Map<string, LearningPath> = new Map()
  private progress: Map<string, LearningProgress> = new Map() // userId_pathId -> progress
  private templates: Map<string, LearningPath> = new Map()

  // 创建学习路径
  createPath(pathData: Omit<LearningPath, "id" | "createdAt" | "updatedAt" | "stats">): LearningPath {
    const path: LearningPath = {
      ...pathData,
      id: `path_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      stats: {
        totalSteps: pathData.steps.length,
        completedSteps: 0,
        totalTime: pathData.steps.reduce((sum, step) => sum + step.estimatedTime, 0),
        completedTime: 0,
        averageRating: 0,
        enrollments: 0,
      },
    }

    this.paths.set(path.id, path)
    return path
  }

  // 智能生成学习路径
  generatePath(
    topic: string,
    difficulty: LearningPath["difficulty"],
    preferences: {
      preferredTypes: LearningStep["type"][]
      timeConstraint?: number // 小时
      focusAreas?: string[]
    },
  ): LearningPath {
    const steps: LearningStep[] = []

    // 基础概念步骤
    if (preferences.preferredTypes.includes("concept")) {
      steps.push({
        id: `step_${Date.now()}_1`,
        title: `${topic}基础概念`,
        description: `学习${topic}的核心概念和基本原理`,
        type: "concept",
        difficulty: difficulty === "beginner" ? 1 : difficulty === "intermediate" ? 2 : 3,
        estimatedTime: 60,
        prerequisites: [],
        resources: this.generateResources(topic, "concept"),
        status: "not-started",
        progress: 0,
        tags: [topic, "基础", "概念"],
      })
    }

    // 实践步骤
    if (preferences.preferredTypes.includes("practice")) {
      steps.push({
        id: `step_${Date.now()}_2`,
        title: `${topic}实践练习`,
        description: `通过实际练习掌握${topic}的应用`,
        type: "practice",
        difficulty: difficulty === "beginner" ? 2 : difficulty === "intermediate" ? 3 : 4,
        estimatedTime: 90,
        prerequisites: steps.length > 0 ? [steps[0].id] : [],
        resources: this.generateResources(topic, "practice"),
        status: "not-started",
        progress: 0,
        tags: [topic, "实践", "练习"],
      })
    }

    // 项目步骤
    if (preferences.preferredTypes.includes("project")) {
      steps.push({
        id: `step_${Date.now()}_3`,
        title: `${topic}项目实战`,
        description: `完成一个完整的${topic}项目`,
        type: "project",
        difficulty: difficulty === "beginner" ? 3 : difficulty === "intermediate" ? 4 : 5,
        estimatedTime: 180,
        prerequisites: steps.slice(0, 2).map((s) => s.id),
        resources: this.generateResources(topic, "project"),
        status: "not-started",
        progress: 0,
        tags: [topic, "项目", "实战"],
      })
    }

    // 评估步骤
    if (preferences.preferredTypes.includes("assessment")) {
      steps.push({
        id: `step_${Date.now()}_4`,
        title: `${topic}知识评估`,
        description: `测试你对${topic}的掌握程度`,
        type: "assessment",
        difficulty: difficulty === "beginner" ? 2 : difficulty === "intermediate" ? 3 : 4,
        estimatedTime: 45,
        prerequisites: steps.map((s) => s.id),
        resources: this.generateResources(topic, "assessment"),
        status: "not-started",
        progress: 0,
        tags: [topic, "评估", "测试"],
      })
    }

    return this.createPath({
      title: `${topic}学习路径`,
      description: `系统学习${topic}的完整路径`,
      category: this.inferCategory(topic),
      difficulty,
      estimatedDuration: Math.ceil(steps.reduce((sum, step) => sum + step.estimatedTime, 0) / 60),
      steps,
      prerequisites: [],
      objectives: [`掌握${topic}的核心概念`, `能够实际应用${topic}解决问题`, `具备${topic}项目开发能力`],
      createdBy: "system",
      isPublic: true,
      tags: [topic, difficulty, "自动生成"],
    })
  }

  // 开始学习路径
  startPath(pathId: string, userId: string): LearningProgress {
    const path = this.paths.get(pathId)
    if (!path) throw new Error("Learning path not found")

    const progressKey = `${userId}_${pathId}`
    const progress: LearningProgress = {
      pathId,
      userId,
      currentStepId: path.steps[0]?.id || "",
      completedSteps: [],
      totalTimeSpent: 0,
      startedAt: new Date(),
      lastAccessedAt: new Date(),
      completionPercentage: 0,
      notes: {},
      ratings: {},
    }

    this.progress.set(progressKey, progress)

    // 更新路径统计
    path.stats.enrollments++

    return progress
  }

  // 完成学习步骤
  completeStep(
    pathId: string,
    userId: string,
    stepId: string,
    timeSpent: number,
    rating?: number,
    note?: string,
  ): boolean {
    const progressKey = `${userId}_${pathId}`
    const progress = this.progress.get(progressKey)
    const path = this.paths.get(pathId)

    if (!progress || !path) return false

    const step = path.steps.find((s) => s.id === stepId)
    if (!step) return false

    // 更新步骤状态
    step.status = "completed"
    step.progress = 100
    step.completedAt = new Date()

    // 更新进度
    if (!progress.completedSteps.includes(stepId)) {
      progress.completedSteps.push(stepId)
    }
    progress.totalTimeSpent += timeSpent
    progress.lastAccessedAt = new Date()
    progress.completionPercentage = (progress.completedSteps.length / path.steps.length) * 100

    if (rating) {
      progress.ratings[stepId] = rating
    }

    if (note) {
      progress.notes[stepId] = note
    }

    // 找到下一个可用步骤
    const nextStep = this.findNextAvailableStep(path, progress.completedSteps)
    if (nextStep) {
      progress.currentStepId = nextStep.id
    }

    // 更新路径统计
    this.updatePathStats(pathId)

    return true
  }

  // 获取推荐的下一步
  getNextSteps(pathId: string, userId: string): LearningStep[] {
    const progressKey = `${userId}_${pathId}`
    const progress = this.progress.get(progressKey)
    const path = this.paths.get(pathId)

    if (!progress || !path) return []

    return path.steps
      .filter((step) => {
        // 检查前置条件是否满足
        const prerequisitesMet = step.prerequisites.every((prereq) => progress.completedSteps.includes(prereq))

        // 未完成且前置条件满足
        return step.status !== "completed" && prerequisitesMet
      })
      .sort((a, b) => a.difficulty - b.difficulty)
  }

  // 获取学习建议
  getLearningRecommendations(
    pathId: string,
    userId: string,
  ): {
    nextSteps: LearningStep[]
    reviewSteps: LearningStep[]
    additionalResources: LearningResource[]
    estimatedTimeToComplete: number
  } {
    const progressKey = `${userId}_${pathId}`
    const progress = this.progress.get(progressKey)
    const path = this.paths.get(pathId)

    if (!progress || !path) {
      return {
        nextSteps: [],
        reviewSteps: [],
        additionalResources: [],
        estimatedTimeToComplete: 0,
      }
    }

    const nextSteps = this.getNextSteps(pathId, userId)

    // 找到需要复习的步骤（评分较低的已完成步骤）
    const reviewSteps = path.steps.filter((step) => {
      const rating = progress.ratings[step.id]
      return step.status === "completed" && rating && rating < 3
    })

    // 剩余时间估算
    const remainingSteps = path.steps.filter((step) => step.status !== "completed")
    const estimatedTimeToComplete = remainingSteps.reduce((sum, step) => sum + step.estimatedTime, 0)

    // 额外资源推荐
    const additionalResources = this.getAdditionalResources(path, progress)

    return {
      nextSteps: nextSteps.slice(0, 3),
      reviewSteps: reviewSteps.slice(0, 2),
      additionalResources: additionalResources.slice(0, 5),
      estimatedTimeToComplete,
    }
  }

  // 搜索学习路径
  searchPaths(
    query: string,
    filters: {
      category?: string
      difficulty?: LearningPath["difficulty"]
      tags?: string[]
      minDuration?: number
      maxDuration?: number
    } = {},
  ): LearningPath[] {
    const results: Array<{ path: LearningPath; relevance: number }> = []

    this.paths.forEach((path) => {
      let relevance = 0

      // 应用过滤器
      if (filters.category && path.category !== filters.category) return
      if (filters.difficulty && path.difficulty !== filters.difficulty) return
      if (filters.minDuration && path.estimatedDuration < filters.minDuration) return
      if (filters.maxDuration && path.estimatedDuration > filters.maxDuration) return
      if (filters.tags && !filters.tags.some((tag) => path.tags.includes(tag))) return

      // 计算相关性
      if (path.title.toLowerCase().includes(query.toLowerCase())) {
        relevance += 0.8
      }
      if (path.description.toLowerCase().includes(query.toLowerCase())) {
        relevance += 0.6
      }
      path.tags.forEach((tag) => {
        if (tag.toLowerCase().includes(query.toLowerCase())) {
          relevance += 0.4
        }
      })

      if (relevance > 0 || query === "") {
        results.push({ path, relevance })
      }
    })

    return results.sort((a, b) => b.relevance - a.relevance).map((result) => result.path)
  }

  // 获取学习统计
  getLearningStats(userId: string): {
    totalPaths: number
    completedPaths: number
    inProgressPaths: number
    totalTimeSpent: number
    averageCompletion: number
    favoriteCategories: string[]
    achievements: string[]
  } {
    const userProgress = Array.from(this.progress.values()).filter((p) => p.userId === userId)

    const completedPaths = userProgress.filter((p) => p.completionPercentage === 100).length
    const inProgressPaths = userProgress.filter(
      (p) => p.completionPercentage > 0 && p.completionPercentage < 100,
    ).length
    const totalTimeSpent = userProgress.reduce((sum, p) => sum + p.totalTimeSpent, 0)
    const averageCompletion =
      userProgress.length > 0
        ? userProgress.reduce((sum, p) => sum + p.completionPercentage, 0) / userProgress.length
        : 0

    // 统计最喜欢的分类
    const categoryCount: Record<string, number> = {}
    userProgress.forEach((progress) => {
      const path = this.paths.get(progress.pathId)
      if (path) {
        categoryCount[path.category] = (categoryCount[path.category] || 0) + 1
      }
    })

    const favoriteCategories = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category)

    // 成就系统
    const achievements: string[] = []
    if (completedPaths >= 1) achievements.push("初学者")
    if (completedPaths >= 5) achievements.push("学习达人")
    if (completedPaths >= 10) achievements.push("知识大师")
    if (totalTimeSpent >= 3600) achievements.push("时间投资者") // 60小时
    if (averageCompletion >= 80) achievements.push("完美主义者")

    return {
      totalPaths: userProgress.length,
      completedPaths,
      inProgressPaths,
      totalTimeSpent,
      averageCompletion,
      favoriteCategories,
      achievements,
    }
  }

  // 私有方法
  private generateResources(topic: string, type: LearningStep["type"]): LearningResource[] {
    const resources: LearningResource[] = []

    switch (type) {
      case "concept":
        resources.push({
          id: `resource_${Date.now()}_1`,
          title: `${topic}概念详解`,
          type: "article",
          difficulty: 2,
          rating: 4.5,
          provider: "AI学习平台",
        })
        break
      case "practice":
        resources.push({
          id: `resource_${Date.now()}_2`,
          title: `${topic}练习题集`,
          type: "exercise",
          difficulty: 3,
          rating: 4.2,
          provider: "AI学习平台",
        })
        break
      case "project":
        resources.push({
          id: `resource_${Date.now()}_3`,
          title: `${topic}项目指南`,
          type: "course",
          difficulty: 4,
          rating: 4.7,
          provider: "AI学习平台",
        })
        break
      case "assessment":
        resources.push({
          id: `resource_${Date.now()}_4`,
          title: `${topic}知识测试`,
          type: "quiz",
          difficulty: 3,
          rating: 4.0,
          provider: "AI学习平台",
        })
        break
    }

    return resources
  }

  private inferCategory(topic: string): string {
    const categoryMap: Record<string, string> = {
      javascript: "编程语言",
      python: "编程语言",
      react: "前端开发",
      vue: "前端开发",
      nodejs: "后端开发",
      database: "数据库",
      ai: "人工智能",
      "machine learning": "人工智能",
      design: "设计",
      marketing: "市场营销",
    }

    const lowerTopic = topic.toLowerCase()
    for (const [key, category] of Object.entries(categoryMap)) {
      if (lowerTopic.includes(key)) {
        return category
      }
    }

    return "通用技能"
  }

  private findNextAvailableStep(path: LearningPath, completedSteps: string[]): LearningStep | null {
    return (
      path.steps.find((step) => {
        const prerequisitesMet = step.prerequisites.every((prereq) => completedSteps.includes(prereq))
        return step.status !== "completed" && prerequisitesMet
      }) || null
    )
  }

  private updatePathStats(pathId: string): void {
    const path = this.paths.get(pathId)
    if (!path) return

    const allProgress = Array.from(this.progress.values()).filter((p) => p.pathId === pathId)

    path.stats.completedSteps = path.steps.filter((s) => s.status === "completed").length
    path.stats.completedTime = path.steps
      .filter((s) => s.status === "completed")
      .reduce((sum, s) => sum + s.estimatedTime, 0)

    // 计算平均评分
    const allRatings: number[] = []
    allProgress.forEach((progress) => {
      Object.values(progress.ratings).forEach((rating) => {
        allRatings.push(rating)
      })
    })

    path.stats.averageRating =
      allRatings.length > 0 ? allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length : 0

    path.updatedAt = new Date()
  }

  private getAdditionalResources(path: LearningPath, progress: LearningProgress): LearningResource[] {
    // 基于用户的学习进度和评分推荐额外资源
    const resources: LearningResource[] = []

    // 如果某个步骤评分较低，推荐相关的补充资源
    Object.entries(progress.ratings).forEach(([stepId, rating]) => {
      if (rating < 3) {
        const step = path.steps.find((s) => s.id === stepId)
        if (step) {
          resources.push({
            id: `additional_${Date.now()}_${stepId}`,
            title: `${step.title}补充材料`,
            type: "article",
            difficulty: step.difficulty - 1,
            rating: 4.0,
            provider: "AI学习平台",
          })
        }
      }
    })

    return resources
  }

  // 获取所有路径
  getAllPaths(): LearningPath[] {
    return Array.from(this.paths.values())
  }

  // 获取用户进度
  getUserProgress(userId: string, pathId: string): LearningProgress | undefined {
    return this.progress.get(`${userId}_${pathId}`)
  }

  // 获取路径详情
  getPath(pathId: string): LearningPath | undefined {
    return this.paths.get(pathId)
  }

  // 删除路径
  deletePath(pathId: string): boolean {
    // 删除相关的进度记录
    const progressToDelete: string[] = []
    this.progress.forEach((progress, key) => {
      if (progress.pathId === pathId) {
        progressToDelete.push(key)
      }
    })

    progressToDelete.forEach((key) => {
      this.progress.delete(key)
    })

    return this.paths.delete(pathId)
  }

  // 更新路径
  updatePath(pathId: string, updates: Partial<LearningPath>): boolean {
    const path = this.paths.get(pathId)
    if (!path) return false

    Object.assign(path, updates, { updatedAt: new Date() })
    return true
  }
}

// 单例实例
export const learningPathManager = new LearningPathManager()
