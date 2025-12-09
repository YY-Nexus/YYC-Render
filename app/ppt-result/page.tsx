"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft, Share2, Download, Settings, ChevronLeft, ChevronRight } from "lucide-react"

export default function PPTResultPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const question = searchParams.get("q") || ""
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      title: "智能学习之路：如何坚持走下去",
      subtitle: "你是否也曾感到迷茫？",
      content: ["学习目标不明确，动力不足", "面对质疑和反对，信心动摇", "长期投入，身心俱疲"],
      footer: "今天，我们一起探讨：",
      highlights: ["如何在智能学习的道路上保持热情与毅力", "克服挑战，持续成长"],
    },
    {
      title: "明确学习目标的重要性",
      subtitle: "内在动机是持续学习的核心驱动力",
      content: ["设定清晰、可衡量的学习目标", "将长期目标分解为短期里程碑", "定期回顾和调整学习计划"],
      footer: "目标明确，方向清晰",
      highlights: [],
    },
    // 可以添加更多幻灯片...
  ]

  const totalSlides = 8 // 模拟总共8页

  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1)
    }
  }

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  const currentSlideData = slides[currentSlide] || slides[0]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-medium">PPT演示</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded">
            <Settings className="w-5 h-5" />
          </button>
          <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm flex items-center gap-1">
            <Share2 className="w-4 h-4" />
            分享
          </button>
          <button className="px-3 py-1 bg-green-600 text-white rounded text-sm flex items-center gap-1">
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>
      </header>

      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-8 relative">
        {/* 左侧切换按钮 */}
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="absolute left-4 z-10 p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* PPT幻灯片主体 */}
        <div className="w-full max-w-6xl bg-gradient-to-br from-blue-500 via-blue-600 to-purple-700 rounded-2xl p-16 text-white shadow-2xl relative">
          {/* 主标题 */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-6 leading-tight">{currentSlideData.title}</h1>
            {currentSlideData.subtitle && (
              <h2 className="text-2xl font-light text-blue-100 mb-8">{currentSlideData.subtitle}</h2>
            )}
          </div>

          {/* 内容列表 */}
          {currentSlideData.content.length > 0 && (
            <div className="mb-12 space-y-4">
              {currentSlideData.content.map((item, index) => (
                <div key={index} className="flex items-center gap-4 text-xl">
                  <div className="w-3 h-3 bg-white rounded-full flex-shrink-0"></div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}

          {/* 底部内容 */}
          {currentSlideData.footer && (
            <div className="mb-8">
              <p className="text-xl font-medium text-blue-100">{currentSlideData.footer}</p>
            </div>
          )}

          {/* 高亮内容 */}
          {currentSlideData.highlights.length > 0 && (
            <div className="space-y-3">
              {currentSlideData.highlights.map((highlight, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span className="text-lg text-orange-200">{highlight}</span>
                </div>
              ))}
            </div>
          )}

          {/* 装饰性渐变元素 */}
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-purple-400/20 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute top-0 left-0 w-48 h-48 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-2xl"></div>
        </div>

        {/* 右侧切换按钮 */}
        <button
          onClick={nextSlide}
          disabled={currentSlide === totalSlides - 1}
          className="absolute right-4 z-10 p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* 页码指示器 */}
        <div className="absolute bottom-8 right-8 bg-black/20 backdrop-blur-sm text-white px-4 py-2 rounded-full">
          <span className="text-lg font-medium">
            {currentSlide + 1} / {totalSlides}
          </span>
        </div>
      </div>
    </div>
  )
}
