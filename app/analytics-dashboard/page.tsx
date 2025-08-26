"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Activity,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Zap,
} from "lucide-react"
import { AnalyticsDashboard, DataVisualization, type AnalyticsData } from "@/lib/analytics-dashboard"

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [realTimeData, setRealTimeData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState("24h")

  const dashboard = AnalyticsDashboard.getInstance()

  useEffect(() => {
    loadData()
    loadRealTimeData()

    let refreshInterval: NodeJS.Timeout
    if (autoRefresh) {
      refreshInterval = setInterval(() => {
        loadRealTimeData()
      }, 5000)
    }

    return () => {
      if (refreshInterval) clearInterval(refreshInterval)
    }
  }, [autoRefresh])

  const loadData = async () => {
    setLoading(true)
    try {
      const analyticsData = await dashboard.getAnalyticsData()
      setData(analyticsData)
    } catch (error) {
      console.error("加载数据失败:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadRealTimeData = async () => {
    try {
      const realTime = await dashboard.getRealTimeData()
      setRealTimeData(realTime)
    } catch (error) {
      console.error("加载实时数据失败:", error)
    }
  }

  const handleExport = async (format: "csv" | "json" | "pdf") => {
    try {
      const blob = await dashboard.exportData(format)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `analytics-${new Date().toISOString().split("T")[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("导出失败:", error)
    }
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载分析数据中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题和控制 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">数据分析面板</h1>
            <p className="text-gray-600 mt-2">实时监控系统性能和用户行为</p>
          </div>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? "bg-green-50 border-green-200" : ""}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
              {autoRefresh ? "自动刷新" : "手动刷新"}
            </Button>
            <Button onClick={loadData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新数据
            </Button>
            <Button onClick={() => handleExport("csv")} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              导出数据
            </Button>
          </div>
        </div>

        {/* 实时状态卡片 */}
        {realTimeData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">在线用户</p>
                    <p className="text-2xl font-bold text-gray-900">{realTimeData.activeUsers}</p>
                  </div>
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">实时更新</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">当前查询</p>
                    <p className="text-2xl font-bold text-gray-900">{realTimeData.currentQueries}</p>
                  </div>
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Activity className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="flex items-center mt-2">
                  <Zap className="h-3 w-3 text-blue-500 mr-1" />
                  <span className="text-xs text-blue-600">处理中</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">系统负载</p>
                    <p className="text-2xl font-bold text-gray-900">{realTimeData.systemLoad.toFixed(1)}%</p>
                  </div>
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      realTimeData.systemLoad < 70
                        ? "bg-green-100"
                        : realTimeData.systemLoad < 90
                          ? "bg-yellow-100"
                          : "bg-red-100"
                    }`}
                  >
                    <BarChart3
                      className={`h-4 w-4 ${
                        realTimeData.systemLoad < 70
                          ? "text-green-600"
                          : realTimeData.systemLoad < 90
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    />
                  </div>
                </div>
                <div className="flex items-center mt-2">
                  {realTimeData.systemLoad < 70 ? (
                    <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-yellow-500 mr-1" />
                  )}
                  <span className={`text-xs ${realTimeData.systemLoad < 70 ? "text-green-600" : "text-yellow-600"}`}>
                    {realTimeData.systemLoad < 70 ? "正常" : "注意"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">响应时间</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {DataVisualization.formatDuration(realTimeData.responseTime)}
                    </p>
                  </div>
                  <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Clock className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-3 w-3 text-purple-500 mr-1" />
                  <span className="text-xs text-purple-600">平均值</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 主要指标 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">总查询数</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {DataVisualization.formatNumber(data.totalQueries)}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <div className="mt-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  今日统计
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">成功率</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {DataVisualization.formatPercentage(data.successRate)}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="mt-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  优秀
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">平均响应时间</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {DataVisualization.formatDuration(data.averageResponseTime)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
              <div className="mt-2">
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  良好
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">活跃用户</p>
                  <p className="text-2xl font-bold text-gray-900">{DataVisualization.formatNumber(data.activeUsers)}</p>
                </div>
                <Users className="h-8 w-8 text-orange-600" />
              </div>
              <div className="mt-2">
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  增长中
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 详细分析 */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="performance">性能</TabsTrigger>
            <TabsTrigger value="users">用户</TabsTrigger>
            <TabsTrigger value="system">系统</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 热门查询 */}
              <Card>
                <CardHeader>
                  <CardTitle>热门查询</CardTitle>
                  <CardDescription>最受欢迎的搜索内容</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.popularQueries.map((query, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{query.query}</p>
                          <p className="text-sm text-gray-600">
                            {query.count} 次查询 • 成功率 {DataVisualization.formatPercentage(query.successRate)}
                          </p>
                        </div>
                        <Badge variant="outline">#{index + 1}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 时间序列图表 */}
              <Card>
                <CardHeader>
                  <CardTitle>查询趋势</CardTitle>
                  <CardDescription>24小时查询量变化</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <p className="text-gray-500">图表区域 - 显示时间序列数据</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">API延迟</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {DataVisualization.formatDuration(data.performanceMetrics.apiLatency)}
                    </p>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(data.performanceMetrics.apiLatency / 10, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">缓存命中率</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {DataVisualization.formatPercentage(data.performanceMetrics.cacheHitRate)}
                    </p>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${data.performanceMetrics.cacheHitRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">错误率</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {DataVisualization.formatPercentage(data.performanceMetrics.errorRate)}
                    </p>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-600 h-2 rounded-full"
                          style={{ width: `${data.performanceMetrics.errorRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">吞吐量</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {DataVisualization.formatNumber(data.performanceMetrics.throughput)}/s
                    </p>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${Math.min(data.performanceMetrics.throughput / 20, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">日活用户</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {DataVisualization.formatNumber(data.userEngagement.dailyActiveUsers)}
                    </p>
                    <Badge variant="secondary" className="mt-2 bg-blue-100 text-blue-800">
                      +12.5%
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">会话时长</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {data.userEngagement.sessionDuration.toFixed(1)}分钟
                    </p>
                    <Badge variant="secondary" className="mt-2 bg-green-100 text-green-800">
                      优秀
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">跳出率</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {DataVisualization.formatPercentage(data.userEngagement.bounceRate)}
                    </p>
                    <Badge variant="secondary" className="mt-2 bg-yellow-100 text-yellow-800">
                      正常
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">回访用户</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {DataVisualization.formatPercentage(data.userEngagement.returnUsers)}
                    </p>
                    <Badge variant="secondary" className="mt-2 bg-purple-100 text-purple-800">
                      良好
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">CPU使用率</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {DataVisualization.formatPercentage(data.systemHealth.cpuUsage)}
                    </p>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            data.systemHealth.cpuUsage < 70
                              ? "bg-green-600"
                              : data.systemHealth.cpuUsage < 90
                                ? "bg-yellow-600"
                                : "bg-red-600"
                          }`}
                          style={{ width: `${data.systemHealth.cpuUsage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">内存使用率</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {DataVisualization.formatPercentage(data.systemHealth.memoryUsage)}
                    </p>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            data.systemHealth.memoryUsage < 70
                              ? "bg-green-600"
                              : data.systemHealth.memoryUsage < 90
                                ? "bg-yellow-600"
                                : "bg-red-600"
                          }`}
                          style={{ width: `${data.systemHealth.memoryUsage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">磁盘使用率</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {DataVisualization.formatPercentage(data.systemHealth.diskUsage)}
                    </p>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${data.systemHealth.diskUsage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">网络延迟</p>
                    <p className="text-2xl font-bold text-gray-900">{data.systemHealth.networkLatency.toFixed(1)}ms</p>
                    <Badge variant="secondary" className="mt-2 bg-green-100 text-green-800">
                      优秀
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
