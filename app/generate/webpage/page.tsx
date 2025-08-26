"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft,
  Download,
  Share2,
  RefreshCw,
  Code,
  Eye,
  Smartphone,
  Monitor,
  Tablet,
  Settings,
  Palette,
  Layout,
  Globe,
  Zap,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

interface WebpageSection {
  id: string
  type: "header" | "hero" | "content" | "features" | "footer"
  title: string
  content: string
  styles: {
    backgroundColor: string
    textColor: string
    layout: "left" | "center" | "right"
  }
  interactive: boolean
  animations: string[]
}

interface WebpageData {
  id: string
  title: string
  description: string
  sections: WebpageSection[]
  theme: "modern" | "classic" | "minimal" | "creative"
  responsive: boolean
  metadata: {
    createdAt: number
    lastModified: number
    version: string
    performance: {
      loadTime: number
      seoScore: number
      accessibilityScore: number
    }
  }
}

export default function WebpageGeneratorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get("query") || ""

  const [webpageData, setWebpageData] = useState<WebpageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop")
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "settings">("preview")
  const [customizations, setCustomizations] = useState({
    primaryColor: "#3B82F6",
    secondaryColor: "#10B981",
    fontFamily: "Inter",
    borderRadius: "8px",
  })
  const [isInteractive, setIsInteractive] = useState(true)
  const [showAnimations, setShowAnimations] = useState(true)

  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    generateWebpage()
  }, [query])

  const generateWebpage = async () => {
    if (!query) {
      router.push("/")
      return
    }

    setIsLoading(true)
    setIsGenerating(true)

    try {
      // 模拟AI生成网页
      await new Promise((resolve) => setTimeout(resolve, 3000))

      const mockWebpage: WebpageData = {
        id: `webpage_${Date.now()}`,
        title: `${query} - 互动网页`,
        description: `关于${query}的专业互动网页，包含丰富的内容和交互功能`,
        sections: generateMockSections(query),
        theme: "modern",
        responsive: true,
        metadata: {
          createdAt: Date.now(),
          lastModified: Date.now(),
          version: "1.0.0",
          performance: {
            loadTime: 1.2,
            seoScore: 95,
            accessibilityScore: 92,
          },
        },
      }

      setWebpageData(mockWebpage)
      setIsLoading(false)
      setIsGenerating(false)

      // 生成预览
      setTimeout(() => {
        generatePreview(mockWebpage)
      }, 100)
    } catch (error) {
      console.error("生成网页失败:", error)
      setIsLoading(false)
      setIsGenerating(false)
    }
  }

  const generateMockSections = (topic: string): WebpageSection[] => {
    return [
      {
        id: "header",
        type: "header",
        title: "导航栏",
        content: `<nav class="navbar">
          <div class="nav-brand">${topic}</div>
          <ul class="nav-menu">
            <li><a href="#home">首页</a></li>
            <li><a href="#about">关于</a></li>
            <li><a href="#features">特性</a></li>
            <li><a href="#contact">联系</a></li>
          </ul>
        </nav>`,
        styles: {
          backgroundColor: "#FFFFFF",
          textColor: "#1F2937",
          layout: "center",
        },
        interactive: true,
        animations: ["fadeIn"],
      },
      {
        id: "hero",
        type: "hero",
        title: "主标题区域",
        content: `<section class="hero">
          <div class="hero-content">
            <h1 class="hero-title">探索${topic}的无限可能</h1>
            <p class="hero-subtitle">深入了解${topic}的核心概念、应用场景和发展趋势</p>
            <div class="hero-actions">
              <button class="btn btn-primary">开始探索</button>
              <button class="btn btn-secondary">了解更多</button>
            </div>
          </div>
          <div class="hero-visual">
            <div class="hero-image"></div>
          </div>
        </section>`,
        styles: {
          backgroundColor: "#F8FAFC",
          textColor: "#1E293B",
          layout: "center",
        },
        interactive: true,
        animations: ["slideUp", "fadeIn"],
      },
      {
        id: "content",
        type: "content",
        title: "主要内容",
        content: `<section class="content">
          <div class="container">
            <h2>什么是${topic}？</h2>
            <p>${topic}是一个重要的概念，在现代社会中发挥着关键作用。它涉及多个领域的知识和技术，为我们的生活带来了巨大的变化。</p>
            
            <div class="content-grid">
              <div class="content-card">
                <h3>基本概念</h3>
                <p>了解${topic}的核心定义和基础理论</p>
              </div>
              <div class="content-card">
                <h3>技术原理</h3>
                <p>深入探讨${topic}的工作机制和实现方法</p>
              </div>
              <div class="content-card">
                <h3>应用场景</h3>
                <p>发现${topic}在各个领域的实际应用</p>
              </div>
            </div>
          </div>
        </section>`,
        styles: {
          backgroundColor: "#FFFFFF",
          textColor: "#374151",
          layout: "left",
        },
        interactive: true,
        animations: ["slideIn", "stagger"],
      },
      {
        id: "features",
        type: "features",
        title: "特性展示",
        content: `<section class="features">
          <div class="container">
            <h2>核心特性</h2>
            <div class="features-grid">
              <div class="feature-item">
                <div class="feature-icon">🚀</div>
                <h3>高效性能</h3>
                <p>${topic}具有出色的性能表现</p>
              </div>
              <div class="feature-item">
                <div class="feature-icon">🔒</div>
                <h3>安全可靠</h3>
                <p>提供企业级的安全保障</p>
              </div>
              <div class="feature-item">
                <div class="feature-icon">⚡</div>
                <h3>快速响应</h3>
                <p>毫秒级的响应速度</p>
              </div>
              <div class="feature-item">
                <div class="feature-icon">🌐</div>
                <h3>全球覆盖</h3>
                <p>支持全球范围的服务</p>
              </div>
            </div>
          </div>
        </section>`,
        styles: {
          backgroundColor: "#F1F5F9",
          textColor: "#334155",
          layout: "center",
        },
        interactive: true,
        animations: ["fadeInUp", "hover"],
      },
      {
        id: "footer",
        type: "footer",
        title: "页脚",
        content: `<footer class="footer">
          <div class="container">
            <div class="footer-content">
              <div class="footer-section">
                <h4>${topic}</h4>
                <p>探索未来，创造可能</p>
              </div>
              <div class="footer-section">
                <h4>快速链接</h4>
                <ul>
                  <li><a href="#about">关于我们</a></li>
                  <li><a href="#services">服务</a></li>
                  <li><a href="#contact">联系我们</a></li>
                </ul>
              </div>
              <div class="footer-section">
                <h4>联系方式</h4>
                <p>邮箱: info@example.com</p>
                <p>电话: +86 123 4567 8900</p>
              </div>
            </div>
            <div class="footer-bottom">
              <p>&copy; 2024 ${topic}. 保留所有权利。</p>
            </div>
          </div>
        </footer>`,
        styles: {
          backgroundColor: "#1E293B",
          textColor: "#F8FAFC",
          layout: "left",
        },
        interactive: false,
        animations: ["fadeIn"],
      },
    ]
  }

  const generatePreview = (data: WebpageData) => {
    const html = generateHTML(data)
    const css = generateCSS(data)
    const js = generateJS(data)

    const fullHTML = `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.title}</title>
        <style>${css}</style>
      </head>
      <body>
        ${html}
        <script>${js}</script>
      </body>
      </html>
    `

    if (iframeRef.current) {
      const iframe = iframeRef.current
      const doc = iframe.contentDocument || iframe.contentWindow?.document
      if (doc) {
        doc.open()
        doc.write(fullHTML)
        doc.close()
      }
    }
  }

  const generateHTML = (data: WebpageData): string => {
    return data.sections.map((section) => section.content).join("\n")
  }

  const generateCSS = (data: WebpageData): string => {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: ${customizations.fontFamily}, -apple-system, BlinkMacSystemFont, sans-serif;
        line-height: 1.6;
        color: #333;
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 20px;
      }

      /* 导航栏样式 */
      .navbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 2rem;
        background: white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1000;
      }

      .nav-brand {
        font-size: 1.5rem;
        font-weight: bold;
        color: ${customizations.primaryColor};
      }

      .nav-menu {
        display: flex;
        list-style: none;
        gap: 2rem;
      }

      .nav-menu a {
        text-decoration: none;
        color: #333;
        font-weight: 500;
        transition: color 0.3s;
      }

      .nav-menu a:hover {
        color: ${customizations.primaryColor};
      }

      /* 主标题区域样式 */
      .hero {
        display: flex;
        align-items: center;
        min-height: 100vh;
        padding: 2rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .hero-content {
        flex: 1;
        max-width: 600px;
      }

      .hero-title {
        font-size: 3rem;
        font-weight: bold;
        margin-bottom: 1rem;
        animation: slideUp 1s ease-out;
      }

      .hero-subtitle {
        font-size: 1.2rem;
        margin-bottom: 2rem;
        opacity: 0.9;
        animation: slideUp 1s ease-out 0.2s both;
      }

      .hero-actions {
        display: flex;
        gap: 1rem;
        animation: slideUp 1s ease-out 0.4s both;
      }

      .btn {
        padding: 12px 24px;
        border: none;
        border-radius: ${customizations.borderRadius};
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
        text-decoration: none;
        display: inline-block;
      }

      .btn-primary {
        background: ${customizations.primaryColor};
        color: white;
      }

      .btn-primary:hover {
        background: #2563eb;
        transform: translateY(-2px);
      }

      .btn-secondary {
        background: transparent;
        color: white;
        border: 2px solid white;
      }

      .btn-secondary:hover {
        background: white;
        color: ${customizations.primaryColor};
      }

      .hero-visual {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .hero-image {
        width: 400px;
        height: 300px;
        background: rgba(255,255,255,0.1);
        border-radius: 20px;
        backdrop-filter: blur(10px);
        animation: float 3s ease-in-out infinite;
      }

      /* 内容区域样式 */
      .content {
        padding: 4rem 0;
        background: white;
      }

      .content h2 {
        font-size: 2.5rem;
        text-align: center;
        margin-bottom: 3rem;
        color: #1e293b;
      }

      .content p {
        font-size: 1.1rem;
        text-align: center;
        max-width: 800px;
        margin: 0 auto 3rem;
        color: #64748b;
      }

      .content-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
        margin-top: 3rem;
      }

      .content-card {
        padding: 2rem;
        background: #f8fafc;
        border-radius: ${customizations.borderRadius};
        text-align: center;
        transition: transform 0.3s, box-shadow 0.3s;
      }

      .content-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      }

      .content-card h3 {
        font-size: 1.5rem;
        margin-bottom: 1rem;
        color: ${customizations.primaryColor};
      }

      /* 特性区域样式 */
      .features {
        padding: 4rem 0;
        background: #f1f5f9;
      }

      .features h2 {
        font-size: 2.5rem;
        text-align: center;
        margin-bottom: 3rem;
        color: #1e293b;
      }

      .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 2rem;
      }

      .feature-item {
        text-align: center;
        padding: 2rem;
        background: white;
        border-radius: ${customizations.borderRadius};
        transition: transform 0.3s, box-shadow 0.3s;
      }

      .feature-item:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 40px rgba(0,0,0,0.1);
      }

      .feature-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
      }

      .feature-item h3 {
        font-size: 1.3rem;
        margin-bottom: 1rem;
        color: #1e293b;
      }

      .feature-item p {
        color: #64748b;
      }

      /* 页脚样式 */
      .footer {
        background: #1e293b;
        color: #f8fafc;
        padding: 3rem 0 1rem;
      }

      .footer-content {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 2rem;
        margin-bottom: 2rem;
      }

      .footer-section h4 {
        font-size: 1.2rem;
        margin-bottom: 1rem;
        color: ${customizations.primaryColor};
      }

      .footer-section ul {
        list-style: none;
      }

      .footer-section ul li {
        margin-bottom: 0.5rem;
      }

      .footer-section a {
        color: #cbd5e1;
        text-decoration: none;
        transition: color 0.3s;
      }

      .footer-section a:hover {
        color: ${customizations.primaryColor};
      }

      .footer-bottom {
        text-align: center;
        padding-top: 2rem;
        border-top: 1px solid #334155;
        color: #94a3b8;
      }

      /* 动画 */
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(-30px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
      }

      /* 响应式设计 */
      @media (max-width: 768px) {
        .hero {
          flex-direction: column;
          text-align: center;
          padding: 1rem;
        }

        .hero-title {
          font-size: 2rem;
        }

        .hero-actions {
          flex-direction: column;
          align-items: center;
        }

        .nav-menu {
          display: none;
        }

        .content-grid,
        .features-grid {
          grid-template-columns: 1fr;
        }

        .footer-content {
          grid-template-columns: 1fr;
          text-align: center;
        }
      }
    `
  }

  const generateJS = (data: WebpageData): string => {
    return `
      // 平滑滚动
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
          e.preventDefault();
          const target = document.querySelector(this.getAttribute('href'));
          if (target) {
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        });
      });

      // 滚动动画
      const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 0.6s ease-out forwards';
          }
        });
      }, observerOptions);

      // 观察所有需要动画的元素
      document.querySelectorAll('.content-card, .feature-item').forEach(el => {
        el.style.opacity = '0';
        observer.observe(el);
      });

      // 按钮交互
      document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('mouseenter', function() {
          this.style.transform = 'translateY(-2px)';
        });
        
        btn.addEventListener('mouseleave', function() {
          this.style.transform = 'translateY(0)';
        });
      });

      // 导航栏滚动效果
      window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 100) {
          navbar.style.background = 'rgba(255, 255, 255, 0.95)';
          navbar.style.backdropFilter = 'blur(10px)';
        } else {
          navbar.style.background = 'white';
          navbar.style.backdropFilter = 'none';
        }
      });

      console.log('${data.title} 已加载完成');
    `
  }

  const handleDownload = () => {
    if (!webpageData) return

    const html = generateHTML(webpageData)
    const css = generateCSS(webpageData)
    const js = generateJS(webpageData)

    const fullHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${webpageData.title}</title>
  <style>${css}</style>
</head>
<body>
  ${html}
  <script>${js}</script>
</body>
</html>`

    const blob = new Blob([fullHTML], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${query}_webpage.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: webpageData?.title,
          text: webpageData?.description,
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        alert("链接已复制到剪贴板")
      }
    } catch (error) {
      console.error("分享失败:", error)
    }
  }

  const handleRegenerateSection = (sectionId: string) => {
    if (!webpageData) return

    setIsGenerating(true)
    setTimeout(() => {
      const updatedSections = webpageData.sections.map((section) =>
        section.id === sectionId ? { ...section, content: section.content + " [已更新]" } : section,
      )

      const updatedData = {
        ...webpageData,
        sections: updatedSections,
        metadata: {
          ...webpageData.metadata,
          lastModified: Date.now(),
        },
      }

      setWebpageData(updatedData)
      generatePreview(updatedData)
      setIsGenerating(false)
    }, 1000)
  }

  const getPreviewWidth = () => {
    switch (previewMode) {
      case "mobile":
        return "375px"
      case "tablet":
        return "768px"
      default:
        return "100%"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg mb-2">{isGenerating ? "AI正在生成互动网页..." : "加载中..."}</p>
          <p className="text-gray-500 text-sm">创建响应式布局和交互功能</p>
        </div>
      </div>
    )
  }

  if (!webpageData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">生成网页失败</p>
          <Button onClick={() => router.back()}>返回</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部工具栏 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-5 h-5 mr-2" />
                返回
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{webpageData.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>版本 {webpageData.metadata.version}</span>
                  <Badge variant="outline" className="bg-green-100 text-green-700">
                    SEO {webpageData.metadata.performance.seoScore}分
                  </Badge>
                  <Badge variant="outline" className="bg-blue-100 text-blue-700">
                    可访问性 {webpageData.metadata.performance.accessibilityScore}分
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* 设备预览切换 */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <Button
                  variant={previewMode === "desktop" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPreviewMode("desktop")}
                >
                  <Monitor className="w-4 h-4" />
                </Button>
                <Button
                  variant={previewMode === "tablet" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPreviewMode("tablet")}
                >
                  <Tablet className="w-4 h-4" />
                </Button>
                <Button
                  variant={previewMode === "mobile" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPreviewMode("mobile")}
                >
                  <Smartphone className="w-4 h-4" />
                </Button>
              </div>

              <Button variant="ghost" size="sm" onClick={handleDownload}>
                <Download className="w-5 h-5" />
              </Button>

              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 主预览区域 */}
          <div className="lg:col-span-3">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <TabsList>
                      <TabsTrigger value="preview">预览</TabsTrigger>
                      <TabsTrigger value="code">代码</TabsTrigger>
                      <TabsTrigger value="settings">设置</TabsTrigger>
                    </TabsList>

                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Zap className="w-4 h-4" />
                      <span>加载时间: {webpageData.metadata.performance.loadTime}s</span>
                    </div>
                  </div>

                  <TabsContent value="preview" className="p-0">
                    <div className="bg-gray-100 p-4">
                      <div
                        className="mx-auto bg-white rounded-lg shadow-lg overflow-hidden"
                        style={{ width: getPreviewWidth(), minHeight: "600px" }}
                      >
                        <iframe
                          ref={iframeRef}
                          className="w-full h-full min-h-[600px]"
                          title="网页预览"
                          sandbox="allow-scripts allow-same-origin"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="code" className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <Code className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold">生成的代码</h3>
                      </div>

                      <Tabs defaultValue="html">
                        <TabsList>
                          <TabsTrigger value="html">HTML</TabsTrigger>
                          <TabsTrigger value="css">CSS</TabsTrigger>
                          <TabsTrigger value="js">JavaScript</TabsTrigger>
                        </TabsList>

                        <TabsContent value="html">
                          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96">
                            <pre className="text-sm">
                              <code>{generateHTML(webpageData)}</code>
                            </pre>
                          </div>
                        </TabsContent>

                        <TabsContent value="css">
                          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96">
                            <pre className="text-sm">
                              <code>{generateCSS(webpageData)}</code>
                            </pre>
                          </div>
                        </TabsContent>

                        <TabsContent value="js">
                          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96">
                            <pre className="text-sm">
                              <code>{generateJS(webpageData)}</code>
                            </pre>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </TabsContent>

                  <TabsContent value="settings" className="p-4">
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-semibold mb-4 flex items-center">
                          <Palette className="w-5 h-5 mr-2" />
                          主题定制
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">主色调</label>
                            <Input
                              type="color"
                              value={customizations.primaryColor}
                              onChange={(e) =>
                                setCustomizations((prev) => ({
                                  ...prev,
                                  primaryColor: e.target.value,
                                }))
                              }
                              className="h-10"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">辅助色</label>
                            <Input
                              type="color"
                              value={customizations.secondaryColor}
                              onChange={(e) =>
                                setCustomizations((prev) => ({
                                  ...prev,
                                  secondaryColor: e.target.value,
                                }))
                              }
                              className="h-10"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">字体</label>
                            <select
                              value={customizations.fontFamily}
                              onChange={(e) =>
                                setCustomizations((prev) => ({
                                  ...prev,
                                  fontFamily: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                              <option value="Inter">Inter</option>
                              <option value="Roboto">Roboto</option>
                              <option value="Open Sans">Open Sans</option>
                              <option value="Lato">Lato</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">圆角大小</label>
                            <select
                              value={customizations.borderRadius}
                              onChange={(e) =>
                                setCustomizations((prev) => ({
                                  ...prev,
                                  borderRadius: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                              <option value="4px">小 (4px)</option>
                              <option value="8px">中 (8px)</option>
                              <option value="12px">大 (12px)</option>
                              <option value="20px">超大 (20px)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-4 flex items-center">
                          <Settings className="w-5 h-5 mr-2" />
                          功能设置
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="interactive"
                              checked={isInteractive}
                              onChange={(e) => setIsInteractive(e.target.checked)}
                              className="rounded"
                            />
                            <label htmlFor="interactive" className="text-sm text-gray-700">
                              启用交互功能
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="animations"
                              checked={showAnimations}
                              onChange={(e) => setShowAnimations(e.target.checked)}
                              className="rounded"
                            />
                            <label htmlFor="animations" className="text-sm text-gray-700">
                              显示动画效果
                            </label>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => webpageData && generatePreview(webpageData)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        应用更改
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* 右侧面板 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 页面结构 */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Layout className="w-5 h-5 mr-2 text-blue-600" />
                  页面结构
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {webpageData.sections.map((section) => (
                  <div key={section.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{section.title}</h4>
                      <p className="text-sm text-gray-600">{section.type}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {section.interactive && (
                        <Badge variant="outline" className="bg-green-100 text-green-700">
                          <Zap className="w-3 h-3 mr-1" />
                          交互
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRegenerateSection(section.id)}
                        disabled={isGenerating}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 性能指标 */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  性能指标
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">加载时间</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{
                          width: `${Math.min((2 - webpageData.metadata.performance.loadTime) * 50, 100)}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{webpageData.metadata.performance.loadTime}s</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">SEO评分</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${webpageData.metadata.performance.seoScore}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{webpageData.metadata.performance.seoScore}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">可访问性</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500"
                        style={{ width: `${webpageData.metadata.performance.accessibilityScore}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{webpageData.metadata.performance.accessibilityScore}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 快速操作 */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">快速操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => router.push(`/generate/mindmap?query=${encodeURIComponent(query)}`)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  生成思维导图
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => router.push(`/generate/poster?query=${encodeURIComponent(query)}`)}
                >
                  <Palette className="w-4 h-4 mr-2" />
                  生成知识海报
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => router.push(`/community/share?content=${encodeURIComponent(webpageData.title)}`)}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  分享到社区
                </Button>
              </CardContent>
            </Card>

            {/* 元数据 */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">元数据</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">创建时间:</span>
                  <span className="font-medium">{new Date(webpageData.metadata.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">最后修改:</span>
                  <span className="font-medium">{new Date(webpageData.metadata.lastModified).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">版本:</span>
                  <span className="font-medium">{webpageData.metadata.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">响应式:</span>
                  <span className="font-medium">
                    {webpageData.responsive ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
