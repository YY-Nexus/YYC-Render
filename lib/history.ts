export interface SearchHistory {
  id?: string
  question: string
  answer: string
  timestamp: number
  category: string
  tags: string[]
  rating?: number
  isFavorite?: boolean
  metadata?: {
    responseTime?: number
    source?: string
    confidence?: number
    relatedQuestions?: string[]
  }
}

export interface HistoryStats {
  totalSearches: number
  averageRating: number
  topCategories: Array<{ category: string; count: number }>
  searchTrends: Array<{ date: string; count: number }>
  favoriteCount: number
}

export class HistoryManager {
  private static readonly STORAGE_KEY = "ai-search-history"
  private static readonly MAX_HISTORY_SIZE = 1000

  // 添加搜索记录
  static addToHistory(item: Omit<SearchHistory, "id">): string {
    const history = this.getHistory()
    const id = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const newItem: SearchHistory = {
      ...item,
      id,
      timestamp: item.timestamp || Date.now(),
    }

    // 检查是否已存在相同问题
    const existingIndex = history.findIndex((h) => h.question === item.question)
    if (existingIndex !== -1) {
      // 更新现有记录
      history[existingIndex] = { ...history[existingIndex], ...newItem, id: history[existingIndex].id }
    } else {
      // 添加新记录
      history.unshift(newItem)
    }

    // 限制历史记录数量
    if (history.length > this.MAX_HISTORY_SIZE) {
      history.splice(this.MAX_HISTORY_SIZE)
    }

    this.saveHistory(history)
    return newItem.id!
  }

  // 获取搜索历史
  static getHistory(): SearchHistory[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return []

      const history = JSON.parse(stored) as SearchHistory[]
      return history.sort((a, b) => b.timestamp - a.timestamp)
    } catch (error) {
      console.error("获取搜索历史失败:", error)
      return []
    }
  }

  // 搜索历史记录
  static searchHistory(query: string): SearchHistory[] {
    const history = this.getHistory()
    const lowerQuery = query.toLowerCase()

    return history.filter(
      (item) =>
        item.question.toLowerCase().includes(lowerQuery) ||
        item.answer.toLowerCase().includes(lowerQuery) ||
        item.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
        item.category.toLowerCase().includes(lowerQuery),
    )
  }

  // 按分类获取历史
  static getHistoryByCategory(category: string): SearchHistory[] {
    return this.getHistory().filter((item) => item.category === category)
  }

  // 获取收藏的历史记录
  static getFavoriteHistory(): SearchHistory[] {
    return this.getHistory().filter((item) => item.isFavorite)
  }

  // 更新历史记录
  static updateHistory(id: string, updates: Partial<SearchHistory>): boolean {
    const history = this.getHistory()
    const index = history.findIndex((item) => item.id === id)

    if (index === -1) return false

    history[index] = { ...history[index], ...updates }
    this.saveHistory(history)
    return true
  }

  // 删除历史记录
  static deleteHistory(id: string): boolean {
    const history = this.getHistory()
    const filteredHistory = history.filter((item) => item.id !== id)

    if (filteredHistory.length === history.length) return false

    this.saveHistory(filteredHistory)
    return true
  }

  // 批量删除历史记录
  static deleteMultipleHistory(ids: string[]): number {
    const history = this.getHistory()
    const filteredHistory = history.filter((item) => !ids.includes(item.id!))
    const deletedCount = history.length - filteredHistory.length

    this.saveHistory(filteredHistory)
    return deletedCount
  }

  // 清空所有历史记录
  static clearHistory(): void {
    this.saveHistory([])
  }

  // 切换收藏状态
  static toggleFavorite(id: string): boolean {
    const history = this.getHistory()
    const index = history.findIndex((item) => item.id === id)

    if (index === -1) return false

    history[index].isFavorite = !history[index].isFavorite
    this.saveHistory(history)
    return history[index].isFavorite!
  }

  // 评分历史记录
  static rateHistory(id: string, rating: number): boolean {
    if (rating < 1 || rating > 5) return false

    return this.updateHistory(id, { rating })
  }

  // 获取历史统计信息
  static getHistoryStats(): HistoryStats {
    const history = this.getHistory()

    if (history.length === 0) {
      return {
        totalSearches: 0,
        averageRating: 0,
        topCategories: [],
        searchTrends: [],
        favoriteCount: 0,
      }
    }

    // 计算平均评分
    const ratedItems = history.filter((item) => item.rating)
    const averageRating =
      ratedItems.length > 0 ? ratedItems.reduce((sum, item) => sum + (item.rating || 0), 0) / ratedItems.length : 0

    // 统计分类
    const categoryCount: Record<string, number> = {}
    history.forEach((item) => {
      categoryCount[item.category] = (categoryCount[item.category] || 0) + 1
    })

    const topCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // 搜索趋势（最近7天）
    const searchTrends = this.getSearchTrends(7)

    // 收藏数量
    const favoriteCount = history.filter((item) => item.isFavorite).length

    return {
      totalSearches: history.length,
      averageRating: Math.round(averageRating * 10) / 10,
      topCategories,
      searchTrends,
      favoriteCount,
    }
  }

  // 获取搜索趋势
  static getSearchTrends(days: number): Array<{ date: string; count: number }> {
    const history = this.getHistory()
    const trends: Array<{ date: string; count: number }> = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      const count = history.filter((item) => {
        const itemDate = new Date(item.timestamp).toISOString().split("T")[0]
        return itemDate === dateStr
      }).length

      trends.push({ date: dateStr, count })
    }

    return trends
  }

  // 导出历史记录
  static exportHistory(format: "json" | "csv" = "json"): string {
    const history = this.getHistory()

    if (format === "csv") {
      const headers = ["问题", "答案", "分类", "标签", "时间", "评分", "收藏"]
      const rows = history.map((item) => [
        item.question,
        item.answer,
        item.category,
        item.tags.join(";"),
        new Date(item.timestamp).toLocaleString(),
        item.rating || "",
        item.isFavorite ? "是" : "否",
      ])

      return [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n")
    }

    return JSON.stringify(history, null, 2)
  }

  // 导入历史记录
  static importHistory(data: string, format: "json" | "csv" = "json"): number {
    try {
      let importedHistory: SearchHistory[] = []

      if (format === "json") {
        importedHistory = JSON.parse(data)
      } else {
        // CSV导入逻辑
        const lines = data.split("\n")
        const headers = lines[0].split(",").map((h) => h.replace(/"/g, ""))

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map((v) => v.replace(/"/g, ""))
          if (values.length >= 7) {
            importedHistory.push({
              id: `imported_${Date.now()}_${i}`,
              question: values[0],
              answer: values[1],
              category: values[2],
              tags: values[3].split(";").filter(Boolean),
              timestamp: new Date(values[4]).getTime(),
              rating: values[5] ? Number(values[5]) : undefined,
              isFavorite: values[6] === "是",
            })
          }
        }
      }

      // 验证数据格式
      const validHistory = importedHistory.filter((item) => item.question && item.answer && item.timestamp)

      if (validHistory.length === 0) {
        throw new Error("没有找到有效的历史记录")
      }

      // 合并到现有历史
      const existingHistory = this.getHistory()
      const mergedHistory = [...validHistory, ...existingHistory]

      // 去重（基于问题内容）
      const uniqueHistory = mergedHistory.filter(
        (item, index, arr) => arr.findIndex((h) => h.question === item.question) === index,
      )

      this.saveHistory(uniqueHistory.slice(0, this.MAX_HISTORY_SIZE))
      return validHistory.length
    } catch (error) {
      console.error("导入历史记录失败:", error)
      throw new Error("导入失败：数据格式不正确")
    }
  }

  // 获取相关搜索建议
  static getRelatedSearches(query: string, limit = 5): string[] {
    const history = this.getHistory()
    const lowerQuery = query.toLowerCase()

    // 基于历史记录生成相关搜索
    const relatedQuestions = new Set<string>()

    history.forEach((item) => {
      // 如果问题包含查询词，添加相关问题
      if (item.question.toLowerCase().includes(lowerQuery)) {
        item.metadata?.relatedQuestions?.forEach((q) => relatedQuestions.add(q))
      }

      // 基于标签匹配
      const queryWords = lowerQuery.split(" ")
      const hasMatchingTag = item.tags.some((tag) => queryWords.some((word) => tag.toLowerCase().includes(word)))

      if (hasMatchingTag && item.question !== query) {
        relatedQuestions.add(item.question)
      }
    })

    return Array.from(relatedQuestions).slice(0, limit)
  }

  // 获取热门搜索
  static getPopularSearches(limit = 10): Array<{ question: string; count: number }> {
    const history = this.getHistory()
    const questionCount: Record<string, number> = {}

    history.forEach((item) => {
      questionCount[item.question] = (questionCount[item.question] || 0) + 1
    })

    return Object.entries(questionCount)
      .map(([question, count]) => ({ question, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  // 私有方法：保存历史记录
  private static saveHistory(history: SearchHistory[]): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history))
    } catch (error) {
      console.error("保存搜索历史失败:", error)

      // 如果存储空间不足，删除最旧的记录
      if (error instanceof Error && error.name === "QuotaExceededError") {
        const reducedHistory = history.slice(0, Math.floor(this.MAX_HISTORY_SIZE / 2))
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reducedHistory))
        } catch (retryError) {
          console.error("重试保存历史记录失败:", retryError)
        }
      }
    }
  }

  // 数据迁移和版本管理
  static migrateData(): void {
    const version = localStorage.getItem("ai-search-history-version")

    if (!version || version < "1.0") {
      // 执行数据迁移逻辑
      const oldHistory = this.getHistory()
      const migratedHistory = oldHistory.map((item) => ({
        ...item,
        id: item.id || `migrated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: item.metadata || {},
      }))

      this.saveHistory(migratedHistory)
      localStorage.setItem("ai-search-history-version", "1.0")
    }
  }

  // 清理过期数据
  static cleanupOldData(daysToKeep = 90): number {
    const history = this.getHistory()
    const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000

    const filteredHistory = history.filter((item) => item.timestamp > cutoffTime || item.isFavorite)

    const removedCount = history.length - filteredHistory.length

    if (removedCount > 0) {
      this.saveHistory(filteredHistory)
    }

    return removedCount
  }
}
