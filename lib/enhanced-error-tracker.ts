export interface ErrorEvent {
  id: string
  timestamp: Date
  level: 'error' | 'warning' | 'info' | 'debug'
  message: string
  stack?: string
  url: string
  userAgent: string
  userId?: string
  sessionId: string
  context: {
    component?: string
    action?: string
    metadata?: Record<string, any>
  }
  resolved: boolean
  resolvedAt?: Date
  resolvedBy?: string
  tags: string[]
}

export interface PerformanceMetric {
  id: string
  timestamp: Date
  metric: 'page-load' | 'api-response' | 'bundle-load' | 'render-time' | 'memory-usage'
  value: number
  url?: string
  component?: string
  metadata?: Record<string, any>
}

export interface UserSession {
  id: string
  userId?: string
  startTime: Date
  endTime?: Date
  pageViews: number
  errors: number
  warnings: number
  duration: number
  userAgent: string
  country?: string
  city?: string
}

export interface MonitoringReport {
  timestamp: Date
  timeRange: {
    start: Date
    end: Date
  }
  errorSummary: {
    total: number
    byLevel: Record<string, number>
    byComponent: Record<string, number>
    resolved: number
    unresolved: number
  }
  performanceSummary: {
    averagePageLoad: number
    averageApiResponse: number
    slowestPages: Array<{ url: string; time: number }>
    memoryUsage: number
  }
  userMetrics: {
    totalSessions: number
    averageSessionDuration: number
    bounceRate: number
    errorRate: number
  }
  recommendations: string[]
  trends: {
    errorTrend: 'increasing' | 'decreasing' | 'stable'
    performanceTrend: 'improving' | 'degrading' | 'stable'
  }
}

export class EnhancedErrorTracker {
  private static errors: ErrorEvent[] = []
  private static metrics: PerformanceMetric[] = []
  private static sessions: UserSession[] = []
  private static isInitialized = false
  private static errorListeners: Array<(error: ErrorEvent) => void> = []
  private static performanceObserver: PerformanceObserver | null = null

  // 初始化错误监控系统
  static initialize(): void {
    if (this.isInitialized) {
      console.log("📊 错误监控系统已经初始化")
      return
    }

    console.log("🚀 初始化增强的错误监控系统...")

    // 捕获全局错误
    this.setupGlobalErrorHandlers()

    // 设置性能监控
    this.setupPerformanceMonitoring()

    // 设置用户会话跟踪
    this.setupSessionTracking()

    // 设置自动清理
    this.setupCleanup()

    this.isInitialized = true
    console.log("✅ 错误监控系统初始化完成")
  }

  // 设置全局错误处理器
  private static setupGlobalErrorHandlers(): void {
    // JavaScript错误
    window.addEventListener('error', (event) => {
      this.logError({
        level: 'error',
        message: event.message,
        stack: event.error?.stack,
        url: event.filename || window.location.href,
        context: {
          action: 'javascript-error',
          metadata: {
            lineno: event.lineno,
            colno: event.colno
          }
        }
      })
    })

    // Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        level: 'error',
        message: event.reason?.message || '未处理的Promise拒绝',
        stack: event.reason?.stack,
        url: window.location.href,
        context: {
          action: 'unhandled-promise-rejection',
          metadata: {
            reason: event.reason
          }
        }
      })
    })

    // React错误边界集成
    this.setupReactErrorBoundary()
  }

  // 设置React错误边界
  private static setupReactErrorBoundary(): void {
    // 这个方法将被React错误边界调用
    (window as any).__errorTracker = {
      logReactError: (error: Error, errorInfo: any) => {
        this.logError({
          level: 'error',
          message: error.message,
          stack: error.stack,
          url: window.location.href,
          context: {
            component: 'react-component',
            action: 'component-error',
            metadata: {
              componentStack: errorInfo.componentStack
            }
          }
        })
      }
    }
  }

  // 设置性能监控
  private static setupPerformanceMonitoring(): void {
    // Performance Observer API
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            this.logPerformanceMetric({
              metric: 'page-load',
              value: navEntry.loadEventEnd - navEntry.loadEventStart,
              url: window.location.href
            })
          } else if (entry.entryType === 'measure') {
            this.logPerformanceMetric({
              metric: 'render-time',
              value: entry.duration,
              component: entry.name
            })
          }
        })
      })

      this.performanceObserver.observe({ 
        entryTypes: ['navigation', 'measure', 'paint'] 
      })
    }

    // 监控API响应时间
    this.interceptFetch()
  }

  // 拦截fetch请求以监控API性能
  private static interceptFetch(): void {
    const originalFetch = window.fetch
    
    window.fetch = async (...args) => {
      const start = performance.now()
      const url = typeof args[0] === 'string' ? args[0] : args[0].url
      
      try {
        const response = await originalFetch(...args)
        const duration = performance.now() - start
        
        this.logPerformanceMetric({
          metric: 'api-response',
          value: duration,
          url,
          metadata: {
            status: response.status,
            statusText: response.statusText
          }
        })

        return response
      } catch (error) {
        const duration = performance.now() - start
        
        this.logError({
          level: 'error',
          message: `API请求失败: ${error}`,
          url,
          context: {
            action: 'api-request-failed',
            metadata: {
              duration,
              requestUrl: url
            }
          }
        })

        throw error
      }
    }
  }

  // 设置用户会话跟踪
  private static setupSessionTracking(): void {
    const sessionId = this.getOrCreateSessionId()
    
    const session: UserSession = {
      id: sessionId,
      startTime: new Date(),
      pageViews: 1,
      errors: 0,
      warnings: 0,
      duration: 0,
      userAgent: navigator.userAgent
    }

    this.sessions.push(session)

    // 页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.endCurrentSession()
      }
    })

    // 页面卸载
    window.addEventListener('beforeunload', () => {
      this.endCurrentSession()
    })
  }

  // 设置自动清理
  private static setupCleanup(): void {
    // 每小时清理一次旧数据
    setInterval(() => {
      this.cleanup()
    }, 60 * 60 * 1000)
  }

  // 记录错误
  static logError(errorData: Partial<ErrorEvent>): void {
    const error: ErrorEvent = {
      id: this.generateId(),
      timestamp: new Date(),
      level: errorData.level || 'error',
      message: errorData.message || '未知错误',
      stack: errorData.stack,
      url: errorData.url || window.location.href,
      userAgent: navigator.userAgent,
      sessionId: this.getCurrentSessionId(),
      context: errorData.context || {},
      resolved: false,
      tags: errorData.tags || []
    }

    this.errors.push(error)

    // 更新会话统计
    this.updateSessionStats(error.level)

    // 通知监听器
    this.errorListeners.forEach(listener => {
      try {
        listener(error)
      } catch (e) {
        console.error("错误监听器执行失败:", e)
      }
    })

    console.error(`[ErrorTracker] ${error.level.toUpperCase()}: ${error.message}`, error)

    // 严重错误立即上报
    if (error.level === 'error') {
      this.reportCriticalError(error)
    }
  }

  // 记录性能指标
  static logPerformanceMetric(metricData: Partial<PerformanceMetric>): void {
    const metric: PerformanceMetric = {
      id: this.generateId(),
      timestamp: new Date(),
      metric: metricData.metric || 'page-load',
      value: metricData.value || 0,
      url: metricData.url,
      component: metricData.component,
      metadata: metricData.metadata
    }

    this.metrics.push(metric)

    // 检查性能阈值
    this.checkPerformanceThresholds(metric)
  }

  // 检查性能阈值
  private static checkPerformanceThresholds(metric: PerformanceMetric): void {
    const thresholds = {
      'page-load': 3000, // 3秒
      'api-response': 1000, // 1秒
      'render-time': 100, // 100ms
      'bundle-load': 2000, // 2秒
      'memory-usage': 100 * 1024 * 1024 // 100MB
    }

    const threshold = thresholds[metric.metric]
    if (threshold && metric.value > threshold) {
      this.logError({
        level: 'warning',
        message: `性能警告: ${metric.metric} 超过阈值`,
        context: {
          action: 'performance-threshold-exceeded',
          metadata: {
            metric: metric.metric,
            value: metric.value,
            threshold,
            url: metric.url,
            component: metric.component
          }
        },
        tags: ['performance', 'threshold']
      })
    }
  }

  // 报告严重错误
  private static reportCriticalError(error: ErrorEvent): void {
    // 这里可以集成外部错误报告服务，如Sentry
    console.error("🚨 严重错误报告:", {
      id: error.id,
      message: error.message,
      url: error.url,
      timestamp: error.timestamp,
      stack: error.stack
    })
  }

  // 生成监控报告
  static generateReport(timeRange?: { start: Date; end: Date }): MonitoringReport {
    const now = new Date()
    const range = timeRange || {
      start: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 24小时前
      end: now
    }

    const filteredErrors = this.errors.filter(
      error => error.timestamp >= range.start && error.timestamp <= range.end
    )

    const filteredMetrics = this.metrics.filter(
      metric => metric.timestamp >= range.start && metric.timestamp <= range.end
    )

    const filteredSessions = this.sessions.filter(
      session => session.startTime >= range.start && session.startTime <= range.end
    )

    return {
      timestamp: now,
      timeRange: range,
      errorSummary: this.generateErrorSummary(filteredErrors),
      performanceSummary: this.generatePerformanceSummary(filteredMetrics),
      userMetrics: this.generateUserMetrics(filteredSessions),
      recommendations: this.generateRecommendations(filteredErrors, filteredMetrics),
      trends: this.generateTrends(filteredErrors, filteredMetrics)
    }
  }

  // 生成错误摘要
  private static generateErrorSummary(errors: ErrorEvent[]) {
    const byLevel: Record<string, number> = {}
    const byComponent: Record<string, number> = {}
    let resolved = 0

    errors.forEach(error => {
      byLevel[error.level] = (byLevel[error.level] || 0) + 1
      
      const component = error.context.component || 'unknown'
      byComponent[component] = (byComponent[component] || 0) + 1
      
      if (error.resolved) resolved++
    })

    return {
      total: errors.length,
      byLevel,
      byComponent,
      resolved,
      unresolved: errors.length - resolved
    }
  }

  // 生成性能摘要
  private static generatePerformanceSummary(metrics: PerformanceMetric[]) {
    const pageLoadMetrics = metrics.filter(m => m.metric === 'page-load')
    const apiMetrics = metrics.filter(m => m.metric === 'api-response')
    
    const averagePageLoad = pageLoadMetrics.length > 0
      ? pageLoadMetrics.reduce((sum, m) => sum + m.value, 0) / pageLoadMetrics.length
      : 0

    const averageApiResponse = apiMetrics.length > 0
      ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length
      : 0

    const slowestPages = pageLoadMetrics
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map(m => ({ url: m.url || 'unknown', time: m.value }))

    const memoryMetrics = metrics.filter(m => m.metric === 'memory-usage')
    const memoryUsage = memoryMetrics.length > 0
      ? memoryMetrics[memoryMetrics.length - 1].value
      : 0

    return {
      averagePageLoad,
      averageApiResponse,
      slowestPages,
      memoryUsage
    }
  }

  // 生成用户指标
  private static generateUserMetrics(sessions: UserSession[]) {
    const totalSessions = sessions.length
    const averageSessionDuration = sessions.length > 0
      ? sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length
      : 0

    const bouncedSessions = sessions.filter(s => s.pageViews === 1 && s.duration < 30000).length
    const bounceRate = totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0

    const sessionsWithErrors = sessions.filter(s => s.errors > 0).length
    const errorRate = totalSessions > 0 ? (sessionsWithErrors / totalSessions) * 100 : 0

    return {
      totalSessions,
      averageSessionDuration,
      bounceRate,
      errorRate
    }
  }

  // 生成建议
  private static generateRecommendations(errors: ErrorEvent[], metrics: PerformanceMetric[]): string[] {
    const recommendations: string[] = []

    // 错误分析建议
    const criticalErrors = errors.filter(e => e.level === 'error')
    if (criticalErrors.length > 10) {
      recommendations.push("严重错误数量较多，建议优先修复最频繁的错误")
    }

    const unresolvedErrors = errors.filter(e => !e.resolved)
    if (unresolvedErrors.length > 5) {
      recommendations.push("存在多个未解决的错误，建议建立错误处理流程")
    }

    // 性能分析建议
    const slowPageLoads = metrics.filter(m => m.metric === 'page-load' && m.value > 3000)
    if (slowPageLoads.length > 0) {
      recommendations.push("页面加载时间较慢，建议优化资源加载和代码分割")
    }

    const slowApiCalls = metrics.filter(m => m.metric === 'api-response' && m.value > 1000)
    if (slowApiCalls.length > 0) {
      recommendations.push("API响应时间较慢，建议优化后端性能或添加缓存")
    }

    if (recommendations.length === 0) {
      recommendations.push("系统运行状况良好，继续保持监控")
    }

    return recommendations
  }

  // 生成趋势分析
  private static generateTrends(errors: ErrorEvent[], metrics: PerformanceMetric[]) {
    // 简化的趋势分析
    const midpoint = new Date(Date.now() - 12 * 60 * 60 * 1000) // 12小时前

    const recentErrors = errors.filter(e => e.timestamp > midpoint)
    const oldErrors = errors.filter(e => e.timestamp <= midpoint)

    const errorTrend = recentErrors.length > oldErrors.length ? 'increasing' : 
                      recentErrors.length < oldErrors.length ? 'decreasing' : 'stable'

    const recentMetrics = metrics.filter(m => m.timestamp > midpoint && m.metric === 'page-load')
    const oldMetrics = metrics.filter(m => m.timestamp <= midpoint && m.metric === 'page-load')

    const recentAvg = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length 
      : 0
    const oldAvg = oldMetrics.length > 0 
      ? oldMetrics.reduce((sum, m) => sum + m.value, 0) / oldMetrics.length 
      : 0

    const performanceTrend = recentAvg < oldAvg ? 'improving' : 
                            recentAvg > oldAvg ? 'degrading' : 'stable'

    return { errorTrend, performanceTrend }
  }

  // 辅助方法
  private static generateId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private static getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('monitoring_session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('monitoring_session_id', sessionId)
    }
    return sessionId
  }

  private static getCurrentSessionId(): string {
    return sessionStorage.getItem('monitoring_session_id') || 'unknown'
  }

  private static updateSessionStats(level: string): void {
    const sessionId = this.getCurrentSessionId()
    const session = this.sessions.find(s => s.id === sessionId)
    
    if (session) {
      if (level === 'error') session.errors++
      if (level === 'warning') session.warnings++
    }
  }

  private static endCurrentSession(): void {
    const sessionId = this.getCurrentSessionId()
    const session = this.sessions.find(s => s.id === sessionId)
    
    if (session && !session.endTime) {
      session.endTime = new Date()
      session.duration = session.endTime.getTime() - session.startTime.getTime()
    }
  }

  private static cleanup(): void {
    const now = new Date()
    const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7天前

    // 清理旧错误
    this.errors = this.errors.filter(error => error.timestamp > cutoff)
    
    // 清理旧性能指标
    this.metrics = this.metrics.filter(metric => metric.timestamp > cutoff)
    
    // 清理旧会话
    this.sessions = this.sessions.filter(session => session.startTime > cutoff)

    console.log("🧹 监控数据清理完成")
  }

  // 公共方法
  static addErrorListener(listener: (error: ErrorEvent) => void): void {
    this.errorListeners.push(listener)
  }

  static removeErrorListener(listener: (error: ErrorEvent) => void): void {
    const index = this.errorListeners.indexOf(listener)
    if (index > -1) {
      this.errorListeners.splice(index, 1)
    }
  }

  static markErrorAsResolved(errorId: string, resolvedBy?: string): void {
    const error = this.errors.find(e => e.id === errorId)
    if (error) {
      error.resolved = true
      error.resolvedAt = new Date()
      error.resolvedBy = resolvedBy
    }
  }

  static getErrorById(errorId: string): ErrorEvent | undefined {
    return this.errors.find(e => e.id === errorId)
  }

  static getRecentErrors(count = 10): ErrorEvent[] {
    return this.errors
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, count)
  }

  static getErrorsByComponent(component: string): ErrorEvent[] {
    return this.errors.filter(e => e.context.component === component)
  }

  static clearAllData(): void {
    this.errors = []
    this.metrics = []
    this.sessions = []
    console.log("🗑️ 所有监控数据已清除")
  }
}