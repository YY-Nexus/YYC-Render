// 增强错误处理系统
export enum ErrorType {
  NETWORK = "network",
  DATABASE = "database",
  AI_SERVICE = "ai_service",
  VALIDATION = "validation",
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  FILE_PROCESSING = "file_processing",
  RATE_LIMIT = "rate_limit",
  SYSTEM = "system",
}

export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export interface ErrorInfo {
  id: string
  type: ErrorType
  severity: ErrorSeverity
  message: string
  userMessage: string
  timestamp: number
  context?: Record<string, any>
  stack?: string
  retryable: boolean
  retryCount: number
  maxRetries: number
}

export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  retryableErrors: ErrorType[]
}

export interface CircuitBreakerConfig {
  failureThreshold: number
  resetTimeout: number
  monitoringPeriod: number
}

export class EnhancedErrorHandler {
  private static errors: Map<string, ErrorInfo> = new Map()
  private static retryConfigs: Map<string, RetryConfig> = new Map()
  private static circuitBreakers: Map<string, CircuitBreakerState> = new Map()
  private static errorListeners: ((error: ErrorInfo) => void)[] = []

  // 默认重试配置
  static readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableErrors: [ErrorType.NETWORK, ErrorType.AI_SERVICE, ErrorType.DATABASE],
  }

  // 默认断路器配置
  static readonly DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
    failureThreshold: 5,
    resetTimeout: 60000,
    monitoringPeriod: 300000,
  }

  // 错误消息映射
  static readonly ERROR_MESSAGES: Record<ErrorType, Record<string, string>> = {
    [ErrorType.NETWORK]: {
      default: "网络连接出现问题，请检查网络设置",
      timeout: "网络请求超时，请稍后重试",
      offline: "网络连接已断开，请检查网络连接",
    },
    [ErrorType.DATABASE]: {
      default: "数据库连接异常，请稍后重试",
      connection: "无法连接到数据库",
      query: "数据查询失败",
      transaction: "数据事务处理失败",
    },
    [ErrorType.AI_SERVICE]: {
      default: "AI服务暂时不可用，请稍后重试",
      quota: "AI服务配额已用完，请稍后重试",
      model: "AI模型加载失败",
      timeout: "AI响应超时，请重新提问",
    },
    [ErrorType.VALIDATION]: {
      default: "输入数据格式不正确",
      required: "必填字段不能为空",
      format: "数据格式不符合要求",
      length: "输入内容长度超出限制",
    },
    [ErrorType.AUTHENTICATION]: {
      default: "身份验证失败，请重新登录",
      expired: "登录已过期，请重新登录",
      invalid: "用户名或密码错误",
    },
    [ErrorType.AUTHORIZATION]: {
      default: "您没有权限执行此操作",
      insufficient: "权限不足",
      forbidden: "访问被禁止",
    },
    [ErrorType.FILE_PROCESSING]: {
      default: "文件处理失败",
      size: "文件大小超出限制",
      format: "不支持的文件格式",
      corrupted: "文件已损坏",
    },
    [ErrorType.RATE_LIMIT]: {
      default: "请求过于频繁，请稍后重试",
      exceeded: "已达到请求限制",
      throttled: "请求被限流",
    },
    [ErrorType.SYSTEM]: {
      default: "系统出现异常，请联系管理员",
      maintenance: "系统正在维护中",
      overload: "系统负载过高",
    },
  }

  // 创建错误信息
  static createError(
    type: ErrorType,
    message: string,
    context?: Record<string, any>,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  ): ErrorInfo {
    const id = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const userMessage = this.generateUserMessage(type, message, context)

    const errorInfo: ErrorInfo = {
      id,
      type,
      severity,
      message,
      userMessage,
      timestamp: Date.now(),
      context,
      stack: new Error().stack,
      retryable: this.isRetryable(type),
      retryCount: 0,
      maxRetries: this.DEFAULT_RETRY_CONFIG.maxRetries,
    }

    this.errors.set(id, errorInfo)
    this.notifyListeners(errorInfo)

    return errorInfo
  }

  // 生成用户友好的错误消息
  private static generateUserMessage(type: ErrorType, message: string, context?: Record<string, any>): string {
    const typeMessages = this.ERROR_MESSAGES[type]

    // 尝试匹配具体的错误类型
    for (const [key, userMsg] of Object.entries(typeMessages)) {
      if (key !== "default" && message.toLowerCase().includes(key)) {
        return userMsg
      }
    }

    // 根据上下文生成更具体的消息
    if (context) {
      if (type === ErrorType.VALIDATION && context.field) {
        return `${context.field}字段${typeMessages.default}`
      }
      if (type === ErrorType.FILE_PROCESSING && context.filename) {
        return `文件"${context.filename}"处理失败`
      }
    }

    return typeMessages.default
  }

  // 判断错误是否可重试
  private static isRetryable(type: ErrorType): boolean {
    return this.DEFAULT_RETRY_CONFIG.retryableErrors.includes(type)
  }

  // 带重试的操作执行
  static async withRetry<T>(operation: () => Promise<T>, operationId: string, maxRetries?: number): Promise<T> {
    const config = this.retryConfigs.get(operationId) || this.DEFAULT_RETRY_CONFIG
    const actualMaxRetries = maxRetries || config.maxRetries

    let lastError: Error | null = null
    let delay = config.baseDelay

    for (let attempt = 0; attempt <= actualMaxRetries; attempt++) {
      try {
        const result = await operation()

        // 成功时重置延迟
        if (attempt > 0) {
          console.log(`操作 ${operationId} 在第 ${attempt + 1} 次尝试后成功`)
        }

        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // 最后一次尝试失败
        if (attempt === actualMaxRetries) {
          const errorInfo = this.createError(
            this.inferErrorType(lastError),
            lastError.message,
            { operationId, attempt: attempt + 1 },
            ErrorSeverity.HIGH,
          )
          errorInfo.retryCount = attempt
          break
        }

        // 检查是否可重试
        const errorType = this.inferErrorType(lastError)
        if (!this.isRetryable(errorType)) {
          const errorInfo = this.createError(
            errorType,
            lastError.message,
            { operationId, reason: "不可重试的错误" },
            ErrorSeverity.HIGH,
          )
          throw errorInfo
        }

        console.log(`操作 ${operationId} 第 ${attempt + 1} 次尝试失败，${delay}ms 后重试`)

        // 等待后重试
        await new Promise((resolve) => setTimeout(resolve, delay))

        // 指数退避
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelay)
      }
    }

    throw lastError
  }

  // 推断错误类型
  private static inferErrorType(error: Error): ErrorType {
    const message = error.message.toLowerCase()

    if (message.includes("network") || message.includes("fetch") || message.includes("timeout")) {
      return ErrorType.NETWORK
    }
    if (message.includes("database") || message.includes("sql") || message.includes("connection")) {
      return ErrorType.DATABASE
    }
    if (message.includes("ai") || message.includes("model") || message.includes("openai")) {
      return ErrorType.AI_SERVICE
    }
    if (message.includes("validation") || message.includes("invalid") || message.includes("required")) {
      return ErrorType.VALIDATION
    }
    if (message.includes("auth") || message.includes("token") || message.includes("login")) {
      return ErrorType.AUTHENTICATION
    }
    if (message.includes("permission") || message.includes("forbidden") || message.includes("unauthorized")) {
      return ErrorType.AUTHORIZATION
    }
    if (message.includes("file") || message.includes("upload") || message.includes("size")) {
      return ErrorType.FILE_PROCESSING
    }
    if (message.includes("rate") || message.includes("limit") || message.includes("throttle")) {
      return ErrorType.RATE_LIMIT
    }

    return ErrorType.SYSTEM
  }

  // 断路器状态
  private static circuitBreakerStates: Map<string, CircuitBreakerState> = new Map()

  // 带断路器的操作执行
  static async withCircuitBreaker<T>(
    operation: () => Promise<T>,
    serviceId: string,
    config?: Partial<CircuitBreakerConfig>,
  ): Promise<T> {
    const actualConfig = { ...this.DEFAULT_CIRCUIT_BREAKER_CONFIG, ...config }
    let state = this.circuitBreakerStates.get(serviceId)

    if (!state) {
      state = {
        status: "closed",
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0,
      }
      this.circuitBreakerStates.set(serviceId, state)
    }

    // 检查断路器状态
    const now = Date.now()

    if (state.status === "open") {
      if (now < state.nextAttemptTime) {
        throw this.createError(
          ErrorType.SYSTEM,
          `服务 ${serviceId} 暂时不可用`,
          { serviceId, status: "circuit_breaker_open" },
          ErrorSeverity.HIGH,
        )
      } else {
        state.status = "half-open"
      }
    }

    try {
      const result = await operation()

      // 成功时重置断路器
      if (state.status === "half-open") {
        state.status = "closed"
        state.failureCount = 0
        console.log(`断路器 ${serviceId} 已重置为关闭状态`)
      }

      return result
    } catch (error) {
      state.failureCount++
      state.lastFailureTime = now

      if (state.failureCount >= actualConfig.failureThreshold) {
        state.status = "open"
        state.nextAttemptTime = now + actualConfig.resetTimeout
        console.log(`断路器 ${serviceId} 已打开，${actualConfig.resetTimeout}ms 后尝试重置`)
      }

      throw error
    }
  }

  // 添加错误监听器
  static addErrorListener(listener: (error: ErrorInfo) => void): void {
    this.errorListeners.push(listener)
  }

  // 移除错误监听器
  static removeErrorListener(listener: (error: ErrorInfo) => void): void {
    const index = this.errorListeners.indexOf(listener)
    if (index > -1) {
      this.errorListeners.splice(index, 1)
    }
  }

  // 通知监听器
  private static notifyListeners(error: ErrorInfo): void {
    this.errorListeners.forEach((listener) => {
      try {
        listener(error)
      } catch (err) {
        console.error("错误监听器执行失败:", err)
      }
    })
  }

  // 获取错误统计
  static getErrorStats(): {
    total: number
    byType: Record<ErrorType, number>
    bySeverity: Record<ErrorSeverity, number>
    recent: ErrorInfo[]
  } {
    const errors = Array.from(this.errors.values())
    const now = Date.now()
    const oneHourAgo = now - 3600000

    const byType: Record<ErrorType, number> = {} as any
    const bySeverity: Record<ErrorSeverity, number> = {} as any

    Object.values(ErrorType).forEach((type) => {
      byType[type] = 0
    })

    Object.values(ErrorSeverity).forEach((severity) => {
      bySeverity[severity] = 0
    })

    errors.forEach((error) => {
      byType[error.type]++
      bySeverity[error.severity]++
    })

    const recent = errors
      .filter((error) => error.timestamp > oneHourAgo)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)

    return {
      total: errors.length,
      byType,
      bySeverity,
      recent,
    }
  }

  // 清理历史错误
  static clearHistory(olderThan?: number): void {
    const cutoff = olderThan || Date.now() - 86400000 // 默认清理24小时前的错误

    for (const [id, error] of this.errors.entries()) {
      if (error.timestamp < cutoff) {
        this.errors.delete(id)
      }
    }
  }

  // 获取错误详情
  static getError(id: string): ErrorInfo | undefined {
    return this.errors.get(id)
  }

  // 获取所有错误
  static getAllErrors(): ErrorInfo[] {
    return Array.from(this.errors.values()).sort((a, b) => b.timestamp - a.timestamp)
  }

  // 设置重试配置
  static setRetryConfig(operationId: string, config: Partial<RetryConfig>): void {
    const fullConfig = { ...this.DEFAULT_RETRY_CONFIG, ...config }
    this.retryConfigs.set(operationId, fullConfig)
  }

  // 健康检查
  static getHealthStatus(): {
    status: "healthy" | "degraded" | "unhealthy"
    errorRate: number
    criticalErrors: number
    circuitBreakers: Record<string, string>
  } {
    const stats = this.getErrorStats()
    const now = Date.now()
    const oneHourAgo = now - 3600000

    const recentErrors = Array.from(this.errors.values()).filter((error) => error.timestamp > oneHourAgo)

    const errorRate = recentErrors.length / 60 // 每分钟错误数
    const criticalErrors = stats.bySeverity[ErrorSeverity.CRITICAL] || 0

    let status: "healthy" | "degraded" | "unhealthy" = "healthy"

    if (criticalErrors > 0 || errorRate > 10) {
      status = "unhealthy"
    } else if (errorRate > 5) {
      status = "degraded"
    }

    const circuitBreakers: Record<string, string> = {}
    for (const [serviceId, state] of this.circuitBreakerStates.entries()) {
      circuitBreakers[serviceId] = state.status
    }

    return {
      status,
      errorRate,
      criticalErrors,
      circuitBreakers,
    }
  }
}

// 断路器状态接口
interface CircuitBreakerState {
  status: "closed" | "open" | "half-open"
  failureCount: number
  lastFailureTime: number
  nextAttemptTime: number
}

// 全局错误处理器
if (typeof window !== "undefined") {
  // 浏览器端全局错误处理
  window.addEventListener("error", (event) => {
    EnhancedErrorHandler.createError(
      ErrorType.SYSTEM,
      event.error?.message || "未知错误",
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
      ErrorSeverity.HIGH,
    )
  })

  window.addEventListener("unhandledrejection", (event) => {
    EnhancedErrorHandler.createError(
      ErrorType.SYSTEM,
      event.reason?.message || "未处理的Promise拒绝",
      { reason: event.reason },
      ErrorSeverity.HIGH,
    )
  })
}

// 导出错误处理装饰器
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  target: T,
  errorType: ErrorType = ErrorType.SYSTEM,
): T {
  return (async (...args: any[]) => {
    try {
      return await target(...args)
    } catch (error) {
      const errorInfo = EnhancedErrorHandler.createError(
        errorType,
        error instanceof Error ? error.message : String(error),
        { functionName: target.name, args },
      )
      throw errorInfo
    }
  }) as T
}
