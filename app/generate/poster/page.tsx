"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Palette, ImageIcon, Type, Sparkles } from "lucide-react"

export default function GeneratePosterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const question = searchParams.get("q") || ""

  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [designElements, setDesignElements] = useState<string[]>([])

  const generationSteps = [
    {
      title: "正在分析内容要点...",
      description: "提取核心信息和关键概念",
      icon: Type,
      duration: 2000,
    },
    {
      title: "正在设计视觉布局...",
      description: "创建海报版式和结构",
      icon: ImageIcon,
      duration: 2500,
    },
    {
      title: "正在优化色彩搭配...",
      description: "应用主题色彩和视觉效果",
      icon: Palette,
      duration: 2000,
    },
    {
      title: "正在添加装饰元素...",
      description: "完善细节和视觉呈现",
      icon: Sparkles,
      duration: 1500,
    },
  ]

  const mockDesignElements = [
    "background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);",
    "title: font-family: 'PingFang SC', sans-serif; font-weight: 700;",
    "layout: grid-template-columns: 1fr; gap: 2rem; padding: 3rem;",
    "card: background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);",
    "text: color: #ffffff; line-height: 1.6; letter-spacing: 0.5px;",
    "decoration: border-left: 4px solid #00d4ff; padding-left: 1rem;",
    "animation: transform: translateY(0); transition: all 0.3s ease;",
  ]

  useEffect(() => {
    const processGeneration = async () => {
      // 模拟设计元素生成动画
      const designInterval = setInterval(() => {
        setDesignElements((prev) => {
          if (prev.length < mockDesignElements.length) {
            return [...prev, mockDesignElements[prev.length]]
          }
          return prev
        })
      }, 400)

      // 执行生成步骤
      for (let i = 0; i < generationSteps.length; i++) {
        setCurrentStep(i)
        setProgress(((i + 1) / generationSteps.length) * 100)
        await new Promise((resolve) => setTimeout(resolve, generationSteps[i].duration))
      }

      clearInterval(designInterval)

      // 生成完成后跳转到结果页面
      setTimeout(() => {
        router.push(`/poster-result?q=${encodeURIComponent(question)}`)
      }, 1000)
    }

    if (question) {
      processGeneration()
    }
  }, [question, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
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
            <h1 className="text-3xl font-bold text-gray-800 mb-4">展示海报生成中</h1>
            <p className="text-gray-600">正在为您创建精美的可视化海报</p>
          </div>

          {/* 设计预览窗口 */}
          <div className="bg-white rounded-lg p-6 mb-8 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-400 text-sm ml-4">poster-design.css</span>
            </div>
            <div className="font-mono text-sm">
              {designElements.map((element, index) => (
                <div
                  key={index}
                  className="text-purple-600 leading-relaxed animate-fadeIn"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {element}
                </div>
              ))}
              {designElements.length > 0 && (
                <div className="inline-block w-2 h-5 bg-purple-400 animate-pulse ml-1"></div>
              )}
            </div>
          </div>

          {/* 进度信息 */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-medium text-gray-800">
                {generationSteps[currentStep]?.title || "生成完成"}
              </span>
              <span className="text-purple-600 font-bold text-xl">{Math.round(progress)}%</span>
            </div>

            {/* 进度条 */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* 当前步骤详情 */}
            {generationSteps[currentStep] && (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  {React.createElement(generationSteps[currentStep].icon, {
                    className: "w-6 h-6 text-purple-600 animate-pulse",
                  })}
                </div>
                <div>
                  <p className="text-gray-600">{generationSteps[currentStep].description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-sm text-purple-600">设计中...</span>
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
