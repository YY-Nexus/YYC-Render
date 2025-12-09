export interface SearchHistory {
  id: string
  question: string
  timestamp: number
  summary?: string
}

export class HistoryManager {
  private static readonly STORAGE_KEY = "ai-search-history"
  private static readonly MAX_HISTORY = 50

  static getHistory(): SearchHistory[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  static addHistory(question: string, summary?: string): void {
    if (typeof window === "undefined") return

    const history = this.getHistory()
    const newItem: SearchHistory = {
      id: Date.now().toString(),
      question: question.trim(),
      timestamp: Date.now(),
      summary,
    }

    // 避免重复添加相同问题
    const existingIndex = history.findIndex((item) => item.question.toLowerCase() === question.toLowerCase().trim())

    if (existingIndex !== -1) {
      history.splice(existingIndex, 1)
    }

    // 添加到开头
    history.unshift(newItem)

    // 限制历史记录数量
    if (history.length > this.MAX_HISTORY) {
      history.splice(this.MAX_HISTORY)
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history))
  }

  static removeHistory(id: string): void {
    if (typeof window === "undefined") return

    const history = this.getHistory()
    const filtered = history.filter((item) => item.id !== id)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered))
  }

  static clearHistory(): void {
    if (typeof window === "undefined") return
    localStorage.removeItem(this.STORAGE_KEY)
  }

  static searchHistory(query: string): SearchHistory[] {
    const history = this.getHistory()
    const lowerQuery = query.toLowerCase()
    return history.filter((item) => item.question.toLowerCase().includes(lowerQuery))
  }
}
