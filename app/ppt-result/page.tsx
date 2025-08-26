"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { PPTGenerator, type GeneratedPPT } from "@/lib/ppt-generator"
import {
  Download,
  Maximize,
  Minimize,
  Code,
  RefreshCw,
  Copy,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  FileText,
  Moon,
  Sun,
  Lightbulb,
  Presentation,
} from "lucide-react"

export default function PPTResultPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [ppt, setPPT] = useState<GeneratedPPT | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showCode, setShowCode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
  const [previewMode, setPreviewMode] = useState<"grid" | "single">("single")
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [shareLink, setShareLink] = useState("")
  const [isCopied, setIsCopied] = useState(false)
  const slidesContainerRef = useRef<HTMLDivElement>(null)

  // 页面加载时初始化
  useEffect(() => {
    // 生成分享链接
    if (searchParams.get("q")) {
      setShareLink(window.location.href)
    }

    // 检测系统主题
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    setTheme(prefersDark ? "dark" : "light")

    // 从URL参数或ID加载PPT
    loadPPT()
  }, [])

  // 监听URL变化重新加载PPT
  useEffect(() => {
    loadPPT()
  }, [searchParams])

  // 加载PPT的逻辑
  const loadPPT = useCallback(() => {
    setIsLoading(true)
    const pptId = searchParams.get("id")

    if (pptId) {
      // 从本地获取已生成的PPT
      const ppts = PPTGenerator.getPPTs()
      const foundPPT = ppts.find((p) => p.id === pptId)

      if (foundPPT) {
        setPPT(foundPPT)
        setActiveSlideIndex(0) // 重置为第一张幻灯片
      } else {
        console.warn("未找到PPT ID:", pptId)
        // 尝试从参数生成
        const params = Object.fromEntries(searchParams.entries())
        if (params.q) {
          generatePPTFromParams(params)
        }
      }
    } else {
      // 从URL参数生成PPT
      const params = Object.fromEntries(searchParams.entries())
      if (params.q) {
        generatePPTFromParams(params)
      } else {
        setIsLoading(false)
      }
    }
  }, [searchParams])

  // 从参数生成PPT
  const generatePPTFromParams = async (params: any) => {
    try {
      // 显示生成中动画
      setIsLoading(true)
      setPPT(null)

      // 提取参数并添加默认值
      const query = params.q || "未命名演示文稿"
      const slideCount = Number.parseInt(params.slides) || 10
      const theme = params.theme || "business"
      const template = params.template || "business-presentation"
      const colorScheme = params.colorScheme || "blue"

      // 调用AI生成幻灯片内容
      const slides = await PPTGenerator.generateAISlides(query, slideCount, theme)

      // 创建PPT配置
      const config = {
        template,
        title: query,
        author: "AI生成",
        theme,
        colorScheme,
        footer: params.footer || "AI Powered Presentation",
        watermark: params.watermark === "true",
        createdAt: new Date().toISOString(),
      }

      // 生成PPT
      const newPPT = await PPTGenerator.createPPT(slides, config)

      // 保存到状态
      setPPT(newPPT)

      // 更新URL参数
      if (newPPT.id) {
        router.push(`/ppt-result?id=${newPPT.id}`)
        setShareLink(window.location.href)
      }
    } catch (error) {
      console.error("生成PPT时出错:", error)
      // 显示智能错误提示
      alert(`生成失败: ${error instanceof Error ? error.message : "未知错误"}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 幻灯片导航
  const goToSlide = (index: number) => {
    if (ppt && index >= 0 && index < ppt.slides.length) {
      setActiveSlideIndex(index)

      // 平滑滚动到幻灯片
      if (slidesContainerRef.current) {
        const slideElement = slidesContainerRef.current.querySelector(`[data-index="${index}"]`) as HTMLElement
        if (slideElement) {
          slideElement.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }
    }
  }

  // 下载PPT
  const downloadPPT = async () => {
    if (!ppt) return

    try {
      setIsLoading(true)
      await PPTGenerator.downloadPPT(ppt.id)

      // 下载成功提示
      showNotification({
        type: "success",
        message: "PPT下载成功！",
      })
    } catch (error) {
      console.error("下载PPT时出错:", error)
      showNotification({
        type: "error",
        message: `下载失败: ${error instanceof Error ? error.message : "未知错误"}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 复制分享链接
  const copyShareLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink)
      setIsCopied(true)

      // 3秒后重置复制状态
      setTimeout(() => {
        setIsCopied(false)
      }, 3000)

      showNotification({
        type: "success",
        message: "分享链接已复制到剪贴板！",
      })
    }
  }

  // 显示通知
  const showNotification = (notification: { type: "success" | "error" | "info"; message: string }) => {
    // 这里可以实现更复杂的通知系统
    console.log(`${notification.type.toUpperCase()}: ${notification.message}`)
  }

  // 主题切换
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  // 切换代码视图
  const toggleCodeView = () => {
    setShowCode(!showCode)
  }

  // 切换全屏
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // 智能生成建议
  const generateSuggestion = async () => {
    if (!ppt) return

    try {
      setIsLoading(true)

      // 调用AI分析当前PPT并生成建议
      const suggestion = await PPTGenerator.analyzePPT(ppt.id)

      // 显示建议
      alert(`AI建议: ${suggestion}`)
    } catch (error) {
      console.error("生成建议时出错:", error)
      showNotification({
        type: "error",
        message: `获取建议失败: ${error instanceof Error ? error.message : "未知错误"}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 重新生成PPT
  const regeneratePPT = () => {
    const query = searchParams.get("q")
    if (query) {
      router.push(`/ppt-result?q=${encodeURIComponent(query)}`)
    }
  }

  // 渲染加载状态
  if (isLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}
      >
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-lg font-medium text-gray-600 dark:text-gray-300">正在智能生成PPT...</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            AI正在分析您的需求并创作内容，这可能需要几秒钟时间
          </p>
        </div>
      </div>
    )
  }

  // 渲染无PPT状态
  if (!ppt) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}
      >
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <Presentation className="text-2xl text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">未找到PPT</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">请检查链接是否正确或使用关键词生成新的PPT</p>

          <div className="flex flex-col space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="输入主题关键词..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={() => {
                  const input = document.querySelector("input") as HTMLInputElement
                  if (input.value) {
                    router.push(`/ppt-result?q=${encodeURIComponent(input.value)}`)
                  }
                }}
              >
                生成
              </button>
            </div>

            {searchParams.get("q") && (
              <button
                onClick={regeneratePPT}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2 inline" />
                重新生成
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"}`}>
      {/* 顶部导航栏 */}
      <header className={`bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-30 ${isFullscreen ? "hidden" : ""}`}>
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center">
              <Presentation className="text-blue-600 text-xl mr-2" />
              <h1 className="text-xl font-semibold">AI PPT Generator</h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setPreviewMode(previewMode === "single" ? "grid" : "single")}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={previewMode === "single" ? "网格视图" : "单页视图"}
            >
              {previewMode === "single" ? <Grid3X3 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="切换主题"
            >
              {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            <button
              onClick={generateSuggestion}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="AI优化建议"
            >
              <Lightbulb className="w-5 h-5 text-yellow-500" />
            </button>

            <button
              onClick={toggleCodeView}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={showCode ? "隐藏代码" : "查看代码"}
            >
              <Code className="w-5 h-5" />
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={isFullscreen ? "退出全屏" : "全屏查看"}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>

            <button
              onClick={downloadPPT}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              下载
            </button>
          </div>
        </div>

        {/* 第二导航栏 - PPT信息 */}
        <div className="bg-gray-50 dark:bg-gray-700 py-2 px-4 border-t border-gray-200 dark:border-gray-600">
          <div className="container mx-auto flex flex-wrap items-center justify-between">
            <div className="flex items-center mr-4">
              <h2 className="text-lg font-semibold truncate max-w-md">{ppt.title}</h2>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-300">
                {new Date(ppt.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center space-x-3 mt-2 sm:mt-0">
              <div className="flex items-center text-sm">
                <span className="text-gray-500 dark:text-gray-300 mr-2">主题:</span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded-full text-xs">{ppt.theme}</span>
              </div>

              <div className="flex items-center text-sm">
                <span className="text-gray-500 dark:text-gray-300 mr-2">幻灯片:</span>
                <span>{ppt.slides.length}</span>
              </div>

              <div className="flex items-center">
                <button
                  onClick={copyShareLink}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  <span>{isCopied ? "已复制" : "分享"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区 */}
      <main className="container mx-auto px-4 py-6">
        {/* 幻灯片导航 */}
        <div className={`mb-6 ${isFullscreen ? "hidden" : ""}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">幻灯片导航</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => goToSlide(activeSlideIndex - 1)}
                disabled={activeSlideIndex === 0}
                className={`px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg ${activeSlideIndex === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg">
                <span className="font-medium">{activeSlideIndex + 1}</span> / {ppt.slides.length}
              </div>

              <button
                onClick={() => goToSlide(activeSlideIndex + 1)}
                disabled={activeSlideIndex === ppt.slides.length - 1}
                className={`px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg ${activeSlideIndex === ppt.slides.length - 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 幻灯片缩略图导航 */}
          <div className="overflow-x-auto pb-2">
            <div className="flex space-x-3" ref={slidesContainerRef}>
              {ppt.slides.map((slide, index) => (
                <div
                  key={index}
                  data-index={index}
                  onClick={() => goToSlide(index)}
                  className={`w-32 h-24 rounded-md overflow-hidden border-2 ${index === activeSlideIndex ? "border-blue-600" : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"} transition-all cursor-pointer flex-shrink-0`}
                >
                  <div
                    className={`w-full h-full ${index === activeSlideIndex ? "opacity-100" : "opacity-80 hover:opacity-100"} transition-opacity bg-white dark:bg-gray-800 p-2 text-xs overflow-hidden`}
                  >
                    <h4 className="font-semibold truncate">{slide.title}</h4>
                    <div className="mt-1 line-clamp-3 text-gray-600 dark:text-gray-300">{slide.content}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PPT预览 */}
        <div
          className={`${isFullscreen ? "fixed inset-0 z-50 bg-black p-6 flex items-center justify-center" : "max-w-5xl mx-auto"}`}
        >
          <div className={`${previewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : ""}`}>
            {previewMode === "grid" ? (
              // 网格视图：显示所有幻灯片
              ppt.slides.map((slide, index) => (
                <div
                  key={index}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transform transition-all duration-300 hover:shadow-xl ${index === activeSlideIndex ? "ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-gray-900" : ""}`}
                  onClick={() => goToSlide(index)}
                >
                  <div className="aspect-[4/3] p-4 flex flex-col">
                    <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-white">{slide.title}</h3>
                    <div className="flex-1 text-sm text-gray-600 dark:text-gray-300 overflow-hidden">
                      {slide.content}
                    </div>
                  </div>
                  <div className="p-2 bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                    <span>幻灯片 #{index + 1}</span>
                    <span>{slide.content?.length || 0} 字符</span>
                  </div>
                </div>
              ))
            ) : (
              // 单页视图：显示当前活动幻灯片
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl">
                <div className="aspect-[16/9] p-8 flex flex-col">
                  <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
                    {ppt.slides[activeSlideIndex].title}
                  </h3>
                  <div className="flex-1 text-gray-600 dark:text-gray-300">{ppt.slides[activeSlideIndex].content}</div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 text-sm text-gray-500 dark:text-gray-400 flex justify-between">
                  <span>幻灯片 #{activeSlideIndex + 1}</span>
                  <span>{ppt.slides[activeSlideIndex].content?.length || 0} 字符</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 代码查看区域 */}
        {showCode && !isFullscreen && (
          <div className="mt-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
                <h3 className="font-semibold">PPT数据结构</h3>
                <div className="flex space-x-2">
                  <button
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center"
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(ppt, null, 2))}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    复制
                  </button>
                  <button
                    onClick={() => setShowCode(false)}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center"
                  >
                    关闭
                  </button>
                </div>
              </div>
              <div className="p-4 bg-gray-900 text-gray-100 rounded-b-lg">
                <pre className="overflow-x-auto text-xs max-h-96">{JSON.stringify(ppt, null, 2)}</pre>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
