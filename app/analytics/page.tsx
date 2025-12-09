"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  TrendingUp,
  Clock,
  Target,
  Award,
  BookOpen,
  Brain,
  BarChart3,
  PieChart,
  Activity,
  Star,
  Zap,
  Trophy,
} from "lucide-react"
import { FavoritesManager } from "@/lib/favorites"
import { RatingsManager } from "@/lib/ratings"
import { HistoryManager } from "@/lib/history"
import { LearningPathManager } from "@/lib/learning-path"

interface AnalyticsData {
  totalSearches: number
  totalLearningTime: number
  completedPaths: number
  favoriteCount: number
  averageRating: number
  weeklyActivity: number[]
  topCategories: { name: string; count: number; color: string }[]
  learningStreak: number
  skillProgress: { skill: string; progress: number; level: string }[]
  monthlyStats: { month: string; searches: number; completions: number }[]
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month")
  const [loading, setLoading] = useState(true)

  const generateAnalyticsData = (): AnalyticsData => {
    const history = HistoryManager.getHistory()
    const favorites = FavoritesManager.getFavorites()
    const ratings = RatingsManager.getRatings()
    const paths = LearningPathManager.getLearningPaths()

    // 计算基础统计
    const totalSearches = history.length
    const favoriteCount = favorites.length
    const completedPaths = paths.filter((p) => p.status === "completed").length
    const ratingStats = RatingsManager.getStats()
    const averageRating = ratingStats.total > 0 ? (ratingStats.likes / ratingStats.total) * 100 : 0

    // 计算学习时间（基于路径完成情况）
    const totalLearningTime = paths.reduce((total, path) => {
      const completedSteps = path.steps.filter((s) => s.completed)
      return total + completedSteps.reduce((sum, step) => sum + step.estimatedTime, 0)
    }, 0)

    // 生成周活跃度数据
    const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
      const dayStart = Date.now() - (6 - i) * 24 * 60 * 60 * 1000
      const dayEnd = dayStart + 24 * 60 * 60 * 1000
      return history.filter((h) => h.timestamp >= dayStart && h.timestamp < dayEnd).length
    })

    // 分析热门类别
    const categoryMap = new Map<string, number>()
    const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"]

    history.forEach((item) => {
      // 简单的关键词分类
      const question = item.question.toLowerCase()
      let category = "其他"

      if (question.includes("学习") || question.includes("教育")) category = "学习方法"
      else if (question.includes("编程") || question.includes("代码")) category = "编程技术"
      else if (question.includes("设计") || question.includes("UI")) category = "设计创意"
      else if (question.includes("管理") || question.includes("效率")) category = "效率管理"
      else if (question.includes("健康") || question.includes("运动")) category = "健康生活"

      categoryMap.set(category, (categoryMap.get(category) || 0) + 1)
    })

    const topCategories = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count], index) => ({
        name,
        count,
        color: colors[index] || "#6B7280",
      }))

    // 计算学习连续天数
    const learningStreak = calculateLearningStreak(history)

    // 技能进度分析
    const skillProgress = [
      { skill: "问题分析", progress: Math.min(100, (totalSearches / 50) * 100), level: "中级" },
      { skill: "知识整理", progress: Math.min(100, (favoriteCount / 20) * 100), level: "初级" },
      { skill: "学习规划", progress: Math.min(100, (completedPaths / 5) * 100), level: "高级" },
      { skill: "持续学习", progress: Math.min(100, (learningStreak / 30) * 100), level: "专家" },
    ]

    // 月度统计
    const monthlyStats = generateMonthlyStats(history, paths)

    return {
      totalSearches,
      totalLearningTime: Math.round(totalLearningTime / 60), // 转换为小时
      completedPaths,
      favoriteCount,
      averageRating: Math.round(averageRating),
      weeklyActivity,
      topCategories,
      learningStreak,
      skillProgress,
      monthlyStats,
    }
  }

  const calculateLearningStreak = (history: any[]) => {
    if (history.length === 0) return 0

    const today = new Date()
    let streak = 0
    const currentDate = new Date(today)

    while (true) {
      const dayStart = new Date(currentDate)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(currentDate)
      dayEnd.setHours(23, 59, 59, 999)

      const hasActivity = history.some((h) => h.timestamp >= dayStart.getTime() && h.timestamp <= dayEnd.getTime())

      if (hasActivity) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }

    return streak
  }

  const generateMonthlyStats = (history: any[], paths: any[]) => {
    const months = ["1月", "2月", "3月", "4月", "5月", "6月"]
    return months.map((month, index) => {
      const monthStart = new Date(2024, index, 1).getTime()
      const monthEnd = new Date(2024, index + 1, 0, 23, 59, 59).getTime()

      const searches = history.filter((h) => h.timestamp >= monthStart && h.timestamp <= monthEnd).length

      const completions = paths.filter((p) => {
        return p.updatedAt >= monthStart && p.updatedAt <= monthEnd && p.status === "completed"
      }).length

      return { month, searches, completions }
    })
  }

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case "初级":
        return "text-green-600 bg-green-100"
      case "中级":
        return "text-blue-600 bg-blue-100"
      case "高级":
        return "text-purple-600 bg-purple-100"
      case "专家":
        return "text-orange-600 bg-orange-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  useEffect(() => {
    setTimeout(() => {
      const data = generateAnalyticsData()
      setAnalyticsData(data)
      setLoading(false)
    }, 500)
  }, [timeRange])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在分析您的学习数据...</p>
        </div>
      </div>
    )
  }

  if (!analyticsData) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">学习分析报告</h1>
              <p className="text-sm text-gray-600">深入了解您的学习进展和成果</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as "week" | "month" | "year")}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="week">最近一周</option>
              <option value="month">最近一月</option>
              <option value="year">最近一年</option>
            </select>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 核心指标卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">总搜索次数</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.totalSearches}</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  较上月 +12%
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">学习时长</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.totalLearningTime}h</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  本月目标 80%
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">完成路径</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.completedPaths}</p>
                <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                  <Target className="w-3 h-3" />
                  完成率 75%
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">学习连续天数</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.learningStreak}</p>
                <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                  <Zap className="w-3 h-3" />
                  保持良好习惯
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Award className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 周活跃度图表 */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              本周学习活跃度
            </h3>
            <div className="space-y-4">
              {["周一", "周二", "周三", "周四", "周五", "周六", "周日"].map((day, index) => (
                <div key={day} className="flex items-center gap-3">
                  <span className="w-8 text-sm text-gray-600">{day}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (analyticsData.weeklyActivity[index] / Math.max(...analyticsData.weeklyActivity)) * 100)}%`,
                      }}
                    ></div>
                  </div>
                  <span className="w-8 text-sm text-gray-900 text-right">{analyticsData.weeklyActivity[index]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 学习类别分布 */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              学习类别分布
            </h3>
            <div className="space-y-3">
              {analyticsData.topCategories.map((category, index) => (
                <div key={category.name} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }}></div>
                  <span className="flex-1 text-sm text-gray-700">{category.name}</span>
                  <span className="text-sm font-medium text-gray-900">{category.count}</span>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${(category.count / Math.max(...analyticsData.topCategories.map((c) => c.count))) * 100}%`,
                        backgroundColor: category.color,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 技能进度 */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5" />
            技能发展进度
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analyticsData.skillProgress.map((skill, index) => (
              <div key={skill.skill} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{skill.skill}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSkillLevelColor(skill.level)}`}>
                    {skill.level}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${skill.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{Math.round(skill.progress)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 月度趋势 */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            月度学习趋势
          </h3>
          <div className="space-y-4">
            {analyticsData.monthlyStats.map((stat, index) => (
              <div key={stat.month} className="flex items-center gap-4">
                <span className="w-8 text-sm text-gray-600">{stat.month}</span>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-12">搜索</span>
                    <div className="flex-1 bg-blue-100 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (stat.searches / Math.max(...analyticsData.monthlyStats.map((s) => s.searches))) * 100)}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-900 w-8">{stat.searches}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-12">完成</span>
                    <div className="flex-1 bg-green-100 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (stat.completions / Math.max(...analyticsData.monthlyStats.map((s) => s.completions))) * 100)}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-900 w-8">{stat.completions}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 成就徽章 */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            学习成就
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Star className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-medium text-gray-900">学习新手</p>
              <p className="text-xs text-gray-600">完成首次搜索</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-medium text-gray-900">知识收集者</p>
              <p className="text-xs text-gray-600">收藏10个回答</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Target className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-medium text-gray-900">目标达成者</p>
              <p className="text-xs text-gray-600">完成学习路径</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-medium text-gray-900">坚持不懈</p>
              <p className="text-xs text-gray-600">连续学习7天</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
