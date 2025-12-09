export interface RatingData {
  question: string
  rating: "like" | "dislike"
  timestamp: number
  feedback?: string
}

export class RatingsManager {
  private static readonly STORAGE_KEY = "ai-search-ratings"

  static getRatings(): RatingData[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  static addRating(question: string, rating: "like" | "dislike", feedback?: string): void {
    if (typeof window === "undefined") return

    const ratings = this.getRatings()
    const newRating: RatingData = {
      question: question.trim(),
      rating,
      timestamp: Date.now(),
      feedback,
    }

    // 移除相同问题的旧评价
    const filtered = ratings.filter((item) => item.question.toLowerCase() !== question.toLowerCase().trim())

    filtered.unshift(newRating)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered))
  }

  static getRating(question: string): RatingData | null {
    const ratings = this.getRatings()
    return ratings.find((item) => item.question.toLowerCase() === question.toLowerCase().trim()) || null
  }

  static getStats(): { likes: number; dislikes: number; total: number } {
    const ratings = this.getRatings()
    const likes = ratings.filter((r) => r.rating === "like").length
    const dislikes = ratings.filter((r) => r.rating === "dislike").length
    return { likes, dislikes, total: ratings.length }
  }
}
