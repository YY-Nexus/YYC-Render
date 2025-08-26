"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  Target,
  Trophy,
  Clock,
  Star,
  Play,
  CheckCircle,
  Circle,
  ArrowRight,
  Plus,
  Search,
  Download,
  Upload,
  BarChart3,
  Award,
  Lightbulb,
} from "lucide-react"
import { LearningManager, type LearningPath, type Achievement, type LearningStats } from "@/lib/learning-manager"

export default function LearningPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"paths" | "achievements" | "stats">("paths")
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [stats, setStats] = useState<LearningStats | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadLearningData()
  }, [])

  const loadLearningData = async () => {
    setIsLoading(true)
    try {
      const [pathsData, achievementsData, statsData] = await Promise.all([
        LearningManager.getLearningPaths(),
        LearningManager.getAchievements(),
        LearningManager.getStats(),
      ])

      setLearningPaths(pathsData)
      setAchievements(achievementsData)
      setStats(statsData)
    } catch (error) {
      console.error("加载学习数据失败:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreatePath = () => {
    router.push("/learning-path/create")
  }

  const handlePathClick = (pathId: string) => {
    router.push(`/learning-path/${pathId}`)
  }

  const handleStepToggle = async (pathId: string, stepId: string) => {
    try {
      await LearningManager.toggleStepCompletion(pathId, stepId)
      await loadLearningData() // 重新加载数据
    } catch (error) {
      console.error("切换步骤状态失败:", error)
    }
  }

  const filteredPaths = learningPaths.filter((path) => {
    const matchesSearch =
      path.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      path.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === "all" || path.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const categories = ["all", "技术", "设计", "商业", "科学", "语言", "艺术"]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载学习数据...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">学习中心</h1>
                <p className="text-gray-600">个性化学习路径与成就系统</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push("/analytics")}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                <span>数据分析</span>
              </button>
              <button
                onClick={handleCreatePath}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>创建路径</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 统计概览 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">学习路径</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPaths}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">完成步骤</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedSteps}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">学习时长</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(stats.totalHours)}h</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">获得成就</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.achievementsCount}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 标签页导航 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("paths")}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                activeTab === "paths" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Target className="w-4 h-4" />
              <span>学习路径</span>
            </button>
            <button
              onClick={() => setActiveTab("achievements")}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                activeTab === "achievements"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>成就系统</span>
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                activeTab === "stats" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>学习统计</span>
            </button>
          </div>

          {/* 学习路径标签页 */}
          {activeTab === "paths" && (
            <div className="p-6">
              {/* 搜索和筛选 */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜索学习路径..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category === "all" ? "全部分类" : category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Download className="w-4 h-4" />
                    <span>导出</span>
                  </button>
                  <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>导入</span>
                  </button>
                </div>
              </div>

              {/* 学习路径列表 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPaths.map((path) => (
                  <div
                    key={path.id}
                    className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{path.title}</h3>
                        <p className="text-gray-600 text-sm line-clamp-2">{path.description}</p>
                      </div>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">{path.category}</span>
                    </div>

                    {/* 进度条 */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                        <span>进度</span>
                        <span>{Math.round(path.progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${path.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* 步骤预览 */}
                    <div className="mb-4">
                      <div className="space-y-2">
                        {path.steps.slice(0, 3).map((step) => (
                          <div key={step.id} className="flex items-center space-x-2">
                            <button onClick={() => handleStepToggle(path.id, step.id)} className="flex-shrink-0">
                              {step.completed ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <Circle className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                            <span
                              className={`text-sm ${step.completed ? "text-gray-500 line-through" : "text-gray-700"}`}
                            >
                              {step.title}
                            </span>
                          </div>
                        ))}
                        {path.steps.length > 3 && (
                          <p className="text-xs text-gray-500 ml-6">还有 {path.steps.length - 3} 个步骤...</p>
                        )}
                      </div>
                    </div>

                    {/* 底部信息 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{path.estimatedHours}h</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3" />
                          <span>{path.difficulty}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handlePathClick(path.id)}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        <span>查看详情</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredPaths.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">��无匹配的学习路径</p>
                  <button
                    onClick={handleCreatePath}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    创建第一个学习路径
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 成就系统标签页 */}
          {activeTab === "achievements" && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`rounded-lg p-6 border-2 transition-all ${
                      achievement.unlocked
                        ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          achievement.unlocked ? "bg-yellow-500" : "bg-gray-400"
                        }`}
                      >
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3
                          className={`font-semibold mb-1 ${achievement.unlocked ? "text-yellow-800" : "text-gray-600"}`}
                        >
                          {achievement.title}
                        </h3>
                        <p className={`text-sm mb-3 ${achievement.unlocked ? "text-yellow-700" : "text-gray-500"}`}>
                          {achievement.description}
                        </p>

                        {achievement.unlocked ? (
                          <div className="flex items-center space-x-2 text-xs text-yellow-700">
                            <CheckCircle className="w-3 h-3" />
                            <span>已解锁</span>
                            {achievement.unlockedAt && (
                              <span>• {new Date(achievement.unlockedAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">
                            <div className="flex items-center justify-between mb-1">
                              <span>进度</span>
                              <span>
                                {achievement.progress}/{achievement.target}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div
                                className="bg-blue-600 h-1 rounded-full"
                                style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 学习统计标签页 */}
          {activeTab === "stats" && stats && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 学习活动图表 */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">学习活动趋势</h3>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                      <p>图表功能开发中...</p>
                    </div>
                  </div>
                </div>

                {/* 分类统计 */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">分类分布</h3>
                  <div className="space-y-4">
                    {stats.categoryStats.map((category, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-gray-700">{category.name}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(category.count / stats.totalPaths) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-8">{category.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 最近活动 */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">最近活动</h3>
                  <div className="space-y-3">
                    {stats.recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          {activity.type === "completed" ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : activity.type === "started" ? (
                            <Play className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Trophy className="w-4 h-4 text-yellow-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{activity.description}</p>
                          <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 学习建议 */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                    个性化建议
                  </h3>
                  <div className="space-y-3">
                    {stats.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">{index + 1}</span>
                        </div>
                        <p className="text-sm text-gray-700">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
