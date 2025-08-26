export interface Quiz {
  id: string
  title: string
  description: string
  category: string
  difficulty: 1 | 2 | 3 | 4 | 5
  questions: QuizQuestion[]
  timeLimit: number // 分钟
  passingScore: number // 百分比
  createdBy: string
  createdAt: number
  tags: string[]
}

export interface QuizQuestion {
  id: string
  type: "multiple_choice" | "true_false" | "short_answer" | "essay"
  question: string
  options?: string[]
  correctAnswer: string | string[]
  explanation: string
  points: number
}

export interface QuizAttempt {
  id: string
  quizId: string
  userId: string
  userName: string
  answers: Record<string, string | string[]>
  score: number
  totalPoints: number
  percentage: number
  timeSpent: number // 秒
  startedAt: number
  completedAt: number
  passed: boolean
}

export interface SkillAssessment {
  id: string
  skillName: string
  userId: string
  level: 1 | 2 | 3 | 4 | 5
  confidence: number // 0-100
  evidence: AssessmentEvidence[]
  lastAssessed: number
  nextAssessment: number
  improvementAreas: string[]
}

export interface AssessmentEvidence {
  type: "quiz_result" | "project_completion" | "peer_review" | "self_assessment"
  source: string
  score: number
  date: number
  description: string
}

export interface Certificate {
  id: string
  userId: string
  userName: string
  skillName: string
  level: string
  issueDate: number
  expiryDate?: number
  verificationCode: string
  achievements: string[]
  credentialUrl: string
}

export interface LearningPortfolio {
  id: string
  userId: string
  userName: string
  userAvatar: string
  title: string
  description: string
  skills: PortfolioSkill[]
  projects: PortfolioProject[]
  certificates: Certificate[]
  testimonials: Testimonial[]
  createdAt: number
  updatedAt: number
  isPublic: boolean
}

export interface PortfolioSkill {
  name: string
  level: number
  endorsements: number
  evidence: string[]
}

export interface PortfolioProject {
  id: string
  title: string
  description: string
  technologies: string[]
  imageUrl?: string
  projectUrl?: string
  completedAt: number
}

export interface Testimonial {
  id: string
  fromUserId: string
  fromUserName: string
  fromUserAvatar: string
  content: string
  skills: string[]
  createdAt: number
}

export class AssessmentManager {
  private static readonly QUIZZES_KEY = "ai-search-quizzes"
  private static readonly QUIZ_ATTEMPTS_KEY = "ai-search-quiz-attempts"
  private static readonly SKILL_ASSESSMENTS_KEY = "ai-search-skill-assessments"
  private static readonly CERTIFICATES_KEY = "ai-search-certificates"
  private static readonly PORTFOLIOS_KEY = "ai-search-portfolios"

  // 测验管理
  static getQuizzes(category?: string): Quiz[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.QUIZZES_KEY)
      const allQuizzes: Quiz[] = stored ? JSON.parse(stored) : this.getDefaultQuizzes()

      if (category) {
        return allQuizzes.filter((quiz) => quiz.category === category)
      }

      return allQuizzes
    } catch {
      return this.getDefaultQuizzes()
    }
  }

  private static getDefaultQuizzes(): Quiz[] {
    return [
      {
        id: "quiz-1",
        title: "JavaScript基础知识测试",
        description: "测试JavaScript基本概念和语法的掌握程度",
        category: "编程",
        difficulty: 2,
        timeLimit: 30,
        passingScore: 70,
        createdBy: "system",
        createdAt: Date.now() - 86400000 * 7,
        tags: ["JavaScript", "基础", "编程"],
        questions: [
          {
            id: "q1",
            type: "multiple_choice",
            question: "以下哪个是JavaScript的数据类型？",
            options: ["string", "number", "boolean", "以上都是"],
            correctAnswer: "以上都是",
            explanation: "JavaScript有多种基本数据类型，包括string、number、boolean等",
            points: 10,
          },
          {
            id: "q2",
            type: "true_false",
            question: "JavaScript是一种编译型语言",
            correctAnswer: "false",
            explanation: "JavaScript是一种解释型语言，不需要编译",
            points: 10,
          },
        ],
      },
      {
        id: "quiz-2",
        title: "学习方法效果评估",
        description: "评估不同学习方法的理解和应用能力",
        category: "学习方法",
        difficulty: 3,
        timeLimit: 45,
        passingScore: 75,
        createdBy: "system",
        createdAt: Date.now() - 86400000 * 3,
        tags: ["学习方法", "效率", "认知"],
        questions: [
          {
            id: "q1",
            type: "short_answer",
            question: "请简述费曼学习法的核心步骤",
            correctAnswer: "选择概念、简单解释、发现问题、重新学习",
            explanation: "费曼学习法通过教授他人来检验自己的理解程度",
            points: 15,
          },
        ],
      },
    ]
  }

  static createQuiz(quizData: Omit<Quiz, "id" | "createdAt">): Quiz {
    const newQuiz: Quiz = {
      ...quizData,
      id: `quiz-${Date.now()}`,
      createdAt: Date.now(),
    }

    const quizzes = this.getQuizzes()
    quizzes.unshift(newQuiz)

    if (typeof window !== "undefined") {
      localStorage.setItem(this.QUIZZES_KEY, JSON.stringify(quizzes))
    }

    return newQuiz
  }

  static startQuizAttempt(quizId: string, userId: string, userName: string): QuizAttempt {
    const attempt: QuizAttempt = {
      id: `attempt-${Date.now()}`,
      quizId,
      userId,
      userName,
      answers: {},
      score: 0,
      totalPoints: 0,
      percentage: 0,
      timeSpent: 0,
      startedAt: Date.now(),
      completedAt: 0,
      passed: false,
    }

    return attempt
  }

  static submitQuizAttempt(attempt: QuizAttempt): QuizAttempt {
    const quiz = this.getQuizzes().find((q) => q.id === attempt.quizId)
    if (!quiz) return attempt

    let score = 0
    let totalPoints = 0

    // 计算分数
    quiz.questions.forEach((question) => {
      totalPoints += question.points
      const userAnswer = attempt.answers[question.id]

      if (this.isAnswerCorrect(question, userAnswer)) {
        score += question.points
      }
    })

    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0
    const passed = percentage >= quiz.passingScore

    const completedAttempt: QuizAttempt = {
      ...attempt,
      score,
      totalPoints,
      percentage,
      completedAt: Date.now(),
      timeSpent: Math.round((Date.now() - attempt.startedAt) / 1000),
      passed,
    }

    // 保存测验记录
    const attempts = this.getQuizAttempts()
    attempts.unshift(completedAttempt)

    if (typeof window !== "undefined") {
      localStorage.setItem(this.QUIZ_ATTEMPTS_KEY, JSON.stringify(attempts))
    }

    // 如果通过，更新技能评估
    if (passed) {
      this.updateSkillAssessment(attempt.userId, quiz.category, percentage)
    }

    return completedAttempt
  }

  private static isAnswerCorrect(question: QuizQuestion, userAnswer: string | string[]): boolean {
    if (!userAnswer) return false

    switch (question.type) {
      case "multiple_choice":
      case "true_false":
        return userAnswer === question.correctAnswer
      case "short_answer":
        if (typeof userAnswer === "string" && typeof question.correctAnswer === "string") {
          return userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()
        }
        return false
      default:
        return false
    }
  }

  static getQuizAttempts(userId?: string, quizId?: string): QuizAttempt[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.QUIZ_ATTEMPTS_KEY)
      let attempts: QuizAttempt[] = stored ? JSON.parse(stored) : []

      if (userId) {
        attempts = attempts.filter((a) => a.userId === userId)
      }

      if (quizId) {
        attempts = attempts.filter((a) => a.quizId === quizId)
      }

      return attempts
    } catch {
      return []
    }
  }

  // 技能评估
  static getSkillAssessments(userId: string): SkillAssessment[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.SKILL_ASSESSMENTS_KEY)
      const allAssessments: SkillAssessment[] = stored ? JSON.parse(stored) : []
      return allAssessments.filter((a) => a.userId === userId)
    } catch {
      return []
    }
  }

  private static updateSkillAssessment(userId: string, skillName: string, score: number): void {
    const assessments = this.getSkillAssessments(userId)
    let assessment = assessments.find((a) => a.skillName === skillName)

    const evidence: AssessmentEvidence = {
      type: "quiz_result",
      source: "quiz",
      score,
      date: Date.now(),
      description: `测验得分: ${score}%`,
    }

    if (assessment) {
      // 更新现有评估
      assessment.evidence.push(evidence)
      assessment.lastAssessed = Date.now()
      assessment.nextAssessment = Date.now() + 86400000 * 30 // 30天后重新评估

      // 根据最近的表现调整等级
      const recentScores = assessment.evidence.filter((e) => e.date > Date.now() - 86400000 * 30).map((e) => e.score)

      if (recentScores.length > 0) {
        const avgScore = recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length
        assessment.level = this.scoreToLevel(avgScore)
        assessment.confidence = Math.min(100, assessment.confidence + 5)
      }
    } else {
      // 创建新评估
      assessment = {
        id: `assessment-${Date.now()}`,
        skillName,
        userId,
        level: this.scoreToLevel(score),
        confidence: 60,
        evidence: [evidence],
        lastAssessed: Date.now(),
        nextAssessment: Date.now() + 86400000 * 30,
        improvementAreas: [],
      }
      assessments.push(assessment)
    }

    if (typeof window !== "undefined") {
      const allAssessments = this.getAllSkillAssessments()
      const otherAssessments = allAssessments.filter((a) => a.userId !== userId)
      localStorage.setItem(this.SKILL_ASSESSMENTS_KEY, JSON.stringify([...otherAssessments, ...assessments]))
    }
  }

  private static scoreToLevel(score: number): 1 | 2 | 3 | 4 | 5 {
    if (score >= 90) return 5
    if (score >= 80) return 4
    if (score >= 70) return 3
    if (score >= 60) return 2
    return 1
  }

  private static getAllSkillAssessments(): SkillAssessment[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.SKILL_ASSESSMENTS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  // 证书管理
  static generateCertificate(
    userId: string,
    userName: string,
    skillName: string,
    level: string,
    achievements: string[],
  ): Certificate {
    const certificate: Certificate = {
      id: `cert-${Date.now()}`,
      userId,
      userName,
      skillName,
      level,
      issueDate: Date.now(),
      expiryDate: Date.now() + 86400000 * 365, // 1年有效期
      verificationCode: this.generateVerificationCode(),
      achievements,
      credentialUrl: `https://ai-search.com/certificates/${Date.now()}`,
    }

    const certificates = this.getCertificates()
    certificates.unshift(certificate)

    if (typeof window !== "undefined") {
      localStorage.setItem(this.CERTIFICATES_KEY, JSON.stringify(certificates))
    }

    return certificate
  }

  private static generateVerificationCode(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  static getCertificates(userId?: string): Certificate[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.CERTIFICATES_KEY)
      const allCertificates: Certificate[] = stored ? JSON.parse(stored) : []

      if (userId) {
        return allCertificates.filter((c) => c.userId === userId)
      }

      return allCertificates
    } catch {
      return []
    }
  }

  static verifyCertificate(verificationCode: string): Certificate | null {
    const certificates = this.getCertificates()
    return certificates.find((c) => c.verificationCode === verificationCode) || null
  }

  // 学习作品集
  static createLearningPortfolio(
    portfolioData: Omit<LearningPortfolio, "id" | "createdAt" | "updatedAt">,
  ): LearningPortfolio {
    const portfolio: LearningPortfolio = {
      ...portfolioData,
      id: `portfolio-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    const portfolios = this.getLearningPortfolios()
    portfolios.unshift(portfolio)

    if (typeof window !== "undefined") {
      localStorage.setItem(this.PORTFOLIOS_KEY, JSON.stringify(portfolios))
    }

    return portfolio
  }

  static getLearningPortfolios(userId?: string): LearningPortfolio[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.PORTFOLIOS_KEY)
      const allPortfolios: LearningPortfolio[] = stored ? JSON.parse(stored) : []

      if (userId) {
        return allPortfolios.filter((p) => p.userId === userId)
      }

      return allPortfolios.filter((p) => p.isPublic)
    } catch {
      return []
    }
  }

  static updatePortfolio(portfolioId: string, updates: Partial<LearningPortfolio>): boolean {
    const portfolios = this.getLearningPortfolios()
    const index = portfolios.findIndex((p) => p.id === portfolioId)

    if (index === -1) return false

    portfolios[index] = {
      ...portfolios[index],
      ...updates,
      updatedAt: Date.now(),
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(this.PORTFOLIOS_KEY, JSON.stringify(portfolios))
    }

    return true
  }

  // 统计和分析
  static getUserLearningStats(userId: string) {
    const attempts = this.getQuizAttempts(userId)
    const assessments = this.getSkillAssessments(userId)
    const certificates = this.getCertificates(userId)

    const totalQuizzes = attempts.length
    const passedQuizzes = attempts.filter((a) => a.passed).length
    const averageScore =
      attempts.length > 0 ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length) : 0

    const skillLevels = assessments.reduce(
      (acc, assessment) => {
        acc[assessment.skillName] = assessment.level
        return acc
      },
      {} as Record<string, number>,
    )

    const totalStudyTime = attempts.reduce((sum, a) => sum + a.timeSpent, 0)

    return {
      totalQuizzes,
      passedQuizzes,
      passRate: totalQuizzes > 0 ? Math.round((passedQuizzes / totalQuizzes) * 100) : 0,
      averageScore,
      skillLevels,
      certificateCount: certificates.length,
      totalStudyTime: Math.round(totalStudyTime / 60), // 转换为分钟
      assessmentCount: assessments.length,
    }
  }
}
