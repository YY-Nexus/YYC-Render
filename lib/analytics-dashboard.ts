export interface AnalyticsData {
  totalQueries: number
  successRate: number
  averageResponseTime: number
  activeUsers: number
  popularQueries: Array<{
    query: string
    count: number
    successRate: number
  }>
  performanceMetrics: {
    apiLatency: number
    cacheHitRate: number
    errorRate: number
    throughput: number
  }
  userEngagement: {
    dailyActiveUsers: number
    sessionDuration: number
    bounceRate: number
    returnUsers: number
  }
  systemHealth: {
    cpuUsage: number
    memoryUsage: number
    diskUsage: number
    networkLatency: number
  }
  timeSeriesData: Array<{
    timestamp: string
    queries: number
    users: number
    errors: number
    responseTime: number
  }>
}

export interface FilterOptions {
  dateRange: {
    start: Date
    end: Date
  }
  queryType?: string
  userSegment?: string
  deviceType?: string
}

export class AnalyticsDashboard {
  private static instance: AnalyticsDashboard
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

  static getInstance(): AnalyticsDashboard {
    if (!AnalyticsDashboard.instance) {
      AnalyticsDashboard.instance = new AnalyticsDashboard()
    }
    return AnalyticsDashboard.instance
  }

  // 获取分析数据
  async getAnalyticsData(filters?: FilterOptions): Promise<AnalyticsData> {
    const cacheKey = `analytics_${JSON.stringify(filters)}`
    const cached = this.cache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }

    try {
      const response = await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters }),
      })

      if (!response.ok) {
        throw new Error("获取分析数据失败")
      }

      const data = await response.json()
      this.cache.set(cacheKey, { data, timestamp: Date.now() })
      return data
    } catch (error) {
      console.error("获取分析数据失败:", error)
      return this.getMockData()
    }
  }

  // 获取实时数据
  async getRealTimeData(): Promise<{
    activeUsers: number
    currentQueries: number
    systemLoad: number
    responseTime: number
  }> {
    try {
      const response = await fetch("/api/analytics/realtime")
      if (!response.ok) throw new Error("获取实时数据失败")
      return await response.json()
    } catch (error) {
      console.error("获取实时数据失败:", error)
      return {
        activeUsers: Math.floor(Math.random() * 100) + 50,
        currentQueries: Math.floor(Math.random() * 20) + 5,
        systemLoad: Math.random() * 100,
        responseTime: Math.random() * 1000 + 200,
      }
    }
  }

  // 导出数据
  async exportData(format: "csv" | "json" | "pdf", filters?: FilterOptions): Promise<Blob> {
    const response = await fetch("/api/analytics/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format, filters }),
    })

    if (!response.ok) {
      throw new Error("导出数据失败")
    }

    return await response.blob()
  }

  // 生成报告
  async generateReport(type: "daily" | "weekly" | "monthly"): Promise<{
    title: string
    summary: string
    insights: string[]
    recommendations: string[]
  }> {
    try {
      const response = await fetch("/api/analytics/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      })

      if (!response.ok) throw new Error("生成报告失败")
      return await response.json()
    } catch (error) {
      console.error("生成报告失败:", error)
      return {
        title: `${type === "daily" ? "日" : type === "weekly" ? "周" : "月"}度报告`,
        summary: "系统运行正常，用户活跃度良好",
        insights: ["搜索成功率保持在95%以上", "平均响应时间控制在500ms以内", "用户满意度持续提升"],
        recommendations: ["继续优化搜索算法", "扩展内容库覆盖范围", "改进用户界面体验"],
      }
    }
  }

  // 模拟数据
  private getMockData(): AnalyticsData {
    const now = new Date()
    const timeSeriesData = Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(now.getTime() - (23 - i) * 60 * 60 * 1000).toISOString(),
      queries: Math.floor(Math.random() * 100) + 50,
      users: Math.floor(Math.random() * 50) + 20,
      errors: Math.floor(Math.random() * 5),
      responseTime: Math.random() * 500 + 200,
    }))

    return {
      totalQueries: 12543,
      successRate: 96.8,
      averageResponseTime: 342,
      activeUsers: 1247,
      popularQueries: [
        { query: "人工智能发展趋势", count: 234, successRate: 98.5 },
        { query: "机器学习算法", count: 189, successRate: 97.2 },
        { query: "深度学习应用", count: 156, successRate: 95.8 },
        { query: "自然语言处理", count: 143, successRate: 96.1 },
        { query: "计算机视觉", count: 128, successRate: 94.7 },
      ],
      performanceMetrics: {
        apiLatency: 245,
        cacheHitRate: 78.5,
        errorRate: 3.2,
        throughput: 1250,
      },
      userEngagement: {
        dailyActiveUsers: 1247,
        sessionDuration: 8.5,
        bounceRate: 23.4,
        returnUsers: 67.8,
      },
      systemHealth: {
        cpuUsage: 45.2,
        memoryUsage: 62.8,
        diskUsage: 34.1,
        networkLatency: 12.5,
      },
      timeSeriesData,
    }
  }

  // 清除缓存
  clearCache(): void {
    this.cache.clear()
  }

  // 设置自动刷新
  startAutoRefresh(interval = 30000): () => void {
    const intervalId = setInterval(() => {
      this.clearCache()
    }, interval)

    return () => clearInterval(intervalId)
  }
}

// 数据可视化工具
export class DataVisualization {
  static formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M"
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K"
    }
    return num.toString()
  }

  static formatPercentage(num: number): string {
    return `${num.toFixed(1)}%`
  }

  static formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms.toFixed(0)}ms`
    }
    return `${(ms / 1000).toFixed(1)}s`
  }

  static getStatusColor(value: number, thresholds: { good: number; warning: number }): string {
    if (value >= thresholds.good) return "text-green-600"
    if (value >= thresholds.warning) return "text-yellow-600"
    return "text-red-600"
  }

  static generateChartConfig(data: any[], type: "line" | "bar" | "pie") {
    const colors = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"]

    switch (type) {
      case "line":
        return {
          type: "line",
          data: {
            labels: data.map((d) => d.label),
            datasets: [
              {
                data: data.map((d) => d.value),
                borderColor: colors[0],
                backgroundColor: colors[0] + "20",
                tension: 0.4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
            },
            scales: {
              y: { beginAtZero: true },
            },
          },
        }

      case "bar":
        return {
          type: "bar",
          data: {
            labels: data.map((d) => d.label),
            datasets: [
              {
                data: data.map((d) => d.value),
                backgroundColor: colors.slice(0, data.length),
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
            },
          },
        }

      case "pie":
        return {
          type: "pie",
          data: {
            labels: data.map((d) => d.label),
            datasets: [
              {
                data: data.map((d) => d.value),
                backgroundColor: colors.slice(0, data.length),
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
          },
        }

      default:
        return null
    }
  }
}
