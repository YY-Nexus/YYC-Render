"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  ArrowLeft,
  Send,
  MoreVertical,
  Bookmark,
  Share2,
  Download,
  GitBranch,
  Clock,
  Settings,
  Trash2,
  Copy,
} from "lucide-react"
import { ConversationManager, type Conversation, type Message } from "@/lib/conversation"

export default function ConversationPage() {
  const router = useRouter()
  const params = useParams()
  const conversationId = params.id as string
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [relatedConversations, setRelatedConversations] = useState<Conversation[]>([])
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null)

  useEffect(() => {
    if (conversationId) {
      const conv = ConversationManager.getConversation(conversationId)
      setConversation(conv)

      if (conv) {
        const related = ConversationManager.getRelatedConversations(conversationId)
        setRelatedConversations(related)
      }
    }
  }, [conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [conversation?.messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation || isLoading) return

    const userMessage = newMessage.trim()
    setNewMessage("")
    setIsLoading(true)

    // 添加用户消息
    ConversationManager.addMessage(conversationId, {
      role: "user",
      content: userMessage,
    })

    // 模拟AI响应
    setTimeout(() => {
      const responses = [
        "这是一个很好的问题。让我来详细解释一下...",
        "根据您的描述，我建议您可以考虑以下几个方面...",
        "这个话题确实很有趣，从多个角度来看...",
        "基于我的理解，这里有几个关键点需要注意...",
        "让我为您分析一下这个问题的核心要素...",
      ]

      const randomResponse = responses[Math.floor(Math.random() * responses.length)]

      ConversationManager.addMessage(conversationId, {
        role: "assistant",
        content: randomResponse,
        metadata: {
          model: "gpt-4",
          tokens: 150,
          temperature: 0.7,
        },
      })

      const updatedConv = ConversationManager.getConversation(conversationId)
      setConversation(updatedConv)
      setIsLoading(false)
    }, 1500)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleBookmark = () => {
    if (!conversation) return

    const conversations = ConversationManager.getConversations()
    const updated = conversations.map((conv) =>
      conv.id === conversationId
        ? { ...conv, metadata: { ...conv.metadata, isBookmarked: !conv.metadata.isBookmarked } }
        : conv,
    )

    localStorage.setItem("ai-search-conversations", JSON.stringify(updated))
    setConversation((prev) =>
      prev
        ? {
            ...prev,
            metadata: { ...prev.metadata, isBookmarked: !prev.metadata.isBookmarked },
          }
        : null,
    )
  }

  const handleExport = () => {
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

  const handleCreateBranch = (messageId: string) => {
    if (!conversation) return

    const branchTitle = `分支 - ${new Date().toLocaleString()}`
    ConversationManager.createBranch(conversationId, messageId, branchTitle)

    // 可以导航到新分支或显示成功消息
    alert("分支创建成功！")
  }

  const handleDeleteConversation = () => {
    if (!conversation) return

    if (confirm("确定要删除这个对话吗？此操作不可撤销。")) {
      ConversationManager.deleteConversation(conversationId)
      router.push("/conversations")
    }
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

  const renderMessage = (message: Message) => {
    const isUser = message.role === "user"
    const isSelected = selectedMessage === message.id

    return (
      <div
        key={message.id}
        className={`flex gap-3 p-4 ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"} transition-colors`}
        onClick={() => setSelectedMessage(isSelected ? null : message.id)}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
            isUser ? "bg-blue-600" : "bg-green-600"
          }`}
        >
          {isUser ? "你" : "AI"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">{isUser ? "你" : "AI助手"}</span>
            <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
            {message.metadata?.model && (
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{message.metadata.model}</span>
            )}
          </div>

          <div className="prose prose-sm max-w-none text-gray-700">{message.content}</div>

          {isSelected && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigator.clipboard.writeText(message.content)
                }}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                复制
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleCreateBranch(message.id)
                }}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <GitBranch className="w-3 h-3" />
                创建分支
              </button>
              {message.metadata?.tokens && (
                <span className="text-xs text-gray-400">{message.metadata.tokens} tokens</span>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载对话中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 主对话区域 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部导航栏 */}
        <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-medium text-gray-900">{conversation.title}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>{formatTime(conversation.updatedAt)}</span>
                <span>•</span>
                <span>{conversation.metadata.totalMessages} 条消息</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBookmark}
              className={`p-2 rounded-lg ${
                conversation.metadata.isBookmarked ? "bg-yellow-100 text-yellow-600" : "hover:bg-gray-100"
              }`}
            >
              <Bookmark className="w-5 h-5" />
            </button>
            <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 hover:bg-gray-100 rounded-lg">
              <Settings className="w-5 h-5" />
            </button>
            <div className="relative">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {conversation.messages.map(renderMessage)}

            {isLoading && (
              <div className="flex gap-3 p-4">
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-medium">
                  AI
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-900">AI助手</span>
                    <span className="text-xs text-gray-500">正在思考...</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 输入区域 */}
        <div className="bg-white border-t p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入您的消息..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-blue-500"
                  rows={1}
                  style={{ minHeight: "48px", maxHeight: "120px" }}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                发送
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧边栏 */}
      {showSidebar && (
        <div className="w-80 bg-white border-l overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* 对话信息 */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">对话信息</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">创建时间:</span>
                  <span>{new Date(conversation.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">消息数量:</span>
                  <span>{conversation.metadata.totalMessages}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">总Token:</span>
                  <span>{conversation.metadata.totalTokens}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">主题领域:</span>
                  <span>{conversation.context.domain}</span>
                </div>
              </div>
            </div>

            {/* 标签 */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">标签</h3>
              <div className="flex flex-wrap gap-2">
                {conversation.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* 关键词 */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">关键词</h3>
              <div className="flex flex-wrap gap-2">
                {conversation.context.keywords.slice(0, 10).map((keyword, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* 相关对话 */}
            {relatedConversations.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">相关对话</h3>
                <div className="space-y-2">
                  {relatedConversations.map((relatedConv) => (
                    <button
                      key={relatedConv.id}
                      onClick={() => router.push(`/conversation/${relatedConv.id}`)}
                      className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="font-medium text-sm text-gray-900 mb-1">{relatedConv.title}</div>
                      <div className="text-xs text-gray-500">
                        {formatTime(relatedConv.updatedAt)} • {relatedConv.metadata.totalMessages} 条消息
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="space-y-2">
              <button
                onClick={handleExport}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <Download className="w-4 h-4" />
                导出对话
              </button>
              <button
                onClick={() => {
                  /* 实现分享功能 */
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <Share2 className="w-4 h-4" />
                分享对话
              </button>
              <button
                onClick={handleDeleteConversation}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
                删除对话
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
