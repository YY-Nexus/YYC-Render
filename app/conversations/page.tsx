"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  MessageSquare,
  Search,
  MoreVertical,
  Trash2,
  Download,
  Clock,
  MessageCircle,
  Plus,
} from "lucide-react"
import { ConversationManager, type ConversationThread } from "@/lib/conversation"

export default function ConversationsPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<ConversationThread[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredConversations, setFilteredConversations] = useState<ConversationThread[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)

  const loadConversations = () => {
    const allConversations = ConversationManager.getConversations()
    setConversations(allConversations)
    applySearch(allConversations, searchQuery)
  }

  const applySearch = (convs: ConversationThread[], query: string) => {
    if (query.trim()) {
      const filtered = ConversationManager.searchConversations(query)
      setFilteredConversations(filtered)
    } else {
      setFilteredConversations(convs)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    applySearch(conversations, query)
  }

  const handleDeleteConversation = (conversationId: string) => {
    if (confirm("确定要删除这个对话吗？此操作无法撤销。")) {
      ConversationManager.deleteConversation(conversationId)
      loadConversations()
    }
  }

  const handleExportConversation = (conversationId: string) => {
    const exportData = ConversationManager.exportConversation(conversationId)
    const blob = new Blob([exportData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `conversation-${conversationId}.json`
    a.click()
    URL.revokeObjectURL(url)
    setSelectedConversation(null)
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return "今天"
    if (days === 1) return "昨天"
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString("zh-CN")
  }

  const getLastMessage = (conversation: ConversationThread) => {
    const lastMessage = conversation.messages[conversation.messages.length - 1]
    if (!lastMessage) return ""

    const content = lastMessage.content
    return content.length > 50 ? content.slice(0, 50) + "..." : content
  }

  useEffect(() => {
    loadConversations()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-medium flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            对话记录
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">共 {conversations.length} 个对话</span>
          <button
            onClick={() => router.push("/")}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            新对话
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* 搜索栏 */}
        <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="搜索对话内容..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* 对话列表 */}
        {filteredConversations.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center shadow-sm">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {conversations.length === 0 ? "还没有对话记录" : "没有找到匹配的对话"}
            </h3>
            <p className="text-gray-500 mb-4">
              {conversations.length === 0 ? "开始您的第一次AI对话吧" : "尝试调整搜索关键词"}
            </p>
            {conversations.length === 0 && (
              <button
                onClick={() => router.push("/")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                开始新对话
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/conversation/${conversation.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">{conversation.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{getLastMessage(conversation)}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(conversation.updatedAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>{conversation.messages.length} 条消息</span>
                      </div>
                      {conversation.tags && conversation.tags.length > 0 && (
                        <div className="flex gap-1">
                          {conversation.tags.slice(0, 2).map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedConversation(selectedConversation === conversation.id ? null : conversation.id)
                      }}
                      className="p-2 hover:bg-gray-100 rounded"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {selectedConversation === conversation.id && (
                      <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleExportConversation(conversation.id)
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          导出对话
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteConversation(conversation.id)
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 text-red-600 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          删除对话
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 点击外部关闭菜单 */}
      {selectedConversation && <div className="fixed inset-0 z-5" onClick={() => setSelectedConversation(null)} />}

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
