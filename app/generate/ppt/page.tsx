"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Presentation, FileText, Layers, Zap } from "lucide-react"

export default function GeneratePPTPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const question = searchParams.get("q") || ""

  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [slideElements, setSlideElements] = useState<string[]>([])

  const generationSteps = [
    {
      title: "正在构建演示大纲...",
      description: "分析内容结构和逻辑关系",
      icon: FileText,
      duration: 2000,
    },
    {
      title: "正在设计幻灯片布局...",
      description: "创建专业的PPT模板",
      icon: Layers,
      duration: 2500,
    },
    {
      title: "正在优化视觉呈现...",
      description: "应用配色方案和图表",
      icon: Presentation,
      duration: 2000,
    },
    {
      title: "正在添加动画效果...",
      description: "完善切换和动画效果",
      icon: Zap,
      duration: 1500,
    },
  ]

  const mockSlideElements = [
    "slide-1: title: '智能学习之路：如何坚持走下去'",
    "slide-2: content: '你是否也曾感到迷茫？'",
    "slide-3: bullets: ['学习目标不明确', '面对质疑和反对']",
    "slide-4: theme: background-gradient(135deg, #4f46e5, #7c3aed)",
    "slide-5: animation: fade-in, slide-up, duration: 0.8s",
    "slide-6: layout: title-content, image-placeholder: right",
    "slide-7: footer: page-number, company-logo, date",
  ]

  useEffect(() => {
    const processGeneration = async () => {
      // 模拟PPT元素生成动画
      const slideInterval = setInterval(() => {
        setSlideElements((prev) => {
          if (prev.length < mockSlideElements.length) {
            return [...prev, mockSlideElements[prev.length]]
          }
          return prev
        })
      }, 350)

      // 执行生成步骤
      for (let i = 0; i < generationSteps.length; i++) {
        setCurrentStep(i)
        setProgress(((i + 1) / generationSteps.length) * 100)
        await new Promise((resolve) => setTimeout(resolve, generationSteps[i].duration))
      }

      clearInterval(slideInterval)

      // 生成完成后跳转到结果页面
      setTimeout(() => {
        router.push(`/ppt-result?q=${encodeURIComponent(question)}`)
      }, 1000)
    }

    if (question) {
      processGeneration()
    }
  }, [question, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
            <h1 className="text-3xl font-bold text-gray-800 mb-4">PPT制作中</h1>
            <p className="text-gray-600">正在为您创建专业的演示文稿</p>
          </div>

          {/* PPT预览窗口 */}
          <div className="bg-gray-900 rounded-lg p-6 mb-8 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-400 text-sm ml-4">presentation.pptx</span>
            </div>
            <div className="font-mono text-sm">
              {slideElements.map((element, index) => (
                <div
                  key={index}
                  className="text-orange-300 leading-relaxed animate-fadeIn"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {element}
                </div>
              ))}
              {slideElements.length > 0 && (
                <div className="inline-block w-2 h-5 bg-orange-400 animate-pulse ml-1"></div>
              )}
            </div>
          </div>

          {/* 进度信息 */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-medium text-gray-800">
                {generationSteps[currentStep]?.title || "制作完成"}
              </span>
              <span className="text-indigo-600 font-bold text-xl">{Math.round(progress)}%</span>
            </div>

            {/* 进度条 */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
              <div
                className="bg-gradient-to-r from-indigo-500 to-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* 当前步骤详情 */}
            {generationSteps[currentStep] && (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  {React.createElement(generationSteps[currentStep].icon, {
                    className: "w-6 h-6 text-indigo-600 animate-pulse",
                  })}
                </div>
                <div>
                  <p className="text-gray-600">{generationSteps[currentStep].description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-sm text-indigo-600">制作中...</span>
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
