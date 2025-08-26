"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Heart,
  Search,
  Filter,
  MoreVertical,
  Trash2,
  Edit3,
  Download,
  Upload,
  Star,
  MessageSquare,
  Globe,
  ImageIcon,
  FileText,
  Brain,
  Calendar,
  Tag,
  StickyNote,
} from "lucide-react"
import { FavoritesManager, type FavoriteItem } from "@/lib/favorites"

export default function FavoritesPage() {
  const router = useRouter()
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [filteredFavorites, setFilteredFavorites] = useState<FavoriteItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title" | "rating">("newest")
  const [selectedFavorite, setSelectedFavorite] = useState<string | null>(null)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteText, setNoteText] = useState("")

  const loadFavorites = () => {
    const allFavorites = FavoritesManager.getFavorites()
    setFavorites(allFavorites)
    applyFilters(allFavorites, searchQuery, selectedType, selectedCategory, sortBy)
  }

  const applyFilters = (favs: FavoriteItem[], query: string, type: string, category: string, sort: string) => {
    let filtered = [...favs]

    // 搜索过滤
    if (query.trim()) {
      const lowerQuery = query.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(lowerQuery) ||
          item.content.toLowerCase().includes(lowerQuery) ||
          item.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)),
      )
    }

    // 类型过滤
    if (type !== "all") {
      filtered = filtered.filter((item) => item.type === type)
    }

    // 分类过滤
    if (category !== "all") {
      filtered = filtered.filter((item) => item.category === category)
    }

    // 排序
    filtered.sort((a, b) => {
      switch (sort) {
        case "oldest":
          return a.timestamp - b.timestamp
        case "title":
          return a.title.localeCompare(b.title)
        case "rating":
          return (b.metadata?.rating || 0) - (a.metadata?.rating || 0)
        default: // newest
          return b.timestamp - a.timestamp
      }
    })

    setFilteredFavorites(filtered)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    applyFilters(favorites, query, selectedType, selectedCategory, sortBy)
  }

  const handleTypeFilter = (type: string) => {
    setSelectedType(type)
    applyFilters(favorites, searchQuery, type, selectedCategory, sortBy)
  }

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category)
    applyFilters(favorites, searchQuery, selectedType, category, sortBy)
  }

  const handleSort = (sort: "newest" | "oldest" | "title" | "rating") => {
    setSortBy(sort)
    applyFilters(favorites, searchQuery, selectedType, selectedCategory, sort)
  }

  const handleRemoveFavorite = (id: string) => {
    if (confirm("确定要从收藏中移除这个项目吗？")) {
      FavoritesManager.removeFromFavorites(id)
      loadFavorites()
    }
  }

  const handleAddNote = (id: string) => {
    const favorite = favorites.find((f) => f.id === id)
    if (favorite) {
      setEditingNote(id)
      setNoteText(favorite.metadata?.notes || "")
    }
  }

  const handleSaveNote = () => {
    if (editingNote) {
      FavoritesManager.addNoteToFavorite(editingNote, noteText)
      setEditingNote(null)
      setNoteText("")
      loadFavorites()
    }
  }

  const handleRating = (id: string, rating: number) => {
    FavoritesManager.rateFavorite(id, rating)
    loadFavorites()
  }

  const handleExport = () => {
    const exportData = FavoritesManager.exportFavorites()
    const blob = new Blob([exportData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `favorites-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        if (FavoritesManager.importFavorites(content)) {
          alert("收藏导入成功！")
          loadFavorites()
        } else {
          alert("导入失败，请检查文件格式。")
        }
      }
      reader.readAsText(file)
    }
  }

  const getTypeIcon = (type: FavoriteItem["type"]) => {
    switch (type) {
      case "search":
        return <Search className="w-4 h-4" />
      case "conversation":
        return <MessageSquare className="w-4 h-4" />
      case "webpage":
        return <Globe className="w-4 h-4" />
      case "poster":
        return <ImageIcon className="w-4 h-4" />
      case "ppt":
        return <FileText className="w-4 h-4" />
      case "mindmap":
        return <Brain className="w-4 h-4" />
      default:
        return <Heart className="w-4 h-4" />
    }
  }

  const getTypeLabel = (type: FavoriteItem["type"]) => {
    const labels = {
      search: "搜索",
      result: "结果",
      conversation: "对话",
      webpage: "网页",
      poster: "海报",
      ppt: "PPT",
      mindmap: "思维导图",
    }
    return labels[type] || type
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

  const getUniqueTypes = () => {
    const types = new Set(favorites.map((f) => f.type))
    return Array.from(types)
  }

  const getUniqueCategories = () => {
    const categories = new Set(favorites.map((f) => f.category).filter(Boolean))
    return Array.from(categories) as string[]
  }

  useEffect(() => {
    loadFavorites()
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
            <Heart className="w-5 h-5 text-red-500" />
            我的收藏
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">共 {favorites.length} 个收藏</span>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              导出
            </button>
            <label className="px-3 py-1 bg-green-600 text-white rounded text-sm flex items-center gap-1 cursor-pointer">
              <Upload className="w-4 h-4" />
              导入
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* 搜索和过滤栏 */}
        <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
          <div className="flex flex-col gap-4">
            {/* 搜索栏 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="搜索收藏内容..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* 过滤器 */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">类型:</span>
                <select
                  value={selectedType}
                  onChange={(e) => handleTypeFilter(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="all">全部</option>
                  {getUniqueTypes().map((type) => (
                    <option key={type} value={type}>
                      {getTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">分类:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryFilter(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="all">全部</option>
                  {getUniqueCategories().map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">排序:</span>
                <select
                  value={sortBy}
                  onChange={(e) => handleSort(e.target.value as any)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="newest">最新</option>
                  <option value="oldest">最旧</option>
                  <option value="title">标题</option>
                  <option value="rating">评分</option>
                </select>
              </div>
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
            <p className="text-gray-500 mb-4">
              {favorites.length === 0 ? "开始收藏您感兴趣的内容吧" : "尝试调整搜索或过滤条件"}
            </p>
            {favorites.length === 0 && (
              <button
                onClick={() => router.push("/")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                开始搜索
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredFavorites.map((favorite) => (
              <div key={favorite.id} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeIcon(favorite.type)}
                      <span className="text-sm text-blue-600 font-medium">{getTypeLabel(favorite.type)}</span>
                      {favorite.category && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-gray-600">{favorite.category}</span>
                        </>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">{favorite.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{favorite.content}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatTime(favorite.timestamp)}</span>
                      </div>
                      {favorite.metadata?.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span>{favorite.metadata.rating}/5</span>
                        </div>
                      )}
                      {favorite.tags && favorite.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Tag className="w-4 h-4" />
                          <div className="flex gap-1">
                            {favorite.tags.slice(0, 2).map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 笔记显示 */}
                    {favorite.metadata?.notes && (
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-3">
                        <div className="flex items-start gap-2">
                          <StickyNote className="w-4 h-4 text-yellow-600 mt-0.5" />
                          <p className="text-sm text-yellow-800">{favorite.metadata.notes}</p>
                        </div>
                      </div>
                    )}

                    {/* 编辑笔记 */}
                    {editingNote === favorite.id && (
                      <div className="mb-3">
                        <textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="添加笔记..."
                          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-blue-500"
                          rows={3}
                        />
                        <div className="flex gap-2 mt-2">
                          <button onClick={handleSaveNote} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                            保存
                          </button>
                          <button
                            onClick={() => setEditingNote(null)}
                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 评分 */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">评分:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleRating(favorite.id, star)}
                            className={`w-4 h-4 ${
                              star <= (favorite.metadata?.rating || 0) ? "text-yellow-500" : "text-gray-300"
                            } hover:text-yellow-400`}
                          >
                            <Star className="w-full h-full fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="relative ml-4">
                    <button
                      onClick={() => setSelectedFavorite(selectedFavorite === favorite.id ? null : favorite.id)}
                      className="p-2 hover:bg-gray-100 rounded"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {selectedFavorite === favorite.id && (
                      <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                        <button
                          onClick={() => {
                            handleAddNote(favorite.id)
                            setSelectedFavorite(null)
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Edit3 className="w-4 h-4" />
                          {favorite.metadata?.notes ? "编辑笔记" : "添加笔记"}
                        </button>
                        <button
                          onClick={() => {
                            handleRemoveFavorite(favorite.id)
                            setSelectedFavorite(null)
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 text-red-600 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          移除收藏
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
      {selectedFavorite && <div className="fixed inset-0 z-5" onClick={() => setSelectedFavorite(null)} />}

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
