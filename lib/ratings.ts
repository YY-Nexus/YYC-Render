export interface RatingItem {
  id: string
  itemId: string
  itemType: "search" | "result" | "conversation" | "mindmap" | "webpage" | "poster" | "ppt"
  rating: number
  comment?: string
  timestamp: number
  userId?: string
  helpful?: boolean
  tags?: string[]
}

export class RatingsManager {
  private static readonly STORAGE_KEY = "ai-search-ratings"
  private static readonly MAX_RATINGS = 500

  static getRatings(): RatingItem[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  static addRating(
    itemId: string,
    itemType: RatingItem["itemType"],
    rating: number,
    comment?: string,
    tags?: string[],
  ): RatingItem {
    const newRating: RatingItem = {
      id: Date.now().toString(),
      itemId,
      itemType,
      rating: Math.max(1, Math.min(5, rating)),
      comment,
      timestamp: Date.now(),
      tags,
    }

    const ratings = this.getRatings()

    // 检查是否已存在对该项目的评分
    const existingIndex = ratings.findIndex((r) => r.itemId === itemId && r.itemType === itemType)

    if (existingIndex !== -1) {
      // 更新现有评分
      ratings[existingIndex] = { ...ratings[existingIndex], ...newRating, id: ratings[existingIndex].id }
    } else {
      // 添加新评分
      ratings.unshift(newRating)
    }

    // 限制评分数量
    if (ratings.length > this.MAX_RATINGS) {
      ratings.splice(this.MAX_RATINGS)
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(ratings))
    return newRating
  }

  static getRating(itemId: string, itemType: RatingItem["itemType"]): RatingItem | null {
    const ratings = this.getRatings()
    return ratings.find((r) => r.itemId === itemId && r.itemType === itemType) || null
  }

  static removeRating(id: string): void {
    const ratings = this.getRatings()
    const filtered = ratings.filter((item) => item.id !== id)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered))
  }

  static getRatingsByType(itemType: RatingItem["itemType"]): RatingItem[] {
    const ratings = this.getRatings()
    return ratings.filter((r) => r.itemType === itemType)
  }

  static getAverageRating(itemId: string, itemType: RatingItem["itemType"]): number {
    const rating = this.getRating(itemId, itemType)
    return rating ? rating.rating : 0
  }

  static updateRating(id: string, updates: Partial<RatingItem>): void {
    const ratings = this.getRatings()
    const index = ratings.findIndex((item) => item.id === id)

    if (index !== -1) {
      ratings[index] = { ...ratings[index], ...updates }
      if (updates.rating) {
        ratings[index].rating = Math.max(1, Math.min(5, updates.rating))
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(ratings))
    }
  }

  static markAsHelpful(id: string, helpful: boolean): void {
    this.updateRating(id, { helpful })
  }

  static searchRatings(query: string): RatingItem[] {
    const ratings = this.getRatings()
    const lowerQuery = query.toLowerCase()

    return ratings.filter(
      (item) =>
        item.comment?.toLowerCase().includes(lowerQuery) ||
        item.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)),
    )
  }

  static getTopRatedItems(itemType?: RatingItem["itemType"], limit = 10): RatingItem[] {
    let ratings = this.getRatings()

    if (itemType) {
      ratings = ratings.filter((r) => r.itemType === itemType)
    }

    return ratings.sort((a, b) => b.rating - a.rating).slice(0, limit)
  }

  static getRecentRatings(limit = 10): RatingItem[] {
    const ratings = this.getRatings()
    return ratings.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit)
  }

  static clearRatings(): void {
    if (typeof window === "undefined") return
    localStorage.removeItem(this.STORAGE_KEY)
  }

  static getStats() {
    const ratings = this.getRatings()
    const now = Date.now()
    const oneDay = 24 * 60 * 60 * 1000
    const oneWeek = 7 * oneDay
    const oneMonth = 30 * oneDay

    const typeStats = new Map<string, number>()
    const ratingDistribution = new Map<number, number>()
    let totalRating = 0

    ratings.forEach((item) => {
      typeStats.set(item.itemType, (typeStats.get(item.itemType) || 0) + 1)
      ratingDistribution.set(item.rating, (ratingDistribution.get(item.rating) || 0) + 1)
      totalRating += item.rating
    })

    return {
      total: ratings.length,
      today: ratings.filter((item) => now - item.timestamp < oneDay).length,
      thisWeek: ratings.filter((item) => now - item.timestamp < oneWeek).length,
      thisMonth: ratings.filter((item) => now - item.timestamp < oneMonth).length,
      averageRating: ratings.length > 0 ? Math.round((totalRating / ratings.length) * 10) / 10 : 0,
      byType: Object.fromEntries(typeStats),
      distribution: Object.fromEntries(ratingDistribution),
      helpfulCount: ratings.filter((item) => item.helpful).length,
      withComments: ratings.filter((item) => item.comment && item.comment.trim()).length,
    }
  }

  static exportRatings(): string {
    const ratings = this.getRatings()
    const exportData = {
      exportDate: new Date().toISOString(),
      totalRatings: ratings.length,
      ratings: ratings.map((item) => ({
        ...item,
        timestamp: new Date(item.timestamp).toISOString(),
      })),
    }

    return JSON.stringify(exportData, null, 2)
  }
}
