"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Presentation, Download, Share2, Eye, Hand, Mic, Plus, Trash2 } from "lucide-react"
import { gestureUtils, voiceUtils } from "@/lib/utils"

interface PPTSlide {
  id: string
  title: string
  content: string
  layout: "title" | "content" | "image" | "chart"
  background: string
  animation: string
}

export default function PPTGeneratorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""

  const [slides, setSlides] = useState<PPTSlide[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isGenerating, setIsGenerating] = useState(true)
  const [isListening, setIsListening] = useState(false)
  const [gestureMode, setGestureMode] = useState<"idle" | "swipe" | "pinch">("idle")
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const slideRef = useRef<HTMLDivElement>(null)

  // 生成PPT内容
  useEffect(() => {
    const generatePPT = async () => {
      setIsGenerating(true)

      // 模拟AI生成PPT
      await new Promise((resolve) => setTimeout(resolve, 3000))

      const generatedSlides: PPTSlide[] = [
        {
          id: "1",
          title: query || "主题演示",
          content: `关于${query}的深度解析与应用`,
          layout: "title",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          animation: "fadeIn",
        },
        {
          id: "2",
          title: "核心概念",
          content: `${query}的基本定义和核心要素：\n\n• 理论基础\n• 关键特征\n• 应用范围\n• 发展历程`,
          layout: "content",
          background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          animation: "slideInLeft",
        },
        {
          id: "3",
          title: "实践应用",
          content: `${query}在实际场景中的应用：\n\n• 成功案例分析\n• 实施策略\n• 效果评估\n• 最佳实践`,
          layout: "content",
          background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
          animation: "slideInRight",
        },
        {
          id: "4",
          title: "数据分析",
          content: "相关数据图表和趋势分析",
          layout: "chart",
          background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
          animation: "slideInUp",
        },
        {
          id: "5",
          title: "未来展望",
          content: `${query}的发展趋势和未来机遇：\n\n• 技术发展方向\n• 市场前景\n• 挑战与机遇\n• 行动建议`,
          layout: "content",
          background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
          animation: "slideInDown",
        },
      ]

      setSlides(generatedSlides)
      setIsGenerating(false)
    }

    if (query) {
      generatePPT()
    }
  }, [query])

  // 手势控制
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let startX = 0,
      startY = 0
    let startDistance = 0
    let isPointerDown = false
    let pointers: PointerEvent[] = []

    const handlePointerDown = (e: PointerEvent) => {
      pointers.push(e)

      if (pointers.length === 1) {
        isPointerDown = true
        startX = e.clientX
        startY = e.clientY
        setGestureMode("swipe")
      } else if (pointers.length === 2) {
        const dx = pointers[0].clientX - pointers[1].clientX
        const dy = pointers[0].clientY - pointers[1].clientY
        startDistance = Math.sqrt(dx * dx + dy * dy)
        setGestureMode("pinch")
      }
    }

    const handlePointerMove = (e: PointerEvent) => {
      const index = pointers.findIndex((p) => p.pointerId === e.pointerId)
      if (index !== -1) {
        pointers[index] = e
      }

      if (pointers.length === 1 && isPointerDown) {
        const deltaX = e.clientX - startX
        const deltaY = e.clientY - startY

        if (Math.abs(deltaX) > 100) {
          if (deltaX > 0 && currentSlide > 0) {
            // 右滑 - 上一张
            setCurrentSlide((prev) => prev - 1)
            gestureUtils.hapticFeedback(100)
          } else if (deltaX < 0 && currentSlide < slides.length - 1) {
            // 左滑 - 下一张
            setCurrentSlide((prev) => prev + 1)
            gestureUtils.hapticFeedback(100)
          }
          isPointerDown = false
        }

        if (Math.abs(deltaY) > 100) {
          if (deltaY > 0) {
            // 下滑 - 退出预览
            setIsPreviewMode(false)
          } else {
            // 上滑 - 进入预览
            setIsPreviewMode(true)
          }
          isPointerDown = false
        }
      } else if (pointers.length === 2) {
        // 双指缩放控制预览模式
        const dx = pointers[0].clientX - pointers[1].clientX
        const dy = pointers[0].clientY - pointers[1].clientY
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance > startDistance * 1.2) {
          setIsPreviewMode(true)
        } else if (distance < startDistance * 0.8) {
          setIsPreviewMode(false)
        }
      }
    }

    const handlePointerUp = (e: PointerEvent) => {
      pointers = pointers.filter((p) => p.pointerId !== e.pointerId)

      if (pointers.length === 0) {
        isPointerDown = false
        setTimeout(() => setGestureMode("idle"), 300)
      }
    }

    container.addEventListener("pointerdown", handlePointerDown)
    container.addEventListener("pointermove", handlePointerMove)
    container.addEventListener("pointerup", handlePointerUp)

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown)
      container.removeEventListener("pointermove", handlePointerMove)
      container.removeEventListener("pointerup", handlePointerUp)
    }
  }, [currentSlide, slides.length])

  // 语音控制
  useEffect(() => {
    const recognition = voiceUtils.initSpeechRecognition(
      (transcript) => {
        const command = transcript.toLowerCase()

        if (command.includes("下一张") || command.includes("下一页")) {
          if (currentSlide < slides.length - 1) {
            setCurrentSlide((prev) => prev + 1)
          }
        } else if (command.includes("上一张") || command.includes("上一页")) {
          if (currentSlide > 0) {
            setCurrentSlide((prev) => prev - 1)
          }
        } else if (command.includes("预览模式")) {
          setIsPreviewMode(true)
        } else if (command.includes("编辑模式")) {
          setIsPreviewMode(false)
        } else if (command.includes("返回")) {
          router.back()
        }
      },
      () => setIsListening(true),
      () => setIsListening(false),
    )

    recognition?.start()
    return () => recognition?.stop()
  }, [currentSlide, slides.length, router])

  // 添加新幻灯片
  const addSlide = () => {
    const newSlide: PPTSlide = {
      id: Date.now().toString(),
      title: "新幻灯片",
      content: "点击编辑内容...",
      layout: "content",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      animation: "fadeIn",
    }

    setSlides((prev) => [...prev, newSlide])
    setCurrentSlide(slides.length)
    gestureUtils.hapticFeedback([100, 50, 100])
  }

  // 删除幻灯片
  const deleteSlide = (slideId: string) => {
    if (slides.length <= 1) return

    setSlides((prev) => prev.filter((slide) => slide.id !== slideId))
    if (currentSlide >= slides.length - 1) {
      setCurrentSlide(Math.max(0, currentSlide - 1))
    }
    gestureUtils.hapticFeedback([100, 100])
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-24 h-24 border-4 border-orange-400/30 rounded-full animate-spin border-t-orange-400"></div>
            <Presentation className="w-10 h-10 text-orange-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">AI正在生成演示文稿</h2>
          <p className="text-gray-400 mb-2">分析内容结构...</p>
          <p className="text-gray-400">设计幻灯片布局...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden"
    >
      {/* 顶部工具栏 */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">{query} - 演示文稿</h1>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`p-2 rounded-full transition-colors ${
                isPreviewMode ? "bg-blue-500/20 text-blue-400" : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <Eye className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <Download className="w-5 h-5 text-white" />
            </button>
            <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <Share2 className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="pt-20 pb-8 px-6 h-screen flex">
        {/* 幻灯片缩略图 */}
        {!isPreviewMode && (
          <div className="w-64 mr-6 bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">幻灯片</h3>
              <button onClick={addSlide} className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="space-y-3">
              {slides.map((slide, index) => (
                <div
                  key={slide.id}
                  onClick={() => setCurrentSlide(index)}
                  className={`relative group cursor-pointer rounded-lg overflow-hidden transition-all duration-300 ${
                    index === currentSlide ? "ring-2 ring-purple-400 scale-105" : "hover:scale-102"
                  }`}
                >
                  <div className="aspect-video p-3 text-white text-xs" style={{ background: slide.background }}>
                    <div className="font-medium mb-1 truncate">{slide.title}</div>
                    <div className="text-white/80 line-clamp-3">{slide.content}</div>
                  </div>

                  <div className="absolute top-2 left-2 bg-black/50 rounded px-2 py-1 text-xs text-white">
                    {index + 1}
                  </div>

                  {slides.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteSlide(slide.id)
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 主幻灯片显示区域 */}
        <div className="flex-1 flex items-center justify-center">
          {slides.length > 0 && (
            <div
              ref={slideRef}
              className={`relative rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ${
                isPreviewMode ? "w-full h-full" : "w-4/5 aspect-video"
              }`}
              style={{ background: slides[currentSlide]?.background }}
            >
              <div className="absolute inset-0 p-12 flex flex-col justify-center text-white">
                <h1 className={`font-bold mb-8 ${isPreviewMode ? "text-6xl" : "text-4xl"}`}>
                  {slides[currentSlide]?.title}
                </h1>

                <div className={`leading-relaxed ${isPreviewMode ? "text-2xl" : "text-xl"}`}>
                  {slides[currentSlide]?.content.split("\n").map((line, index) => (
                    <div key={index} className="mb-2">
                      {line}
                    </div>
                  ))}
                </div>
              </div>

              {/* 幻灯片导航指示器 */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {slides.map((_, index) => (
                  <div
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full cursor-pointer transition-all duration-300 ${
                      index === currentSlide ? "bg-white scale-125" : "bg-white/50 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>

              {/* 幻灯片编号 */}
              <div className="absolute top-6 right-6 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm">
                {currentSlide + 1} / {slides.length}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 状态指示器 */}
      <div className="fixed bottom-8 right-8 flex flex-col space-y-2">
        {isListening && (
          <div className="bg-red-500/20 backdrop-blur-sm rounded-full p-3 border border-red-400/30">
            <Mic className="w-5 h-5 text-red-400 animate-pulse" />
          </div>
        )}
        {gestureMode !== "idle" && (
          <div className="bg-blue-500/20 backdrop-blur-sm rounded-full p-3 border border-blue-400/30">
            <Hand className="w-5 h-5 text-blue-400" />
          </div>
        )}
        {isPreviewMode && (
          <div className="bg-green-500/20 backdrop-blur-sm rounded-full p-3 border border-green-400/30">
            <Eye className="w-5 h-5 text-green-400" />
          </div>
        )}
      </div>

      {/* 交互提示 */}
      <div className="fixed bottom-8 left-8 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 p-4">
        <div className="text-white text-sm space-y-1">
          <p>👆 左右滑动: 切换幻灯片</p>
          <p>🤏 双指缩放: 预览模式</p>
          <p>🗣️ 语音: "下一张"、"预览模式"</p>
          <p>📱 上下滑动: 切换视图模式</p>
        </div>
      </div>
    </div>
  )
}
