export interface PosterConfig {
  title: string
  subtitle?: string
  content: string[]
  theme: "modern" | "minimal" | "creative" | "business" | "education" | "tech"
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
  }
  layout: "vertical" | "horizontal" | "grid"
  size: {
    width: number
    height: number
  }
}

export interface GeneratedPoster {
  id: string
  config: PosterConfig
  svgContent: string
  dataUrl: string
  timestamp: number
}

export class PosterGenerator {
  private static themes = {
    modern: {
      colors: {
        primary: "#3B82F6",
        secondary: "#1E40AF",
        accent: "#F59E0B",
        background: "#FFFFFF",
        text: "#1F2937",
      },
      fonts: {
        title: "font-bold text-4xl",
        subtitle: "font-medium text-xl",
        content: "font-normal text-base",
      },
    },
    minimal: {
      colors: {
        primary: "#000000",
        secondary: "#6B7280",
        accent: "#EF4444",
        background: "#F9FAFB",
        text: "#111827",
      },
      fonts: {
        title: "font-light text-5xl",
        subtitle: "font-normal text-lg",
        content: "font-light text-sm",
      },
    },
    creative: {
      colors: {
        primary: "#8B5CF6",
        secondary: "#EC4899",
        accent: "#F59E0B",
        background: "#FEF3C7",
        text: "#1F2937",
      },
      fonts: {
        title: "font-black text-4xl",
        subtitle: "font-bold text-xl",
        content: "font-medium text-base",
      },
    },
    business: {
      colors: {
        primary: "#1F2937",
        secondary: "#374151",
        accent: "#3B82F6",
        background: "#FFFFFF",
        text: "#111827",
      },
      fonts: {
        title: "font-semibold text-3xl",
        subtitle: "font-medium text-lg",
        content: "font-normal text-sm",
      },
    },
    education: {
      colors: {
        primary: "#059669",
        secondary: "#047857",
        accent: "#F59E0B",
        background: "#ECFDF5",
        text: "#064E3B",
      },
      fonts: {
        title: "font-bold text-4xl",
        subtitle: "font-semibold text-xl",
        content: "font-medium text-base",
      },
    },
    tech: {
      colors: {
        primary: "#0F172A",
        secondary: "#1E293B",
        accent: "#06B6D4",
        background: "#F1F5F9",
        text: "#0F172A",
      },
      fonts: {
        title: "font-mono font-bold text-3xl",
        subtitle: "font-mono font-medium text-lg",
        content: "font-mono text-sm",
      },
    },
  }

  static generatePoster(config: PosterConfig): GeneratedPoster {
    const id = `poster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const svgContent = this.createSVG(config)

    // 使用 data URL 而不是 blob URL 来避免跨域问题
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`

    return {
      id,
      config,
      svgContent,
      dataUrl,
      timestamp: Date.now(),
    }
  }

  private static createSVG(config: PosterConfig): string {
    const { width, height } = config.size
    const colors = config.colors

    // 创建渐变背景
    const gradientId = `gradient_${Math.random().toString(36).substr(2, 9)}`
    const shadowId = `shadow_${Math.random().toString(36).substr(2, 9)}`

    let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
        <defs>
          <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors.background};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${this.lightenColor(colors.primary, 0.1)};stop-opacity:1" />
          </linearGradient>
          <filter id="${shadowId}" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
          </filter>
        </defs>
        
        <!-- 背景 -->
        <rect width="100%" height="100%" fill="url(#${gradientId})" />
        
        <!-- 装饰元素 -->
        ${this.createDecorations(config)}
        
        <!-- 内容区域 -->
        <g transform="translate(${width * 0.1}, ${height * 0.1})">
    `

    const contentWidth = width * 0.8
    const contentHeight = height * 0.8
    let currentY = 60

    // 标题
    if (config.title) {
      const titleSize = Math.min(Math.max((contentWidth / config.title.length) * 1.2, 24), 48)
      const titleLines = this.wrapText(config.title, contentWidth, titleSize)

      titleLines.forEach((line, index) => {
        svgContent += `
          <text x="${contentWidth / 2}" y="${currentY + titleSize}" 
                text-anchor="middle" 
                font-family="Arial, sans-serif" 
                font-size="${titleSize}" 
                font-weight="bold" 
                fill="${colors.primary}"
                filter="url(#${shadowId})">
            ${this.escapeXml(line)}
          </text>
        `
        currentY += titleSize + 10
      })
      currentY += 30
    }

    // 副标题
    if (config.subtitle) {
      const subtitleSize = Math.min(Math.max((contentWidth / config.subtitle.length) * 1.0, 16), 28)
      svgContent += `
        <text x="${contentWidth / 2}" y="${currentY + subtitleSize}" 
              text-anchor="middle" 
              font-family="Arial, sans-serif" 
              font-size="${subtitleSize}" 
              font-weight="normal" 
              fill="${colors.secondary}">
          ${this.escapeXml(config.subtitle)}
        </text>
      `
      currentY += subtitleSize + 50
    }

    // 内容
    if (config.content && config.content.length > 0) {
      const contentSize = 18
      const lineHeight = 32

      config.content.forEach((line, index) => {
        if (currentY + lineHeight < contentHeight - 60) {
          svgContent += `
            <text x="${contentWidth / 2}" y="${currentY + contentSize}" 
                  text-anchor="middle" 
                  font-family="Arial, sans-serif" 
                  font-size="${contentSize}" 
                  fill="${colors.text}">
              ${this.escapeXml(line)}
            </text>
          `
          currentY += lineHeight
        }
      })
    }

    // 底部装饰和信息
    svgContent += `
        <!-- 底部装饰线 -->
        <line x1="${contentWidth * 0.2}" y1="${contentHeight - 40}" x2="${contentWidth * 0.8}" y2="${contentHeight - 40}" 
              stroke="${colors.accent}" stroke-width="3" />
        
        <!-- 时间戳 -->
        <text x="${contentWidth}" y="${contentHeight - 10}" 
              text-anchor="end" 
              font-family="Arial, sans-serif" 
              font-size="14" 
              fill="${colors.secondary}">
          ${new Date().toLocaleDateString("zh-CN")}
        </text>
        
        <!-- AI标识 -->
        <text x="0" y="${contentHeight - 10}" 
              text-anchor="start" 
              font-family="Arial, sans-serif" 
              font-size="14" 
              fill="${colors.secondary}">
          AI生成
        </text>
      </g>
    </svg>
    `

    return svgContent
  }

  private static createDecorations(config: PosterConfig): string {
    const { width, height } = config.size
    const colors = config.colors

    let decorations = ""

    // 根据主题添加不同的装饰元素
    switch (config.theme) {
      case "modern":
        decorations = `
          <circle cx="${width * 0.9}" cy="${height * 0.1}" r="30" fill="${colors.accent}" opacity="0.3" />
          <rect x="0" y="0" width="${width * 0.02}" height="${height}" fill="${colors.primary}" />
          <circle cx="${width * 0.1}" cy="${height * 0.9}" r="15" fill="${colors.accent}" opacity="0.5" />
        `
        break
      case "minimal":
        decorations = `
          <rect x="${width * 0.1}" y="${height * 0.05}" width="${width * 0.8}" height="2" fill="${colors.accent}" />
          <rect x="${width * 0.1}" y="${height * 0.95}" width="${width * 0.8}" height="1" fill="${colors.secondary}" opacity="0.5" />
        `
        break
      case "creative":
        decorations = `
          <polygon points="${width * 0.95},${height * 0.05} ${width},${height * 0.1} ${width * 0.9},${height * 0.15}" fill="${colors.accent}" />
          <circle cx="${width * 0.05}" cy="${height * 0.95}" r="20" fill="${colors.secondary}" opacity="0.5" />
          <rect x="${width * 0.02}" y="${height * 0.3}" width="8" height="40" fill="${colors.primary}" opacity="0.7" />
        `
        break
      case "business":
        decorations = `
          <rect x="0" y="${height * 0.95}" width="${width}" height="${height * 0.05}" fill="${colors.primary}" />
          <rect x="${width * 0.9}" y="0" width="${width * 0.1}" height="${height * 0.1}" fill="${colors.accent}" opacity="0.3" />
        `
        break
      case "education":
        decorations = `
          <path d="M ${width * 0.05} ${height * 0.1} Q ${width * 0.1} ${height * 0.05} ${width * 0.15} ${height * 0.1}" 
                stroke="${colors.accent}" stroke-width="3" fill="none" />
          <circle cx="${width * 0.9}" cy="${height * 0.9}" r="25" fill="${colors.primary}" opacity="0.2" />
        `
        break
      case "tech":
        decorations = `
          <rect x="${width * 0.02}" y="${height * 0.02}" width="12" height="12" fill="${colors.accent}" />
          <rect x="${width * 0.02}" y="${height * 0.06}" width="8" height="8" fill="${colors.secondary}" />
          <rect x="${width * 0.02}" y="${height * 0.09}" width="4" height="4" fill="${colors.primary}" />
          <line x1="${width * 0.9}" y1="${height * 0.1}" x2="${width * 0.95}" y2="${height * 0.15}" stroke="${colors.accent}" stroke-width="2" />
        `
        break
    }

    return decorations
  }

  private static wrapText(text: string, maxWidth: number, fontSize: number): string[] {
    const maxCharsPerLine = Math.floor(maxWidth / (fontSize * 0.6))
    const words = text.split("")
    const lines: string[] = []
    let currentLine = ""

    for (const char of words) {
      if (currentLine.length + 1 <= maxCharsPerLine) {
        currentLine += char
      } else {
        if (currentLine) lines.push(currentLine)
        currentLine = char
      }
    }

    if (currentLine) lines.push(currentLine)
    return lines.length > 0 ? lines : [text]
  }

  private static lightenColor(color: string, amount: number): string {
    const hex = color.replace("#", "")
    const r = Number.parseInt(hex.substr(0, 2), 16)
    const g = Number.parseInt(hex.substr(2, 2), 16)
    const b = Number.parseInt(hex.substr(4, 2), 16)

    const newR = Math.min(255, Math.floor(r + (255 - r) * amount))
    const newG = Math.min(255, Math.floor(g + (255 - g) * amount))
    const newB = Math.min(255, Math.floor(b + (255 - b) * amount))

    return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`
  }

  private static escapeXml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
  }

  static generateFromQuery(query: string, theme: PosterConfig["theme"] = "modern"): GeneratedPoster {
    const config: PosterConfig = {
      title: query,
      subtitle: "AI智能搜索结果",
      content: ["基于人工智能技术生成", "深度分析与知识整合", "专业内容智能推荐"],
      theme,
      colors: this.themes[theme].colors,
      layout: "vertical",
      size: {
        width: 800,
        height: 1200,
      },
    }

    return this.generatePoster(config)
  }

  static downloadPoster(poster: GeneratedPoster, filename?: string): void {
    const link = document.createElement("a")
    link.href = poster.dataUrl
    link.download = filename || `poster_${poster.id}.svg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  static async convertToImage(svgContent: string, format: "png" | "jpeg" = "png"): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("无法获取canvas上下文"))
          return
        }

        const img = new Image()

        img.onload = () => {
          try {
            canvas.width = img.naturalWidth || 800
            canvas.height = img.naturalHeight || 1200

            // 设置白色背景
            ctx.fillStyle = "#ffffff"
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            ctx.drawImage(img, 0, 0)
            const dataUrl = canvas.toDataURL(`image/${format}`, 0.9)
            resolve(dataUrl)
          } catch (error) {
            reject(error)
          }
        }

        img.onerror = () => {
          reject(new Error("图片加载失败"))
        }

        // 使用 data URL 而不是 blob URL
        const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`
        img.src = dataUrl
      } catch (error) {
        reject(error)
      }
    })
  }
}

export default PosterGenerator
