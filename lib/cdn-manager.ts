"use client"

import React from "react"

// CDN管理系统 - 静态资源CDN加速
export interface CDNConfig {
  baseUrl: string
  regions: string[]
  fallbackUrl?: string
  timeout: number
  retryAttempts: number
  cacheControl: string
}

export interface CDNResource {
  url: string
  type: "image" | "video" | "audio" | "document" | "font" | "script" | "style"
  size?: number
  hash?: string
  version?: string
  priority: "high" | "medium" | "low"
}

export interface CDNPerformance {
  region: string
  latency: number
  bandwidth: number
  successRate: number
  lastCheck: Date
}

export class CDNManager {
  private static instance: CDNManager
  private config: CDNConfig
  private performanceData = new Map<string, CDNPerformance>()
  private resourceCache = new Map<string, string>()
  private loadingPromises = new Map<string, Promise<string>>()

  constructor(config: Partial<CDNConfig> = {}) {
    this.config = {
      baseUrl: "https://cdn.example.com",
      regions: ["us-east-1", "eu-west-1", "ap-southeast-1"],
      timeout: 10000,
      retryAttempts: 3,
      cacheControl: "public, max-age=31536000",
      ...config,
    }
  }

  static getInstance(config?: Partial<CDNConfig>): CDNManager {
    if (!CDNManager.instance) {
      CDNManager.instance = new CDNManager(config)
    }
    return CDNManager.instance
  }

  // 获取最优CDN节点
  async getBestRegion(): Promise<string> {
    const performances = Array.from(this.performanceData.values())

    if (performances.length === 0) {
      await this.testAllRegions()
    }

    // 根据延迟和成功率选择最优节点
    const sortedRegions = performances.sort((a, b) => {
      const scoreA = (1 / a.latency) * a.successRate
      const scoreB = (1 / b.latency) * b.successRate
      return scoreB - scoreA
    })

    return sortedRegions[0]?.region || this.config.regions[0]
  }

  // 测试所有CDN节点性能
  async testAllRegions(): Promise<void> {
    const testPromises = this.config.regions.map((region) => this.testRegion(region))
    await Promise.allSettled(testPromises)
  }

  // 测试单个CDN节点
  async testRegion(region: string): Promise<CDNPerformance> {
    const testUrl = `${this.config.baseUrl}/${region}/ping.json`
    const startTime = Date.now()

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      const response = await fetch(testUrl, {
        signal: controller.signal,
        cache: "no-cache",
      })

      clearTimeout(timeoutId)

      const latency = Date.now() - startTime
      const performance: CDNPerformance = {
        region,
        latency,
        bandwidth: this.calculateBandwidth(response.headers.get("content-length"), latency),
        successRate: response.ok ? 1 : 0,
        lastCheck: new Date(),
      }

      this.performanceData.set(region, performance)
      return performance
    } catch (error) {
      const performance: CDNPerformance = {
        region,
        latency: this.config.timeout,
        bandwidth: 0,
        successRate: 0,
        lastCheck: new Date(),
      }

      this.performanceData.set(region, performance)
      return performance
    }
  }

  // 计算带宽
  private calculateBandwidth(contentLength: string | null, latency: number): number {
    if (!contentLength || latency === 0) return 0

    const bytes = Number.parseInt(contentLength)
    const seconds = latency / 1000
    return (bytes * 8) / seconds / 1024 / 1024 // Mbps
  }

  // 构建CDN URL
  buildUrl(resource: CDNResource, region?: string): string {
    const targetRegion = region || this.config.regions[0]
    const baseUrl = `${this.config.baseUrl}/${targetRegion}`

    let url = `${baseUrl}/${resource.url}`

    // 添加版本参数
    if (resource.version) {
      url += `?v=${resource.version}`
    }

    // 添加哈希参数用于缓存破坏
    if (resource.hash) {
      const separator = url.includes("?") ? "&" : "?"
      url += `${separator}h=${resource.hash}`
    }

    return url
  }

  // 加载资源
  async loadResource(
    resource: CDNResource,
    options: {
      preferredRegion?: string
      useCache?: boolean
      priority?: "high" | "medium" | "low"
    } = {},
  ): Promise<string> {
    const { preferredRegion, useCache = true, priority = resource.priority } = options
    const cacheKey = `${resource.url}_${resource.version || "latest"}`

    // 检查缓存
    if (useCache && this.resourceCache.has(cacheKey)) {
      return this.resourceCache.get(cacheKey)!
    }

    // 检查是否正在加载
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)!
    }

    // 开始加载
    const loadPromise = this.doLoadResource(resource, preferredRegion, priority)
    this.loadingPromises.set(cacheKey, loadPromise)

    try {
      const result = await loadPromise

      // 缓存结果
      if (useCache) {
        this.resourceCache.set(cacheKey, result)
      }

      return result
    } finally {
      this.loadingPromises.delete(cacheKey)
    }
  }

  // 实际加载资源
  private async doLoadResource(
    resource: CDNResource,
    preferredRegion?: string,
    priority: "high" | "medium" | "low" = "medium",
  ): Promise<string> {
    const region = preferredRegion || (await this.getBestRegion())
    const url = this.buildUrl(resource, region)

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

        const response = await fetch(url, {
          signal: controller.signal,
          priority: priority as any, // 现代浏览器支持
          cache: "force-cache",
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        // 根据资源类型处理响应
        switch (resource.type) {
          case "image":
          case "video":
          case "audio":
            return URL.createObjectURL(await response.blob())

          case "script":
          case "style":
          case "document":
            return await response.text()

          default:
            return url
        }
      } catch (error) {
        console.warn(`CDN加载失败 (尝试 ${attempt + 1}/${this.config.retryAttempts}):`, error)

        if (attempt === this.config.retryAttempts - 1) {
          // 最后一次尝试失败，使用回退URL
          if (this.config.fallbackUrl) {
            return `${this.config.fallbackUrl}/${resource.url}`
          }
          throw error
        }

        // 等待后重试
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
      }
    }

    throw new Error("CDN加载失败")
  }

  // 预加载资源
  async preloadResources(resources: CDNResource[]): Promise<void> {
    // 按优先级排序
    const sortedResources = resources.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })

    // 并发加载高优先级资源
    const highPriorityResources = sortedResources.filter((r) => r.priority === "high")
    const mediumPriorityResources = sortedResources.filter((r) => r.priority === "medium")
    const lowPriorityResources = sortedResources.filter((r) => r.priority === "low")

    // 高优先级资源立即加载
    await Promise.allSettled(highPriorityResources.map((resource) => this.loadResource(resource)))

    // 中优先级资源延迟加载
    setTimeout(() => {
      Promise.allSettled(mediumPriorityResources.map((resource) => this.loadResource(resource)))
    }, 100)

    // 低优先级资源空闲时加载
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => {
        Promise.allSettled(lowPriorityResources.map((resource) => this.loadResource(resource)))
      })
    } else {
      setTimeout(() => {
        Promise.allSettled(lowPriorityResources.map((resource) => this.loadResource(resource)))
      }, 1000)
    }
  }

  // 清理缓存
  clearCache(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern)
      for (const [key, value] of this.resourceCache.entries()) {
        if (regex.test(key)) {
          // 释放Blob URL
          if (value.startsWith("blob:")) {
            URL.revokeObjectURL(value)
          }
          this.resourceCache.delete(key)
        }
      }
    } else {
      // 清理所有Blob URL
      for (const [key, value] of this.resourceCache.entries()) {
        if (value.startsWith("blob:")) {
          URL.revokeObjectURL(value)
        }
      }
      this.resourceCache.clear()
    }
  }

  // 获取缓存统计
  getCacheStats(): {
    size: number
    hitRate: number
    totalRequests: number
    cacheHits: number
  } {
    // 这里需要实现缓存命中率统计
    return {
      size: this.resourceCache.size,
      hitRate: 0.85, // 示例值
      totalRequests: 100, // 示例值
      cacheHits: 85, // 示例值
    }
  }

  // 获取性能报告
  getPerformanceReport(): {
    regions: CDNPerformance[]
    bestRegion: string
    averageLatency: number
    totalBandwidth: number
  } {
    const regions = Array.from(this.performanceData.values())
    const bestRegion = regions.sort((a, b) => a.latency - b.latency)[0]?.region || "unknown"
    const averageLatency = regions.reduce((sum, r) => sum + r.latency, 0) / regions.length || 0
    const totalBandwidth = regions.reduce((sum, r) => sum + r.bandwidth, 0)

    return {
      regions,
      bestRegion,
      averageLatency,
      totalBandwidth,
    }
  }

  // 更新配置
  updateConfig(newConfig: Partial<CDNConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  // 健康检查
  async healthCheck(): Promise<boolean> {
    try {
      const bestRegion = await this.getBestRegion()
      const performance = this.performanceData.get(bestRegion)

      return performance ? performance.successRate > 0.8 && performance.latency < 2000 : false
    } catch {
      return false
    }
  }
}

// React Hook
export const useCDN = (config?: Partial<CDNConfig>) => {
  const [manager] = React.useState(() => CDNManager.getInstance(config))
  const [performance, setPerformance] = React.useState<CDNPerformance[]>([])
  const [loading, setLoading] = React.useState(false)

  const loadResource = React.useCallback(
    async (resource: CDNResource) => {
      setLoading(true)
      try {
        return await manager.loadResource(resource)
      } finally {
        setLoading(false)
      }
    },
    [manager],
  )

  const preloadResources = React.useCallback(
    async (resources: CDNResource[]) => {
      setLoading(true)
      try {
        await manager.preloadResources(resources)
      } finally {
        setLoading(false)
      }
    },
    [manager],
  )

  const testPerformance = React.useCallback(async () => {
    setLoading(true)
    try {
      await manager.testAllRegions()
      const report = manager.getPerformanceReport()
      setPerformance(report.regions)
    } finally {
      setLoading(false)
    }
  }, [manager])

  React.useEffect(() => {
    testPerformance()
  }, [testPerformance])

  return {
    loadResource,
    preloadResources,
    testPerformance,
    performance,
    loading,
    clearCache: manager.clearCache.bind(manager),
    getStats: manager.getCacheStats.bind(manager),
    healthCheck: manager.healthCheck.bind(manager),
  }
}

// 工具函数
export const createCDNResource = (
  url: string,
  type: CDNResource["type"],
  options: Partial<CDNResource> = {},
): CDNResource => {
  return {
    url,
    type,
    priority: "medium",
    ...options,
  }
}

export const optimizeImageUrl = (
  url: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: "webp" | "jpeg" | "png"
  } = {},
): string => {
  const params = new URLSearchParams()

  if (options.width) params.append("w", options.width.toString())
  if (options.height) params.append("h", options.height.toString())
  if (options.quality) params.append("q", options.quality.toString())
  if (options.format) params.append("f", options.format)

  return `${url}?${params.toString()}`
}
