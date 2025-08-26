// 性能优化系统
export interface PerformanceMetrics {
  memoryUsage: {
    used: number
    total: number
    percentage: number
  }
  cacheStats: {
    hits: number
    misses: number
    hitRate: number
    size: number
    maxSize: number
  }
  operationTimes: Record<string, number[]>
  fileProcessingStats: {
    totalFiles: number
    totalSize: number
    averageProcessingTime: number
    compressionRatio: number
  }
}

export interface CacheItem<T = any> {
  data: T
  timestamp: number
  expiresAt: number
  accessCount: number
  lastAccessed: number
  size: number
}

export interface FileChunk {
  data: ArrayBuffer
  index: number
  total: number
  size: number
}

export interface ProcessingProgress {
  current: number
  total: number
  percentage: number
  estimatedTimeRemaining: number
  currentOperation: string
}

export class PerformanceOptimizer {
  private static cache: Map<string, CacheItem> = new Map()
  private static maxCacheSize = 50 * 1024 * 1024 // 50MB
  private static currentCacheSize = 0
  private static cacheHits = 0
  private static cacheMisses = 0
  private static operationTimes: Map<string, number[]> = new Map()
  private static fileProcessingStats = {
    totalFiles: 0,
    totalSize: 0,
    totalProcessingTime: 0,
    totalCompressedSize: 0,
  }

  // 缓存管理
  static setCache<T>(key: string, data: T, ttl = 3600000): boolean {
    try {
      const size = this.calculateSize(data)
      const now = Date.now()

      // 检查是否需要清理缓存
      if (this.currentCacheSize + size > this.maxCacheSize) {
        this.evictLRU(size)
      }

      const item: CacheItem<T> = {
        data,
        timestamp: now,
        expiresAt: now + ttl,
        accessCount: 0,
        lastAccessed: now,
        size,
      }

      // 如果key已存在，先减去旧的大小
      const existingItem = this.cache.get(key)
      if (existingItem) {
        this.currentCacheSize -= existingItem.size
      }

      this.cache.set(key, item)
      this.currentCacheSize += size

      return true
    } catch (error) {
      console.error("缓存设置失败:", error)
      return false
    }
  }

  static getCache<T>(key: string): T | null {
    const item = this.cache.get(key) as CacheItem<T> | undefined

    if (!item) {
      this.cacheMisses++
      return null
    }

    const now = Date.now()

    // 检查是否过期
    if (now > item.expiresAt) {
      this.removeCache(key)
      this.cacheMisses++
      return null
    }

    // 更新访问统计
    item.accessCount++
    item.lastAccessed = now
    this.cacheHits++

    return item.data
  }

  static removeCache(key: string): boolean {
    const item = this.cache.get(key)
    if (item) {
      this.currentCacheSize -= item.size
      this.cache.delete(key)
      return true
    }
    return false
  }

  static clearCache(): void {
    this.cache.clear()
    this.currentCacheSize = 0
  }

  // LRU缓存淘汰
  private static evictLRU(requiredSize: number): void {
    const items = Array.from(this.cache.entries())
      .map(([key, item]) => ({ key, item }))
      .sort((a, b) => a.item.lastAccessed - b.item.lastAccessed)

    let freedSize = 0
    for (const { key, item } of items) {
      this.cache.delete(key)
      this.currentCacheSize -= item.size
      freedSize += item.size

      if (freedSize >= requiredSize) {
        break
      }
    }
  }

  // 计算数据大小（粗略估算）
  private static calculateSize(data: any): number {
    try {
      if (data === null || data === undefined) return 0

      if (typeof data === "string") {
        return data.length * 2 // UTF-16编码
      }

      if (typeof data === "number") {
        return 8
      }

      if (typeof data === "boolean") {
        return 4
      }

      if (data instanceof ArrayBuffer) {
        return data.byteLength
      }

      if (data instanceof Blob) {
        return data.size
      }

      // 对象和数组的粗略估算
      return JSON.stringify(data).length * 2
    } catch {
      return 1024 // 默认1KB
    }
  }

  // 文件分块处理
  static async processFileInChunks<T>(
    file: File | Blob,
    processor: (chunk: FileChunk, index: number, total: number) => Promise<T>,
    onProgress?: (progress: ProcessingProgress) => void,
    chunkSize: number = 1024 * 1024, // 1MB chunks
  ): Promise<T[]> {
    const startTime = Date.now()
    const totalSize = file.size
    const totalChunks = Math.ceil(totalSize / chunkSize)
    const results: T[] = []

    this.fileProcessingStats.totalFiles++
    this.fileProcessingStats.totalSize += totalSize

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, totalSize)
      const blob = file.slice(start, end)
      const arrayBuffer = await blob.arrayBuffer()

      const chunk: FileChunk = {
        data: arrayBuffer,
        index: i,
        total: totalChunks,
        size: arrayBuffer.byteLength,
      }

      // 处理进度回调
      if (onProgress) {
        const elapsed = Date.now() - startTime
        const progress: ProcessingProgress = {
          current: i + 1,
          total: totalChunks,
          percentage: ((i + 1) / totalChunks) * 100,
          estimatedTimeRemaining: (elapsed * (totalChunks - i - 1)) / (i + 1),
          currentOperation: `处理分块 ${i + 1}/${totalChunks}`,
        }
        onProgress(progress)
      }

      try {
        const result = await processor(chunk, i, totalChunks)
        results.push(result)
      } catch (error) {
        console.error(`处理分块 ${i} 失败:`, error)
        throw error
      }

      // 避免阻塞UI线程
      if (i % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
    }

    const processingTime = Date.now() - startTime
    this.fileProcessingStats.totalProcessingTime += processingTime

    // 记录操作时间
    this.recordOperationTime("file_processing", processingTime)

    return results
  }

  // 图片优化
  static async optimizeImage(
    file: File,
    options: {
      maxWidth?: number
      maxHeight?: number
      quality?: number
      format?: "jpeg" | "png" | "webp"
    } = {},
  ): Promise<Blob> {
    const { maxWidth = 1920, maxHeight = 1080, quality = 0.8, format = "jpeg" } = options

    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      img.onload = () => {
        try {
          // 计算新尺寸
          let { width, height } = img

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width *= ratio
            height *= ratio
          }

          canvas.width = width
          canvas.height = height

          // 绘制图片
          ctx?.drawImage(img, 0, 0, width, height)

          // 转换为Blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // 更新压缩统计
                this.fileProcessingStats.totalCompressedSize += blob.size
                resolve(blob)
              } else {
                reject(new Error("图片优化失败"))
              }
            },
            `image/${format}`,
            quality,
          )
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => reject(new Error("图片加载失败"))

      // 设置CORS以避免跨域问题
      img.crossOrigin = "anonymous"
      img.src = URL.createObjectURL(file)
    })
  }

  // 批量处理
  static async processBatch<T, R>(
    items: T[],
    processor: (item: T, index: number) => Promise<R>,
    options: {
      batchSize?: number
      concurrency?: number
      onProgress?: (progress: ProcessingProgress) => void
      onError?: (error: Error, item: T, index: number) => void
    } = {},
  ): Promise<R[]> {
    const { batchSize = 10, concurrency = 3, onProgress, onError } = options

    const results: R[] = new Array(items.length)
    const startTime = Date.now()
    let completed = 0

    // 创建批次
    const batches: T[][] = []
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }

    // 并发处理批次
    const processBatch = async (batch: T[], batchIndex: number): Promise<void> => {
      const promises = batch.map(async (item, itemIndex) => {
        const globalIndex = batchIndex * batchSize + itemIndex

        try {
          const result = await processor(item, globalIndex)
          results[globalIndex] = result
          completed++

          // 进度回调
          if (onProgress) {
            const elapsed = Date.now() - startTime
            const progress: ProcessingProgress = {
              current: completed,
              total: items.length,
              percentage: (completed / items.length) * 100,
              estimatedTimeRemaining: (elapsed * (items.length - completed)) / completed,
              currentOperation: `处理项目 ${completed}/${items.length}`,
            }
            onProgress(progress)
          }
        } catch (error) {
          if (onError) {
            onError(error as Error, item, globalIndex)
          } else {
            throw error
          }
        }
      })

      await Promise.all(promises)
    }

    // 限制并发数
    const semaphore = new Array(concurrency).fill(null)
    const batchPromises = batches.map(async (batch, index) => {
      // 等待可用的并发槽
      await Promise.race(semaphore)

      const promise = processBatch(batch, index)

      // 更新信号量
      const slotIndex = semaphore.findIndex((p) => p === null || p === promise)
      semaphore[slotIndex] = promise

      promise.finally(() => {
        semaphore[slotIndex] = null
      })

      return promise
    })

    await Promise.all(batchPromises)

    const totalTime = Date.now() - startTime
    this.recordOperationTime("batch_processing", totalTime)

    return results
  }

  // 记录操作时间
  static recordOperationTime(operation: string, time: number): void {
    if (!this.operationTimes.has(operation)) {
      this.operationTimes.set(operation, [])
    }

    const times = this.operationTimes.get(operation)!
    times.push(time)

    // 只保留最近100次记录
    if (times.length > 100) {
      times.shift()
    }
  }

  // 获取操作统计
  static getOperationStats(operation: string): {
    count: number
    average: number
    min: number
    max: number
    recent: number
  } | null {
    const times = this.operationTimes.get(operation)
    if (!times || times.length === 0) {
      return null
    }

    const count = times.length
    const sum = times.reduce((a, b) => a + b, 0)
    const average = sum / count
    const min = Math.min(...times)
    const max = Math.max(...times)
    const recent = times[times.length - 1]

    return { count, average, min, max, recent }
  }

  // 内存监控
  static getMemoryUsage(): PerformanceMetrics["memoryUsage"] {
    if (typeof window !== "undefined" && "memory" in performance) {
      const memory = (performance as any).memory
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
      }
    }

    // 服务器端或不支持的浏览器
    return {
      used: 0,
      total: 0,
      percentage: 0,
    }
  }

  // 获取性能报告
  static getPerformanceReport(): PerformanceMetrics {
    const memoryUsage = this.getMemoryUsage()

    const cacheStats = {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: (this.cacheHits / (this.cacheHits + this.cacheMisses)) * 100 || 0,
      size: this.currentCacheSize,
      maxSize: this.maxCacheSize,
    }

    const operationTimes: Record<string, number[]> = {}
    for (const [operation, times] of this.operationTimes.entries()) {
      operationTimes[operation] = [...times]
    }

    const fileProcessingStats = {
      totalFiles: this.fileProcessingStats.totalFiles,
      totalSize: this.fileProcessingStats.totalSize,
      averageProcessingTime:
        this.fileProcessingStats.totalFiles > 0
          ? this.fileProcessingStats.totalProcessingTime / this.fileProcessingStats.totalFiles
          : 0,
      compressionRatio:
        this.fileProcessingStats.totalSize > 0
          ? this.fileProcessingStats.totalCompressedSize / this.fileProcessingStats.totalSize
          : 0,
    }

    return {
      memoryUsage,
      cacheStats,
      operationTimes,
      fileProcessingStats,
    }
  }

  // 自动优化
  static async autoOptimize(): Promise<{
    cacheCleared: boolean
    memoryFreed: number
    optimizationsApplied: string[]
  }> {
    const optimizations: string[] = []
    let memoryFreed = 0
    let cacheCleared = false

    const memoryUsage = this.getMemoryUsage()

    // 内存使用率过高时清理缓存
    if (memoryUsage.percentage > 80) {
      const beforeSize = this.currentCacheSize
      this.clearExpiredCache()
      memoryFreed = beforeSize - this.currentCacheSize
      optimizations.push("清理过期缓存")

      if (memoryUsage.percentage > 90) {
        this.clearCache()
        cacheCleared = true
        optimizations.push("清空所有缓存")
      }
    }

    // 清理旧的操作时间记录
    for (const [operation, times] of this.operationTimes.entries()) {
      if (times.length > 50) {
        this.operationTimes.set(operation, times.slice(-50))
        optimizations.push(`清理${operation}操作记录`)
      }
    }

    return {
      cacheCleared,
      memoryFreed,
      optimizationsApplied: optimizations,
    }
  }

  // 清理过期缓存
  private static clearExpiredCache(): void {
    const now = Date.now()

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.removeCache(key)
      }
    }
  }

  // 预加载资源
  static async preloadResources(urls: string[]): Promise<void> {
    const promises = urls.map(async (url) => {
      try {
        const response = await fetch(url)
        const data = await response.blob()
        this.setCache(`preload_${url}`, data, 3600000) // 1小时缓存
      } catch (error) {
        console.warn(`预加载资源失败: ${url}`, error)
      }
    })

    await Promise.all(promises)
  }

  // 懒加载图片
  static setupLazyLoading(selector = "img[data-src]"): void {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          const src = img.dataset.src

          if (src) {
            img.src = src
            img.removeAttribute("data-src")
            observer.unobserve(img)
          }
        }
      })
    })

    document.querySelectorAll(selector).forEach((img) => {
      observer.observe(img)
    })
  }

  // 防抖函数
  static debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout

    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }
  }

  // 节流函数
  static throttle<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
    let lastCall = 0

    return (...args: Parameters<T>) => {
      const now = Date.now()

      if (now - lastCall >= delay) {
        lastCall = now
        func(...args)
      }
    }
  }
}

// 自动优化定时器
if (typeof window !== "undefined") {
  // 每5分钟自动优化一次
  setInterval(() => {
    PerformanceOptimizer.autoOptimize().then((result) => {
      if (result.optimizationsApplied.length > 0) {
        console.log("自动优化完成:", result)
      }
    })
  }, 300000)
}
