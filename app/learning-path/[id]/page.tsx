"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  ArrowLeft,
  CheckCircle,
  Circle,
  Clock,
  Star,
  Target,
  BookOpen,
  Video,
  FileText,
  ExternalLink,
  Edit3,
  Share2,
  MoreVertical,
  TrendingUp,
} from "lucide-react"
import { LearningPathManager, type LearningPath, type LearningStep } from "@/lib/learning-path"

export default function LearningPathDetailPage() {
  const router = useRouter()
  const params = useParams()
  const pathId = params.id as string

  const [learningPath, setLearningPath] = useState<LearningPath | null>(null)
  const [activeStep, setActiveStep] = useState<string | null>(null)
  const [showNotes, setShowNotes] = useState<string | null>(null)
  const [noteText, setNoteText] = useState("")
  const [showMenu, setShowMenu] = useState(false)

  const loadLearningPath = () => {
    const paths = LearningPathManager.getLearningPaths()
    const path = paths.find((p) => p.id === pathId)
    if (path) {
      setLearningPath(path)
    } else {
      router.push("/learning-paths")
    }
  }

  const handleStepToggle = (stepId: string) => {
    if (!learningPath) return

    const step = learningPath.steps.find((s) => s.id === stepId)
    if (!step) return

    LearningPathManager.updateStepProgress(pathId, stepId, !step.completed, step.notes)
    loadLearningPath()
  }

  const handleSaveNotes = (stepId: string) => {
    if (!learningPath) return

    const step = learningPath.steps.find((s) => s.id === stepId)
    if (!step) return

    LearningPathManager.updateStepProgress(pathId, stepId, step.completed, noteText)
    setShowNotes(null)
    setNoteText("")
    loadLearningPath()
  }

  const getStepIcon = (type: LearningStep["type"]) => {
    switch (type) {
      case "study":
        return <BookOpen className="w-5 h-5" />
      case "practice":
        return <Target className="w-5 h-5" />
      case "review":
        return <FileText className="w-5 h-5" />
      case "assessment":
        return <CheckCircle className="w-5 h-5" />
      default:
        return <Circle className="w-5 h-5" />
    }
  }

  const getStepColor = (type: LearningStep["type"]) => {
    switch (type) {
      case "study":
        return "bg-blue-100 text-blue-600"
      case "practice":
        return "bg-green-100 text-green-600"
      case "review":
        return "bg-orange-100 text-orange-600"
      case "assessment":
        return "bg-purple-100 text-purple-600"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4" />
      case "article":
        return <FileText className="w-4 h-4" />
      case "book":
        return <BookOpen className="w-4 h-4" />
      default:
        return <ExternalLink className="w-4 h-4" />
    }
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}分钟`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
  }

  const getNextSteps = () => {
    if (!learningPath) return []
    return LearningPathManager.getRecommendedNextSteps(pathId)
  }

  const getPathStats = () => {
    if (!learningPath) return null
    return LearningPathManager.getPathStatistics(pathId)
  }

  useEffect(() => {
    loadLearningPath()
  }, [pathId])

  if (!learningPath) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载学习路径中...</p>
        </div>
      </div>
    )
  }

  const nextSteps = getNextSteps()
  const stats = getPathStats()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-medium">{learningPath.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>进度: {Math.round(learningPath.progress)}%</span>
              <span>状态: {learningPath.status === "in_progress" ? "进行中" : "未开始"}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded">
            <Share2 className="w-5 h-5" />
          </button>
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-gray-100 rounded">
              <MoreVertical className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2">
                  <Edit3 className="w-4 h-4" />
                  编辑路径
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧主要内容 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 进度概览 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">学习进度</h2>
                <div className="text-2xl font-bold text-blue-600">{Math.round(learningPath.progress)}%</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${learningPath.progress}%` }}
                />
              </div>
              {stats && (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{stats.completedSteps}</div>
                    <div className="text-sm text-gray-500">已完成</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{stats.totalSteps}</div>
                    <div className="text-sm text-gray-500">总步骤</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{formatTime(stats.completedTime)}</div>
                    <div className="text-sm text-gray-500">已学习</div>
                  </div>
                </div>
              )}
            </div>

            {/* 推荐下一步 */}
            {nextSteps.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">建议下一步</h3>
                </div>
                <div className="space-y-2">
                  {nextSteps.slice(0, 2).map((step) => (
                    <div key={step.id} className="flex items-center gap-3 p-3 bg-white rounded-lg">
                      <div className={`p-2 rounded-lg ${getStepColor(step.type)}`}>{getStepIcon(step.type)}</div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{step.title}</h4>
                        <p className="text-sm text-gray-600">{formatTime(step.estimatedTime)}</p>
                      </div>
                      <button
                        onClick={() => setActiveStep(step.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        开始
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 学习步骤列表 */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">学习步骤</h2>
              </div>
              <div className="divide-y">
                {learningPath.steps.map((step, index) => (
                  <div key={step.id} className="p-6">
                    <div className="flex items-start gap-4">
                      {/* 步骤状态 */}
                      <button
                        onClick={() => handleStepToggle(step.id)}
                        className={`mt-1 p-1 rounded-full transition-colors ${
                          step.completed ? "text-green-600" : "text-gray-400 hover:text-blue-600"
                        }`}
                      >
                        {step.completed ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                      </button>

                      <div className="flex-1">
                        {/* 步骤头部 */}
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-1 rounded ${getStepColor(step.type)}`}>{getStepIcon(step.type)}</div>
                          <h3
                            className={`font-medium ${step.completed ? "text-gray-500 line-through" : "text-gray-900"}`}
                          >
                            {step.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatTime(step.estimatedTime)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4" />
                              <span>{step.difficulty}星</span>
                            </div>
                          </div>
                        </div>

                        {/* 步骤描述 */}
                        <p className="text-gray-600 mb-4">{step.description}</p>

                        {/* 学习资源 */}
                        {step.resources.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 mb-2">学习资源</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {step.resources.map((resource) => (
                                <div
                                  key={resource.id}
                                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                                >
                                  <div className="text-gray-500">{getResourceIcon(resource.type)}</div>
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-medium text-gray-900 truncate">{resource.title}</h5>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                      <span>{formatTime(resource.estimatedTime)}</span>
                                      {resource.rating && (
                                        <>
                                          <span>•</span>
                                          <div className="flex items-center gap-1">
                                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                            <span>{resource.rating}</span>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 笔记区域 */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setShowNotes(step.id)
                              setNoteText(step.notes || "")
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            {step.notes ? "查看笔记" : "添加笔记"}
                          </button>
                          {step.completedAt && (
                            <span className="text-sm text-gray-500">
                              完成于 {new Date(step.completedAt).toLocaleDateString("zh-CN")}
                            </span>
                          )}
                        </div>

                        {/* 笔记编辑 */}
                        {showNotes === step.id && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <textarea
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              placeholder="记录学习心得、重点内容或疑问..."
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                            />
                            <div className="flex items-center gap-2 mt-3">
                              <button
                                onClick={() => handleSaveNotes(step.id)}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                              >
                                保存
                              </button>
                              <button
                                onClick={() => setShowNotes(null)}
                                className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-sm"
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧边栏 */}
          <div className="space-y-6">
            {/* 路径信息 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">路径信息</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">总时长:</span>
                  <span className="font-medium">{formatTime(learningPath.totalEstimatedTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">创建时间:</span>
                  <span className="font-medium">{new Date(learningPath.createdAt).toLocaleDateString("zh-CN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">最后更新:</span>
                  <span className="font-medium">{new Date(learningPath.updatedAt).toLocaleDateString("zh-CN")}</span>
                </div>
              </div>
            </div>

            {/* 学习统计 */}
            {stats && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">学习统计</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>完成率</span>
                      <span>{Math.round(stats.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${stats.progress}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>时间进度</span>
                      <span>{Math.round((stats.completedTime / stats.totalEstimatedTime) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(stats.completedTime / stats.totalEstimatedTime) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="text-sm text-gray-600">平均难度: {stats.averageStepDifficulty.toFixed(1)} 星</div>
                  </div>
                </div>
              </div>
            )}

            {/* 快速操作 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">快速操作</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  生成学习报告
                </button>
                <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                  导出学习计划
                </button>
                <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                  分享给朋友
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 点击外部关闭菜单 */}
      {showMenu && <div className="fixed inset-0 z-5" onClick={() => setShowMenu(false)} />}
    </div>
  )
}
