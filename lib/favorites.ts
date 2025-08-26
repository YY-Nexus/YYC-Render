export interface FavoriteItem {
  id: string
  type: "search" | "result" | "conversation" | "mindmap" | "webpage" | "poster" | "ppt"
  title: string
  content: string
  url?: string
  timestamp: number
  tags?: string[]
  category?: string
  metadata?: {
    query?: string
    rating?: number
    notes?: string
    sourceId?: string
  }
}

export class FavoritesManager {
  private static readonly STORAGE_KEY = "ai-search-favorites"
  private static readonly MAX_FAVORITES = 200

  static getFavorites(): FavoriteItem[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  static addToFavorites(item: Omit<FavoriteItem, "id" | "timestamp">): FavoriteItem {
    const newFavorite: FavoriteItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: Date.now(),
    }

    const favorites = this.getFavorites()

    // 检查是否已存在相同内容
    const existingIndex = favorites.findIndex((fav) => fav.type === item.type && fav.content === item.content)

    if (existingIndex !== -1) {
      // 更新现有收藏的时间戳
      favorites[existingIndex].timestamp = Date.now()
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites))
      return favorites[existingIndex]
    }

    // 添加新收藏到开头
    favorites.unshift(newFavorite)

    // 限制收藏数量
    if (favorites.length > this.MAX_FAVORITES) {
      favorites.splice(this.MAX_FAVORITES)
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites))
    return newFavorite
  }

  static removeFromFavorites(id: string): void {
    const favorites = this.getFavorites()
    const filtered = favorites.filter((item) => item.id !== id)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered))
  }

  static isFavorite(content: string, type: FavoriteItem["type"]): boolean {
    const favorites = this.getFavorites()
    return favorites.some((fav) => fav.content === content && fav.type === type)
  }

  static toggleFavorite(item: Omit<FavoriteItem, "id" | "timestamp">): boolean {
    if (this.isFavorite(item.content, item.type)) {
      const favorites = this.getFavorites()
      const existing = favorites.find((fav) => fav.content === item.content && fav.type === item.type)
      if (existing) {
        this.removeFromFavorites(existing.id)
        return false
      }
    } else {
      this.addToFavorites(item)
      return true
    }
    return false
  }

  static searchFavorites(query: string): FavoriteItem[] {
    const favorites = this.getFavorites()
    const lowerQuery = query.toLowerCase()

    return favorites.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.content.toLowerCase().includes(lowerQuery) ||
        item.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
        item.category?.toLowerCase().includes(lowerQuery),
    )
  }

  static getFavoritesByType(type: FavoriteItem["type"]): FavoriteItem[] {
    const favorites = this.getFavorites()
    return favorites.filter((item) => item.type === type)
  }

  static getFavoritesByCategory(category: string): FavoriteItem[] {
    const favorites = this.getFavorites()
    return favorites.filter((item) => item.category === category)
  }

  static updateFavorite(id: string, updates: Partial<FavoriteItem>): void {
    const favorites = this.getFavorites()
    const index = favorites.findIndex((item) => item.id === id)

    if (index !== -1) {
      favorites[index] = { ...favorites[index], ...updates }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites))
    }
  }

  static addNoteToFavorite(id: string, note: string): void {
    this.updateFavorite(id, {
      metadata: {
        ...this.getFavorites().find((f) => f.id === id)?.metadata,
        notes: note,
      },
    })
  }

  static rateFavorite(id: string, rating: number): void {
    this.updateFavorite(id, {
      metadata: {
        ...this.getFavorites().find((f) => f.id === id)?.metadata,
        rating: Math.max(1, Math.min(5, rating)),
      },
    })
  }

  static clearFavorites(): void {
    if (typeof window === "undefined") return
    localStorage.removeItem(this.STORAGE_KEY)
  }

  static exportFavorites(): string {
    const favorites = this.getFavorites()
    const exportData = {
      exportDate: new Date().toISOString(),
      totalItems: favorites.length,
      favorites: favorites.map((item) => ({
        ...item,
        timestamp: new Date(item.timestamp).toISOString(),
      })),
    }

    return JSON.stringify(exportData, null, 2)
  }

  static importFavorites(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData)
      if (data.favorites && Array.isArray(data.favorites)) {
        const currentFavorites = this.getFavorites()
        const importedFavorites = data.favorites.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp).getTime(),
        }))

        // 合并收藏，避免重复
        const mergedFavorites = [...currentFavorites]
        importedFavorites.forEach((imported: FavoriteItem) => {
          const exists = mergedFavorites.some(
            (existing) => existing.content === imported.content && existing.type === imported.type,
          )
          if (!exists) {
            mergedFavorites.push(imported)
          }
        })

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(mergedFavorites))
        return true
      }
    } catch {
      return false
    }
    return false
  }

  static getStats() {
    const favorites = this.getFavorites()
    const now = Date.now()
    const oneDay = 24 * 60 * 60 * 1000
    const oneWeek = 7 * oneDay
    const oneMonth = 30 * oneDay

    const typeStats = new Map<string, number>()
    const categoryStats = new Map<string, number>()

    favorites.forEach((item) => {
      typeStats.set(item.type, (typeStats.get(item.type) || 0) + 1)
      if (item.category) {
        categoryStats.set(item.category, (categoryStats.get(item.category) || 0) + 1)
      }
    })

    return {
      total: favorites.length,
      today: favorites.filter((item) => now - item.timestamp < oneDay).length,
      thisWeek: favorites.filter((item) => now - item.timestamp < oneWeek).length,
      thisMonth: favorites.filter((item) => now - item.timestamp < oneMonth).length,
      byType: Object.fromEntries(typeStats),
      byCategory: Object.fromEntries(categoryStats),
      averageRating: this.getAverageRating(favorites),
    }
  }

  private static getAverageRating(favorites: FavoriteItem[]): number {
    const ratedItems = favorites.filter((item) => item.metadata?.rating)
    if (ratedItems.length === 0) return 0

    const totalRating = ratedItems.reduce((sum, item) => sum + (item.metadata?.rating || 0), 0)
    return Math.round((totalRating / ratedItems.length) * 10) / 10
  }
}
