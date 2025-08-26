"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  TrendingUp,
  Clock,
  Heart,
  MessageCircle,
  Eye,
  Share2,
  Filter,
  Search,
  Plus,
  Star,
  BookOpen,
  Brain,
  Users,
  Award,
} from "lucide-react"
import { CollaborationManager, type SharedContent } from "@/lib/collaboration"

export default function CommunityPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"trending" | "recent" | "following">("trending")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [sharedContent, setSharedContent] = useState<SharedContent[]>([])
  const [filteredContent, setFilteredContent] = useState<SharedContent[]>([])
  const [showFilters, setShowFilters] = useState(false)

  const loadContent = () => {
    let content: SharedContent[] = []

    switch (activeTab) {
      case "trending":
        content = CollaborationManager.getTrendingContent(20)
        break
      case "recent":
        content = CollaborationManager.getSharedContent().slice(0, 20)
        break
      case "following":
        // 模拟关注的内容
        content = CollaborationManager.getSharedContent().slice(0, 10)
        break
    }

    setSharedContent(content)
    applyFilters(content)
  }

  const applyFilters = (content: SharedContent[]) => {
    let filtered = [...content]

    // 搜索过滤
    if (searchQuery.trim()) {
      filtered = CollaborationManager.searchSharedContent(searchQuery, {
        type: selectedType !== "all" ? (selectedType as any) : undefined,
      })
    } else if (selectedType !== "all") {
      filtered = filtered.filter((c) => c.type === selectedType)
    }

    setFilteredContent(filtered)
  }

  const handleLike = (contentId: string) => {
    CollaborationManager.likeContent(contentId)
    CollaborationManager.viewContent(contentId)
    loadContent()
  }

  const handleView = (contentId: string) => {
    CollaborationManager.viewContent(contentId)
    router.push(`/community/content/${contentId}`)
  }

  const getTypeIcon = (type: SharedContent["type"]) => {
    switch (type) {
      case "question":
        return <MessageCircle className="w-4 h-4" />
      case "answer":
        return <BookOpen className="w-4 h-4" />
      case "mindmap":
        return <Brain className="w-4 h-4" />
      case "learning_path":
        return <Award className="w-4 h-4" />
      default:
        return <Star className="w-4 h-4" />
    }
  }

  const getTypeLabel = (type: SharedContent["type"]) => {
    const labels = {
      question: "问题",
      answer: "回答",
      conversation: "对话",
      mindmap: "思维导图",
      learning_path: "学习路径",
    }
    return labels[type] || type
  }

  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return "刚刚"
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return new Date(timestamp).toLocaleDateString("zh-CN")
  }

  useEffect(() => {
    loadContent()
  }, [activeTab])

  useEffect(() => {
    applyFilters(sharedContent)
  }, [searchQuery, selectedType, sharedContent])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-medium flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            学习社区
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/community/share")}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            分享内容
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* 标签页导航 */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3 md:gap-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab("trending")}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === "trending" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                热门
              </button>
              <button
                onClick={() => setActiveTab("recent")}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === "recent" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Clock className="w-4 h-4" />
                最新
              </button>
              <button
                onClick={() => setActiveTab("following")}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === "following" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Heart className="w-4 h-4" />
                关注
              </button>
            </div>

            <button onClick={() => setShowFilters(!showFilters)} className="p-2 hover:bg-gray-100 rounded-lg">
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {/* 搜索和筛选 */}
          <div className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索社区内容..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              {showFilters && (
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="all">全部类型</option>
                  <option value="question">问题</option>
                  <option value="answer">回答</option>
                  <option value="conversation">对话</option>
                  <option value="mindmap">思维导图</option>
                  <option value="learning_path">学习路径</option>
                </select>
              )}
            </div>
          </div>
        </div>

        {/* 内容列表 */}
        <div className="grid gap-6">
          {filteredContent.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center shadow-sm">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无内容</h3>
              <p className="text-gray-500 mb-4">成为第一个分享内容的人吧！</p>
              <button
                onClick={() => router.push("/community/share")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                分享内容
              </button>
            </div>
          ) : (
            filteredContent.map((content) => (
              <div key={content.id} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  {/* 作者头像 */}
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-medium">{content.authorName.charAt(0)}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* 内容头部 */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">{content.authorName}</span>
                      <span className="text-gray-500">·</span>
                      <span className="text-sm text-gray-500">{formatTime(content.createdAt)}</span>
                      <div
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600`}
                      >
                        {getTypeIcon(content.type)}
                        <span>{getTypeLabel(content.type)}</span>
                      </div>
                    </div>

                    {/* 内容标题和预览 */}
                    <h3
                      className="text-lg font-semibold text-gray-900 mb-2 cursor-pointer hover:text-blue-600"
                      onClick={() => handleView(content.id)}
                    >
                      {content.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">{content.content.slice(0, 200)}...</p>

                    {/* 标签 */}
                    {content.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {content.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 互动统计 */}
                    <div className="flex items-center gap-4 md:gap-6 flex-wrap text-sm text-gray-500">
                      <button
                        onClick={() => handleLike(content.id)}
                        className="flex items-center gap-1 hover:text-red-600 transition-colors"
                      >
                        <Heart className="w-4 h-4" />
                        <span>{content.likes}</span>
                      </button>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>{content.comments.length}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{content.views}</span>
                      </div>
                      <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                        <Share2 className="w-4 h-4" />
                        <span>分享</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 加载更多 */}
        {filteredContent.length > 0 && (
          <div className="text-center mt-8">
            <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              加载更多内容
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
