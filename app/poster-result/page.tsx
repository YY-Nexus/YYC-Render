"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Download, Share2, RefreshCw, Palette, Settings, Eye, Copy, Check, ImageIcon } from "lucide-react"
import { PosterGenerator, type PosterConfig, type GeneratedPoster } from "@/lib/poster-generator"

export default function PosterResultPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get("query") || ""
  const theme = (searchParams.get("theme") as PosterConfig["theme"]) || "modern"

  const [poster, setPoster] = useState<GeneratedPoster | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTheme, setSelectedTheme] = useState<PosterConfig["theme"]>(theme)
  const [showSettings, setShowSettings] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [shareSuccess, setShareSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const themes: Array<{ key: PosterConfig["theme"]; name: string; description: string; color: string }> = [
    { key: "modern", name: "现代风格", description: "简洁现代，适合商务场景", color: "bg-blue-500" },
    { key: "minimal", name: "极简风格", description: "简约优雅，突出内容", color: "bg-gray-500" },
    { key: "creative", name: "创意风格", description: "色彩丰富，富有创意", color: "bg-purple-500" },
    { key: "business", name: "商务风格", description: "专业正式，商务首选", color: "bg-gray-700" },
    { key: "education", name: "教育风格", description: "清新自然，适合学习", color: "bg-green-500" },
    { key: "tech", name: "科技风格", description: "科技感强，适合技术内容", color: "bg-slate-600" },
  ]

  useEffect(() => {
    if (query) {
      generatePosterFromParams()
    } else {
      router.push("/")
    }
  }, [query, selectedTheme])

  const generatePosterFromParams = async () => {
    if (!query) return

    setIsLoading(true)
    setError(null)

    try {
      // 模拟生成延迟
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const generatedPoster = PosterGenerator.generateFromQuery(query, selectedTheme)
      setPoster(generatedPoster)
    } catch (error) {
      console.error("生成海报失败:", error)
      setError("海报生成失败，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  const handleThemeChange = (newTheme: PosterConfig["theme"]) => {
    setSelectedTheme(newTheme)
    setShowSettings(false)
  }

  const handleDownload = () => {
    if (poster) {
      PosterGenerator.downloadPoster(poster, `${query}_poster.svg`)
    }
  }

  const handleDownloadPNG = async () => {
    if (!poster) return

    try {
      const pngDataUrl = await PosterGenerator.convertToImage(poster.svgContent, "png")
      const link = document.createElement("a")
      link.href = pngDataUrl
      link.download = `${query}_poster.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("转换PNG失败:", error)
      setError("PNG转换失败，请重试")
    }
  }

  const handleCopy = async () => {
    if (!poster) return

    try {
      await navigator.clipboard.writeText(poster.svgContent)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error("复制失败:", error)
      setError("复制失败，请重试")
    }
  }

  const handleShare = async () => {
    if (!poster) return

    const shareData = {
      title: `AI生成海报: ${query}`,
      text: `查看我用AI生成的海报：${query}`,
      url: window.location.href,
    }

    try {
      if (navigator.share && window.isSecureContext) {
        await navigator.share(shareData)
        setShareSuccess(true)
        setTimeout(() => setShareSuccess(false), 2000)
      } else {
        await navigator.clipboard.writeText(window.location.href)
        setShareSuccess(true)
        setTimeout(() => setShareSuccess(false), 2000)
      }
    } catch (error) {
      console.error("分享失败:", error)
      try {
        await navigator.clipboard.writeText(window.location.href)
        setShareSuccess(true)
        setTimeout(() => setShareSuccess(false), 2000)
      } catch (clipboardError) {
        console.error("复制链接也失败:", clipboardError)
        setError("分享失败，请手动复制链接")
      }
    }
  }

  const handleRegenerate = () => {
    generatePosterFromParams()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">正在生成海报...</p>
          <p className="text-gray-500 text-sm mt-2">AI正在为您创作独特的视觉设计</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-red-600 text-2xl">⚠</span>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <button
              onClick={handleRegenerate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              重新生成
            </button>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              返回
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!poster) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">海报生成失败</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            返回
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">海报生成结果</h1>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="主题设置"
            >
              <Palette className="w-5 h-5" />
            </button>
            <button
              onClick={handleCopy}
              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="复制SVG代码"
            >
              {copySuccess ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
            </button>
            <button
              onClick={handleShare}
              className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="分享海报"
            >
              {shareSuccess ? <Check className="w-5 h-5 text-green-600" /> : <Share2 className="w-5 h-5" />}
            </button>
            <button
              onClick={handleRegenerate}
              className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              title="重新生成"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 海报预览 */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">海报预览</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Eye className="w-4 h-4" />
                  <span>主题: {themes.find((t) => t.key === selectedTheme)?.name}</span>
                </div>
              </div>

              {/* 海报显示区域 */}
              <div className="flex justify-center">
                <div className="bg-gray-100 p-4 rounded-lg shadow-inner">
                  <div
                    className="bg-white rounded shadow-lg overflow-hidden"
                    style={{ maxWidth: "400px", maxHeight: "600px" }}
                  >
                    <img
                      src={poster.dataUrl || "/placeholder.svg"}
                      alt={`海报: ${query}`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        console.error("图片加载失败:", e)
                        setError("海报预览加载失败")
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* 下载按钮 */}
              <div className="flex justify-center space-x-4 mt-6">
                <button
                  onClick={handleDownload}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>下载 SVG</span>
                </button>
                <button
                  onClick={handleDownloadPNG}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>下载 PNG</span>
                </button>
              </div>
            </div>
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* 主题选择 */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">主题选择</h3>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {themes.map((themeOption) => (
                  <button
                    key={themeOption.key}
                    onClick={() => handleThemeChange(themeOption.key)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedTheme === themeOption.key
                        ? "border-blue-300 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded ${themeOption.color}`}></div>
                      <div className="flex-1">
                        <div className="font-medium">{themeOption.name}</div>
                        <div className="text-sm text-gray-500 mt-1">{themeOption.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 海报信息 */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">海报信息</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">标题:</span>
                  <span className="font-medium text-right flex-1 ml-2 truncate">{poster.config.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">主题:</span>
                  <span className="font-medium">{themes.find((t) => t.key === selectedTheme)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">尺寸:</span>
                  <span className="font-medium">
                    {poster.config.size.width} × {poster.config.size.height}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">格式:</span>
                  <span className="font-medium">SVG 矢量图</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">生成时间:</span>
                  <span className="font-medium">{new Date(poster.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>

            {/* 快速操作 */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/results?query=${encodeURIComponent(query)}`)}
                  className="w-full flex items-center space-x-3 p-3 text-left rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <Eye className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-800">查看搜索结果</span>
                </button>

                <button
                  onClick={() => router.push(`/generate/mindmap?query=${encodeURIComponent(query)}`)}
                  className="w-full flex items-center space-x-3 p-3 text-left rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                >
                  <Settings className="w-5 h-5 text-purple-600" />
                  <span className="text-gray-800">生成思维导图</span>
                </button>

                <button
                  onClick={() => router.push(`/community/share?content=${encodeURIComponent(poster.svgContent)}`)}
                  className="w-full flex items-center space-x-3 p-3 text-left rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
                >
                  <Share2 className="w-5 h-5 text-green-600" />
                  <span className="text-gray-800">分享到社区</span>
                </button>
              </div>
            </div>

            {/* 使用提示 */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">使用提示</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• SVG格式支持无损缩放</li>
                <li>• 可转换为PNG用于社交媒体</li>
                <li>• 支持在设计软件中编辑</li>
                <li>• 文件体积小，加载速度快</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 成功提示 */}
      {(copySuccess || shareSuccess) && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {copySuccess ? "SVG代码已复制!" : "链接已分享!"}
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-white hover:text-gray-200">
            ×
          </button>
        </div>
      )}
    </div>
  )
}
