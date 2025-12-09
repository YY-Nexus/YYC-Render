"use client"

import { EncryptionManager } from "./encryption"

// 增强身份认证系统
export interface AuthSession {
  id: string
  userId: string
  deviceId: string
  ipAddress: string
  userAgent: string
  createdAt: Date
  lastActivity: Date
  expiresAt: Date
  isActive: boolean
  permissions: string[]
  metadata: Record<string, any>
}

export interface SecurityEvent {
  id: string
  userId: string
  type: "login" | "logout" | "failed_login" | "password_change" | "permission_change" | "suspicious_activity"
  severity: "low" | "medium" | "high" | "critical"
  description: string
  ipAddress: string
  userAgent: string
  timestamp: Date
  metadata: Record<string, any>
}

export interface TwoFactorAuth {
  userId: string
  secret: string
  backupCodes: string[]
  isEnabled: boolean
  lastUsed?: Date
  method: "totp" | "sms" | "email"
}

export interface LoginAttempt {
  id: string
  email: string
  ipAddress: string
  userAgent: string
  success: boolean
  timestamp: Date
  failureReason?: string
  blocked: boolean
}

export interface SecurityPolicy {
  maxLoginAttempts: number
  lockoutDuration: number
  passwordMinLength: number
  passwordRequireUppercase: boolean
  passwordRequireLowercase: boolean
  passwordRequireNumbers: boolean
  passwordRequireSymbols: boolean
  sessionTimeout: number
  requireTwoFactor: boolean
  allowedIpRanges?: string[]
  blockedIpRanges?: string[]
}

export class EnhancedAuthManager {
  private static sessions: Map<string, AuthSession> = new Map()
  private static securityEvents: SecurityEvent[] = []
  private static twoFactorAuth: Map<string, TwoFactorAuth> = new Map()
  private static loginAttempts: LoginAttempt[] = []
  private static blockedIps: Set<string> = new Set()

  private static readonly DEFAULT_POLICY: SecurityPolicy = {
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15分钟
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSymbols: false,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24小时
    requireTwoFactor: false,
  }

  private static securityPolicy: SecurityPolicy = { ...this.DEFAULT_POLICY }

  // 增强登录验证
  static async authenticateUser(
    email: string,
    password: string,
    deviceInfo: {
      deviceId: string
      ipAddress: string
      userAgent: string
    },
    twoFactorCode?: string,
  ): Promise<{
    success: boolean
    sessionId?: string
    user?: any
    requiresTwoFactor?: boolean
    error?: string
    securityWarnings?: string[]
  }> {
    const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const warnings: string[] = []

    try {
      // 检查IP是否被阻止
      if (this.isIpBlocked(deviceInfo.ipAddress)) {
        this.logSecurityEvent({
          userId: "",
          type: "failed_login",
          severity: "high",
          description: "尝试从被阻止的IP地址登录",
          ipAddress: deviceInfo.ipAddress,
          userAgent: deviceInfo.userAgent,
          metadata: { email, reason: "blocked_ip" },
        })

        return {
          success: false,
          error: "访问被拒绝",
        }
      }

      // 检查登录尝试次数
      const recentAttempts = this.getRecentLoginAttempts(email, deviceInfo.ipAddress)
      if (recentAttempts.length >= this.securityPolicy.maxLoginAttempts) {
        this.blockIp(deviceInfo.ipAddress, this.securityPolicy.lockoutDuration)

        this.logSecurityEvent({
          userId: "",
          type: "failed_login",
          severity: "high",
          description: "登录尝试次数过多，IP已被阻止",
          ipAddress: deviceInfo.ipAddress,
          userAgent: deviceInfo.userAgent,
          metadata: { email, attempts: recentAttempts.length },
        })

        return {
          success: false,
          error: "登录尝试次数过多，请稍后再试",
        }
      }

      // 验证用户凭据（这里应该连接到实际的用户数据库）
      const user = await this.validateCredentials(email, password)
      if (!user) {
        this.recordLoginAttempt({
          email,
          ipAddress: deviceInfo.ipAddress,
          userAgent: deviceInfo.userAgent,
          success: false,
          failureReason: "invalid_credentials",
        })

        return {
          success: false,
          error: "邮箱或密码错误",
        }
      }

      // 检查是否需要双因素认证
      const twoFactor = this.twoFactorAuth.get(user.id)
      if (this.securityPolicy.requireTwoFactor || (twoFactor && twoFactor.isEnabled)) {
        if (!twoFactorCode) {
          return {
            success: false,
            requiresTwoFactor: true,
          }
        }

        const twoFactorValid = await this.validateTwoFactorCode(user.id, twoFactorCode)
        if (!twoFactorValid) {
          this.recordLoginAttempt({
            email,
            ipAddress: deviceInfo.ipAddress,
            userAgent: deviceInfo.userAgent,
            success: false,
            failureReason: "invalid_2fa",
          })

          return {
            success: false,
            error: "双因素认证码无效",
          }
        }
      }

      // 检查可疑活动
      const suspiciousActivity = this.detectSuspiciousActivity(user.id, deviceInfo)
      if (suspiciousActivity.length > 0) {
        warnings.push(...suspiciousActivity)
      }

      // 创建会话
      const session = await this.createSession(user, deviceInfo)

      // 记录成功登录
      this.recordLoginAttempt({
        email,
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
        success: true,
      })

      this.logSecurityEvent({
        userId: user.id,
        type: "login",
        severity: "low",
        description: "用户成功登录",
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
        metadata: { sessionId: session.id },
      })

      return {
        success: true,
        sessionId: session.id,
        user,
        securityWarnings: warnings.length > 0 ? warnings : undefined,
      }
    } catch (error) {
      this.logSecurityEvent({
        userId: "",
        type: "failed_login",
        severity: "medium",
        description: "登录过程中发生错误",
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
        metadata: { email, error: error instanceof Error ? error.message : "未知错误" },
      })

      return {
        success: false,
        error: "登录失败，请稍后重试",
      }
    }
  }

  // 创建安全会话
  private static async createSession(user: any, deviceInfo: any): Promise<AuthSession> {
    const sessionId = await this.generateSecureSessionId()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + this.securityPolicy.sessionTimeout)

    const session: AuthSession = {
      id: sessionId,
      userId: user.id,
      deviceId: deviceInfo.deviceId,
      ipAddress: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      createdAt: now,
      lastActivity: now,
      expiresAt,
      isActive: true,
      permissions: user.permissions || [],
      metadata: {
        loginMethod: "password",
        deviceFingerprint: await this.generateDeviceFingerprint(deviceInfo),
      },
    }

    this.sessions.set(sessionId, session)
    return session
  }

  // 生成安全会话ID
  private static async generateSecureSessionId(): Promise<string> {
    const randomBytes = EncryptionManager.generateSecureRandom(32)
    const timestamp = Date.now().toString(36)
    const random = Array.from(randomBytes)
      .map((byte) => byte.toString(36))
      .join("")

    return `sess_${timestamp}_${random}`
  }

  // 生成设备指纹
  private static async generateDeviceFingerprint(deviceInfo: any): Promise<string> {
    const fingerprint = `${deviceInfo.userAgent}|${deviceInfo.deviceId}|${deviceInfo.ipAddress}`
    return await EncryptionManager.generateHash(fingerprint)
  }

  // 验证会话
  static validateSession(sessionId: string): { valid: boolean; session?: AuthSession; error?: string } {
    const session = this.sessions.get(sessionId)

    if (!session) {
      return { valid: false, error: "会话不存在" }
    }

    if (!session.isActive) {
      return { valid: false, error: "会话已失效" }
    }

    if (new Date() > session.expiresAt) {
      session.isActive = false
      return { valid: false, error: "会话已过期" }
    }

    // 更新最后活动时间
    session.lastActivity = new Date()
    return { valid: true, session }
  }

  // 刷新会话
  static refreshSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session || !session.isActive) {
      return false
    }

    const now = new Date()
    session.lastActivity = now
    session.expiresAt = new Date(now.getTime() + this.securityPolicy.sessionTimeout)

    return true
  }

  // 终止会话
  static terminateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return false
    }

    session.isActive = false

    this.logSecurityEvent({
      userId: session.userId,
      type: "logout",
      severity: "low",
      description: "用户会话已终止",
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      metadata: { sessionId },
    })

    return true
  }

  // 终止用户所有会话
  static terminateAllUserSessions(userId: string): number {
    let terminatedCount = 0

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId && session.isActive) {
        session.isActive = false
        terminatedCount++
      }
    }

    this.logSecurityEvent({
      userId,
      type: "logout",
      severity: "medium",
      description: `用户所有会话已终止 (${terminatedCount}个)`,
      ipAddress: "",
      userAgent: "",
      metadata: { terminatedSessions: terminatedCount },
    })

    return terminatedCount
  }

  // 设置双因素认证
  static async setupTwoFactorAuth(
    userId: string,
    method: "totp" | "sms" | "email" = "totp",
  ): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> {
    const secret = this.generateTOTPSecret()
    const backupCodes = this.generateBackupCodes()

    const twoFactor: TwoFactorAuth = {
      userId,
      secret,
      backupCodes,
      isEnabled: false, // 需要验证后才启用
      method,
    }

    this.twoFactorAuth.set(userId, twoFactor)

    // 生成QR码URL（用于TOTP应用）
    const qrCode = `otpauth://totp/AI搜索平台:${userId}?secret=${secret}&issuer=AI搜索平台`

    this.logSecurityEvent({
      userId,
      type: "permission_change",
      severity: "medium",
      description: "用户设置双因素认证",
      ipAddress: "",
      userAgent: "",
      metadata: { method },
    })

    return { secret, qrCode, backupCodes }
  }

  // 启用双因素认证
  static async enableTwoFactorAuth(userId: string, verificationCode: string): Promise<boolean> {
    const twoFactor = this.twoFactorAuth.get(userId)
    if (!twoFactor) {
      return false
    }

    const isValid = await this.validateTOTPCode(twoFactor.secret, verificationCode)
    if (!isValid) {
      return false
    }

    twoFactor.isEnabled = true
    twoFactor.lastUsed = new Date()

    this.logSecurityEvent({
      userId,
      type: "permission_change",
      severity: "medium",
      description: "双因素认证已启用",
      ipAddress: "",
      userAgent: "",
      metadata: { method: twoFactor.method },
    })

    return true
  }

  // 禁用双因素认证
  static disableTwoFactorAuth(userId: string): boolean {
    const twoFactor = this.twoFactorAuth.get(userId)
    if (!twoFactor) {
      return false
    }

    twoFactor.isEnabled = false

    this.logSecurityEvent({
      userId,
      type: "permission_change",
      severity: "medium",
      description: "双因素认证已禁用",
      ipAddress: "",
      userAgent: "",
      metadata: { method: twoFactor.method },
    })

    return true
  }

  // 验证双因素认证码
  private static async validateTwoFactorCode(userId: string, code: string): Promise<boolean> {
    const twoFactor = this.twoFactorAuth.get(userId)
    if (!twoFactor || !twoFactor.isEnabled) {
      return false
    }

    // 检查是否是备用码
    const backupCodeIndex = twoFactor.backupCodes.indexOf(code)
    if (backupCodeIndex !== -1) {
      // 使用后移除备用码
      twoFactor.backupCodes.splice(backupCodeIndex, 1)
      twoFactor.lastUsed = new Date()
      return true
    }

    // 验证TOTP码
    if (twoFactor.method === "totp") {
      const isValid = await this.validateTOTPCode(twoFactor.secret, code)
      if (isValid) {
        twoFactor.lastUsed = new Date()
      }
      return isValid
    }

    return false
  }

  // 生成TOTP密钥
  private static generateTOTPSecret(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
    let secret = ""
    const randomBytes = EncryptionManager.generateSecureRandom(64) // Get more random bytes

    // Use rejection sampling to avoid modulo bias
    for (let i = 0, j = 0; i < 32 && j < randomBytes.length; j++) {
      const randomValue = randomBytes[j]
      // Only accept values that don't introduce bias
      const maxAcceptable = 256 - (256 % chars.length)
      if (randomValue < maxAcceptable) {
        secret += chars[randomValue % chars.length]
        i++
      }
    }

    return secret
  }

  // 生成备用码
  private static generateBackupCodes(): string[] {
    const codes: string[] = []
    for (let i = 0; i < 10; i++) {
      const randomBytes = EncryptionManager.generateSecureRandom(4)
      const code = Array.from(randomBytes)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase()
      codes.push(code)
    }
    return codes
  }

  // 验证TOTP码（简化实现）
  private static async validateTOTPCode(secret: string, code: string): Promise<boolean> {
    // 这里应该实现真正的TOTP算法
    // 为了演示，我们使用简化的验证
    const timeStep = Math.floor(Date.now() / 30000)
    const expectedCode = (timeStep % 1000000).toString().padStart(6, "0")

    return code === expectedCode || code === "123456" // 测试码
  }

  // 检测可疑活动
  private static detectSuspiciousActivity(userId: string, deviceInfo: any): string[] {
    const warnings: string[] = []
    const userSessions = Array.from(this.sessions.values()).filter((s) => s.userId === userId && s.isActive)

    // 检查异常IP地址
    const knownIps = new Set(userSessions.map((s) => s.ipAddress))
    if (!knownIps.has(deviceInfo.ipAddress) && knownIps.size > 0) {
      warnings.push("检测到来自新IP地址的登录")
    }

    // 检查异常设备
    const knownDevices = new Set(userSessions.map((s) => s.deviceId))
    if (!knownDevices.has(deviceInfo.deviceId) && knownDevices.size > 0) {
      warnings.push("检测到来自新设备的登录")
    }

    // 检查并发会话数量
    if (userSessions.length > 3) {
      warnings.push("检测到多个活动会话")
    }

    return warnings
  }

  // 记录登录尝试
  private static recordLoginAttempt(attempt: Omit<LoginAttempt, "id" | "timestamp" | "blocked">): void {
    const loginAttempt: LoginAttempt = {
      id: `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...attempt,
      timestamp: new Date(),
      blocked: false,
    }

    this.loginAttempts.push(loginAttempt)

    // 只保留最近1000条记录
    if (this.loginAttempts.length > 1000) {
      this.loginAttempts = this.loginAttempts.slice(-1000)
    }
  }

  // 获取最近登录尝试
  private static getRecentLoginAttempts(email: string, ipAddress: string): LoginAttempt[] {
    const cutoff = new Date(Date.now() - this.securityPolicy.lockoutDuration)

    return this.loginAttempts.filter(
      (attempt) =>
        (attempt.email === email || attempt.ipAddress === ipAddress) && attempt.timestamp > cutoff && !attempt.success,
    )
  }

  // 阻止IP地址
  private static blockIp(ipAddress: string, duration: number): void {
    this.blockedIps.add(ipAddress)

    // 设置自动解除阻止
    setTimeout(() => {
      this.blockedIps.delete(ipAddress)
    }, duration)
  }

  // 检查IP是否被阻止
  private static isIpBlocked(ipAddress: string): boolean {
    return this.blockedIps.has(ipAddress)
  }

  // 验证用户凭据（模拟实现）
  private static async validateCredentials(email: string, password: string): Promise<any> {
    // 这里应该连接到实际的用户数据库
    // 模拟用户验证
    if (email === "admin@example.com" && password === "password") {
      return {
        id: "user_001",
        email,
        username: "admin",
        permissions: ["read", "write", "admin"],
      }
    }

    return null
  }

  // 记录安全事件
  private static logSecurityEvent(event: Omit<SecurityEvent, "id" | "timestamp">): void {
    const securityEvent: SecurityEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...event,
      timestamp: new Date(),
    }

    this.securityEvents.push(securityEvent)

    // 只保留最近10000条记录
    if (this.securityEvents.length > 10000) {
      this.securityEvents = this.securityEvents.slice(-10000)
    }

    // 高严重性事件立即处理
    if (event.severity === "critical" || event.severity === "high") {
      this.handleCriticalSecurityEvent(securityEvent)
    }
  }

  // 处理关键安全事件
  private static handleCriticalSecurityEvent(event: SecurityEvent): void {
    console.warn("关键安全事件:", event)

    // 这里可以添加更多处理逻辑，如：
    // - 发送警报邮件
    // - 自动阻止可疑IP
    // - 强制用户重新认证
    // - 记录到安全日志系统
  }

  // 获取安全统计信息
  static getSecurityStats(): {
    activeSessions: number
    recentLoginAttempts: number
    failedLoginAttempts: number
    blockedIps: number
    securityEvents: number
    twoFactorUsers: number
  } {
    const now = new Date()
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const recentAttempts = this.loginAttempts.filter((attempt) => attempt.timestamp > last24Hours)
    const failedAttempts = recentAttempts.filter((attempt) => !attempt.success)
    const recentEvents = this.securityEvents.filter((event) => event.timestamp > last24Hours)
    const twoFactorUsers = Array.from(this.twoFactorAuth.values()).filter((tf) => tf.isEnabled)

    return {
      activeSessions: Array.from(this.sessions.values()).filter((s) => s.isActive).length,
      recentLoginAttempts: recentAttempts.length,
      failedLoginAttempts: failedAttempts.length,
      blockedIps: this.blockedIps.size,
      securityEvents: recentEvents.length,
      twoFactorUsers: twoFactorUsers.length,
    }
  }

  // 更新安全策略
  static updateSecurityPolicy(policy: Partial<SecurityPolicy>): void {
    this.securityPolicy = { ...this.securityPolicy, ...policy }

    this.logSecurityEvent({
      userId: "system",
      type: "permission_change",
      severity: "medium",
      description: "安全策略已更新",
      ipAddress: "",
      userAgent: "",
      metadata: { updatedFields: Object.keys(policy) },
    })
  }

  // 获取当前安全策略
  static getSecurityPolicy(): SecurityPolicy {
    return { ...this.securityPolicy }
  }

  // 清理过期数据
  static cleanupExpiredData(): void {
    const now = new Date()
    const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // 30天前

    // 清理过期会话
    for (const [sessionId, session] of this.sessions.entries()) {
      if (!session.isActive || session.expiresAt < now) {
        this.sessions.delete(sessionId)
      }
    }

    // 清理旧的登录尝试记录
    this.loginAttempts = this.loginAttempts.filter((attempt) => attempt.timestamp > cutoff)

    // 清理旧的安全事件
    this.securityEvents = this.securityEvents.filter((event) => event.timestamp > cutoff)
  }
}

// 定期清理过期数据
if (typeof window !== "undefined") {
  setInterval(
    () => {
      EnhancedAuthManager.cleanupExpiredData()
    },
    60 * 60 * 1000,
  ) // 每小时清理一次
}
