export interface CustomTemplate {
  id: string
  name: string
  description: string
  category: string
  type: "webpage" | "poster" | "ppt"
  content: any
  preview: string
  tags: string[]
  author: string
  isPublic: boolean
  rating: number
  downloads: number
  createdAt: string
  updatedAt: string
}

export interface TemplateCollection {
  id: string
  name: string
  description: string
  templates: string[]
  author: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export class TemplateManager {
  private static readonly TEMPLATES_KEY = "custom-templates"
  private static readonly COLLECTIONS_KEY = "template-collections"
  private static readonly MAX_TEMPLATES = 100
  private static readonly MAX_COLLECTIONS = 20

  // 获取所有自定义模板
  static getCustomTemplates(): CustomTemplate[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.TEMPLATES_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  // 保存自定义模板
  static saveTemplate(template: Omit<CustomTemplate, "id" | "createdAt" | "updatedAt">): CustomTemplate {
    const newTemplate: CustomTemplate = {
      ...template,
      id: Date.now().toString(),
      rating: 0,
      downloads: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (typeof window !== "undefined") {
      try {
        const templates = this.getCustomTemplates()
        templates.unshift(newTemplate)

        // 限制数量
        if (templates.length > this.MAX_TEMPLATES) {
          templates.splice(this.MAX_TEMPLATES)
        }

        localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(templates))
      } catch (error) {
        console.error("保存模板失败:", error)
        throw new Error("保存模板失败")
      }
    }

    return newTemplate
  }

  // 获取单个模板
  static getTemplate(id: string): CustomTemplate | null {
    const templates = this.getCustomTemplates()
    return templates.find((t) => t.id === id) || null
  }

  // 更新模板
  static updateTemplate(id: string, updates: Partial<CustomTemplate>): CustomTemplate | null {
    if (typeof window === "undefined") return null

    try {
      const templates = this.getCustomTemplates()
      const index = templates.findIndex((t) => t.id === id)

      if (index === -1) return null

      templates[index] = {
        ...templates[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      }

      localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(templates))
      return templates[index]
    } catch (error) {
      console.error("更新模板失败:", error)
      return null
    }
  }

  // 删除模板
  static deleteTemplate(id: string): boolean {
    if (typeof window === "undefined") return false

    try {
      const templates = this.getCustomTemplates()
      const filtered = templates.filter((t) => t.id !== id)

      if (filtered.length === templates.length) return false

      localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(filtered))
      return true
    } catch (error) {
      console.error("删除模板失败:", error)
      return false
    }
  }

  // 搜索模板
  static searchTemplates(
    query: string,
    filters?: {
      type?: string
      category?: string
      author?: string
      tags?: string[]
    },
  ): CustomTemplate[] {
    if (!query && !filters) return this.getCustomTemplates()

    const templates = this.getCustomTemplates()
    const lowerQuery = query?.toLowerCase() || ""

    return templates.filter((template) => {
      // 文本搜索
      const textMatch =
        !query ||
        template.name.toLowerCase().includes(lowerQuery) ||
        template.description.toLowerCase().includes(lowerQuery) ||
        template.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))

      // 类型过滤
      const typeMatch = !filters?.type || template.type === filters.type

      // 分类过滤
      const categoryMatch = !filters?.category || template.category === filters.category

      // 作者过滤
      const authorMatch = !filters?.author || template.author.toLowerCase().includes(filters.author.toLowerCase())

      // 标签过滤
      const tagsMatch = !filters?.tags?.length || filters.tags.some((tag) => template.tags.includes(tag))

      return textMatch && typeMatch && categoryMatch && authorMatch && tagsMatch
    })
  }

  // 按分类获取模板
  static getTemplatesByCategory(category: string): CustomTemplate[] {
    const templates = this.getCustomTemplates()
    return templates.filter((t) => t.category === category)
  }

  // 按类型获取模板
  static getTemplatesByType(type: "webpage" | "poster" | "ppt"): CustomTemplate[] {
    const templates = this.getCustomTemplates()
    return templates.filter((t) => t.type === type)
  }

  // 获取热门模板
  static getPopularTemplates(limit = 10): CustomTemplate[] {
    const templates = this.getCustomTemplates()
    return templates.sort((a, b) => b.downloads + b.rating * 10 - (a.downloads + a.rating * 10)).slice(0, limit)
  }

  // 获取最新模板
  static getRecentTemplates(limit = 10): CustomTemplate[] {
    const templates = this.getCustomTemplates()
    return templates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit)
  }

  // 评分模板
  static rateTemplate(id: string, rating: number): boolean {
    if (rating < 1 || rating > 5) return false

    const template = this.getTemplate(id)
    if (!template) return false

    // 简化评分逻辑，实际应用中需要更复杂的评分系统
    const newRating = (template.rating + rating) / 2
    return this.updateTemplate(id, { rating: newRating }) !== null
  }

  // 增加下载次数
  static incrementDownloads(id: string): boolean {
    const template = this.getTemplate(id)
    if (!template) return false

    return this.updateTemplate(id, { downloads: template.downloads + 1 }) !== null
  }

  // 导出模板
  static exportTemplate(id: string): string | null {
    const template = this.getTemplate(id)
    if (!template) return null

    try {
      return JSON.stringify(template, null, 2)
    } catch (error) {
      console.error("导出模板失败:", error)
      return null
    }
  }

  // 导入模板
  static importTemplate(templateData: string): CustomTemplate | null {
    try {
      const template = JSON.parse(templateData) as CustomTemplate

      // 验证模板数据
      if (!template.name || !template.type || !template.content) {
        throw new Error("模板数据不完整")
      }

      // 生成新ID避免冲突
      const newTemplate = {
        ...template,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      return this.saveTemplate(newTemplate)
    } catch (error) {
      console.error("导入模板失败:", error)
      return null
    }
  }

  // 获取所有收藏集
  static getCollections(): TemplateCollection[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.COLLECTIONS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  // 创建收藏集
  static createCollection(collection: Omit<TemplateCollection, "id" | "createdAt" | "updatedAt">): TemplateCollection {
    const newCollection: TemplateCollection = {
      ...collection,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (typeof window !== "undefined") {
      try {
        const collections = this.getCollections()
        collections.unshift(newCollection)

        // 限制数量
        if (collections.length > this.MAX_COLLECTIONS) {
          collections.splice(this.MAX_COLLECTIONS)
        }

        localStorage.setItem(this.COLLECTIONS_KEY, JSON.stringify(collections))
      } catch (error) {
        console.error("创建收藏集失败:", error)
        throw new Error("创建收藏集失败")
      }
    }

    return newCollection
  }

  // 添加模板到收藏集
  static addToCollection(collectionId: string, templateId: string): boolean {
    if (typeof window === "undefined") return false

    try {
      const collections = this.getCollections()
      const collection = collections.find((c) => c.id === collectionId)

      if (!collection) return false

      if (!collection.templates.includes(templateId)) {
        collection.templates.push(templateId)
        collection.updatedAt = new Date().toISOString()
        localStorage.setItem(this.COLLECTIONS_KEY, JSON.stringify(collections))
      }

      return true
    } catch (error) {
      console.error("添加到收藏集失败:", error)
      return false
    }
  }

  // 从收藏集移除模板
  static removeFromCollection(collectionId: string, templateId: string): boolean {
    if (typeof window === "undefined") return false

    try {
      const collections = this.getCollections()
      const collection = collections.find((c) => c.id === collectionId)

      if (!collection) return false

      const index = collection.templates.indexOf(templateId)
      if (index > -1) {
        collection.templates.splice(index, 1)
        collection.updatedAt = new Date().toISOString()
        localStorage.setItem(this.COLLECTIONS_KEY, JSON.stringify(collections))
      }

      return true
    } catch (error) {
      console.error("从收藏集移除失败:", error)
      return false
    }
  }

  // 获取收藏集中的模板
  static getCollectionTemplates(collectionId: string): CustomTemplate[] {
    const collection = this.getCollections().find((c) => c.id === collectionId)
    if (!collection) return []

    const allTemplates = this.getCustomTemplates()
    return collection.templates.map((id) => allTemplates.find((t) => t.id === id)).filter(Boolean) as CustomTemplate[]
  }

  // 获取统计信息
  static getStats() {
    const templates = this.getCustomTemplates()
    const collections = this.getCollections()

    const typeStats = templates.reduce(
      (acc, template) => {
        acc[template.type] = (acc[template.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const categoryStats = templates.reduce(
      (acc, template) => {
        acc[template.category] = (acc[template.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      totalTemplates: templates.length,
      totalCollections: collections.length,
      typeStats,
      categoryStats,
      totalDownloads: templates.reduce((sum, t) => sum + t.downloads, 0),
      averageRating: templates.length > 0 ? templates.reduce((sum, t) => sum + t.rating, 0) / templates.length : 0,
    }
  }
}
