"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Brain, Network, Zap, Target } from "lucide-react"

export default function GenerateMindMapPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const question = searchParams.get("q") || ""

  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [analysisElements, setAnalysisElements] = useState<string[]>([])

  const generationSteps = [
    {
      title: "正在分析内容结构...",
      description: "识别关键概念和逻辑关系",
      icon: Brain,
      duration: 2000,
    },
    {
      title: "正在构建知识网络...",
      description: "建立概念间的连接关系",
      icon: Network,
      duration: 2500,
    },
    {
      title: "正在优化布局算法...",
      description: "计算最佳的视觉呈现方式",
      icon: Target,
      duration: 2000,
    },
    {
      title: "正在生成交互效果...",
      description: "添加动画和交互功能",
      icon: Zap,
      duration: 1500,
    },
  ]

  const mockAnalysisElements = [
    "concept-extraction: 智能学习, 坚持方法, 心理调节, 计划制定",
    "relationship-mapping: 学习动机 → 坚持行为 → 成功结果",
    "hierarchy-building: 核心理念 > 具体策略 > 实施步骤",
    "visual-optimization: radial-layout, color-coding, size-scaling",
    "interaction-design: hover-effects, click-expand, zoom-navigation",
    "animation-sequence: fade-in, slide-out, pulse-highlight",
    "accessibility: keyboard-navigation, screen-reader-support",
  ]

  useEffect(() => {
    const processGeneration = async () => {
      // 模拟分析元素生成动画
      const analysisInterval = setInterval(() => {
        setAnalysisElements((prev) => {
          if (prev.length < mockAnalysisElements.length) {
            return [...prev, mockAnalysisElements[prev.length]]
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

      clearInterval(analysisInterval)

      // 生成完成后跳转到结果页面
      setTimeout(() => {
        router.push(`/mindmap-result?q=${encodeURIComponent(question)}`)
      }, 1000)
    }

    if (question) {
      processGeneration()
    }
  }, [question, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
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
            <h1 className="text-3xl font-bold text-gray-800 mb-4">思维导图生成中</h1>
            <p className="text-gray-600">正在为您创建知识结构可视化图表</p>
          </div>

          {/* 分析预览窗口 */}
          <div className="bg-gray-900 rounded-lg p-6 mb-8 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-400 text-sm ml-4">mindmap-analysis.log</span>
            </div>
            <div className="font-mono text-sm">
              {analysisElements.map((element, index) => (
                <div
                  key={index}
                  className="text-green-400 leading-relaxed animate-fadeIn"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {element}
                </div>
              ))}
              {analysisElements.length > 0 && (
                <div className="inline-block w-2 h-5 bg-green-400 animate-pulse ml-1"></div>
              )}
            </div>
          </div>

          {/* 进度信息 */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-medium text-gray-800">
                {generationSteps[currentStep]?.title || "生成完成"}
              </span>
              <span className="text-indigo-600 font-bold text-xl">{Math.round(progress)}%</span>
            </div>

            {/* 进度条 */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out"
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
                    <span className="text-sm text-indigo-600">分析中...</span>
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
