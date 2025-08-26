"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Database,
  Brain,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Activity,
  HardDrive,
  MemoryStick,
} from "lucide-react"

interface SystemStatus {
  database: {
    status: "healthy" | "degraded" | "unhealthy"
    connections: number
    activeConnection: string | null
    details: any[]
  }
  ai: {
    status: "healthy" | "degraded" | "unhealthy"
    activeProvider: string
    providers: Record<string, any>
  }
  performance: {
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
  }
  errors: {
    total: number
    byType: Record<string, number>
    bySeverity: Record<string, number>
    recent: any[]
  }
}

export default function SystemStatusPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchSystemStatus = async () => {
    try {
      setRefreshing(true)

      // 并行获取各个系统的状态
      const [dbResponse, aiResponse, perfResponse, errorResponse] = await Promise.all([
        fetch("/api/database?action=health"),
        fetch("/api/ai?action=health"),
        fetch("/api/performance?action=report"),
        fetch("/api/errors?action=stats"),
      ])

      const [dbData, aiData, perfData, errorData] = await Promise.all([
        dbResponse.json(),
        aiResponse.json(),
        perfResponse.json(),
        errorResponse.json(),
      ])

      setStatus({
        database: dbData.data,
        ai: aiData.data,
        performance: perfData.data,
        errors: errorData.data || {
          total: 0,
          byType: {},
          bySeverity: {},
          recent: [],
        },
      })

      setLastUpdated(new Date())
    } catch (error) {
      console.error("获取系统状态失败:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleOptimize = async () => {
    try {
      const response = await fetch("/api/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "optimize" }),
      })

      const result = await response.json()
      if (result.success) {
        alert(`优化完成: ${result.data.optimizationsApplied.join(", ")}`)
        fetchSystemStatus()
      }
    } catch (error) {
      console.error("系统优化失败:", error)
      alert("系统优化失败")
    }
  }

  const handleClearCache = async () => {
    try {
      const response = await fetch("/api/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_cache" }),
      })

      const result = await response.json()
      if (result.success) {
        alert("缓存已清空")
        fetchSystemStatus()
      }
    } catch (error) {
      console.error("清空缓存失败:", error)
      alert("清空缓存失败")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600"
      case "degraded":
        return "text-yellow-600"
      case "unhealthy":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "degraded":
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case "unhealthy":
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Activity className="w-5 h-5 text-gray-600" />
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  useEffect(() => {
    fetchSystemStatus()

    // 每30秒自动刷新
    const interval = setInterval(fetchSystemStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">正在加载系统状态...</p>
        </div>
      </div>
    )
  }

  if (!status) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-8 h-8 mx-auto mb-4 text-red-600" />
          <p className="text-gray-600">无法获取系统状态</p>
          <Button onClick={fetchSystemStatus} className="mt-4">
            重试
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">系统状态监控</h1>
            <p className="text-sm text-gray-500">最后更新: {lastUpdated?.toLocaleString("zh-CN") || "未知"}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={fetchSystemStatus} disabled={refreshing} variant="outline" size="sm">
              {refreshing ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              刷新
            </Button>
            <Button onClick={handleOptimize} size="sm">
              <Zap className="w-4 h-4 mr-2" />
              优化系统
            </Button>
            <Button onClick={handleClearCache} variant="outline" size="sm">
              <HardDrive className="w-4 h-4 mr-2" />
              清空缓存
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* 系统概览卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">数据库状态</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {getStatusIcon(status.database.status)}
                <span className={`text-2xl font-bold ${getStatusColor(status.database.status)}`}>
                  {status.database.status === "healthy"
                    ? "正常"
                    : status.database.status === "degraded"
                      ? "降级"
                      : "异常"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{status.database.connections} 个连接</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI服务状态</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {getStatusIcon(status.ai.status)}
                <span className={`text-2xl font-bold ${getStatusColor(status.ai.status)}`}>
                  {status.ai.status === "healthy" ? "正常" : status.ai.status === "degraded" ? "降级" : "异常"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">当前: {status.ai.activeProvider}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">内存使用</CardTitle>
              <MemoryStick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(status.performance.memoryUsage.percentage)}</div>
              <Progress value={status.performance.memoryUsage.percentage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {formatBytes(status.performance.memoryUsage.used)} / {formatBytes(status.performance.memoryUsage.total)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">缓存命中率</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(status.performance.cacheStats.hitRate)}</div>
              <Progress value={status.performance.cacheStats.hitRate} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {status.performance.cacheStats.hits} 命中 / {status.performance.cacheStats.misses} 未命中
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 详细信息标签页 */}
        <Tabs defaultValue="database" className="space-y-4">
          <TabsList>
            <TabsTrigger value="database">数据库</TabsTrigger>
            <TabsTrigger value="ai">AI服务</TabsTrigger>
            <TabsTrigger value="performance">性能</TabsTrigger>
            <TabsTrigger value="errors">错误</TabsTrigger>
          </TabsList>

          <TabsContent value="database" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>数据库连接详情</CardTitle>
                <CardDescription>当前活动连接: {status.database.activeConnection || "无"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {status.database.details.map((conn: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{conn.id}</div>
                        <div className="text-sm text-gray-500">
                          {conn.type} - {conn.host}
                        </div>
                        {conn.lastConnected && (
                          <div className="text-xs text-gray-400">
                            最后连接: {new Date(conn.lastConnected).toLocaleString("zh-CN")}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={conn.status === "connected" ? "default" : "destructive"}>
                          {conn.status === "connected" ? "已连接" : "未连接"}
                        </Badge>
                        {conn.error && <span className="text-xs text-red-500">{conn.error}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI提供商状态</CardTitle>
                <CardDescription>当前活动提供商: {status.ai.activeProvider}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(status.ai.providers).map(([name, info]: [string, any]) => (
                    <div key={name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{name}</div>
                        <div className="text-sm text-gray-500">模型: {info.model}</div>
                        {info.latency && <div className="text-xs text-gray-400">延迟: {info.latency}ms</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={info.available ? "default" : "destructive"}>
                          {info.available ? "可用" : "不可用"}
                        </Badge>
                        {info.error && <span className="text-xs text-red-500">{info.error}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>内存使用情况</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>已使用</span>
                        <span>{formatBytes(status.performance.memoryUsage.used)}</span>
                      </div>
                      <Progress value={status.performance.memoryUsage.percentage} className="mt-1" />
                    </div>
                    <div className="text-xs text-gray-500">
                      总内存: {formatBytes(status.performance.memoryUsage.total)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>缓存统计</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">命中次数</div>
                        <div className="text-2xl font-bold text-green-600">{status.performance.cacheStats.hits}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">未命中次数</div>
                        <div className="text-2xl font-bold text-red-600">{status.performance.cacheStats.misses}</div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>缓存使用</span>
                        <span>{formatBytes(status.performance.cacheStats.size)}</span>
                      </div>
                      <Progress
                        value={(status.performance.cacheStats.size / status.performance.cacheStats.maxSize) * 100}
                        className="mt-1"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        最大: {formatBytes(status.performance.cacheStats.maxSize)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="errors" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>错误统计</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-3xl font-bold">{status.errors.total}</div>
                    <div className="text-sm text-gray-500">总错误数</div>

                    <div className="space-y-2">
                      <h4 className="font-medium">按严重程度</h4>
                      {Object.entries(status.errors.bySeverity).map(([severity, count]) => (
                        <div key={severity} className="flex justify-between">
                          <span className="capitalize">{severity}</span>
                          <span>{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>最近错误</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {status.errors.recent.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">暂无最近错误</p>
                    ) : (
                      status.errors.recent.slice(0, 5).map((error: any, index: number) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="destructive" className="text-xs">
                              {error.type}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(error.timestamp).toLocaleString("zh-CN")}
                            </span>
                          </div>
                          <p className="text-sm">{error.userMessage}</p>
                        </div>
                      ))
                    )}
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
