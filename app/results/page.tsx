"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Brain, Sparkles, Hand, Mic, Zap } from "lucide-react"

export default function ResultsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  const mode = searchParams.get("mode") || "search"

  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentSection, setCurrentSection] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [gestureMode, setGestureMode] = useState<"idle" | "scroll" | "navigate">("idle")
  const [readingProgress, setReadingProgress] = useState(0)
  const [userEngagement, setUserEngagement] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // 模拟AI结果生成
  useEffect(() => {
    const generateResult = async () => {
      setIsLoading(true)

      // 模拟AI处理时间
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const mockResult = {
        answer: `# ${query} - 智能分析结果

## 核心洞察

基于您的查询"${query}"，我为您提供以下深度分析：

### 主要概念
${query}是一个多维度的概念，涉及理论基础、实践应用和未来发展等多个层面。

### 关键要点
1. **理论基础**: 建立在扎实的学术研究基础上
2. **实践价值**: 在实际应用中展现出显著效果
3. **发展趋势**: 随着技术进步呈现新的发展机遇

### 深度分析
通过多维度分析，我们可以看到${query}不仅在当前具有重要意义，在未来发展中也将发挥关键作用。

### 实际应用
- 应用场景一：具体的实施方案和预期效果
- 应用场景二：创新的应用模式和成功案例
- 应用场景三：未来的发展方向和潜在机会

### 学习建议
1. 从基础概念开始，建立完整的知识体系
2. 结合实际案例，加深理解和应用能力
3. 关注最新发展，保持知识的时效性

这个分析为您提供了全面的视角，希望能够帮助您更好地理解和应用相关知识。`,
        sections: [
          { title: "核心洞察", content: "基于AI分析的核心观点和见解" },
          { title: "深度解析", content: "详细的概念解释和理论分析" },
          { title: "实践应用", content: "具体的应用场景和实施方案" },
          { title: "未来展望", content: "发展趋势和潜在机会分析" },
        ],
        relatedActions: [
          { title: "生成思维导图", path: "/generate/mindmap" },
          { title: "创建学习路径", path: "/learning-path/create" },
          { title: "制作演示文稿", path: "/generate/ppt" },
        ],
      }

      setResult(mockResult)
      setIsLoading(false)
    }

    if (query) {
      generateResult()
    }
  }, [query])

  // 手势导航系统
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let startY = 0
    let currentY = 0
    let isPointerDown = false

    const handlePointerDown = (e: PointerEvent) => {
      isPointerDown = true
      startY = currentY = e.clientY
      setGestureMode("scroll")
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return

      currentY = e.clientY
      const deltaY = currentY - startY

      if (Math.abs(deltaY) > 100) {
        if (deltaY > 0) {
          // 向下滑动 - 上一节
          if (currentSection > 0) {
            setCurrentSection((prev) => prev - 1)
            if ("vibrate" in navigator) navigator.vibrate(100)
          }
        } else {
          // 向上滑动 - 下一节
          if (result && currentSection < result.sections.length - 1) {
            setCurrentSection((prev) => prev + 1)
            if ("vibrate" in navigator) navigator.vibrate(100)
          }
        }
        isPointerDown = false
        setGestureMode("navigate")
        setTimeout(() => setGestureMode("idle"), 500)
      }
    }

    const handlePointerUp = () => {
      isPointerDown = false
      setTimeout(() => setGestureMode("idle"), 300)
    }

    container.addEventListener("pointerdown", handlePointerDown)
    container.addEventListener("pointermove", handlePointerMove)
    container.addEventListener("pointerup", handlePointerUp)

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown)
      container.removeEventListener("pointermove", handlePointerMove)
      container.removeEventListener("pointerup", handlePointerUp)
    }
  }, [currentSection, result])

  // 语音控制系统
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.continuous = true
      recognition.lang = "zh-CN"

      recognition.onresult = (event: any) => {
        const command = event.results[event.results.length - 1][0].transcript.toLowerCase()

        if (command.includes("下一个") || command.includes("下一节")) {
          if (result && currentSection < result.sections.length - 1) {
            setCurrentSection((prev) => prev + 1)
          }
        } else if (command.includes("上一个") || command.includes("上一节")) {
          if (currentSection > 0) {
            setCurrentSection((prev) => prev - 1)
          }
        } else if (command.includes("返回") || command.includes("回去")) {
          router.back()
        } else if (command.includes("思维导图")) {
          router.push(`/generate/mindmap?q=${encodeURIComponent(query)}`)
        }
      }

      recognition.onstart = () => setIsListening(true)
      recognition.onend = () => setIsListening(false)

      recognition.start()

      return () => recognition.stop()
    }
  }, [currentSection, result, query, router])

  // 阅读进度追踪
  useEffect(() => {
    const updateProgress = () => {
      if (contentRef.current) {
        const element = contentRef.current
        const scrollTop = element.scrollTop
        const scrollHeight = element.scrollHeight - element.clientHeight
        const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0
        setReadingProgress(progress)

        // 用户参与度计算
        setUserEngagement((prev) => Math.min(100, prev + 0.1))
      }
    }

    const content = contentRef.current
    if (content) {
      content.addEventListener("scroll", updateProgress)
      return () => content.removeEventListener("scroll", updateProgress)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-400/30 rounded-full animate-spin border-t-purple-400"></div>
            <Brain className="w-8 h-8 text-purple-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-white mt-6 text-xl">AI正在深度分析中...</p>
          <p className="text-gray-400 mt-2">为您生成个性化洞察</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative"
    >
      {/* 返回手势区域 */}
      <div className="absolute top-0 left-0 w-16 h-full z-20 cursor-pointer" onClick={() => router.back()}>
        <div className="flex items-center justify-center h-full">
          <ArrowLeft className="w-6 h-6 text-white/50 hover:text-white transition-colors" />
        </div>
      </div>

      {/* 进度指示器 */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-black/20 z-30">
        <div
          className="h-full bg-gradient-to-r from-purple-400 to-blue-400 transition-all duration-300"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* 主内容区域 */}
      <div ref={contentRef} className="pt-16 pb-20 px-6 max-w-4xl mx-auto overflow-y-auto h-screen">
        {/* 查询标题 */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
            {query}
          </h1>
          <p className="text-gray-400">AI智能分析结果</p>
        </div>

        {/* 内容区域 */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 mb-8">
          {/* 章节导航 */}
          <div className="flex justify-center mb-8">
            <div className="flex space-x-2">
              {result.sections.map((section: any, index: number) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 cursor-pointer ${
                    index === currentSection ? "bg-purple-400 scale-125" : "bg-white/20 hover:bg-white/40"
                  }`}
                  onClick={() => setCurrentSection(index)}
                />
              ))}
            </div>
          </div>

          {/* 当前章节内容 */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">{result.sections[currentSection]?.title}</h2>
            <div className="prose prose-invert max-w-none">
              <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">{result.answer}</div>
            </div>
          </div>
        </div>

        {/* 相关操作 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {result.relatedActions.map((action: any, index: number) => (
            <div
              key={index}
              onClick={() => router.push(`${action.path}?q=${encodeURIComponent(query)}`)}
              className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm rounded-2xl border border-white/10 p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg text-center"
            >
              <div className="flex items-center justify-center mb-3">
                {action.title.includes("思维导图") && <Brain className="w-6 h-6 text-purple-400" />}
                {action.title.includes("学习") && <Sparkles className="w-6 h-6 text-blue-400" />}
                {action.title.includes("演示") && <Zap className="w-6 h-6 text-green-400" />}
              </div>
              <h3 className="text-white font-medium">{action.title}</h3>
            </div>
          ))}
        </div>

        {/* 交互提示 */}
        <div className="text-center text-gray-400 text-sm">
          <p>上下滑动切换章节 • 语音说"下一个"或"上一个" • 左边缘点击返回</p>
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
        <div className="bg-purple-500/20 backdrop-blur-sm rounded-full p-3 border border-purple-400/30">
          <div className="text-xs text-purple-400 font-mono">{Math.round(userEngagement)}%</div>
        </div>
      </div>

      {/* 章节指示器 */}
      <div className="fixed left-8 top-1/2 transform -translate-y-1/2 flex flex-col space-y-4">
        {result.sections.map((section: any, index: number) => (
          <div
            key={index}
            className={`w-1 h-8 rounded-full transition-all duration-300 cursor-pointer ${
              index === currentSection ? "bg-purple-400" : "bg-white/20 hover:bg-white/40"
            }`}
            onClick={() => setCurrentSection(index)}
          />
        ))}
      </div>
    </div>
  )
}
