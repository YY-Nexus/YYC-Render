"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Brain,
  Search,
  FileText,
  ImageIcon,
  Mic,
  CheckCircle,
  Clock,
  Zap,
  Target,
  Lightbulb,
  ArrowRight,
  Sparkles,
} from "lucide-react"

interface ThinkingStep {
  id: string
  title: string
  description: string
  status: "pending" | "processing" | "completed" | "error"
  progress: number
  icon: React.ComponentType<any>
  estimatedTime: number
  details?: string[]
}

export default function ThinkingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get("query") || ""
  const type = searchParams.get("type") || "text"

  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState<ThinkingStep[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [totalProgress, setTotalProgress] = useState(0)
  const [startTime] = useState(Date.now())
  const [elapsedTime, setElapsedTime] = useState(0)

  // 根据查询类型初始化步骤
  useEffect(() => {
    const initSteps = () => {
      const baseSteps: ThinkingStep[] = [
        {
          id: "analyze",
          title: "分析问题",
          description: "理解您的问题并确定最佳解答策略",
          status: "pending",
          progress: 0,
          icon: Brain,
          estimatedTime: 2000,
          details: ["解析问题关键词", "识别问题类型", "确定回答策略"],
        },
        {
          id: "search",
          title: "搜索知识",
          description: "在知识库中查找相关信息",
          status: "pending",
          progress: 0,
          icon: Search,
          estimatedTime: 3000,
          details: ["检索相关文档", "匹配知识点", "筛选最佳答案"],
        },
        {
          id: "process",
          title: "处理信息",
          description: "整合信息并生成结构化回答",
          status: "pending",
          progress: 0,
          icon: Zap,
          estimatedTime: 4000,
          details: ["信息去重整合", "逻辑结构组织", "内容质量检查"],
        },
        {
          id: "optimize",
          title: "优化回答",
          description: "完善答案并添加相关建议",
          status: "pending",
          progress: 0,
          icon: Target,
          estimatedTime: 2000,
          details: ["答案完整性检查", "添加相关链接", "生成后续建议"],
        },
      ]

      // 根据输入类型添加特定步骤
      if (type === "file") {
        baseSteps.unshift({
          id: "upload",
          title: "处理文件",
          description: "分析上传的文件内容",
          status: "pending",
          progress: 0,
          icon: FileText,
          estimatedTime: 3000,
          details: ["文件格式识别", "内容提取", "文本预处理"],
        })
      } else if (type === "image") {
        baseSteps.unshift({
          id: "vision",
          title: "图像识别",
          description: "分析图像内容并提取信息",
          status: "pending",
          progress: 0,
          icon: ImageIcon,
          estimatedTime: 4000,
          details: ["图像内容识别", "文字提取(OCR)", "场景理解"],
        })
      } else if (type === "voice") {
        baseSteps.unshift({
          id: "speech",
          title: "语音识别",
          description: "将语音转换为文字",
          status: "pending",
          progress: 0,
          icon: Mic,
          estimatedTime: 2000,
          details: ["语音信号处理", "语音转文字", "语义理解"],
        })
      }

      setSteps(baseSteps)
    }

    initSteps()
  }, [type])

  // 计算总进度
  useEffect(() => {
    const totalSteps = steps.length
    if (totalSteps === 0) return

    const completedSteps = steps.filter((step) => step.status === "completed").length
    const currentStepProgress = steps[currentStep]?.progress || 0

    const progress = totalSteps > 0 ? ((completedSteps + currentStepProgress / 100) / totalSteps) * 100 : 0

    setTotalProgress(Math.min(progress, 100))
  }, [steps, currentStep])

  // 更新经过时间
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Date.now() - startTime)
    }, 100)

    return () => clearInterval(timer)
  }, [startTime])

  // 执行思考步骤
  useEffect(() => {
    if (steps.length === 0) return

    const executeStep = async (stepIndex: number) => {
      if (stepIndex >= steps.length) {
        setIsComplete(true)
        // 延迟跳转到结果页面
        setTimeout(() => {
          router.push(`/results?query=${encodeURIComponent(query)}&type=${type}`)
        }, 1500)
        return
      }

      const step = steps[stepIndex]

      // 更新步骤状态为处理中
      setSteps((prev) => prev.map((s, i) => (i === stepIndex ? { ...s, status: "processing" as const } : s)))

      // 模拟步骤执行过程
      let currentProgress = 0
      const progressInterval = setInterval(() => {
        currentProgress += Math.random() * 15 + 5 // 5-20% 增量
        const newProgress = Math.min(currentProgress, 100)

        setSteps((prev) =>
          prev.map((s, i) => {
            if (i === stepIndex) {
              return { ...s, progress: newProgress }
            }
            return s
          }),
        )

        if (newProgress >= 100) {
          clearInterval(progressInterval)
          // 标记为完成并继续下一步
          setSteps((prev) =>
            prev.map((s, i) => (i === stepIndex ? { ...s, status: "completed" as const, progress: 100 } : s)),
          )

          // 延迟后执行下一步
          setTimeout(() => {
            if (stepIndex + 1 < steps.length) {
              setCurrentStep(stepIndex + 1)
            } else {
              // 所有步骤完成
              setIsComplete(true)
              setTimeout(() => {
                router.push(`/results?query=${encodeURIComponent(query)}&type=${type}`)
              }, 1500)
            }
          }, 500)
        }
      }, step.estimatedTime / 20) // 分20次更新进度
    }

    // 开始执行当前步骤
    if (currentStep < steps.length && steps[currentStep]?.status === "pending") {
      executeStep(currentStep)
    }
  }, [currentStep, steps, query, type, router])

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    return `${seconds}秒`
  }

  const getStepStatusIcon = (status: ThinkingStep["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "processing":
        return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      case "error":
        return <div className="w-5 h-5 bg-red-500 rounded-full" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 顶部进度条 */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
          style={{ width: `${totalProgress}%` }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 头部信息 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-4">
            <Brain className="w-8 h-8 text-white animate-pulse" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI正在思考中...</h1>

          <p className="text-gray-600 mb-4">正在为您的问题寻找最佳答案</p>

          {/* 查询内容显示 */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 max-w-2xl mx-auto">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                {type === "file" ? (
                  <FileText className="w-4 h-4 text-blue-600" />
                ) : type === "image" ? (
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                ) : type === "voice" ? (
                  <Mic className="w-4 h-4 text-blue-600" />
                ) : (
                  <Search className="w-4 h-4 text-blue-600" />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="text-gray-900 font-medium">{query}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {type === "file" && "文件上传查询"}
                  {type === "image" && "图像识别查询"}
                  {type === "voice" && "语音输入查询"}
                  {type === "text" && "文本搜索查询"}
                </p>
              </div>
            </div>
          </div>

          {/* 进度信息 */}
          <div className="flex items-center justify-center space-x-6 mt-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>进度: {Math.round(totalProgress)}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>用时: {formatTime(elapsedTime)}</span>
            </div>
          </div>
        </div>

        {/* 思考步骤 */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = index === currentStep
            const isCompleted = step.status === "completed"
            const isProcessing = step.status === "processing"

            return (
              <div
                key={step.id}
                className={`bg-white rounded-lg p-6 shadow-sm border transition-all duration-300 ${
                  isActive
                    ? "border-blue-300 shadow-md scale-[1.02]"
                    : isCompleted
                      ? "border-green-200 bg-green-50"
                      : "border-gray-200"
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* 步骤图标 */}
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isCompleted ? "bg-green-100" : isProcessing ? "bg-blue-100" : "bg-gray-100"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : isProcessing ? (
                      <Icon className="w-6 h-6 text-blue-600 animate-pulse" />
                    ) : (
                      <Icon className="w-6 h-6 text-gray-500" />
                    )}
                  </div>

                  {/* 步骤内容 */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3
                        className={`text-lg font-semibold ${
                          isCompleted ? "text-green-800" : isProcessing ? "text-blue-800" : "text-gray-700"
                        }`}
                      >
                        {step.title}
                      </h3>
                      {getStepStatusIcon(step.status)}
                    </div>

                    <p
                      className={`text-sm mb-3 ${
                        isCompleted ? "text-green-600" : isProcessing ? "text-blue-600" : "text-gray-600"
                      }`}
                    >
                      {step.description}
                    </p>

                    {/* 进度条 */}
                    {(isProcessing || isCompleted) && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>处理进度</span>
                          <span>{Math.round(step.progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              isCompleted ? "bg-green-500" : "bg-blue-500"
                            }`}
                            style={{ width: `${step.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* 详细步骤 */}
                    {(isProcessing || isCompleted) && step.details && (
                      <div className="space-y-1">
                        {step.details.map((detail, detailIndex) => {
                          const isDetailCompleted =
                            isCompleted || (isProcessing && detailIndex < Math.floor(step.progress / 33.33))

                          return (
                            <div key={detailIndex} className="flex items-center space-x-2 text-xs">
                              <div
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isDetailCompleted ? "bg-green-500" : "bg-gray-300"
                                }`}
                              />
                              <span className={isDetailCompleted ? "text-green-600" : "text-gray-500"}>{detail}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* 完成状态 */}
        {isComplete && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">思考完成！</h2>

            <p className="text-gray-600 mb-6">已为您准备好详细的答案，正在跳转到结果页面...</p>

            <div className="flex items-center justify-center space-x-2 text-blue-600">
              <span>正在跳转</span>
              <ArrowRight className="w-4 h-4 animate-pulse" />
            </div>
          </div>
        )}

        {/* 底部提示 */}
        {!isComplete && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center space-x-2 text-sm text-gray-500 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200">
              <Lightbulb className="w-4 h-4" />
              <span>AI正在运用深度学习技术为您分析问题</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
