"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Code, Palette, Layout, Zap } from "lucide-react"

export default function GenerateWebpagePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const question = searchParams.get("q") || ""

  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [codeLines, setCodeLines] = useState<string[]>([])

  const generationSteps = [
    {
      title: "正在分析内容结构...",
      description: "解析问题核心要点",
      icon: Layout,
      duration: 2000,
    },
    {
      title: "正在生成页面布局...",
      description: "创建响应式设计框架",
      icon: Code,
      duration: 2500,
    },
    {
      title: "正在优化视觉效果...",
      description: "应用主题样式和动画",
      icon: Palette,
      duration: 2000,
    },
    {
      title: "正在初始化交互功能...",
      description: "添加用户交互逻辑",
      icon: Zap,
      duration: 1500,
    },
  ]

  const mockCodeLines = [
    "secondary:#f3f3f3;--border-color:#dedede;--dark-primary:#7c84e8;",
    "primary-light:#9cd4e8;--secondary:#2d2d2d;--text-primary:#f5f5f5;",
    "text-secondary:#aaa;--bg-primary:#1a1a1a;--bg-secondary:#2d2d2d;--",
    "border-color:#3a3a3d}body{background-color:var(--bg-",
    "primary);color:var(--text-primary);font-family:Noto Sans SC,sans-",
    "serif;transition:background-color .3s,color .3s}.card{background-",
    "color:var(--bg-primary);border:1px solid var(--border-color);border-",
    "radius:.5rem;transition:all .3s;",
  ]

  useEffect(() => {
    const processGeneration = async () => {
      // 模拟代码生成动画
      const codeInterval = setInterval(() => {
        setCodeLines((prev) => {
          if (prev.length < mockCodeLines.length) {
            return [...prev, mockCodeLines[prev.length]]
          }
          return prev
        })
      }, 300)

      // 执行生成步骤
      for (let i = 0; i < generationSteps.length; i++) {
        setCurrentStep(i)
        setProgress(((i + 1) / generationSteps.length) * 100)
        await new Promise((resolve) => setTimeout(resolve, generationSteps[i].duration))
      }

      clearInterval(codeInterval)

      // 生成完成后跳转到结果页面
      setTimeout(() => {
        router.push(`/interactive-webpage?q=${encodeURIComponent(question)}`)
      }, 1000)
    }

    if (question) {
      processGeneration()
    }
  }, [question, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* 退出提示 */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <span>若要退出全屏，请将鼠标移动到屏幕顶部或长按</span>
          <kbd className="bg-gray-700 px-2 py-1 rounded text-xs">esc</kbd>
        </div>
      </div>

      <div className="flex items-center justify-center min-h-screen px-8">
        <div className="w-full max-w-4xl">
          {/* 标题 */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">正在生成互动网页</h1>
            <p className="text-gray-600">基于您的问题创建可视化内容展示</p>
          </div>

          {/* 代码窗口 */}
          <div className="bg-gray-900 rounded-lg p-6 mb-8 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-400 text-sm ml-4">styles.css</span>
            </div>
            <div className="font-mono text-sm">
              {codeLines.map((line, index) => (
                <div
                  key={index}
                  className="text-blue-300 leading-relaxed animate-fadeIn"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {line}
                </div>
              ))}
              {codeLines.length > 0 && <div className="inline-block w-2 h-5 bg-blue-400 animate-pulse ml-1"></div>}
            </div>
          </div>

          {/* 进度信息 */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-medium text-gray-800">
                {generationSteps[currentStep]?.title || "生成完成"}
              </span>
              <span className="text-blue-600 font-bold text-xl">{Math.round(progress)}%</span>
            </div>

            {/* 进度条 */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* 当前步骤详情 */}
            {generationSteps[currentStep] && (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  {React.createElement(generationSteps[currentStep].icon, {
                    className: "w-6 h-6 text-blue-600 animate-pulse",
                  })}
                </div>
                <div>
                  <p className="text-gray-600">{generationSteps[currentStep].description}</p>
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
                    <span className="text-sm text-blue-600">处理中...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
