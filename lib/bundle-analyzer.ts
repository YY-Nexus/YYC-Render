"use client"

import React from "react"

// Bundle分析和优化系统
export interface BundleStats {
  totalSize: number
  gzippedSize: number
  modules: ModuleInfo[]
  chunks: ChunkInfo[]
  assets: AssetInfo[]
  duplicates: DuplicateInfo[]
  recommendations: OptimizationRecommendation[]
}

export interface ModuleInfo {
  name: string
  size: number
  gzippedSize: number
  chunks: string[]
  reasons: string[]
  isEntry: boolean
  isAsync: boolean
}

export interface ChunkInfo {
  name: string
  size: number
  modules: string[]
  isEntry: boolean
  isAsync: boolean
  parents: string[]
  children: string[]
}

export interface AssetInfo {
  name: string
  size: number
  type: "js" | "css" | "image" | "font" | "other"
  compressed: boolean
  cached: boolean
}

export interface DuplicateInfo {
  module: string
  instances: number
  totalSize: number
  chunks: string[]
}

export interface OptimizationRecommendation {
  type: "code-split" | "tree-shake" | "compress" | "lazy-load" | "cache"
  priority: "high" | "medium" | "low"
  description: string
  impact: string
  implementation: string
}

export class BundleAnalyzer {
  private static instance: BundleAnalyzer
  private stats: BundleStats | null = null
  private thresholds = {
    maxBundleSize: 2 * 1024 * 1024, // 2MB
    maxChunkSize: 500 * 1024, // 500KB
    maxModuleSize: 100 * 1024, // 100KB
    duplicateThreshold: 2,
  }

  static getInstance(): BundleAnalyzer {
    if (!BundleAnalyzer.instance) {
      BundleAnalyzer.instance = new BundleAnalyzer()
    }
    return BundleAnalyzer.instance
  }

  // 分析当前bundle
  async analyzeCurrent(): Promise<BundleStats> {
    try {
      // 获取性能信息
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
      const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[]

      // 分析资源
      const assets = this.analyzeAssets(resources)
      const modules = this.analyzeModules()
      const chunks = this.analyzeChunks()
      const duplicates = this.findDuplicates(modules)
      const recommendations = this.generateRecommendations(assets, modules, chunks, duplicates)

      const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0)
      const gzippedSize = Math.round(totalSize * 0.7) // 估算压缩后大小

      this.stats = {
        totalSize,
        gzippedSize,
        modules,
        chunks,
        assets,
        duplicates,
        recommendations,
      }

      return this.stats
    } catch (error) {
      console.error("Bundle分析失败:", error)
      throw error
    }
  }

  // 分析资源文件
  private analyzeAssets(resources: PerformanceResourceTiming[]): AssetInfo[] {
    return resources
      .filter((resource) => resource.name.includes(window.location.origin))
      .map((resource) => {
        const url = new URL(resource.name)
        const pathname = url.pathname

        let type: AssetInfo["type"] = "other"
        if (pathname.endsWith(".js")) type = "js"
        else if (pathname.endsWith(".css")) type = "css"
        else if (/\.(png|jpg|jpeg|gif|webp|svg)$/.test(pathname)) type = "image"
        else if (/\.(woff|woff2|ttf|eot)$/.test(pathname)) type = "font"

        return {
          name: pathname,
          size: resource.transferSize || 0,
          type,
          compressed: (resource.encodedBodySize || 0) < (resource.decodedBodySize || 0),
          cached: resource.transferSize === 0 && resource.decodedBodySize > 0,
        }
      })
      .sort((a, b) => b.size - a.size)
  }

  // 分析模块（模拟）
  private analyzeModules(): ModuleInfo[] {
    const modules: ModuleInfo[] = []

    // 分析已加载的脚本
    const scripts = Array.from(document.scripts)
    scripts.forEach((script) => {
      if (script.src) {
        const url = new URL(script.src)
        modules.push({
          name: url.pathname,
          size: script.textContent?.length || 0,
          gzippedSize: Math.round((script.textContent?.length || 0) * 0.7),
          chunks: ["main"],
          reasons: ["entry"],
          isEntry: true,
          isAsync: script.async,
        })
      }
    })

    // 分析动态导入（如果有的话）
    if (typeof window !== "undefined" && (window as any).__webpack_require__) {
      // 这里可以集成webpack的运行时信息
    }

    return modules
  }

  // 分析代码块
  private analyzeChunks(): ChunkInfo[] {
    const chunks: ChunkInfo[] = []

    // 主chunk
    chunks.push({
      name: "main",
      size: 0,
      modules: [],
      isEntry: true,
      isAsync: false,
      parents: [],
      children: [],
    })

    // 动态chunk（路由分割等）
    const dynamicImports = this.findDynamicImports()
    dynamicImports.forEach((importPath, index) => {
      chunks.push({
        name: `chunk-${index}`,
        size: 0,
        modules: [importPath],
        isEntry: false,
        isAsync: true,
        parents: ["main"],
        children: [],
      })
    })

    return chunks
  }

  // 查找动态导入
  private findDynamicImports(): string[] {
    const imports: string[] = []

    // 分析页面中的动态导入
    const scripts = Array.from(document.scripts)
    scripts.forEach((script) => {
      if (script.textContent) {
        const dynamicImportRegex = /import$$['"`]([^'"`]+)['"`]$$/g
        let match
        while ((match = dynamicImportRegex.exec(script.textContent)) !== null) {
          imports.push(match[1])
        }
      }
    })

    return imports
  }

  // 查找重复模块
  private findDuplicates(modules: ModuleInfo[]): DuplicateInfo[] {
    const moduleMap = new Map<string, ModuleInfo[]>()

    modules.forEach((module) => {
      const baseName = module.name.split("/").pop() || module.name
      if (!moduleMap.has(baseName)) {
        moduleMap.set(baseName, [])
      }
      moduleMap.get(baseName)!.push(module)
    })

    const duplicates: DuplicateInfo[] = []
    moduleMap.forEach((instances, moduleName) => {
      if (instances.length >= this.thresholds.duplicateThreshold) {
        duplicates.push({
          module: moduleName,
          instances: instances.length,
          totalSize: instances.reduce((sum, instance) => sum + instance.size, 0),
          chunks: [...new Set(instances.flatMap((instance) => instance.chunks))],
        })
      }
    })

    return duplicates.sort((a, b) => b.totalSize - a.totalSize)
  }

  // 生成优化建议
  private generateRecommendations(
    assets: AssetInfo[],
    modules: ModuleInfo[],
    chunks: ChunkInfo[],
    duplicates: DuplicateInfo[],
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = []

    // 检查bundle大小
    const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0)
    if (totalSize > this.thresholds.maxBundleSize) {
      recommendations.push({
        type: "code-split",
        priority: "high",
        description: `总bundle大小 ${this.formatSize(totalSize)} 超过建议值 ${this.formatSize(this.thresholds.maxBundleSize)}`,
        impact: "减少初始加载时间",
        implementation: "使用动态导入进行代码分割，按路由或功能拆分代码",
      })
    }

    // 检查大型资源
    const largeAssets = assets.filter((asset) => asset.size > this.thresholds.maxChunkSize)
    largeAssets.forEach((asset) => {
      if (asset.type === "js") {
        recommendations.push({
          type: "code-split",
          priority: "medium",
          description: `JavaScript文件 ${asset.name} 大小为 ${this.formatSize(asset.size)}`,
          impact: "减少主线程阻塞时间",
          implementation: "拆分大型JavaScript文件，使用懒加载",
        })
      } else if (asset.type === "image") {
        recommendations.push({
          type: "compress",
          priority: "medium",
          description: `图片文件 ${asset.name} 大小为 ${this.formatSize(asset.size)}`,
          impact: "减少网络传输时间",
          implementation: "压缩图片，使用WebP格式，实现响应式图片",
        })
      }
    })

    // 检查未压缩的资源
    const uncompressedAssets = assets.filter((asset) => !asset.compressed && asset.size > 10 * 1024)
    if (uncompressedAssets.length > 0) {
      recommendations.push({
        type: "compress",
        priority: "high",
        description: `发现 ${uncompressedAssets.length} 个未压缩的资源`,
        impact: "减少传输大小30-70%",
        implementation: "启用Gzip/Brotli压缩，配置服务器压缩设置",
      })
    }

    // 检查重复模块
    if (duplicates.length > 0) {
      recommendations.push({
        type: "tree-shake",
        priority: "medium",
        description: `发现 ${duplicates.length} 个重复模块`,
        impact: "减少bundle大小",
        implementation: "配置webpack去重，使用tree-shaking移除未使用代码",
      })
    }

    // 检查缓存策略
    const uncachedAssets = assets.filter((asset) => !asset.cached && asset.type !== "other")
    if (uncachedAssets.length > 0) {
      recommendations.push({
        type: "cache",
        priority: "medium",
        description: `${uncachedAssets.length} 个资源未被缓存`,
        impact: "提高重复访问性能",
        implementation: "配置适当的缓存头，使用Service Worker缓存",
      })
    }

    // 检查懒加载机会
    const imageAssets = assets.filter((asset) => asset.type === "image")
    if (imageAssets.length > 5) {
      recommendations.push({
        type: "lazy-load",
        priority: "low",
        description: `页面包含 ${imageAssets.length} 个图片资源`,
        impact: "减少初始页面加载时间",
        implementation: "实现图片懒加载，使用Intersection Observer",
      })
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  // 格式化文件大小
  private formatSize(bytes: number): string {
    if (bytes === 0) return "0 B"

    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // 获取性能评分
  getPerformanceScore(): {
    score: number
    grade: "A" | "B" | "C" | "D" | "F"
    details: {
      bundleSize: number
      compression: number
      caching: number
      duplicates: number
    }
  } {
    if (!this.stats) {
      throw new Error("请先运行分析")
    }

    const { totalSize, assets, duplicates } = this.stats

    // 计算各项得分
    const bundleSizeScore = Math.max(0, 100 - (totalSize / this.thresholds.maxBundleSize) * 50)

    const compressedAssets = assets.filter((asset) => asset.compressed).length
    const compressionScore = assets.length > 0 ? (compressedAssets / assets.length) * 100 : 100

    const cachedAssets = assets.filter((asset) => asset.cached).length
    const cachingScore = assets.length > 0 ? (cachedAssets / assets.length) * 100 : 100

    const duplicatesScore = Math.max(0, 100 - duplicates.length * 10)

    // 计算总分
    const totalScore = (bundleSizeScore + compressionScore + cachingScore + duplicatesScore) / 4

    // 确定等级
    let grade: "A" | "B" | "C" | "D" | "F"
    if (totalScore >= 90) grade = "A"
    else if (totalScore >= 80) grade = "B"
    else if (totalScore >= 70) grade = "C"
    else if (totalScore >= 60) grade = "D"
    else grade = "F"

    return {
      score: Math.round(totalScore),
      grade,
      details: {
        bundleSize: Math.round(bundleSizeScore),
        compression: Math.round(compressionScore),
        caching: Math.round(cachingScore),
        duplicates: Math.round(duplicatesScore),
      },
    }
  }

  // 生成优化报告
  generateReport(): string {
    if (!this.stats) {
      throw new Error("请先运行分析")
    }

    const score = this.getPerformanceScore()
    const { totalSize, gzippedSize, assets, modules, chunks, duplicates, recommendations } = this.stats

    let report = `# Bundle分析报告\n\n`

    // 总体评分
    report += `## 性能评分: ${score.score}/100 (${score.grade}级)\n\n`

    // 基本信息
    report += `## 基本信息\n`
    report += `- 总大小: ${this.formatSize(totalSize)}\n`
    report += `- 压缩后: ${this.formatSize(gzippedSize)}\n`
    report += `- 资源数量: ${assets.length}\n`
    report += `- 模块数量: ${modules.length}\n`
    report += `- 代码块数量: ${chunks.length}\n\n`

    // 详细评分
    report += `## 详细评分\n`
    report += `- Bundle大小: ${score.details.bundleSize}/100\n`
    report += `- 压缩率: ${score.details.compression}/100\n`
    report += `- 缓存策略: ${score.details.caching}/100\n`
    report += `- 重复模块: ${score.details.duplicates}/100\n\n`

    // 最大的资源
    report += `## 最大的资源 (前5个)\n`
    assets.slice(0, 5).forEach((asset, index) => {
      report += `${index + 1}. ${asset.name} - ${this.formatSize(asset.size)} (${asset.type})\n`
    })
    report += `\n`

    // 重复模块
    if (duplicates.length > 0) {
      report += `## 重复模块\n`
      duplicates.forEach((duplicate) => {
        report += `- ${duplicate.module}: ${duplicate.instances}个实例, 总大小 ${this.formatSize(duplicate.totalSize)}\n`
      })
      report += `\n`
    }

    // 优化建议
    if (recommendations.length > 0) {
      report += `## 优化建议\n`
      recommendations.forEach((rec, index) => {
        report += `### ${index + 1}. ${rec.description} (${rec.priority}优先级)\n`
        report += `**影响**: ${rec.impact}\n`
        report += `**实现**: ${rec.implementation}\n\n`
      })
    }

    return report
  }

  // 导出分析数据
  exportData(format: "json" | "csv" = "json"): string {
    if (!this.stats) {
      throw new Error("请先运行分析")
    }

    if (format === "json") {
      return JSON.stringify(this.stats, null, 2)
    } else {
      // CSV格式
      let csv = "Name,Size,Type,Compressed,Cached\n"
      this.stats.assets.forEach((asset) => {
        csv += `"${asset.name}",${asset.size},"${asset.type}",${asset.compressed},${asset.cached}\n`
      })
      return csv
    }
  }

  // 设置阈值
  setThresholds(newThresholds: Partial<typeof this.thresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds }
  }

  // 获取当前统计信息
  getStats(): BundleStats | null {
    return this.stats
  }
}

// React Hook
export const useBundleAnalyzer = () => {
  const [stats, setStats] = React.useState<BundleStats | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const analyzer = React.useRef(BundleAnalyzer.getInstance())

  const analyze = React.useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await analyzer.current.analyzeCurrent()
      setStats(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "分析失败")
    } finally {
      setLoading(false)
    }
  }, [])

  const getScore = React.useCallback(() => {
    return stats ? analyzer.current.getPerformanceScore() : null
  }, [stats])

  const generateReport = React.useCallback(() => {
    return stats ? analyzer.current.generateReport() : ""
  }, [stats])

  const exportData = React.useCallback(
    (format: "json" | "csv" = "json") => {
      return stats ? analyzer.current.exportData(format) : ""
    },
    [stats],
  )

  return {
    stats,
    loading,
    error,
    analyze,
    getScore,
    generateReport,
    exportData,
  }
}

// 工具函数
export const analyzeBundleSize = async (): Promise<BundleStats> => {
  return BundleAnalyzer.getInstance().analyzeCurrent()
}

export const getBundleScore = (): number => {
  const analyzer = BundleAnalyzer.getInstance()
  const stats = analyzer.getStats()
  return stats ? analyzer.getPerformanceScore().score : 0
}
