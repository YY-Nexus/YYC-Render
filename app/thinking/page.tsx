"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Brain, Search, Database, Lightbulb, Check } from "lucide-react"
import { HistoryManager } from "@/lib/history"
import { ConversationManager } from "@/lib/conversation"

export default function ThinkingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const question = searchParams.get("q") || ""

  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [progress, setProgress] = useState(0)

  const thinkingSteps = [
    {
      id: 0,
      title: "正在理解您的问题...",
      description: "分析问题关键词和语义",
      icon: Brain,
      duration: 2000,
    },
    {
      id: 1,
      title: "正在知识库中检索相关信息...",
      description: "搜索相关文档和资料",
      icon: Database,
      duration: 2500,
    },
    {
      id: 2,
      title: "正在联网获取最新数据...",
      description: "获取实时信息和最新观点",
      icon: Search,
      duration: 3000,
    },
    {
      id: 3,
      title: "正在整合分析结果...",
      description: "综合信息生成最佳答案",
      icon: Lightbulb,
      duration: 2000,
    },
  ]

  useEffect(() => {
    const processSteps = async () => {
      for (let i = 0; i < thinkingSteps.length; i++) {
        setCurrentStep(i)
        setProgress(((i + 1) / thinkingSteps.length) * 100)

        await new Promise((resolve) => setTimeout(resolve, thinkingSteps[i].duration))

        setCompletedSteps((prev) => [...prev, i])
      }

      // 所有步骤完成后，等待1秒然后跳转到结果页
      setTimeout(() => {
        // 更新历史记录，添加简短摘要
        HistoryManager.addHistory(question, "AI正在为您分析这个问题...")

        // 创建新的对话线程
        const conversation = ConversationManager.createConversation(question)

        // 添加AI回答到对话中
        ConversationManager.addMessage(
          conversation.id,
          "assistant",
          "AI正在为您分析这个问题...",
          conversation.messages[0].id,
          {
            confidence: 0.9,
            processingTime: 2000,
            sources: ["知识库", "在线搜索"],
          },
        )

        // 跳转时携带对话ID
        router.push(`/results?q=${encodeURIComponent(question)}&conversationId=${conversation.id}`)
      }, 1000)
    }

    if (question) {
      processSteps()
    }
  }, [question, router])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-blue-700 rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-medium">智能AI搜索 - 正在思考</h1>
        </div>
      </header>

      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-8">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8">
          {/* 问题回显 */}
          <div className="mb-8 p-4 bg-blue-50 rounded-xl">
            <h2 className="text-sm text-blue-600 font-medium mb-2">您的问题：</h2>
            <p className="text-gray-800 leading-relaxed">{question}</p>
          </div>

          {/* 进度条 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">处理进度</span>
              <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* 思考步骤 */}
          <div className="space-y-6">
            {thinkingSteps.map((step, index) => {
              const isActive = currentStep === index
              const isCompleted = completedSteps.includes(index)
              const IconComponent = step.icon

              return (
                <div key={step.id} className="flex items-start gap-4">
                  {/* 步骤图标 */}
                  <div
                    className={`
                    w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                    ${
                      isCompleted
                        ? "bg-green-100 text-green-600"
                        : isActive
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-400"
                    }
                  `}
                  >
                    {isCompleted ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <IconComponent className={`w-6 h-6 ${isActive ? "animate-pulse" : ""}`} />
                    )}
                  </div>

                  {/* 步骤内容 */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`
                      text-lg font-medium transition-colors duration-300
                      ${isCompleted ? "text-green-700" : isActive ? "text-blue-700" : "text-gray-500"}
                    `}
                    >
                      {step.title}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">{step.description}</p>

                    {/* 活动指示器 */}
                    {isActive && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                        <span className="text-xs text-blue-600">处理中...</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* 完成提示 */}
          {completedSteps.length === thinkingSteps.length && (
            <div className="mt-8 p-4 bg-green-50 rounded-xl text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-green-700 font-medium">分析完成！正在为您生成答案...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
