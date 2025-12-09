import type { KnowledgeGraph } from "./knowledge-graph"

export interface LearningGoal {
  id: string
  title: string
  description: string
  targetSkills: string[]
  difficulty: 1 | 2 | 3 | 4 | 5
  estimatedTime: number // 小时
  priority: "low" | "medium" | "high"
  deadline?: number
  createdAt: number
}

export interface LearningStep {
  id: string
  title: string
  description: string
  type: "study" | "practice" | "review" | "assessment"
  estimatedTime: number // 分钟
  difficulty: 1 | 2 | 3 | 4 | 5
  prerequisites: string[]
  resources: LearningResource[]
  completed: boolean
  completedAt?: number
  notes?: string
}

export interface LearningResource {
  id: string
  title: string
  type: "article" | "video" | "book" | "course" | "exercise"
  url?: string
  description: string
  difficulty: 1 | 2 | 3 | 4 | 5
  estimatedTime: number
  rating?: number
}

export interface LearningPath {
  id: string
  goalId: string
  title: string
  description: string
  steps: LearningStep[]
  totalEstimatedTime: number
  progress: number // 0-100
  createdAt: number
  updatedAt: number
  status: "not_started" | "in_progress" | "completed" | "paused"
}

export class LearningPathManager {
  private static readonly GOALS_STORAGE_KEY = "ai-search-learning-goals"
  private static readonly PATHS_STORAGE_KEY = "ai-search-learning-paths"

  // 学习目标管理
  static getLearningGoals(): LearningGoal[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.GOALS_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  static createLearningGoal(
    title: string,
    description: string,
    targetSkills: string[],
    difficulty: 1 | 2 | 3 | 4 | 5,
    estimatedTime: number,
    priority: "low" | "medium" | "high" = "medium",
    deadline?: number,
  ): LearningGoal {
    const goal: LearningGoal = {
      id: `goal-${Date.now()}`,
      title,
      description,
      targetSkills,
      difficulty,
      estimatedTime,
      priority,
      deadline,
      createdAt: Date.now(),
    }

    const goals = this.getLearningGoals()
    goals.unshift(goal)
    localStorage.setItem(this.GOALS_STORAGE_KEY, JSON.stringify(goals))

    return goal
  }

  // 学习路径管理
  static getLearningPaths(): LearningPath[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.PATHS_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  static generateLearningPath(goal: LearningGoal, knowledgeGraph?: KnowledgeGraph): LearningPath {
    const steps = this.generateLearningSteps(goal, knowledgeGraph)
    const totalTime = steps.reduce((sum, step) => sum + step.estimatedTime, 0)

    const path: LearningPath = {
      id: `path-${Date.now()}`,
      goalId: goal.id,
      title: `学习路径：${goal.title}`,
      description: `为实现"${goal.title}"目标而制定的个性化学习路径`,
      steps,
      totalEstimatedTime: totalTime,
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: "not_started",
    }

    const paths = this.getLearningPaths()
    paths.unshift(path)
    localStorage.setItem(this.PATHS_STORAGE_KEY, JSON.stringify(paths))

    return path
  }

  private static generateLearningSteps(goal: LearningGoal, knowledgeGraph?: KnowledgeGraph): LearningStep[] {
    const steps: LearningStep[] = []
    let stepId = 0

    // 基础阶段
    steps.push({
      id: `step-${stepId++}`,
      title: "基础概念学习",
      description: `学习${goal.title}的基础概念和理论知识`,
      type: "study",
      estimatedTime: Math.max(30, goal.estimatedTime * 60 * 0.3),
      difficulty: Math.max(1, goal.difficulty - 1) as 1 | 2 | 3 | 4 | 5,
      prerequisites: [],
      resources: this.generateResources("基础概念", goal.difficulty),
      completed: false,
    })

    // 实践阶段
    steps.push({
      id: `step-${stepId++}`,
      title: "实践练习",
      description: `通过实际练习巩固${goal.title}相关技能`,
      type: "practice",
      estimatedTime: Math.max(45, goal.estimatedTime * 60 * 0.4),
      difficulty: goal.difficulty,
      prerequisites: [steps[0].id],
      resources: this.generateResources("实践练习", goal.difficulty),
      completed: false,
    })

    // 进阶阶段
    if (goal.difficulty >= 3) {
      steps.push({
        id: `step-${stepId++}`,
        title: "进阶应用",
        description: `探索${goal.title}的高级应用和技巧`,
        type: "study",
        estimatedTime: Math.max(60, goal.estimatedTime * 60 * 0.2),
        difficulty: Math.min(5, goal.difficulty + 1) as 1 | 2 | 3 | 4 | 5,
        prerequisites: [steps[1].id],
        resources: this.generateResources("进阶应用", goal.difficulty + 1),
        completed: false,
      })
    }

    // 复习和评估
    steps.push({
      id: `step-${stepId++}`,
      title: "复习与评估",
      description: `回顾学习内容，评估掌握程度`,
      type: "review",
      estimatedTime: Math.max(20, goal.estimatedTime * 60 * 0.1),
      difficulty: goal.difficulty,
      prerequisites: steps.slice(-1).map((s) => s.id),
      resources: this.generateResources("复习评估", goal.difficulty),
      completed: false,
    })

    return steps
  }

  private static generateResources(topic: string, difficulty: number): LearningResource[] {
    const resources: LearningResource[] = []
    let resourceId = 0

    // 文章资源
    resources.push({
      id: `resource-${resourceId++}`,
      title: `${topic} - 理论基础`,
      type: "article",
      description: `关于${topic}的详细理论介绍`,
      difficulty: Math.max(1, difficulty - 1) as 1 | 2 | 3 | 4 | 5,
      estimatedTime: 15 + difficulty * 5,
      rating: 4.2,
    })

    // 视频资源
    resources.push({
      id: `resource-${resourceId++}`,
      title: `${topic} - 视频教程`,
      type: "video",
      description: `${topic}的视频讲解和演示`,
      difficulty: difficulty as 1 | 2 | 3 | 4 | 5,
      estimatedTime: 20 + difficulty * 8,
      rating: 4.5,
    })

    // 练习资源
    if (difficulty >= 2) {
      resources.push({
        id: `resource-${resourceId++}`,
        title: `${topic} - 实践练习`,
        type: "exercise",
        description: `${topic}相关的实践练习题`,
        difficulty: difficulty as 1 | 2 | 3 | 4 | 5,
        estimatedTime: 30 + difficulty * 10,
        rating: 4.0,
      })
    }

    return resources
  }

  static updateStepProgress(pathId: string, stepId: string, completed: boolean, notes?: string): void {
    const paths = this.getLearningPaths()
    const path = paths.find((p) => p.id === pathId)

    if (path) {
      const step = path.steps.find((s) => s.id === stepId)
      if (step) {
        step.completed = completed
        step.completedAt = completed ? Date.now() : undefined
        step.notes = notes

        // 更新路径进度
        const completedSteps = path.steps.filter((s) => s.completed).length
        path.progress = (completedSteps / path.steps.length) * 100
        path.updatedAt = Date.now()

        // 更新路径状态
        if (path.progress === 100) {
          path.status = "completed"
        } else if (path.progress > 0) {
          path.status = "in_progress"
        }

        localStorage.setItem(this.PATHS_STORAGE_KEY, JSON.stringify(paths))
      }
    }
  }

  static getRecommendedNextSteps(pathId: string): LearningStep[] {
    const paths = this.getLearningPaths()
    const path = paths.find((p) => p.id === pathId)

    if (!path) return []

    // 找到可以开始的下一步
    return path.steps.filter((step) => {
      if (step.completed) return false

      // 检查前置条件是否完成
      return step.prerequisites.every((prereqId) => {
        const prereqStep = path.steps.find((s) => s.id === prereqId)
        return prereqStep?.completed || false
      })
    })
  }

  static getPathStatistics(pathId: string) {
    const paths = this.getLearningPaths()
    const path = paths.find((p) => p.id === pathId)

    if (!path) return null

    const completedSteps = path.steps.filter((s) => s.completed).length
    const totalSteps = path.steps.length
    const completedTime = path.steps.filter((s) => s.completed).reduce((sum, step) => sum + step.estimatedTime, 0)

    return {
      progress: path.progress,
      completedSteps,
      totalSteps,
      completedTime,
      totalEstimatedTime: path.totalEstimatedTime,
      averageStepDifficulty: path.steps.reduce((sum, step) => sum + step.difficulty, 0) / path.steps.length,
    }
  }
}
