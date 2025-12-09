"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Heart, Search, Trash2, ThumbsUp, ThumbsDown, Calendar, Tag, Filter, SortAsc } from "lucide-react"
import { FavoritesManager, type FavoriteItem } from "@/lib/favorites"

export default function FavoritesPage() {
  const router = useRouter()
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [filteredFavorites, setFilteredFavorites] = useState<FavoriteItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "rating">("newest")
  const [filterBy, setFilterBy] = useState<"all" | "liked" | "disliked">("all")

  const loadFavorites = () => {
    const allFavorites = FavoritesManager.getFavorites()
    setFavorites(allFavorites)
    applyFiltersAndSort(allFavorites, searchQuery, sortBy, filterBy)
  }

  const applyFiltersAndSort = (items: FavoriteItem[], query: string, sort: string, filter: string) => {
    let filtered = [...items]

    // 搜索过滤
    if (query.trim()) {
      const lowerQuery = query.toLowerCase()
      filtered = filtered.filter(
        (item) => item.question.toLowerCase().includes(lowerQuery) || item.answer.toLowerCase().includes(lowerQuery),
      )
    }

    // 评价过滤
    if (filter !== "all") {
      filtered = filtered.filter((item) => item.rating === (filter.replace("d", "") as "like" | "dislike"))
    }

    // 排序
    filtered.sort((a, b) => {
      switch (sort) {
        case "newest":
          return b.timestamp - a.timestamp
        case "oldest":
          return a.timestamp - b.timestamp
        case "rating":
          if (a.rating === "like" && b.rating !== "like") return -1
          if (b.rating === "like" && a.rating !== "like") return 1
          return b.timestamp - a.timestamp
        default:
          return b.timestamp - a.timestamp
      }
    })

    setFilteredFavorites(filtered)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    applyFiltersAndSort(favorites, query, sortBy, filterBy)
  }

  const handleSort = (sort: "newest" | "oldest" | "rating") => {
    setSortBy(sort)
    applyFiltersAndSort(favorites, searchQuery, sort, filterBy)
  }

  const handleFilter = (filter: "all" | "liked" | "disliked") => {
    setFilterBy(filter)
    applyFiltersAndSort(favorites, searchQuery, sortBy, filter)
  }

  const handleDelete = (id: string) => {
    FavoritesManager.removeFavorite(id)
    loadFavorites()
  }

  const handleQuestionClick = (question: string) => {
    router.push(`/results?q=${encodeURIComponent(question)}`)
  }

  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return "今天"
    if (days === 1) return "昨天"
    if (days < 7) return `${days}天前`
    return new Date(timestamp).toLocaleDateString("zh-CN")
  }

  useEffect(() => {
    loadFavorites()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-blue-700 rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-medium flex items-center gap-2">
            <Heart className="w-5 h-5" />
            我的收藏
          </h1>
        </div>
        <div className="text-sm opacity-80">共 {favorites.length} 个收藏</div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* 搜索和筛选栏 */}
        <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 搜索框 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="搜索收藏的问题或答案..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* 排序选择 */}
            <div className="flex items-center gap-2">
              <SortAsc className="w-4 h-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => handleSort(e.target.value as "newest" | "oldest" | "rating")}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="newest">最新收藏</option>
                <option value="oldest">最早收藏</option>
                <option value="rating">按评价排序</option>
              </select>
            </div>

            {/* 筛选选择 */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterBy}
                onChange={(e) => handleFilter(e.target.value as "all" | "liked" | "disliked")}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="all">全部</option>
                <option value="liked">已点赞</option>
                <option value="disliked">已踩</option>
              </select>
            </div>
          </div>
        </div>

        {/* 收藏列表 */}
        {filteredFavorites.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center shadow-sm">
            <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {favorites.length === 0 ? "还没有收藏内容" : "没有找到匹配的收藏"}
            </h3>
            <p className="text-gray-500">
              {favorites.length === 0 ? "在搜索结果页面点击收藏按钮来保存有价值的内容" : "尝试调整搜索条件或筛选选项"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFavorites.map((item) => (
              <div key={item.id} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <button onClick={() => handleQuestionClick(item.question)} className="flex-1 text-left">
                    <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors mb-2">
                      {item.question}
                    </h3>
                  </button>

                  <div className="flex items-center gap-2 ml-4">
                    {/* 评价显示 */}
                    {item.rating && (
                      <div
                        className={`p-1 rounded ${
                          item.rating === "like" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                        }`}
                      >
                        {item.rating === "like" ? <ThumbsUp className="w-4 h-4" /> : <ThumbsDown className="w-4 h-4" />}
                      </div>
                    )}

                    {/* 删除按钮 */}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 答案预览 */}
                <div className="text-gray-700 leading-relaxed mb-4 line-clamp-3">{item.answer.slice(0, 200)}...</div>

                {/* 底部信息 */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatTime(item.timestamp)}</span>
                    </div>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Tag className="w-4 h-4" />
                        <span>{item.tags.join(", ")}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleQuestionClick(item.question)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    查看详情 →
                  </button>
                </div>
              </div>
            ))}
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
