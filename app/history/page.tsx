"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Search, Filter, Calendar, Clock, Star, Hand, Mic } from "lucide-react"
import { gestureUtils, voiceUtils } from "@/lib/utils"

interface HistoryItem {
  id: string
  type: "search" | "generate" | "chat" | "learn"
  title: string
  content: string
  timestamp: Date
  isFavorite: boolean
  tags: string[]
  duration?: number
  resultCount?: number
}

interface FilterState {
  type: "all" | "search" | "generate" | "chat" | "learn"
  timeRange: "all" | "today" | "week" | "month"
  onlyFavorites: boolean
}

export default function HistoryPage() {
  const router = useRouter()
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<HistoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterState, setFilterState] = useState<FilterState>({
    type: "all",
    timeRange: "all",
    onlyFavorites: false,
  })
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isListening, setIsListening] = useState(false)
  const [gestureMode, setGestureMode] = useState<"idle" | "swipe" | "select">("idle")

  const containerRef = useRef<HTMLDivElement>(null)

  // 初始化历史数据
  useEffect(() => {
    const mockHistory: HistoryItem[] = [
      {
        id: "1",
        type: "search",
        title: "人工智能发展趋势",
        content: "搜索了关于AI技术发展的最新趋势和应用场景",
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30分钟前
        isFavorite: true,
        tags: ["AI", "技术", "趋势"],
        duration: 180,
        resultCount: 25,
      },
      {
        id: "2",
        type: "generate",
        title: "机器学习思维导图",
        content: "生成了机器学习概念的思维导图，包含监督学习、无监督学习等",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2小时前
        isFavorite: false,
        tags: ["机器学习", "思维导图", "教育"],
        duration: 120,
      },
      {
        id: "3",
        type: "chat",
        title: "与AI助手讨论编程",
        content: "讨论了Python编程最佳实践和代码优化技巧",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5小时前
        isFavorite: true,
        tags: ["编程", "Python", "优化"],
        duration: 300,
      },
      {
        id: "4",
        type: "learn",
        title: "深度学习学习路径",
        content: "创建了从基础到高级的深度学习学习计划",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1天前
        isFavorite: false,
        tags: ["深度学习", "学习路径", "计划"],
        duration: 240,
      },
      {
        id: "5",
        type: "generate",
        title: "技术分享PPT",
        content: "制作了关于区块链技术的演示文稿",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2天前
        isFavorite: true,
        tags: ["区块链", "PPT", "分享"],
        duration: 150,
      },
    ]

    setHistoryItems(mockHistory)
  }, [])

  // 过滤历史记录
  useEffect(() => {
    let filtered = historyItems

    // 按类型过滤
    if (filterState.type !== "all") {
      filtered = filtered.filter((item) => item.type === filterState.type)
    }

    // 按时间范围过滤
    const now = new Date()
    switch (filterState.timeRange) {
      case "today":
        filtered = filtered.filter((item) => {
          const itemDate = new Date(item.timestamp)
          return itemDate.toDateString() === now.toDateString()
        })
        break
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        filtered = filtered.filter((item) => item.timestamp >= weekAgo)
        break
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        filtered = filtered.filter((item) => item.timestamp >= monthAgo)
        break
    }

    // 按收藏过滤
    if (filterState.onlyFavorites) {
      filtered = filtered.filter((item) => item.isFavorite)
    }

    // 按搜索查询过滤
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    // 按时间排序
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    setFilteredItems(filtered)
  }, [historyItems, filterState, searchQuery])

  // 手势控制
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let startX = 0,
      startY = 0
    let isPointerDown = false

    const handlePointerDown = (e: PointerEvent) => {
      isPointerDown = true
      startX = e.clientX
      startY = e.clientY
      setGestureMode("swipe")
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return

      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY

      if (Math.abs(deltaX) > 100) {
        if (deltaX > 0) {
          // 右滑返回
          router.back()
          isPointerDown = false
        } else if (deltaX < 0 && Math.abs(deltaX) > 150) {
          // 左滑进入选择模式
          setGestureMode("select")
          isPointerDown = false
        }
      }

      if (Math.abs(deltaY) > 100) {
        if (deltaY > 0) {
          // 下滑刷新
          window.location.reload()
        } else {
          // 上滑搜索
          document.querySelector("input")?.focus()
        }
        isPointerDown = false
      }
    }

    const handlePointerUp = () => {
      isPointerDown = false
      setTimeout(() => setGestureMode("idle"), 300)
    }

    container.addEventListener("pointerdown", handlePointerDown)
    container.addEventListener("pointermove", handlePointerMove)
    container.addEventListener("pointerup", handlePointerUp)

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown)
      container.removeEventListener("pointermove", handlePointerMove)
      container.removeEventListener("pointerup", handlePointerUp)
    }
  }, [router])

  // 语音搜索
  const startVoiceSearch = () => {
    const recognition = voiceUtils.initSpeechRecognition(
      (transcript) => {
        setSearchQuery(transcript)
      },
      () => setIsListening(true),
      () => setIsListening(false),
    )

    recognition?.start()
  }

  // 切换收藏状态
  const toggleFavorite = (id: string) => {
    setHistoryItems((prev) => prev.map((item) => (item.id === id ? { ...item, isFavorite: !item.isFavorite } : item)))
    gestureUtils.hapticFeedback(100)
  }

  // 删除历史记录
  const deleteItems = (ids: string[]) => {
    setHistoryItems((prev) => prev.filter((item) => !ids.includes(item.id)))
    setSelectedItems(new Set())
    gestureUtils.hapticFeedback([100, 100])
  }

  // 获取类型图标
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "search":
        return <Search className="w-4 h-4" />
      case "generate":
        return <Star className="w-4 h-4" />
      case "chat":
        return <Mic className="w-4 h-4" />
      case "learn":
        return <Calendar className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  // 获取类型颜色
  const getTypeColor = (type: string) => {
    switch (type) {
      case "search":
        return "text-blue-400 bg-blue-500/20"
      case "generate":
        return "text-green-400 bg-green-500/20"
      case "chat":
        return "text-purple-400 bg-purple-500/20"
      case "learn":
        return "text-orange-400 bg-orange-500/20"
      default:
        return "text-gray-400 bg-gray-500/20"
    }
  }

  // 格式化时间
  const formatTime = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return timestamp.toLocaleDateString()
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 顶部工具栏 */}
      <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">历史记录</h1>
            <span className="text-sm text-gray-400">{filteredItems.length} 条记录</span>
          </div>

          <div className="flex items-center space-x-2">
            {selectedItems.size > 0 && (
              <button
                onClick={() => deleteItems(Array.from(selectedItems))}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-lg text-red-400 text-sm transition-colors"
              >
                删除 ({selectedItems.size})
              </button>
            )}
          </div>
        </div>

        {/* 搜索栏 */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索历史记录..."
              className="w-full px-4 py-2 pl-10 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />

            {isListening && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="flex space-x-1">
                  <div className="w-1 h-3 bg-red-400 rounded-full animate-voice-wave" />
                  <div
                    className="w-1 h-3 bg-red-400 rounded-full animate-voice-wave"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-1 h-3 bg-red-400 rounded-full animate-voice-wave"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={startVoiceSearch}
            className={`p-2 rounded-lg transition-colors ${
              isListening
                ? "bg-red-500/20 border border-red-400/30 text-red-400"
                : "bg-white/10 hover:bg-white/20 border border-white/20 text-white"
            }`}
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>

        {/* 过滤器 */}
        <div className="flex items-center space-x-4 mt-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">过滤:</span>
          </div>

          <select
            value={filterState.type}
            onChange={(e) => setFilterState((prev) => ({ ...prev, type: e.target.value as any }))}
            className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="all">全部类型</option>
            <option value="search">搜索</option>
            <option value="generate">生成</option>
            <option value="chat">对话</option>
            <option value="learn">学习</option>
          </select>

          <select
            value={filterState.timeRange}
            onChange={(e) => setFilterState((prev) => ({ ...prev, timeRange: e.target.value as any }))}
            className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="all">全部时间</option>
            <option value="today">今天</option>
            <option value="week">本周</option>
            <option value="month">本月</option>
          </select>

          <button
            onClick={() => setFilterState((prev) => ({ ...prev, onlyFavorites: !prev.onlyFavorites }))}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              filterState.onlyFavorites
                ? "bg-yellow-500/20 border border-yellow-400/30 text-yellow-400"
                : "bg-white/10 border border-white/20 text-white hover:bg-white/20"
            }`}
          >
            <Star className="w-4 h-4 inline mr-1" />
            收藏
          </button>
        </div>
      </div>

      {/* 历史记录列表 */}
      <div className="px-6 py-6">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">暂无历史记录</h3>
            <p className="text-gray-400">开始使用AI助手来创建你的第一条记录吧</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 transition-all duration-300 hover:bg-white/15 hover:scale-102 ${
                  selectedItems.has(item.id) ? "ring-2 ring-purple-400" : ""
                }`}
                onClick={() => {
                  if (gestureMode === "select") {
                    const newSelected = new Set(selectedItems)
                    if (newSelected.has(item.id)) {
                      newSelected.delete(item.id)
                    } else {
                      newSelected.add(item.id)
                    }
                    setSelectedItems(newSelected)
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>{getTypeIcon(item.type)}</div>
                      <h3 className="text-lg font-medium text-white">{item.title}</h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(item.id)
                        }}
                        className={`p-1 rounded-full transition-colors ${
                          item.isFavorite
                            ? "text-yellow-400 hover:text-yellow-300"
                            : "text-gray-400 hover:text-yellow-400"
                        }`}
                      >
                        <Star className={`w-4 h-4 ${item.isFavorite ? "fill-current" : ""}`} />
                      </button>
                    </div>

                    <p className="text-gray-300 mb-3 leading-relaxed">{item.content}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(item.timestamp)}</span>
                        </span>
                        {item.duration && (
                          <span>
                            用时 {Math.floor(item.duration / 60)}分{item.duration % 60}秒
                          </span>
                        )}
                        {item.resultCount && <span>{item.resultCount} 个结果</span>}
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {item.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-white/10 rounded-full text-xs text-gray-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 状态指示器 */}
      <div className="fixed bottom-8 right-8 flex flex-col space-y-2">
        {isListening && (
          <div className="bg-red-500/20 backdrop-blur-sm rounded-full p-3 border border-red-400/30">
            <Mic className="w-5 h-5 text-red-400 animate-pulse" />
          </div>
        )}
        {gestureMode !== "idle" && (
          <div className="bg-blue-500/20 backdrop-blur-sm rounded-full p-3 border border-blue-400/30">
            <Hand className="w-5 h-5 text-blue-400" />
          </div>
        )}
      </div>

      {/* 交互提示 */}
      <div className="fixed bottom-8 left-8 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 p-4">
        <div className="text-white text-sm space-y-1">
          <p>👆 右滑: 返回上页</p>
          <p>👈 左滑: 选择模式</p>
          <p>🗣️ 语音: 搜索历史</p>
          <p>⭐ 点击星星: 收藏/取消</p>
        </div>
      </div>
    </div>
  )
}
