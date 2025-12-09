export interface FavoriteItem {
  id: string
  question: string
  answer: string
  timestamp: number
  tags?: string[]
  rating?: "like" | "dislike"
  note?: string
}

export class FavoritesManager {
  private static readonly STORAGE_KEY = "ai-search-favorites"
  private static readonly MAX_FAVORITES = 100

  static getFavorites(): FavoriteItem[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  static addFavorite(question: string, answer: string, rating?: "like" | "dislike"): string {
    if (typeof window === "undefined") return ""

    const favorites = this.getFavorites()
    const newItem: FavoriteItem = {
      id: Date.now().toString(),
      question: question.trim(),
      answer: answer.trim(),
      timestamp: Date.now(),
      rating,
    }

    // 检查是否已存在相同问题的收藏
    const existingIndex = favorites.findIndex((item) => item.question.toLowerCase() === question.toLowerCase().trim())

    if (existingIndex !== -1) {
      // 更新现有收藏
      favorites[existingIndex] = { ...favorites[existingIndex], ...newItem, id: favorites[existingIndex].id }
    } else {
      // 添加新收藏
      favorites.unshift(newItem)
    }

    // 限制收藏数量
    if (favorites.length > this.MAX_FAVORITES) {
      favorites.splice(this.MAX_FAVORITES)
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites))
    return newItem.id
  }

  static removeFavorite(id: string): void {
    if (typeof window === "undefined") return

    const favorites = this.getFavorites()
    const filtered = favorites.filter((item) => item.id !== id)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered))
  }

  static updateFavorite(id: string, updates: Partial<FavoriteItem>): void {
    if (typeof window === "undefined") return

    const favorites = this.getFavorites()
    const index = favorites.findIndex((item) => item.id === id)

    if (index !== -1) {
      favorites[index] = { ...favorites[index], ...updates }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites))
    }
  }

  static isFavorited(question: string): boolean {
    const favorites = this.getFavorites()
    return favorites.some((item) => item.question.toLowerCase() === question.toLowerCase().trim())
  }

  static getFavoriteByQuestion(question: string): FavoriteItem | null {
    const favorites = this.getFavorites()
    return favorites.find((item) => item.question.toLowerCase() === question.toLowerCase().trim()) || null
  }

  static searchFavorites(query: string): FavoriteItem[] {
    const favorites = this.getFavorites()
    const lowerQuery = query.toLowerCase()
    return favorites.filter(
      (item) =>
        item.question.toLowerCase().includes(lowerQuery) ||
        item.answer.toLowerCase().includes(lowerQuery) ||
        item.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)),
    )
  }

  static clearFavorites(): void {
    if (typeof window === "undefined") return
    localStorage.removeItem(this.STORAGE_KEY)
  }
}
