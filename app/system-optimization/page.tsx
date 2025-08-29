"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Cpu, 
  Database, 
  Gauge, 
  MemoryStick, 
  Shield, 
  TestTube,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react'

// Import our optimization systems
import { ApplicationAuditor } from '@/lib/application-auditor'
import { AutoOptimizationEngine } from '@/lib/auto-optimization-engine'
import { EnhancedErrorTracker } from '@/lib/enhanced-error-tracker'
import { TestFrameworkManager } from '@/lib/test-framework-manager'

interface DashboardStats {
  overallHealth: number
  activeOptimizations: number
  errorCount: number
  testCoverage: number
  performanceScore: number
}

export default function SystemOptimizationDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    overallHealth: 0,
    activeOptimizations: 0,
    errorCount: 0,
    testCoverage: 0,
    performanceScore: 0
  })
  
  const [auditReport, setAuditReport] = useState<any>(null)
  const [optimizationReport, setOptimizationReport] = useState<any>(null)
  const [errorReport, setErrorReport] = useState<any>(null)
  const [testReport, setTestReport] = useState<any>(null)
  
  const [autoOptimizationEnabled, setAutoOptimizationEnabled] = useState(false)

  useEffect(() => {
    initializeSystems()
  }, [])

  const initializeSystems = async () => {
    try {
      console.log("🚀 初始化系统优化仪表板...")
      
      // 初始化错误追踪
      EnhancedErrorTracker.initialize()
      
      // 初始化测试框架
      await TestFrameworkManager.initialize()
      
      // 执行全面审核
      const audit = await ApplicationAuditor.performFullAudit()
      setAuditReport(audit)
      
      // 获取优化报告
      const optimization = AutoOptimizationEngine.generateReport()
      setOptimizationReport(optimization)
      
      // 获取错误监控报告
      const errors = EnhancedErrorTracker.generateReport()
      setErrorReport(errors)
      
      // 运行测试
      const tests = await TestFrameworkManager.runAllTests()
      setTestReport(tests)
      
      // 更新统计数据
      updateStats(audit, optimization, errors, tests)
      
      setIsLoading(false)
      console.log("✅ 系统初始化完成")
    } catch (error) {
      console.error("❌ 系统初始化失败:", error)
      setIsLoading(false)
    }
  }

  const updateStats = (audit: any, optimization: any, errors: any, tests: any) => {
    setStats({
      overallHealth: audit.overallScore,
      activeOptimizations: optimization.totalOptimizations,
      errorCount: errors.errorSummary.total,
      testCoverage: tests.coverage.overall,
      performanceScore: calculatePerformanceScore(audit, optimization, errors)
    })
  }

  const calculatePerformanceScore = (audit: any, optimization: any, errors: any) => {
    const auditWeight = 0.4
    const optimizationWeight = 0.3
    const errorWeight = 0.3
    
    const auditScore = audit.overallScore
    const optimizationScore = Math.max(0, 100 - optimization.failedOptimizations * 10)
    const errorScore = Math.max(0, 100 - errors.errorSummary.total * 5)
    
    return Math.round(
      auditScore * auditWeight + 
      optimizationScore * optimizationWeight + 
      errorScore * errorWeight
    )
  }

  const startAutoOptimization = () => {
    AutoOptimizationEngine.start()
    setAutoOptimizationEnabled(true)
  }

  const stopAutoOptimization = () => {
    AutoOptimizationEngine.stop()
    setAutoOptimizationEnabled(false)
  }

  const triggerManualOptimization = async () => {
    const report = await AutoOptimizationEngine.triggerManualOptimization()
    setOptimizationReport(report)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">正在初始化系统优化仪表板...</p>
          <p className="text-sm text-muted-foreground mt-2">这可能需要几秒钟时间</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">系统优化仪表板</h1>
          <p className="text-muted-foreground">实时监控应用性能、错误和优化状态</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={stats.overallHealth >= 80 ? "default" : stats.overallHealth >= 60 ? "secondary" : "destructive"}>
            健康度: {stats.overallHealth}%
          </Badge>
          <Button 
            onClick={autoOptimizationEnabled ? stopAutoOptimization : startAutoOptimization}
            variant={autoOptimizationEnabled ? "destructive" : "default"}
          >
            {autoOptimizationEnabled ? "停止自动优化" : "启动自动优化"}
          </Button>
        </div>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">系统健康度</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overallHealth}%</div>
            <Progress value={stats.overallHealth} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">性能评分</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.performanceScore}%</div>
            <Progress value={stats.performanceScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃优化</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeOptimizations}</div>
            <p className="text-xs text-muted-foreground mt-1">项优化任务</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">错误计数</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.errorCount}</div>
            <p className="text-xs text-muted-foreground mt-1">待处理错误</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">测试覆盖率</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.testCoverage}%</div>
            <Progress value={stats.testCoverage} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* 详细报告标签页 */}
      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="audit">应用审核</TabsTrigger>
          <TabsTrigger value="optimization">自动优化</TabsTrigger>
          <TabsTrigger value="monitoring">错误监控</TabsTrigger>
          <TabsTrigger value="testing">测试报告</TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                应用程序审核报告
              </CardTitle>
              <CardDescription>
                最后更新: {auditReport?.timestamp ? new Date(auditReport.timestamp).toLocaleString() : '未知'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditReport ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{auditReport.issuesSummary.critical}</div>
                      <div className="text-sm text-muted-foreground">严重问题</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{auditReport.issuesSummary.high}</div>
                      <div className="text-sm text-muted-foreground">高优先级</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{auditReport.issuesSummary.medium}</div>
                      <div className="text-sm text-muted-foreground">中优先级</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold">自动修复结果</h4>
                    <div className="flex items-center gap-4">
                      <Badge variant="default">{auditReport.autoFixResults.fixed} 项已修复</Badge>
                      <Badge variant="destructive">{auditReport.autoFixResults.failed} 项修复失败</Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">下一步建议</h4>
                    <ul className="space-y-1">
                      {auditReport.nextSteps?.map((step: string, index: number) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p>暂无审核数据</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                自动优化报告
                <Button size="sm" onClick={triggerManualOptimization} className="ml-auto">
                  手动触发优化
                </Button>
              </CardTitle>
              <CardDescription>
                优化引擎状态和性能提升统计
              </CardDescription>
            </CardHeader>
            <CardContent>
              {optimizationReport ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{optimizationReport.successfulOptimizations}</div>
                      <div className="text-sm text-muted-foreground">成功优化</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{optimizationReport.failedOptimizations}</div>
                      <div className="text-sm text-muted-foreground">失败优化</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{optimizationReport.overallPerformanceGain.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">性能提升</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">最近优化项目</h4>
                    <div className="space-y-2">
                      {optimizationReport.optimizations?.slice(0, 5).map((opt: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div>
                            <div className="font-medium">{opt.optimizationType}</div>
                            <div className="text-sm text-muted-foreground">{opt.details}</div>
                          </div>
                          <Badge variant={opt.status === 'success' ? 'default' : 'destructive'}>
                            {opt.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">优化建议</h4>
                    <ul className="space-y-1">
                      {optimizationReport.recommendations?.map((rec: string, index: number) => (
                        <li key={index} className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p>暂无优化数据</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                错误监控报告
              </CardTitle>
              <CardDescription>
                系统错误追踪和性能监控数据
              </CardDescription>
            </CardHeader>
            <CardContent>
              {errorReport ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{errorReport.errorSummary.total}</div>
                      <div className="text-sm text-muted-foreground">总错误数</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{errorReport.errorSummary.resolved}</div>
                      <div className="text-sm text-muted-foreground">已解决</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{errorReport.userMetrics.totalSessions}</div>
                      <div className="text-sm text-muted-foreground">用户会话</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{errorReport.userMetrics.errorRate.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">错误率</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">性能指标</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">平均页面加载时间</span>
                        </div>
                        <div className="text-lg font-bold">{errorReport.performanceSummary.averagePageLoad.toFixed(0)}ms</div>
                      </div>
                      <div className="p-3 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          <span className="font-medium">平均API响应时间</span>
                        </div>
                        <div className="text-lg font-bold">{errorReport.performanceSummary.averageApiResponse.toFixed(0)}ms</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">趋势分析</h4>
                    <div className="flex items-center gap-4">
                      <Badge variant={errorReport.trends.errorTrend === 'decreasing' ? 'default' : 'destructive'}>
                        错误趋势: {errorReport.trends.errorTrend === 'increasing' ? '上升' : 
                                errorReport.trends.errorTrend === 'decreasing' ? '下降' : '稳定'}
                      </Badge>
                      <Badge variant={errorReport.trends.performanceTrend === 'improving' ? 'default' : 'secondary'}>
                        性能趋势: {errorReport.trends.performanceTrend === 'improving' ? '改善' : 
                                 errorReport.trends.performanceTrend === 'degrading' ? '下降' : '稳定'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <p>暂无监控数据</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                测试执行报告
              </CardTitle>
              <CardDescription>
                自动化测试结果和代码覆盖率分析
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testReport ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{testReport.passedTests}</div>
                      <div className="text-sm text-muted-foreground">通过</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{testReport.failedTests}</div>
                      <div className="text-sm text-muted-foreground">失败</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">{testReport.skippedTests}</div>
                      <div className="text-sm text-muted-foreground">跳过</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">代码覆盖率</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm">行覆盖率</span>
                          <span className="text-sm font-medium">{testReport.coverage.lines}%</span>
                        </div>
                        <Progress value={testReport.coverage.lines} />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm">函数覆盖率</span>
                          <span className="text-sm font-medium">{testReport.coverage.functions}%</span>
                        </div>
                        <Progress value={testReport.coverage.functions} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">测试套件状态</h4>
                    <div className="space-y-2">
                      {testReport.suites?.map((suite: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div>
                            <div className="font-medium">{suite.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {suite.passed}/{suite.tests} 通过，耗时 {suite.duration.toFixed(0)}ms
                            </div>
                          </div>
                          <Badge variant={suite.status === 'passed' ? 'default' : suite.status === 'partial' ? 'secondary' : 'destructive'}>
                            {suite.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">改进建议</h4>
                    <ul className="space-y-1">
                      {testReport.recommendations?.map((rec: string, index: number) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p>暂无测试数据</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}