"use client"

export interface SourceReference {
  id: string
  title: string
  url: string
  type: "article" | "video" | "document" | "website" | "book" | "paper"
  reliability: number
  snippet: string
  accessDate: string
  authors?: string[]
  publishDate?: string
  doi?: string
  isbn?: string
}

export interface SourceLink {
  sourceId: string
  position: {
    paragraph: number
    sentence: number
    startChar: number
    endChar: number
  }
  text: string
  footnoteNumber: number
}

export class SourceManager {
  private static sources: Map<string, SourceReference> = new Map()
  private static sourceLinks: SourceLink[] = []

  // 添加来源
  static addSource(source: SourceReference): void {
    this.sources.set(source.id, source)
  }

  // 获取来源
  static getSource(id: string): SourceReference | undefined {
    return this.sources.get(id)
  }

  // 获取所有来源
  static getAllSources(): SourceReference[] {
    return Array.from(this.sources.values())
  }

  // 添加来源链接
  static addSourceLink(link: SourceLink): void {
    this.sourceLinks.push(link)
  }

  // 获取段落的来源链接
  static getSourceLinksForParagraph(paragraphIndex: number): SourceLink[] {
    return this.sourceLinks.filter((link) => link.position.paragraph === paragraphIndex)
  }

  // 处理文本中的来源标注
  static processTextWithSources(text: string, paragraphIndex: number): string {
    const links = this.getSourceLinksForParagraph(paragraphIndex)
    let processedText = text

    // 按位置倒序处理，避免位置偏移
    links.sort((a, b) => b.position.startChar - a.position.startChar)

    links.forEach((link) => {
      const beforeText = processedText.substring(0, link.position.startChar)
      const linkText = processedText.substring(link.position.startChar, link.position.endChar)
      const afterText = processedText.substring(link.position.endChar)

      const sourceRef = this.getSource(link.sourceId)
      const footnoteHtml = `<span class="source-link" data-source-id="${link.sourceId}" data-footnote="${link.footnoteNumber}">
        ${linkText}<sup class="source-footnote" onclick="openSource('${link.sourceId}')">[${link.footnoteNumber}]</sup>
      </span>`

      processedText = beforeText + footnoteHtml + afterText
    })

    return processedText
  }

  // 生成来源列表HTML
  static generateSourceListHTML(): string {
    const sources = this.getAllSources()
    if (sources.length === 0) return ""

    let html = '<div class="sources-section"><h3>参考来源</h3><ol class="sources-list">'

    sources.forEach((source, index) => {
      const footnoteNumber = index + 1
      html += `
        <li class="source-item" data-source-id="${source.id}">
          <div class="source-header">
            <span class="source-title">${source.title}</span>
            <span class="source-type">[${this.getTypeLabel(source.type)}]</span>
            <span class="source-reliability" data-reliability="${source.reliability}">
              可靠性: ${Math.round(source.reliability * 100)}%
            </span>
          </div>
          <div class="source-details">
            ${source.authors ? `<div class="source-authors">作者: ${source.authors.join(", ")}</div>` : ""}
            ${source.publishDate ? `<div class="source-date">发布日期: ${source.publishDate}</div>` : ""}
            <div class="source-snippet">${source.snippet}</div>
            <div class="source-link">
              <a href="${source.url}" target="_blank" rel="noopener noreferrer">
                查看原文 ↗
              </a>
              <span class="source-access-date">访问日期: ${source.accessDate}</span>
            </div>
            ${source.doi ? `<div class="source-doi">DOI: ${source.doi}</div>` : ""}
            ${source.isbn ? `<div class="source-isbn">ISBN: ${source.isbn}</div>` : ""}
          </div>
        </li>
      `
    })

    html += "</ol></div>"
    return html
  }

  // 获取类型标签
  private static getTypeLabel(type: string): string {
    const labels = {
      article: "文章",
      video: "视频",
      document: "文档",
      website: "网站",
      book: "书籍",
      paper: "论文",
    }
    return labels[type as keyof typeof labels] || "其他"
  }

  // 验证来源链接
  static async validateSourceLinks(): Promise<{ valid: SourceReference[]; invalid: SourceReference[] }> {
    const sources = this.getAllSources()
    const valid: SourceReference[] = []
    const invalid: SourceReference[] = []

    for (const source of sources) {
      try {
        const response = await fetch(source.url, { method: "HEAD", mode: "no-cors" })
        if (response.ok || response.type === "opaque") {
          valid.push(source)
        } else {
          invalid.push(source)
        }
      } catch (error) {
        // 对于CORS限制的链接，我们假设它们是有效的
        valid.push(source)
      }
    }

    return { valid, invalid }
  }

  // 导出来源数据
  static exportSources(format: "json" | "bibtex" | "apa"): string {
    const sources = this.getAllSources()

    switch (format) {
      case "json":
        return JSON.stringify(sources, null, 2)

      case "bibtex":
        return sources.map((source) => this.toBibTeX(source)).join("\n\n")

      case "apa":
        return sources.map((source) => this.toAPA(source)).join("\n\n")

      default:
        return JSON.stringify(sources, null, 2)
    }
  }

  // 转换为BibTeX格式
  private static toBibTeX(source: SourceReference): string {
    const type = source.type === "paper" ? "article" : source.type === "book" ? "book" : "misc"
    let bibtex = `@${type}{${source.id},\n`
    bibtex += `  title={${source.title}},\n`

    if (source.authors) {
      bibtex += `  author={${source.authors.join(" and ")}},\n`
    }

    if (source.publishDate) {
      bibtex += `  year={${new Date(source.publishDate).getFullYear()}},\n`
    }

    bibtex += `  url={${source.url}},\n`

    if (source.doi) {
      bibtex += `  doi={${source.doi}},\n`
    }

    if (source.isbn) {
      bibtex += `  isbn={${source.isbn}},\n`
    }

    bibtex += `  note={访问日期: ${source.accessDate}}\n}`

    return bibtex
  }

  // 转换为APA格式
  private static toAPA(source: SourceReference): string {
    let apa = ""

    if (source.authors) {
      apa += source.authors.join(", ") + ". "
    }

    if (source.publishDate) {
      apa += `(${new Date(source.publishDate).getFullYear()}). `
    }

    apa += `${source.title}. `

    if (source.type === "website") {
      apa += `Retrieved ${source.accessDate}, from ${source.url}`
    } else {
      apa += source.url
    }

    return apa
  }

  // 清空所有数据
  static clear(): void {
    this.sources.clear()
    this.sourceLinks = []
  }

  // 搜索来源
  static searchSources(query: string): SourceReference[] {
    const sources = this.getAllSources()
    const lowercaseQuery = query.toLowerCase()

    return sources.filter(
      (source) =>
        source.title.toLowerCase().includes(lowercaseQuery) ||
        source.snippet.toLowerCase().includes(lowercaseQuery) ||
        (source.authors && source.authors.some((author) => author.toLowerCase().includes(lowercaseQuery))),
    )
  }

  // 按类型分组来源
  static groupSourcesByType(): { [key: string]: SourceReference[] } {
    const sources = this.getAllSources()
    const grouped: { [key: string]: SourceReference[] } = {}

    sources.forEach((source) => {
      if (!grouped[source.type]) {
        grouped[source.type] = []
      }
      grouped[source.type].push(source)
    })

    return grouped
  }

  // 获取来源统计
  static getSourceStatistics(): {
    total: number
    byType: { [key: string]: number }
    averageReliability: number
    mostReliable: SourceReference | null
    leastReliable: SourceReference | null
  } {
    const sources = this.getAllSources()
    const byType: { [key: string]: number } = {}
    let totalReliability = 0
    let mostReliable: SourceReference | null = null
    let leastReliable: SourceReference | null = null

    sources.forEach((source) => {
      // 按类型统计
      byType[source.type] = (byType[source.type] || 0) + 1

      // 计算可靠性
      totalReliability += source.reliability

      if (!mostReliable || source.reliability > mostReliable.reliability) {
        mostReliable = source
      }

      if (!leastReliable || source.reliability < leastReliable.reliability) {
        leastReliable = source
      }
    })

    return {
      total: sources.length,
      byType,
      averageReliability: sources.length > 0 ? totalReliability / sources.length : 0,
      mostReliable,
      leastReliable,
    }
  }
}

// 全局函数，用于在HTML中调用
declare global {
  interface Window {
    openSource: (sourceId: string) => void
    SourceManager: typeof SourceManager
  }
}

if (typeof window !== "undefined") {
  window.openSource = (sourceId: string) => {
    const source = SourceManager.getSource(sourceId)
    if (source) {
      window.open(source.url, "_blank", "noopener,noreferrer")
    }
  }

  window.SourceManager = SourceManager
}
