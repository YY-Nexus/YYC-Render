"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Send, Mic, MicOff, Bot, User, Brain, Eye, Hand } from "lucide-react"
import { gestureUtils, voiceUtils, aiUtils } from "@/lib/utils"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
  context?: {
    intent: string
    confidence: number
    suggestions: string[]
  }
}

interface ConversationState {
  isListening: boolean
  isThinking: boolean
  gestureMode: "idle" | "swipe" | "tap" | "hold"
  eyeTracking: boolean
  currentTopic: string
}

export default function AIAssistantPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "assistant",
      content:
        "你好！我是YYC³ AI助手。你可以通过语音、手势或文字与我交流。我会记住我们的对话上下文，为你提供更智能的帮助。",
      timestamp: new Date(),
      context: {
        intent: "greeting",
        confidence: 1.0,
        suggestions: ["开始对话", "语音交流", "手势控制"],
      },
    },
  ])

  const [inputText, setInputText] = useState("")
  const [conversationState, setConversationState] = useState<ConversationState>({
    isListening: false,
    isThinking: false,
    gestureMode: "idle",
    eyeTracking: false,
    currentTopic: "",
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // 手势控制
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let startX = 0,
      startY = 0,
      startTime = 0
    let isPointerDown = false

    const handlePointerDown = (e: PointerEvent) => {
      isPointerDown = true
      startX = e.clientX
      startY = e.clientY
      startTime = Date.now()
      setConversationState((prev) => ({ ...prev, gestureMode: "tap" }))
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return

      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY
      const distance = gestureUtils.calculateDistance(startX, startY, e.clientX, e.clientY)

      if (distance > 50) {
        const gestureType = gestureUtils.getGestureType(deltaX, deltaY)
        setConversationState((prev) => ({ ...prev, gestureMode: "swipe" }))

        if (gestureType === "swipe-right" && Math.abs(deltaX) > 150) {
          // 右滑返回
          router.back()
          isPointerDown = false
        } else if (gestureType === "swipe-up" && Math.abs(deltaY) > 150) {
          // 上滑清空对话
          clearConversation()
          isPointerDown = false
        } else if (gestureType === "swipe-down" && Math.abs(deltaY) > 150) {
          // 下滑开始语音
          startVoiceInput()
          isPointerDown = false
        }
      }
    }

    const handlePointerUp = (e: PointerEvent) => {
      const holdTime = Date.now() - startTime

      if (holdTime > 1000 && !conversationState.isListening) {
        // 长按开始语音输入
        setConversationState((prev) => ({ ...prev, gestureMode: "hold" }))
        startVoiceInput()
      }

      isPointerDown = false
      setTimeout(() => {
        setConversationState((prev) => ({ ...prev, gestureMode: "idle" }))
      }, 300)
    }

    container.addEventListener("pointerdown", handlePointerDown)
    container.addEventListener("pointermove", handlePointerMove)
    container.addEventListener("pointerup", handlePointerUp)

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown)
      container.removeEventListener("pointermove", handlePointerMove)
      container.removeEventListener("pointerup", handlePointerUp)
    }
  }, [conversationState.isListening, router])

  // 语音输入
  const startVoiceInput = () => {
    if (conversationState.isListening) return

    const recognition = voiceUtils.initSpeechRecognition(
      (transcript) => {
        if (transcript.trim()) {
          sendMessage(transcript)
        }
      },
      () => setConversationState((prev) => ({ ...prev, isListening: true })),
      () => setConversationState((prev) => ({ ...prev, isListening: false })),
    )

    recognition?.start()
  }

  // 发送消息
  const sendMessage = async (content: string) => {
    if (!content.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: content.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputText("")
    setConversationState((prev) => ({ ...prev, isThinking: true }))

    // 分析用户意图
    const analysis = aiUtils.analyzeIntent(content)

    // 模拟AI思考和回复
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: "assistant",
      content: generateAIResponse(content, analysis),
      timestamp: new Date(),
      context: analysis,
    }

    setMessages((prev) => [...prev, assistantMessage])
    setConversationState((prev) => ({
      ...prev,
      isThinking: false,
      currentTopic: analysis.intent,
    }))

    // 语音回复
    voiceUtils.speak(assistantMessage.content)
    gestureUtils.hapticFeedback([100, 50, 100])
  }

  // 生成AI回复
  const generateAIResponse = (userInput: string, analysis: any): string => {
    const responses = {
      search: [
        `我理解你想要搜索"${userInput}"。让我为你提供相关信息和深度分析。`,
        `关于"${userInput}"，我可以帮你从多个角度进行探索和分析。`,
        `我会为你搜索"${userInput}"的相关内容，并提供智能化的结果整理。`,
      ],
      generate: [
        `我可以帮你生成关于"${userInput}"的创意内容。你希望生成思维导图、PPT还是海报？`,
        `基于"${userInput}"，我能为你创建多种形式的内容，包括可视化图表和演示文稿。`,
        `让我为"${userInput}"生成一些创意方案，你可以选择最适合的形式。`,
      ],
      learn: [
        `我来为你制定"${userInput}"的学习路径。我会根据你的水平和目标定制个性化的学习计划。`,
        `关于"${userInput}"的学习，我可以提供系统性的教程和实践指导。`,
        `让我帮你构建"${userInput}"的知识体系，从基础到进阶的完整学习方案。`,
      ],
      analyze: [
        `我将对"${userInput}"进行深度分析，包括趋势预测和数据洞察。`,
        `让我从多个维度分析"${userInput}"，为你提供全面的解读和建议。`,
        `我会运用AI能力对"${userInput}"进行智能分析，发现其中的关键信息。`,
      ],
    }

    const intentResponses = responses[analysis.intent as keyof typeof responses] || responses.search
    const randomResponse = intentResponses[Math.floor(Math.random() * intentResponses.length)]

    return randomResponse
  }

  // 清空对话
  const clearConversation = () => {
    setMessages([
      {
        id: "welcome",
        type: "assistant",
        content: "对话已清空。我们可以开始新的交流！",
        timestamp: new Date(),
        context: {
          intent: "reset",
          confidence: 1.0,
          suggestions: ["新话题", "继续对话", "功能介绍"],
        },
      },
    ])
    gestureUtils.hapticFeedback([100, 100, 100])
  }

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputText)
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col"
    >
      {/* 顶部工具栏 */}
      <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Bot className="w-8 h-8 text-purple-400" />
                {conversationState.isThinking && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full animate-pulse" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">AI助手</h1>
                <p className="text-sm text-gray-400">
                  {conversationState.isThinking
                    ? "正在思考..."
                    : conversationState.isListening
                      ? "正在聆听..."
                      : conversationState.currentTopic
                        ? `当前话题: ${conversationState.currentTopic}`
                        : "准备就绪"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={clearConversation}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
            >
              清空对话
            </button>
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-4 ${
              message.type === "user" ? "flex-row-reverse space-x-reverse" : ""
            }`}
          >
            {/* 头像 */}
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                message.type === "user"
                  ? "bg-blue-500/20 border border-blue-400/30"
                  : "bg-purple-500/20 border border-purple-400/30"
              }`}
            >
              {message.type === "user" ? (
                <User className="w-5 h-5 text-blue-400" />
              ) : (
                <Bot className="w-5 h-5 text-purple-400" />
              )}
            </div>

            {/* 消息内容 */}
            <div className={`flex-1 max-w-3xl ${message.type === "user" ? "text-right" : ""}`}>
              <div
                className={`inline-block p-4 rounded-2xl ${
                  message.type === "user"
                    ? "bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 text-white"
                    : "bg-white/10 backdrop-blur-sm border border-white/20 text-white"
                }`}
              >
                <p className="leading-relaxed">{message.content}</p>

                {/* 上下文信息 */}
                {message.context && message.type === "assistant" && (
                  <div className="mt-3 pt-3 border-t border-white/20">
                    <div className="flex items-center space-x-2 text-xs text-gray-300 mb-2">
                      <Brain className="w-3 h-3" />
                      <span>意图: {message.context.intent}</span>
                      <span>置信度: {Math.round(message.context.confidence * 100)}%</span>
                    </div>

                    {message.context.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {message.context.suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => sendMessage(suggestion)}
                            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-xs text-white transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-2 text-xs text-gray-400">{message.timestamp.toLocaleTimeString()}</div>
            </div>
          </div>
        ))}

        {/* AI思考指示器 */}
        {conversationState.isThinking && (
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
              <Bot className="w-5 h-5 text-purple-400 animate-pulse" />
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div
                    className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
                <span className="text-gray-300 text-sm">AI正在思考...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="bg-black/20 backdrop-blur-xl border-t border-white/10 px-6 py-4">
        <form onSubmit={handleSubmit} className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="输入消息或使用语音、手势交流..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              disabled={conversationState.isListening || conversationState.isThinking}
            />

            {conversationState.isListening && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="flex space-x-1">
                  <div className="w-1 h-4 bg-red-400 rounded-full animate-voice-wave" />
                  <div
                    className="w-1 h-4 bg-red-400 rounded-full animate-voice-wave"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-1 h-4 bg-red-400 rounded-full animate-voice-wave"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={startVoiceInput}
            disabled={conversationState.isListening || conversationState.isThinking}
            className={`p-3 rounded-full transition-colors ${
              conversationState.isListening
                ? "bg-red-500/20 border border-red-400/30 text-red-400"
                : "bg-white/10 hover:bg-white/20 border border-white/20 text-white"
            }`}
          >
            {conversationState.isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            type="submit"
            disabled={!inputText.trim() || conversationState.isThinking}
            className="p-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full transition-colors"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </form>
      </div>

      {/* 状态指示器 */}
      <div className="fixed bottom-24 right-8 flex flex-col space-y-2">
        {conversationState.isListening && (
          <div className="bg-red-500/20 backdrop-blur-sm rounded-full p-3 border border-red-400/30">
            <Mic className="w-5 h-5 text-red-400 animate-pulse" />
          </div>
        )}
        {conversationState.gestureMode !== "idle" && (
          <div className="bg-blue-500/20 backdrop-blur-sm rounded-full p-3 border border-blue-400/30">
            <Hand className="w-5 h-5 text-blue-400" />
          </div>
        )}
        {conversationState.eyeTracking && (
          <div className="bg-green-500/20 backdrop-blur-sm rounded-full p-3 border border-green-400/30">
            <Eye className="w-5 h-5 text-green-400" />
          </div>
        )}
      </div>

      {/* 交互提示 */}
      <div className="fixed bottom-24 left-8 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 p-4">
        <div className="text-white text-sm space-y-1">
          <p>🗣️ 语音: 点击麦克风或长按屏幕</p>
          <p>👆 手势: 右滑返回，上滑清空，下滑语音</p>
          <p>💬 文字: 直接输入或点击建议</p>
          <p>🧠 智能: AI会记住对话上下文</p>
        </div>
      </div>
    </div>
  )
}
