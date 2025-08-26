"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Mic,
  Camera,
  Upload,
  Filter,
  Clock,
  Star,
  Share2,
  BookOpen,
  Globe,
  ImageIcon,
  FileText,
  Video,
  ArrowLeft,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

interface SearchResult {
  id: string
  title: string
  description: string
  url: string
  type: "web" | "image" | "video" | "news" | "academic"
  source: string
  timestamp: Date
  relevance: number
  thumbnail?: string
}

interface SearchSuggestion {
  query: string
  type: "trending" | "recent" | "related"
  count?: number
}

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [searchType, setSearchType] = useState<"all" | "web" | "images" | "videos" | "news" | "academic">("all")
  const [filters, setFilters] = useState({
    timeRange: "all",
    language: "all",
    region: "all",
  })
  const [isListening, setIsListening] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const q = searchParams.get("q")
    if (q) {
      setQuery(q)
      handleSearch(q)
    }
    loadSuggestions()
  }, [searchParams])

  const loadSuggestions = () => {
    // 模拟热门搜索建议
    const mockSuggestions: SearchSuggestion[] = [
      { query: "人工智能最新发展", type: "trending", count: 1234 },
      { query: "机器学习算法", type: "trending", count: 987 },
      { query: "深度学习框架", type: "trending", count: 756 },
      { query: "自然语言处理", type: "recent", count: 543 },
      { query: "计算机视觉应用", type: "recent", count: 432 },
      { query: "量子计算原理", type: "related", count: 321 },
    ]
    setSuggestions(mockSuggestions)
  }

  const handleSearch = async (searchQuery?: string) => {
    const finalQuery = searchQuery || query
    if (!finalQuery.trim()) return

    setLoading(true)
    try {
      // 模拟搜索API调用
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockResults: SearchResult[] = [
        {
          id: "1",
          title: `${finalQuery} - 详细解析和应用指南`,
          description: `深入了解${finalQuery}的核心概念、技术原理和实际应用场景。本文提供全面的技术分析和实践指导。`,
          url: "https://example.com/article1",
          type: "web",
          source: "技术博客",
          timestamp: new Date(),
          relevance: 0.95,
          thumbnail: "/interconnected-tech.png",
        },
        {
          id: "2",
          title: `${finalQuery}最新研究进展`,
          description: `2024年${finalQuery}领域的最新研究成果和技术突破，包括学术论文分析和行业趋势预测。`,
          url: "https://example.com/research",
          type: "academic",
          source: "学术期刊",
          timestamp: new Date(Date.now() - 86400000),
          relevance: 0.92,
        },
        {
          id: "3",
          title: `${finalQuery}实战教程`,
          description: `从零开始学习${finalQuery}，包含完整的代码示例、项目实践和常见问题解答。`,
          url: "https://example.com/tutorial",
          type: "web",
          source: "在线教程",
          timestamp: new Date(Date.now() - 172800000),
          relevance: 0.89,
          thumbnail: "/tutorial-concept.png",
        },
        {
          id: "4",
          title: `${finalQuery}行业应用案例`,
          description: `探索${finalQuery}在各个行业的成功应用案例，了解实际部署经验和最佳实践。`,
          url: "https://example.com/cases",
          type: "news",
          source: "行业资讯",
          timestamp: new Date(Date.now() - 259200000),
          relevance: 0.86,
        },
        {
          id: "5",
          title: `${finalQuery}开源项目推荐`,
          description: `精选优质的${finalQuery}开源项目，包括项目介绍、技术特点和使用指南。`,
          url: "https://example.com/opensource",
          type: "web",
          source: "开源社区",
          timestamp: new Date(Date.now() - 345600000),
          relevance: 0.83,
        },
      ]

      setResults(mockResults)
    } catch (error) {
      console.error("搜索失败:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleVoiceSearch = async () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("您的浏览器不支持语音识别功能")
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.lang = "zh-CN"
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setQuery(transcript)
      handleSearch(transcript)
    }

    recognition.onerror = (event: any) => {
      console.error("语音识别错误:", event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setQuery(`分析文件: ${file.name}`)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "web":
        return <Globe className="w-4 h-4 text-blue-500" />
      case "image":
        return <ImageIcon className="w-4 h-4 text-green-500" />
      case "video":
        return <Video className="w-4 h-4 text-red-500" />
      case "news":
        return <FileText className="w-4 h-4 text-purple-500" />
      case "academic":
        return <BookOpen className="w-4 h-4 text-orange-500" />
      default:
        return <Globe className="w-4 h-4 text-gray-500" />
    }
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      web: "网页",
      image: "图片",
      video: "视频",
      news: "新闻",
      academic: "学术",
    }
    return labels[type as keyof typeof labels] || "网页"
  }

  const filteredResults = results.filter((result) => {
    if (searchType === "all") return true
    return result.type === searchType
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶部导航 */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回
              </Button>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-6 h-6 text-blue-600" />
                <span className="font-semibold text-gray-900 dark:text-white">AI搜索</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                筛选
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 搜索框 */}
        <div className="mb-8">
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center p-4">
                <div className="flex-1">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="输入您要搜索的内容..."
                    className="border-0 text-lg bg-transparent focus:ring-0"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearch()
                      }
                    }}
                  />
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleVoiceSearch}
                    disabled={isListening}
                    className={isListening ? "text-red-500 animate-pulse" : ""}
                  >
                    <Mic className="w-5 h-5" />
                  </Button>

                  <Button variant="ghost" size="sm">
                    <Camera className="w-5 h-5" />
                  </Button>

                  <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-5 h-5" />
                  </Button>

                  <Button
                    onClick={() => handleSearch()}
                    disabled={loading || !query.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Search className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>

              {selectedFile && (
                <div className="px-4 pb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <FileText className="w-4 h-4" />
                    <span>已选择文件: {selectedFile.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                      className="text-red-500 hover:text-red-700"
                    >
                      移除
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.md"
            />
          </div>
        </div>

        {/* 搜索建议 */}
        {!loading && results.length === 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">热门搜索</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestions.map((suggestion, index) => (
                <Card
                  key={index}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setQuery(suggestion.query)
                    handleSearch(suggestion.query)
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {suggestion.type === "trending" && <TrendingUp className="w-4 h-4 text-red-500" />}
                        {suggestion.type === "recent" && <Clock className="w-4 h-4 text-blue-500" />}
                        {suggestion.type === "related" && <Star className="w-4 h-4 text-yellow-500" />}
                        <span className="font-medium text-gray-900 dark:text-white">{suggestion.query}</span>
                      </div>
                      {suggestion.count && (
                        <Badge variant="secondary" className="text-xs">
                          {suggestion.count.toLocaleString()}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 搜索结果 */}
        {(loading || results.length > 0) && (
          <div>
            {/* 搜索类型标签 */}
            <Tabs value={searchType} onValueChange={(value) => setSearchType(value as any)} className="mb-6">
              <TabsList>
                <TabsTrigger value="all">全部</TabsTrigger>
                <TabsTrigger value="web">网页</TabsTrigger>
                <TabsTrigger value="images">图片</TabsTrigger>
                <TabsTrigger value="videos">视频</TabsTrigger>
                <TabsTrigger value="news">新闻</TabsTrigger>
                <TabsTrigger value="academic">学术</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* 搜索结果统计 */}
            {!loading && results.length > 0 && (
              <div className="mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  找到约 {filteredResults.length.toLocaleString()} 个结果 (用时 0.42 秒)
                </p>
              </div>
            )}

            {/* 加载状态 */}
            {loading && (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex space-x-4">
                        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* 搜索结果列表 */}
            {!loading && filteredResults.length > 0 && (
              <div className="space-y-4">
                {filteredResults.map((result) => (
                  <Card key={result.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex space-x-4">
                        {result.thumbnail && (
                          <div className="w-20 h-20 flex-shrink-0">
                            <img
                              src={result.thumbnail || "/placeholder.svg"}
                              alt={result.title}
                              className="w-full h-full object-cover rounded"
                            />
                          </div>
                        )}

                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {getTypeIcon(result.type)}
                            <Badge variant="outline" className="text-xs">
                              {getTypeLabel(result.type)}
                            </Badge>
                            <span className="text-xs text-gray-500">{result.source}</span>
                            <span className="text-xs text-gray-500">{result.timestamp.toLocaleDateString()}</span>
                          </div>

                          <h3 className="text-lg font-semibold text-blue-600 hover:text-blue-800 cursor-pointer mb-2">
                            {result.title}
                          </h3>

                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                            {result.description}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <span className="text-xs text-green-600">
                                相关度: {Math.round(result.relevance * 100)}%
                              </span>
                              <a
                                href={result.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline"
                              >
                                {result.url}
                              </a>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm">
                                <Star className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Share2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* 无结果状态 */}
            {!loading && filteredResults.length === 0 && results.length > 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    没有找到相关的{getTypeLabel(searchType)}结果
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">尝试切换到其他搜索类型或调整搜索关键词</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
