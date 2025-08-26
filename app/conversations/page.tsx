"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Plus,
  Filter,
  MessageSquare,
  Clock,
  Bookmark,
  MoreVertical,
  Trash2,
  Share2,
  Download,
} from "lucide-react"
import { ConversationManager, type Conversation } from "@/lib/conversation"

export default function ConversationsPage() {
  const router = useRouter()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string>("all")
  const [selectedDomain, setSelectedDomain] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"updated" | "created" | "messages">("updated")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    filterConversations()
  }, [conversations, searchQuery, selectedTag, selectedDomain, sortBy])

  const loadConversations = () => {
    const convs = ConversationManager.getConversations()
    setConversations(convs)
  }

  const filterConversations = () => {
    let filtered = [...conversations]

    // 搜索过滤
    if (searchQuery) {
      filtered = ConversationManager.searchConversations(searchQuery)
    }

    // 标签过滤
    if (selectedTag !== "all") {
      filtered = filtered.filter((conv) => conv.tags.includes(selectedTag))
    }

    // 领域过滤
    if (selectedDomain !== "all") {
      filtered = filtered.filter((conv) => conv.context.domain === selectedDomain)
    }

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "created":
          return b.createdAt - a.createdAt
        case "messages":
          return b.metadata.totalMessages - a.metadata.totalMessages
        default:
          return b.updatedAt - a.updatedAt
      }
    })

    setFilteredConversations(filtered)
  }

  const getAllTags = () => {
    const tags = new Set<string>()
    conversations.forEach((conv) => {
      conv.tags.forEach((tag) => tags.add(tag))
    })
    return Array.from(tags)
  }

  const getAllDomains = () => {
    const domains = new Set<string>()
    conversations.forEach((conv) => {
      domains.add(conv.context.domain)
    })
    return Array.from(domains)
  }

  const handleDeleteConversation = (conversationId: string) => {
    if (confirm("确定要删除这个对话吗？此操作不可撤销。")) {
      ConversationManager.deleteConversation(conversationId)
      loadConversations()
    }
  }

  const handleExportConversation = (conversationId: string) => {
    const conversation = conversations.find((conv) => conv.id === conversationId)
    if (!conversation) return

    const exportData = ConversationManager.exportConversation(conversationId)
    const blob = new Blob([exportData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `conversation-${conversation.title.slice(0, 20)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) return "刚刚"
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    return date.toLocaleDateString()
  }

  const renderConversationCard = (conversation: Conversation) => {
    return (
      <div
        key={conversation.id}
        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => router.push(`/conversation/${conversation.id}`)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate mb-1">{conversation.title}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{formatTime(conversation.updatedAt)}</span>
              <span>•</span>
              <MessageSquare className="w-4 h-4" />
              <span>{conversation.metadata.totalMessages} 条消息</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {conversation.metadata.isBookmarked && <Bookmark className="w-4 h-4 text-yellow-500" />}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  // 显示操作菜单
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 预览最后一条消息 */}
        {conversation.messages.length > 0 && (
          <div className="mb-3">
            <p className="text-sm text-gray-600 line-clamp-2">
              {conversation.messages[conversation.messages.length - 1].content}
            </p>
          </div>
        )}

        {/* 标签和领域 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {conversation.context.domain}
            </span>
            {conversation.tags.slice(0, 2).map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                {tag}
              </span>
            ))}
            {conversation.tags.length > 2 && (
              <span className="text-xs text-gray-500">+{conversation.tags.length - 2}</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleExportConversation(conversation.id)
              }}
              className="p-1 hover:bg-gray-100 rounded text-gray-500"
              title="导出对话"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                // 实现分享功能
              }}
              className="p-1 hover:bg-gray-100 rounded text-gray-500"
              title="分享对话"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteConversation(conversation.id)
              }}
              className="p-1 hover:bg-gray-100 rounded text-red-500"
              title="删除对话"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">对话历史</h1>
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              新建对话
            </button>
          </div>

          {/* 搜索和过滤 */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="搜索对话..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              筛选
            </button>
          </div>

          {/* 筛选器 */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">全部标签</option>
                    {getAllTags().map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">领域</label>
                  <select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">全部领域</option>
                    {getAllDomains().map((domain) => (
                      <option key={domain} value={domain}>
                        {domain}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">排序方式</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="updated">最近更新</option>
                    <option value="created">创建时间</option>
                    <option value="messages">消息数量</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 对话列表 */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? "未找到匹配的对话" : "还没有对话记录"}
            </h3>
            <p className="text-gray-500 mb-4">{searchQuery ? "尝试调整搜索条件" : "开始您的第一次对话吧"}</p>
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              开始对话
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredConversations.map(renderConversationCard)}
          </div>
        )}
      </main>

      {/* 统计信息 */}
      {conversations.length > 0 && (
        <div className="bg-white border-t px-4 py-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                共 {conversations.length} 个对话，显示 {filteredConversations.length} 个
              </span>
              <span>总计 {conversations.reduce((sum, conv) => sum + conv.metadata.totalMessages, 0)} 条消息</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
