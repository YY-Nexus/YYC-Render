"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { WebpageGenerator, type GeneratedWebpage } from "@/lib/webpage-generator"

export default function InteractiveWebpagePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [webpage, setWebpage] = useState<GeneratedWebpage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"desktop" | "tablet" | "mobile">("desktop")
  const [showCode, setShowCode] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const webpageId = searchParams.get("id")

  useEffect(() => {
    if (webpageId) {
      const webpages = WebpageGenerator.getWebpages()
      const foundWebpage = webpages.find((w) => w.id === webpageId)

      if (foundWebpage) {
        setWebpage(foundWebpage)
      }
    } else {
      // 如果没有ID，从URL参数生成网页
      const params = Object.fromEntries(searchParams.entries())
      if (params.prompt) {
        generateWebpageFromParams(params)
      }
    }

    setIsLoading(false)
  }, [webpageId, searchParams])

  const generateWebpageFromParams = async (params: any) => {
    try {
      const aiContent = await WebpageGenerator.generateAIContent(params.prompt, params.template || "business-corporate")

      const config = {
        template: params.template || "business-corporate",
        title: params.title || "AI生成网站",
        description: params.description || params.prompt,
        style: params.style || "modern",
        colorScheme: params.colorScheme || "blue",
        layout: params.layout || "single",
        features: [],
        content: {
          hero: aiContent.hero || {
            title: params.title || "欢迎访问我们的网站",
            subtitle: params.description || params.prompt,
            buttonText: "了解更多",
          },
          about: aiContent.about || {
            title: "关于我们",
            content: "我们致力于为客户提供优质的服务。",
          },
          services: aiContent.services || [],
          contact: aiContent.contact || {
            email: "contact@example.com",
            phone: "400-123-4567",
            address: "北京市朝阳区",
          },
        },
      }

      const generatedWebpage = await WebpageGenerator.generateWebpage(config)
      WebpageGenerator.saveWebpage(generatedWebpage)
      setWebpage(generatedWebpage)
    } catch (error) {
      console.error("生成网页失败:", error)
    }
  }

  const getViewportWidth = () => {
    switch (viewMode) {
      case "mobile":
        return "375px"
      case "tablet":
        return "768px"
      default:
        return "100%"
    }
  }

  const handleDownload = () => {
    if (!webpage) return

    const blob = new Blob([webpage.html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${webpage.config.title.replace(/\s+/g, "-").toLowerCase()}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleShare = async () => {
    if (!webpage) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: webpage.config.title,
          text: webpage.config.description,
          url: window.location.href,
        })
      } catch (error) {
        console.log("分享失败:", error)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert("链接已复制到剪贴板")
    }
  }

  const handleEdit = () => {
    router.push(`/generate/webpage?edit=${webpage?.id}`)
  }

  useEffect(() => {
    if (webpage && iframeRef.current) {
      const iframe = iframeRef.current
      const doc = iframe.contentDocument || iframe.contentWindow?.document

      if (doc) {
        doc.open()
        doc.write(webpage.html)
        doc.close()
      }
    }
  }, [webpage])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800">正在加载网页...</h2>
          <p className="text-gray-600 mt-2">请稍候</p>
        </div>
      </div>
    )
  }

  if (!webpage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">网页未找到</h2>
          <p className="text-gray-600 mb-4">请检查链接是否正确</p>
          <button
            onClick={() => router.push("/generate/webpage")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            创建新网页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 工具栏 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
                ← 返回
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{webpage.config.title}</h1>
                <p className="text-sm text-gray-600">{webpage.config.description}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* 视图模式切换 */}
              <div className="flex bg-gray-100 rounded-md p-1">
                <button
                  onClick={() => setViewMode("desktop")}
                  className={`px-3 py-1 text-sm rounded ${
                    viewMode === "desktop" ? "bg-white shadow-sm" : "text-gray-600"
                  }`}
                >
                  桌面
                </button>
                <button
                  onClick={() => setViewMode("tablet")}
                  className={`px-3 py-1 text-sm rounded ${
                    viewMode === "tablet" ? "bg-white shadow-sm" : "text-gray-600"
                  }`}
                >
                  平板
                </button>
                <button
                  onClick={() => setViewMode("mobile")}
                  className={`px-3 py-1 text-sm rounded ${
                    viewMode === "mobile" ? "bg-white shadow-sm" : "text-gray-600"
                  }`}
                >
                  手机
                </button>
              </div>

              <button
                onClick={() => setShowCode(!showCode)}
                className="px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                {showCode ? "隐藏代码" : "查看代码"}
              </button>
              <button
                onClick={handleEdit}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                编辑
              </button>
              <button
                onClick={handleShare}
                className="px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                分享
              </button>
              <button
                onClick={handleDownload}
                className="px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                下载
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* 网页预览 */}
        <div className={`${showCode ? "w-2/3" : "w-full"} transition-all duration-300`}>
          <div className="h-full p-4 flex items-center justify-center bg-gray-50">
            <div
              className="bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300"
              style={{
                width: getViewportWidth(),
                height: viewMode === "mobile" ? "667px" : "80vh",
                maxWidth: "100%",
              }}
            >
              <iframe
                ref={iframeRef}
                className="w-full h-full border-0"
                title="网页预览"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        </div>

        {/* 代码查看器 */}
        {showCode && (
          <div className="w-1/3 bg-gray-900 text-white overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold">HTML 代码</h3>
              <button
                onClick={() => navigator.clipboard.writeText(webpage.html)}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                复制
              </button>
            </div>
            <div className="h-full overflow-auto p-4">
              <pre className="text-sm">
                <code>{webpage.html}</code>
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* 网页信息面板 */}
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
        <h4 className="font-semibold text-gray-900 mb-2">网页信息</h4>
        <div className="space-y-1 text-sm text-gray-600">
          <p>
            <span className="font-medium">模板:</span> {webpage.config.template}
          </p>
          <p>
            <span className="font-medium">风格:</span> {webpage.config.style}
          </p>
          <p>
            <span className="font-medium">配色:</span> {webpage.config.colorScheme}
          </p>
          <p>
            <span className="font-medium">布局:</span> {webpage.config.layout}
          </p>
          <p>
            <span className="font-medium">创建时间:</span> {new Date(webpage.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}
