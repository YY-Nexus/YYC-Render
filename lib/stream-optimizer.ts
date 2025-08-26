"use client"

import { useState } from "react"

// 流式响应优化系统
export interface StreamConfig {
  bufferSize: number
  flushInterval: number
  compressionEnabled: boolean
  retryAttempts: number
  timeoutMs: number
  backpressureThreshold: number
}

export interface StreamMetrics {
  bytesTransferred: number
  chunksProcessed: number
  averageChunkSize: number
  throughputBps: number
  latencyMs: number
  errorRate: number
  connectionQuality: "excellent" | "good" | "fair" | "poor"
}

export interface StreamChunk {
  id: string
  data: string
  timestamp: number
  size: number
  isComplete: boolean
  metadata?: Record<string, any>
}

export interface StreamConnection {
  id: string
  url: string
  status: "connecting" | "connected" | "disconnected" | "error"
  metrics: StreamMetrics
  config: StreamConfig
  startTime: number
  lastActivity: number
}

export class StreamOptimizer {
  private static connections: Map<string, StreamConnection> = new Map()
  private static readonly DEFAULT_CONFIG: StreamConfig = {
    bufferSize: 8192,
    flushInterval: 100,
    compressionEnabled: true,
    retryAttempts: 3,
    timeoutMs: 30000,
    backpressureThreshold: 1024 * 1024, // 1MB
  }

  // 创建优化的流式连接
  static async createOptimizedStream(
    url: string,
    config: Partial<StreamConfig> = {},
    onChunk?: (chunk: StreamChunk) => void,
    onError?: (error: Error) => void,
    onComplete?: (metrics: StreamMetrics) => void,
  ): Promise<string> {
    const connectionId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config }

    const connection: StreamConnection = {
      id: connectionId,
      url,
      status: "connecting",
      config: finalConfig,
      startTime: Date.now(),
      lastActivity: Date.now(),
      metrics: {
        bytesTransferred: 0,
        chunksProcessed: 0,
        averageChunkSize: 0,
        throughputBps: 0,
        latencyMs: 0,
        errorRate: 0,
        connectionQuality: "good",
      },
    }

    this.connections.set(connectionId, connection)

    try {
      await this.establishConnection(connection, onChunk, onError, onComplete)
      return connectionId
    } catch (error) {
      this.connections.delete(connectionId)
      throw error
    }
  }

  // 建立连接
  private static async establishConnection(
    connection: StreamConnection,
    onChunk?: (chunk: StreamChunk) => void,
    onError?: (error: Error) => void,
    onComplete?: (metrics: StreamMetrics) => void,
  ): Promise<void> {
    let retryCount = 0
    const maxRetries = connection.config.retryAttempts

    while (retryCount <= maxRetries) {
      try {
        await this.attemptConnection(connection, onChunk, onError, onComplete)
        return
      } catch (error) {
        retryCount++
        connection.metrics.errorRate = retryCount / (retryCount + 1)

        if (retryCount > maxRetries) {
          connection.status = "error"
          if (onError) {
            onError(new Error(`连接失败，已重试 ${maxRetries} 次`))
          }
          throw error
        }

        // 指数退避重试
        const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  // 尝试建立连接
  private static async attemptConnection(
    connection: StreamConnection,
    onChunk?: (chunk: StreamChunk) => void,
    onError?: (error: Error) => void,
    onComplete?: (metrics: StreamMetrics) => void,
  ): Promise<void> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, connection.config.timeoutMs)

    try {
      const response = await fetch(connection.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          "Cache-Control": "no-cache",
          ...(connection.config.compressionEnabled && {
            "Accept-Encoding": "gzip, deflate, br",
          }),
        },
        body: JSON.stringify({
          stream: true,
          buffer_size: connection.config.bufferSize,
          compression: connection.config.compressionEnabled,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      connection.status = "connected"
      await this.processStream(connection, response, onChunk, onError, onComplete)
    } catch (error) {
      clearTimeout(timeoutId)
      connection.status = "error"
      throw error
    }
  }

  // 处理流数据
  private static async processStream(
    connection: StreamConnection,
    response: Response,
    onChunk?: (chunk: StreamChunk) => void,
    onError?: (error: Error) => void,
    onComplete?: (metrics: StreamMetrics) => void,
  ): Promise<void> {
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error("无法获取响应流")
    }

    const decoder = new TextDecoder()
    let buffer = ""
    let chunkCount = 0
    const startTime = Date.now()

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          connection.status = "disconnected"
          break
        }

        // 更新连接活动时间
        connection.lastActivity = Date.now()

        // 解码数据
        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk

        // 处理缓冲区中的完整消息
        const lines = buffer.split("\n")
        buffer = lines.pop() || "" // 保留不完整的行

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)

            if (data === "[DONE]") {
              // 流结束
              const finalMetrics = this.calculateFinalMetrics(connection, startTime)
              if (onComplete) {
                onComplete(finalMetrics)
              }
              return
            }

            try {
              // 创建流块
              const streamChunk: StreamChunk = {
                id: `chunk_${chunkCount++}`,
                data,
                timestamp: Date.now(),
                size: data.length,
                isComplete: false,
              }

              // 更新指标
              this.updateMetrics(connection, streamChunk, startTime)

              // 背压控制
              if (connection.metrics.bytesTransferred > connection.config.backpressureThreshold) {
                await new Promise((resolve) => setTimeout(resolve, 10))
              }

              // 调用回调
              if (onChunk) {
                onChunk(streamChunk)
              }
            } catch (error) {
              console.warn("处理流块失败:", error)
            }
          }
        }

        // 定期刷新缓冲区
        if (chunkCount % 10 === 0) {
          await new Promise((resolve) => setTimeout(resolve, connection.config.flushInterval))
        }
      }
    } catch (error) {
      connection.status = "error"
      if (onError) {
        onError(error as Error)
      }
      throw error
    } finally {
      reader.releaseLock()
    }
  }

  // 更新连接指标
  private static updateMetrics(connection: StreamConnection, chunk: StreamChunk, startTime: number): void {
    const metrics = connection.metrics

    metrics.bytesTransferred += chunk.size
    metrics.chunksProcessed++
    metrics.averageChunkSize = metrics.bytesTransferred / metrics.chunksProcessed

    const elapsedSeconds = (Date.now() - startTime) / 1000
    metrics.throughputBps = metrics.bytesTransferred / elapsedSeconds
    metrics.latencyMs = Date.now() - chunk.timestamp

    // 评估连接质量
    metrics.connectionQuality = this.assessConnectionQuality(metrics)
  }

  // 评估连接质量
  private static assessConnectionQuality(metrics: StreamMetrics): StreamMetrics["connectionQuality"] {
    const { throughputBps, latencyMs, errorRate } = metrics

    if (errorRate > 0.1 || latencyMs > 2000) {
      return "poor"
    } else if (errorRate > 0.05 || latencyMs > 1000 || throughputBps < 1024) {
      return "fair"
    } else if (latencyMs > 500 || throughputBps < 10240) {
      return "good"
    } else {
      return "excellent"
    }
  }

  // 计算最终指标
  private static calculateFinalMetrics(connection: StreamConnection, startTime: number): StreamMetrics {
    const totalTime = (Date.now() - startTime) / 1000
    const metrics = connection.metrics

    return {
      ...metrics,
      throughputBps: metrics.bytesTransferred / totalTime,
      latencyMs: (connection.lastActivity - startTime) / metrics.chunksProcessed,
    }
  }

  // 获取连接状态
  static getConnectionStatus(connectionId: string): StreamConnection | null {
    return this.connections.get(connectionId) || null
  }

  // 关闭连接
  static closeConnection(connectionId: string): boolean {
    const connection = this.connections.get(connectionId)
    if (connection) {
      connection.status = "disconnected"
      this.connections.delete(connectionId)
      return true
    }
    return false
  }

  // 获取所有活动连接
  static getActiveConnections(): StreamConnection[] {
    return Array.from(this.connections.values()).filter(
      (conn) => conn.status === "connected" || conn.status === "connecting",
    )
  }

  // 优化建议
  static getOptimizationSuggestions(connectionId: string): string[] {
    const connection = this.connections.get(connectionId)
    if (!connection) {
      return ["连接不存在"]
    }

    const suggestions: string[] = []
    const { metrics, config } = connection

    if (metrics.connectionQuality === "poor") {
      suggestions.push("网络连接质量较差，建议检查网络环境")
    }

    if (metrics.latencyMs > 1000) {
      suggestions.push("延迟较高，建议减少缓冲区大小或增加刷新频率")
    }

    if (metrics.throughputBps < 1024) {
      suggestions.push("吞吐量较低，建议启用压缩或增加缓冲区大小")
    }

    if (metrics.errorRate > 0.05) {
      suggestions.push("错误率较高，建议增加重试次数或检查服务器状态")
    }

    if (metrics.averageChunkSize < 100) {
      suggestions.push("数据块过小，建议增加缓冲区大小以提高效率")
    }

    if (!config.compressionEnabled && metrics.bytesTransferred > 10240) {
      suggestions.push("数据量较大，建议启用压缩以减少传输时间")
    }

    return suggestions.length > 0 ? suggestions : ["连接状态良好，无需优化"]
  }

  // 自动优化配置
  static autoOptimizeConfig(connectionId: string): StreamConfig | null {
    const connection = this.connections.get(connectionId)
    if (!connection) {
      return null
    }

    const { metrics, config } = connection
    const optimizedConfig = { ...config }

    // 根据连接质量调整配置
    switch (metrics.connectionQuality) {
      case "poor":
        optimizedConfig.bufferSize = Math.max(1024, config.bufferSize / 2)
        optimizedConfig.flushInterval = Math.max(50, config.flushInterval / 2)
        optimizedConfig.retryAttempts = Math.min(5, config.retryAttempts + 1)
        optimizedConfig.timeoutMs = Math.min(60000, config.timeoutMs * 1.5)
        break

      case "fair":
        optimizedConfig.bufferSize = Math.max(2048, config.bufferSize * 0.8)
        optimizedConfig.flushInterval = Math.max(75, config.flushInterval * 0.8)
        break

      case "excellent":
        optimizedConfig.bufferSize = Math.min(16384, config.bufferSize * 1.5)
        optimizedConfig.flushInterval = Math.min(200, config.flushInterval * 1.2)
        optimizedConfig.compressionEnabled = true
        break
    }

    // 根据延迟调整
    if (metrics.latencyMs > 1000) {
      optimizedConfig.flushInterval = Math.max(25, optimizedConfig.flushInterval / 2)
    }

    // 根据吞吐量调整
    if (metrics.throughputBps < 1024) {
      optimizedConfig.compressionEnabled = true
      optimizedConfig.bufferSize = Math.min(16384, optimizedConfig.bufferSize * 2)
    }

    return optimizedConfig
  }

  // 性能监控报告
  static getPerformanceReport(): {
    totalConnections: number
    activeConnections: number
    averageLatency: number
    averageThroughput: number
    qualityDistribution: Record<string, number>
    recommendations: string[]
  } {
    const connections = Array.from(this.connections.values())
    const activeConnections = connections.filter((c) => c.status === "connected")

    const totalLatency = connections.reduce((sum, c) => sum + c.metrics.latencyMs, 0)
    const totalThroughput = connections.reduce((sum, c) => sum + c.metrics.throughputBps, 0)

    const qualityDistribution = connections.reduce(
      (dist, c) => {
        dist[c.metrics.connectionQuality] = (dist[c.metrics.connectionQuality] || 0) + 1
        return dist
      },
      {} as Record<string, number>,
    )

    const recommendations: string[] = []

    if (activeConnections.length === 0) {
      recommendations.push("当前无活动连接")
    } else {
      const avgLatency = totalLatency / connections.length
      const avgThroughput = totalThroughput / connections.length

      if (avgLatency > 1000) {
        recommendations.push("平均延迟较高，建议优化网络配置")
      }

      if (avgThroughput < 1024) {
        recommendations.push("平均吞吐量较低，建议启用压缩")
      }

      const poorQualityRatio = (qualityDistribution.poor || 0) / connections.length
      if (poorQualityRatio > 0.2) {
        recommendations.push("超过20%的连接质量较差，建议检查网络环境")
      }
    }

    return {
      totalConnections: connections.length,
      activeConnections: activeConnections.length,
      averageLatency: connections.length > 0 ? totalLatency / connections.length : 0,
      averageThroughput: connections.length > 0 ? totalThroughput / connections.length : 0,
      qualityDistribution,
      recommendations,
    }
  }
}

// React Hook for stream optimization
export function useStreamOptimizer() {
  const [connections, setConnections] = useState<StreamConnection[]>([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createStream = async (url: string, config?: Partial<StreamConfig>, onChunk?: (chunk: StreamChunk) => void) => {
    setIsConnecting(true)
    setError(null)

    try {
      const connectionId = await StreamOptimizer.createOptimizedStream(
        url,
        config,
        onChunk,
        (error) => setError(error.message),
        (metrics) => console.log("Stream completed:", metrics),
      )

      // 更新连接列表
      const connection = StreamOptimizer.getConnectionStatus(connectionId)
      if (connection) {
        setConnections((prev) => [...prev, connection])
      }

      return connectionId
    } catch (err) {
      setError(err instanceof Error ? err.message : "连接失败")
      return null
    } finally {
      setIsConnecting(false)
    }
  }

  const closeStream = (connectionId: string) => {
    StreamOptimizer.closeConnection(connectionId)
    setConnections((prev) => prev.filter((c) => c.id !== connectionId))
  }

  const getOptimizationSuggestions = (connectionId: string) => {
    return StreamOptimizer.getOptimizationSuggestions(connectionId)
  }

  const getPerformanceReport = () => {
    return StreamOptimizer.getPerformanceReport()
  }

  return {
    connections,
    isConnecting,
    error,
    createStream,
    closeStream,
    getOptimizationSuggestions,
    getPerformanceReport,
    reset: () => {
      setConnections([])
      setError(null)
    },
  }
}
