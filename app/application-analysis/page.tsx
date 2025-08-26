"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  BarChart3,
  Users,
  Clock,
  TrendingUp,
  Download,
  Share2,
  Globe,
  Smartphone,
  Monitor,
  Activity,
  Zap,
  Target,
  CheckCircle,
  AlertTriangle,
  Info,
} from "lucide-react"

interface AnalyticsData {
  overview: {
    totalUsers: number
    activeUsers: number
    totalSessions: number
    avgSessionDuration: number
    bounceRate: number
    conversionRate: number
  }
  usage: {
    dailyActiveUsers: { date: string; count: number }[]
    featureUsage: { feature: string; usage: number; trend: number }[]
    deviceBreakdown: { device: string; percentage: number }[]
    geographicData: { country: string; users: number; percentage: number }[]
  }
  performance: {
    loadTimes: { page: string; avgTime: number; p95Time: number }[]
    errorRates: { type: string; count: number; percentage: number }[]
    apiPerformance: { endpoint: string; avgResponse: number; errorRate: number }[]
  }
  content: {
    popularQueries: { query: string; count: number; successRate: number }[]
    generatedContent: { type: string; count: number; quality: number }[]
    userFeedback: { rating: number; count: number; percentage: number }[]
  }
  insights: {
    keyFindings: string[]
    recommendations: string[]
    alerts: { type: "warning" | "error" | "info"; message: string }[]
  }
}

export default function ApplicationAnalysisPage() {
  const router = useRouter()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d")
  const [selectedMetric, setSelectedMetric] = useState<"users" | "sessions" | "performance">("users")

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    setIsLoading(true)

    try {
      // 模拟加载分析数据
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const mockData: AnalyticsData = {
        overview: {
          totalUsers: 12847,
          activeUsers: 8932,
          totalSessions: 45621,
          avgSessionDuration: 8.5,
          bounceRate: 23.4,
          conversionRate: 12.8,
        },
        usage: {
          dailyActiveUsers: generateDailyData(30),
          featureUsage: [
            { feature: "AI搜索", usage: 89.2, trend: 5.3 },
            { feature: "思维导图生成", usage: 76.8, trend: 12.1 },
            { feature: "海报生成", usage: 64.5, trend: -2.4 },
            { feature: "PPT生成", usage: 58.9, trend: 8.7 },
            { feature: "网页生成", usage: 45.2, trend: 15.6 },
            { feature: "社区分享", usage: 38.7, trend: 3.2 },
            { feature: "学习路径", usage: 32.1, trend: 9.8 },
            { feature: "本地LLM", usage: 28.4, trend: 22.3 },
          ],
          deviceBreakdown: [
            { device: "桌面端", percentage: 58.3 },
            { device: "移动端", percentage: 35.7 },
            { device: "平板端", percentage: 6.0 },
          ],
          geographicData: [
            { country: "中国", users: 7892, percentage: 61.4 },
            { country: "美国", users: 1847, percentage: 14.4 },
            { country: "日本", users: 1234, percentage: 9.6 },
            { country: "德国", users: 892, percentage: 6.9 },
            { country: "其他", users: 982, percentage: 7.7 },
          ],
        },
        performance: {
          loadTimes: [
            { page: "首页", avgTime: 1.2, p95Time: 2.8 },
            { page: "搜索结果", avgTime: 2.1, p95Time: 4.5 },
            { page: "思维导图", avgTime: 3.4, p95Time: 7.2 },
            { page: "海报生成", avgTime: 4.8, p95Time: 9.1 },
            { page: "社区", avgTime: 1.8, p95Time: 3.6 },
          ],
          errorRates: [
            { type: "4xx错误", count: 234, percentage: 2.1 },
            { type: "5xx错误", count: 89, percentage: 0.8 },
            { type: "超时错误", count: 156, percentage: 1.4 },
            { type: "网络错误", count: 67, percentage: 0.6 },
          ],
          apiPerformance: [
            { endpoint: "/api/chat", avgResponse: 850, errorRate: 0.5 },
            { endpoint: "/api/generate", avgResponse: 2340, errorRate: 1.2 },
            { endpoint: "/api/upload", avgResponse: 1200, errorRate: 0.8 },
            { endpoint: "/api/auth", avgResponse: 320, errorRate: 0.3 },
          ],
        },
        content: {
          popularQueries: [
            { query: "人工智能", count: 2847, successRate: 94.2 },
            { query: "机器学习", count: 2156, successRate: 91.8 },
            { query: "深度学习", count: 1923, successRate: 89.5 },
            { query: "自然语言处理", count: 1678, successRate: 87.3 },
            { query: "计算机视觉", count: 1445, successRate: 85.9 },
            { query: "区块链", count: 1289, successRate: 82.4 },
            { query: "量子计算", count: 1067, successRate: 79.8 },
            { query: "物联网", count: 934, successRate: 88.7 },
          ],
          generatedContent: [
            { type: "思维导图", count: 8934, quality: 4.3 },
            { type: "知识海报", count: 6782, quality: 4.1 },
            { type: "PPT演示", count: 4567, quality: 4.0 },
            { type: "互动网页", count: 3421, quality: 4.2 },
            { type: "学习路径", count: 2156, quality: 4.4 },
          ],
          userFeedback: [
            { rating: 5, count: 3456, percentage: 45.2 },
            { rating: 4, count: 2789, percentage: 36.5 },
            { rating: 3, count: 987, percentage: 12.9 },
            { rating: 2, count: 234, percentage: 3.1 },
            { rating: 1, count: 178, percentage: 2.3 },
          ],
        },
        insights: {
          keyFindings: [
            "用户对AI生成内容的满意度达到81.7%，较上月提升3.2%",
            "思维导图功能使用率增长12.1%，成为最受欢迎的新功能",
            "移动端用户占比持续增长，已达35.7%",
            "本地LLM功能虽然使用率较低，但增长趋势强劲(+22.3%)",
            "用户平均会话时长为8.5分钟，表明用户粘性良好",
          ],
          recommendations: [
            "优化移动端体验，特别是思维导图和海报生成功能",
            "加强本地LLM功能的推广和用户教育",
            "改进海报生成功能，提升用户满意度",
            "扩展国际市场，特别是欧美地区的用户获取",
            "优化API性能，减少生成内容的等待时间",
          ],
          alerts: [
            { type: "warning", message: "海报生成功能使用率下降2.4%，需要关注" },
            { type: "info", message: "新用户注册量较上月增长15.6%" },
            { type: "error", message: "API错误率略有上升，需要技术团队关注" },
          ],
        },
      }

      setAnalyticsData(mockData)
    } catch (error) {
      console.error("加载分析数据失败:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateDailyData = (days: number) => {
    const data = []
    const baseUsers = 8000

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const variation = Math.random() * 2000 - 1000
      const weekendFactor = date.getDay() === 0 || date.getDay() === 6 ? 0.8 : 1

      data.push({
        date: date.toISOString().split("T")[0],
        count: Math.round((baseUsers + variation) * weekendFactor),
      })
    }

    return data
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M"
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K"
    }
    return num.toString()
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) {
      return <TrendingUp className="w-4 h-4 text-green-600" />
    }
    return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      default:
        return <Info className="w-4 h-4 text-blue-600" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg mb-2">正在分析应用数据...</p>
          <p className="text-gray-500 text-sm">收集用户行为和性能指标</p>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">加载分析数据失败</p>
          <Button onClick={() => router.back()}>返回</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部工具栏 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-5 h-5 mr-2" />
                返回
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">应用功能分析报告</h1>
                <p className="text-sm text-gray-500">
                  数据时间范围: 最近{timeRange === "7d" ? "7天" : timeRange === "30d" ? "30天" : "90天"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* 时间范围选择 */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <Button variant={timeRange === "7d" ? "default" : "ghost"} size="sm" onClick={() => setTimeRange("7d")}>
                  7天
                </Button>
                <Button
                  variant={timeRange === "30d" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeRange("30d")}
                >
                  30天
                </Button>
                <Button
                  variant={timeRange === "90d" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeRange("90d")}
                >
                  90天
                </Button>
              </div>

              <Button variant="ghost" size="sm">
                <Download className="w-5 h-5" />
              </Button>

              <Button variant="ghost" size="sm">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* 概览指标 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">总用户数</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.overview.totalUsers)}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">活跃用户</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.overview.activeUsers)}</p>
                </div>
                <Activity className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">总会话数</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(analyticsData.overview.totalSessions)}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">平均会话时长</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.avgSessionDuration}分钟</p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">跳出率</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.bounceRate}%</p>
                </div>
                <Target className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">转化率</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.conversionRate}%</p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 主要分析内容 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧主要图表区域 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 功能使用情况 */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-blue-600" />
                  功能使用情况
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.usage.featureUsage.map((feature) => (
                    <div key={feature.feature} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{feature.feature}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{feature.usage}%</span>
                          {getTrendIcon(feature.trend)}
                          <span className={`text-sm ${feature.trend > 0 ? "text-green-600" : "text-red-600"}`}>
                            {feature.trend > 0 ? "+" : ""}
                            {feature.trend}%
                          </span>
                        </div>
                      </div>
                      <Progress value={feature.usage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 热门搜索查询 */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
                  热门搜索查询
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.content.popularQueries.map((query, index) => (
                    <div key={query.query} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <span className="font-medium text-gray-900">{query.query}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-gray-600">{formatNumber(query.count)} 次</span>
                        <Badge
                          variant="outline"
                          className={`${query.successRate > 90 ? "bg-green-100 text-green-700" : query.successRate > 80 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}
                        >
                          成功率 {query.successRate}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 性能指标 */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-purple-600" />
                  页面性能指标
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.performance.loadTimes.map((page) => (
                    <div
                      key={page.page}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <span className="font-medium text-gray-900">{page.page}</span>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="text-center">
                          <div className="text-gray-600">平均</div>
                          <div className="font-bold text-blue-600">{page.avgTime}s</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-600">P95</div>
                          <div className="font-bold text-orange-600">{page.p95Time}s</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧辅助信息 */}
          <div className="space-y-6">
            {/* 设备分布 */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Monitor className="w-5 h-5 mr-2 text-indigo-600" />
                  设备分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.usage.deviceBreakdown.map((device) => (
                    <div key={device.device} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {device.device === "桌面端" && <Monitor className="w-4 h-4" />}
                          {device.device === "移动端" && <Smartphone className="w-4 h-4" />}
                          {device.device === "平板端" && <Monitor className="w-4 h-4" />}
                          <span className="text-sm font-medium">{device.device}</span>
                        </div>
                        <span className="text-sm text-gray-600">{device.percentage}%</span>
                      </div>
                      <Progress value={device.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 地理分布 */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-emerald-600" />
                  地理分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.usage.geographicData.map((geo) => (
                    <div key={geo.country} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{geo.country}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{formatNumber(geo.users)}</span>
                        <Badge variant="outline" className="text-xs">
                          {geo.percentage}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 用户反馈 */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-yellow-600" />
                  用户反馈评分
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.content.userFeedback.reverse().map((feedback) => (
                    <div key={feedback.rating} className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded-full ${i < feedback.rating ? "bg-yellow-400" : "bg-gray-200"}`}
                          />
                        ))}
                      </div>
                      <div className="flex-1">
                        <Progress value={feedback.percentage} className="h-2" />
                      </div>
                      <div className="text-sm text-gray-600 min-w-[3rem]">{feedback.percentage}%</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">4.2</div>
                    <div className="text-sm text-gray-600">平均评分</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 系统警报 */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                  系统警报
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.insights.alerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border-l-4 ${
                        alert.type === "error"
                          ? "bg-red-50 border-red-500"
                          : alert.type === "warning"
                            ? "bg-yellow-50 border-yellow-500"
                            : "bg-blue-50 border-blue-500"
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {getAlertIcon(alert.type)}
                        <p className="text-sm text-gray-700">{alert.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 关键发现和建议 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                关键发现
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.insights.keyFindings.map((finding, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-sm text-gray-700">{finding}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-green-600" />
                优化建议
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.insights.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-sm text-gray-700">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
