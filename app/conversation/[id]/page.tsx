"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  ArrowLeft,
  Send,
  MoreVertical,
  Copy,
  Download,
  Trash2,
  Edit3,
  MessageSquare,
  Bot,
  User,
  Clock,
} from "lucide-react"
import { ConversationManager, type ConversationThread, type ConversationMessage } from "@/lib/conversation"

export default function ConversationPage() {
  const router = useRouter()
  const params = useParams()
  const conversationId = params.id as string

  const [conversation, setConversation] = useState<ConversationThread | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [showMenu, setShowMenu] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const loadConversation = () => {
    const conv = ConversationManager.getConversation(conversationId)
    if (conv) {
      setConversation(conv)
      setEditTitle(conv.title)
    } else {
      router.push("/")
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isLoading || !conversation) return

    setIsLoading(true)

    // 添加用户消息
    const userMessage = ConversationManager.addMessage(conversationId, "user", newMessage.trim())

    if (userMessage) {
      // 更新本地状态
      setConversation((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          messages: [...prev.messages, userMessage],
          updatedAt: Date.now(),
        }
      })

      setNewMessage("")

      // 模拟AI响应
      setTimeout(() => {
        const mockResponse = generateMockResponse(newMessage, conversation.messages)
        const assistantMessage = ConversationManager.addMessage(
          conversationId,
          "assistant",
          mockResponse,
          userMessage.id,
          {
            confidence: 0.85,
            processingTime: 1200,
            sources: ["知识库", "在线搜索"],
          },
        )

        if (assistantMessage) {
          setConversation((prev) => {
            if (!prev) return prev
            return {
              ...prev,
              messages: [...prev.messages, assistantMessage],
              updatedAt: Date.now(),
            }
          })
        }

        setIsLoading(false)
      }, 2000)
    }
  }

  const generateMockResponse = (question: string, context: ConversationMessage[]): string => {
    // 简单的上下文感知响应生成
    const lowerQuestion = question.toLowerCase()

    if (lowerQuestion.includes("具体") || lowerQuestion.includes("详细")) {
      return "基于我们之前的讨论，我来为您提供更详细的解释。这个问题涉及多个方面，让我逐一为您分析..."
    }

    if (lowerQuestion.includes("例子") || lowerQuestion.includes("举例")) {
      return "好的，让我为您举几个具体的例子来说明这个概念。比如说..."
    }

    if (lowerQuestion.includes("为什么") || lowerQuestion.includes("原因")) {
      return "这是一个很好的问题。造成这种情况的主要原因包括以下几个方面..."
    }

    if (lowerQuestion.includes("如何") || lowerQuestion.includes("怎么")) {
      return "根据您的情况，我建议您可以采取以下几个步骤来解决这个问题..."
    }

    return "感谢您的追问。基于我们之前的对话，我认为这个问题的关键在于理解其背后的逻辑和原理。让我为您进一步解释..."
  }

  const handleTitleSave = () => {
    if (editTitle.trim() && conversation) {
      ConversationManager.updateConversationTitle(conversationId, editTitle.trim())
      setConversation((prev) => (prev ? { ...prev, title: editTitle.trim() } : prev))
      setIsEditingTitle(false)
    }
  }

  const handleExport = () => {
    const exportData = ConversationManager.exportConversation(conversationId)
    const blob = new Blob([exportData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `conversation-${conversationId}.json`
    a.click()
    URL.revokeObjectURL(url)
    setShowMenu(false)
  }

  const handleDelete = () => {
    if (confirm("确定要删除这个对话吗？此操作无法撤销。")) {
      ConversationManager.deleteConversation(conversationId)
      router.push("/")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))

    if (minutes < 1) return "刚刚"
    if (minutes < 60) return `${minutes}分钟前`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}小时前`
    return date.toLocaleDateString("zh-CN")
  }

  useEffect(() => {
    loadConversation()
  }, [conversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversation?.messages])

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <MessageSquare className="w-5 h-5 text-blue-600" />
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyPress={(e) => e.key === "Enter" && handleTitleSave()}
                className="text-lg font-medium bg-transparent border-b border-blue-500 focus:outline-none"
                autoFocus
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-medium">{conversation.title}</h1>
              <button onClick={() => setIsEditingTitle(true)} className="p-1 hover:bg-gray-100 rounded">
                <Edit3 className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{conversation.messages.length} 条消息</span>
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-gray-100 rounded">
              <MoreVertical className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                <button
                  onClick={handleExport}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  导出对话
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 text-red-600 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  删除对话
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {conversation.messages.map((message, index) => (
            <div key={message.id} className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" && (
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-blue-600" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl px-4 py-3 ${
                  message.role === "user" ? "bg-blue-600 text-white" : "bg-white border shadow-sm"
                }`}
              >
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200/20">
                  <div className="flex items-center gap-2 text-xs opacity-70">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(message.timestamp)}</span>
                    {message.metadata?.confidence && (
                      <span>• 置信度: {Math.round(message.metadata.confidence * 100)}%</span>
                    )}
                  </div>

                  {message.role === "assistant" && (
                    <button
                      onClick={() => navigator.clipboard.writeText(message.content)}
                      className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {message.role === "user" && (
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
              )}
            </div>
          ))}

          {/* 加载指示器 */}
          {isLoading && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
              <div className="bg-white border shadow-sm rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500">AI正在思考...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 输入区域 */}
      <div className="bg-white border-t px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="继续对话..."
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:border-blue-500 max-h-32"
                rows={1}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isLoading}
              className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {/* 快捷操作 */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => setNewMessage("请详细解释一下")}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-600"
            >
              详细解释
            </button>
            <button
              onClick={() => setNewMessage("能举个例子吗？")}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-600"
            >
              举个例子
            </button>
            <button
              onClick={() => setNewMessage("还有其他方法吗？")}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-600"
            >
              其他方法
            </button>
          </div>
        </div>
      </div>

      {/* 点击外部关闭菜单 */}
      {showMenu && <div className="fixed inset-0 z-5" onClick={() => setShowMenu(false)} />}
    </div>
  )
}
