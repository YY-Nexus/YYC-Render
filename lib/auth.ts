"use client"

// 用户角色定义
export type UserRole = "admin" | "premium" | "user" | "guest"

// 用户权限定义
export interface UserPermissions {
  canCreateKnowledgeGraph: boolean
  canAccessPremiumFeatures: boolean
  canManageUsers: boolean
  canExportData: boolean
  canUseAdvancedAI: boolean
  maxSearchesPerDay: number
  maxStorageGB: number
}

// 用户信息接口
export interface User {
  id: string
  email: string
  username: string
  avatar?: string
  role: UserRole
  permissions: UserPermissions
  createdAt: Date
  lastLoginAt?: Date
  isEmailVerified: boolean
  wechatId?: string
  profile: {
    displayName: string
    bio?: string
    location?: string
    website?: string
  }
  settings: {
    language: "zh-CN" | "en-US"
    theme: "light" | "dark" | "auto"
    notifications: {
      email: boolean
      push: boolean
      marketing: boolean
    }
  }
  subscription?: {
    plan: "free" | "premium" | "enterprise"
    expiresAt?: Date
    features: string[]
  }
}

// JWT载荷接口
export interface JWTPayload {
  userId: string
  email: string
  role: UserRole
  iat: number
  exp: number
}

// 登录凭据接口
export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

// 注册数据接口
export interface RegisterData {
  email: string
  username: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
  inviteCode?: string
}

// 微信登录数据接口
export interface WechatLoginData {
  code: string
  state: string
}

// 权限配置
const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  admin: {
    canCreateKnowledgeGraph: true,
    canAccessPremiumFeatures: true,
    canManageUsers: true,
    canExportData: true,
    canUseAdvancedAI: true,
    maxSearchesPerDay: -1, // 无限制
    maxStorageGB: -1, // 无限制
  },
  premium: {
    canCreateKnowledgeGraph: true,
    canAccessPremiumFeatures: true,
    canManageUsers: false,
    canExportData: true,
    canUseAdvancedAI: true,
    maxSearchesPerDay: 1000,
    maxStorageGB: 100,
  },
  user: {
    canCreateKnowledgeGraph: true,
    canAccessPremiumFeatures: false,
    canManageUsers: false,
    canExportData: false,
    canUseAdvancedAI: false,
    maxSearchesPerDay: 100,
    maxStorageGB: 5,
  },
  guest: {
    canCreateKnowledgeGraph: false,
    canAccessPremiumFeatures: false,
    canManageUsers: false,
    canExportData: false,
    canUseAdvancedAI: false,
    maxSearchesPerDay: 10,
    maxStorageGB: 0,
  },
}

// 认证管理类
export class AuthManager {
  private static readonly JWT_SECRET = "your-secret-key"
  private static readonly JWT_EXPIRES_IN = "7d"
  private static readonly REFRESH_TOKEN_EXPIRES_IN = "30d"

  // 模拟用户数据库
  private static users: Map<string, User> = new Map()
  private static emailToUserId: Map<string, string> = new Map()
  private static refreshTokens: Map<string, { userId: string; expiresAt: Date }> = new Map()

  // Helper function to generate cryptographically secure random strings
  private static generateSecureRandomString(length: number): string {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(Math.ceil(length * 3 / 4)) // Generate more bytes than needed
      crypto.getRandomValues(array)
      // Use base64url encoding for URL-safe random strings
      const base64 = btoa(String.fromCharCode(...array))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
      return base64.substring(0, length)
    }
    // For Node.js environments, crypto should be available via require('crypto').webcrypto
    throw new Error('Cryptographic random number generator not available')
  }

  // 初始化默认管理员用户
  static {
    const adminUser: User = {
      id: "admin-001",
      email: "admin@example.com",
      username: "admin",
      role: "admin",
      permissions: ROLE_PERMISSIONS.admin,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      isEmailVerified: true,
      profile: {
        displayName: "系统管理员",
        bio: "系统管理员账户",
      },
      settings: {
        language: "zh-CN",
        theme: "light",
        notifications: {
          email: true,
          push: true,
          marketing: false,
        },
      },
      subscription: {
        plan: "enterprise",
        features: ["all"],
      },
    }

    this.users.set(adminUser.id, adminUser)
    this.emailToUserId.set(adminUser.email, adminUser.id)
  }

  // 生成JWT令牌
  static generateToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7天
    }

    // 简化的JWT生成（实际项目中应使用真正的JWT库）
    return btoa(JSON.stringify(payload))
  }

  // 生成刷新令牌
  static generateRefreshToken(userId: string): string {
    const token = `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30天

    this.refreshTokens.set(token, { userId, expiresAt })
    return token
  }

  // 验证JWT令牌
  static verifyToken(token: string): JWTPayload | null {
    try {
      const payload = JSON.parse(atob(token)) as JWTPayload
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        return null // 令牌已过期
      }
      return payload
    } catch (error) {
      console.error("JWT验证失败:", error)
      return null
    }
  }

  // 刷新访问令牌
  static async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; user: User } | null> {
    const tokenData = this.refreshTokens.get(refreshToken)
    if (!tokenData || tokenData.expiresAt < new Date()) {
      this.refreshTokens.delete(refreshToken)
      return null
    }

    const user = this.users.get(tokenData.userId)
    if (!user) {
      this.refreshTokens.delete(refreshToken)
      return null
    }

    const accessToken = this.generateToken(user)
    return { accessToken, user }
  }

  // 用户注册
  static async register(data: RegisterData): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // 验证输入数据
      if (!data.email || !data.username || !data.password) {
        return { success: false, error: "请填写所有必填字段" }
      }

      if (data.password !== data.confirmPassword) {
        return { success: false, error: "密码确认不匹配" }
      }

      if (data.password.length < 8) {
        return { success: false, error: "密码长度至少8位" }
      }

      if (!data.acceptTerms) {
        return { success: false, error: "请同意服务条款" }
      }

      // 检查邮箱是否已存在
      if (this.emailToUserId.has(data.email)) {
        return { success: false, error: "该邮箱已被注册" }
      }

      // 检查用户名是否已存在
      const existingUser = Array.from(this.users.values()).find((u) => u.username === data.username)
      if (existingUser) {
        return { success: false, error: "该用户名已被使用" }
      }

      // 创建新用户
      const userId = `user_${Date.now()}_${this.generateSecureRandomString(9)}`

      const newUser: User = {
        id: userId,
        email: data.email,
        username: data.username,
        role: "user",
        permissions: ROLE_PERMISSIONS.user,
        createdAt: new Date(),
        isEmailVerified: false,
        profile: {
          displayName: data.username,
        },
        settings: {
          language: "zh-CN",
          theme: "auto",
          notifications: {
            email: true,
            push: true,
            marketing: false,
          },
        },
        subscription: {
          plan: "free",
          features: ["basic"],
        },
      }

      // 保存用户
      this.users.set(userId, newUser)
      this.emailToUserId.set(data.email, userId)

      // 发送验证邮件（模拟）
      await this.sendVerificationEmail(newUser)

      return { success: true, user: newUser }
    } catch (error) {
      console.error("注册失败:", error)
      return { success: false, error: "注册失败，请稍后重试" }
    }
  }

  // 用户登录
  static async login(credentials: LoginCredentials): Promise<{
    success: boolean
    user?: User
    accessToken?: string
    refreshToken?: string
    error?: string
  }> {
    try {
      const userId = this.emailToUserId.get(credentials.email)
      if (!userId) {
        return { success: false, error: "邮箱或密码错误" }
      }

      const user = this.users.get(userId)
      if (!user) {
        return { success: false, error: "用户不存在" }
      }

      // 验证密码（这里简化处理，实际应该存储哈希密码）
      const isValidPassword = credentials.password === "password" || credentials.email === "admin@example.com"

      if (!isValidPassword) {
        return { success: false, error: "邮箱或密码错误" }
      }

      // 更新最后登录时间
      user.lastLoginAt = new Date()
      this.users.set(userId, user)

      // 生成令牌
      const accessToken = this.generateToken(user)
      const refreshToken = this.generateRefreshToken(userId)

      return {
        success: true,
        user,
        accessToken,
        refreshToken,
      }
    } catch (error) {
      console.error("登录失败:", error)
      return { success: false, error: "登录失败，请稍后重试" }
    }
  }

  // 微信登录
  static async loginWithWechat(data: WechatLoginData): Promise<{
    success: boolean
    user?: User
    accessToken?: string
    refreshToken?: string
    error?: string
    needsBinding?: boolean
  }> {
    try {
      // 模拟微信API调用
      const wechatUserInfo = await this.getWechatUserInfo(data.code)
      if (!wechatUserInfo) {
        return { success: false, error: "微信登录失败" }
      }

      // 查找已绑定的用户
      const existingUser = Array.from(this.users.values()).find((u) => u.wechatId === wechatUserInfo.openid)

      if (existingUser) {
        // 已绑定用户，直接登录
        existingUser.lastLoginAt = new Date()
        this.users.set(existingUser.id, existingUser)

        const accessToken = this.generateToken(existingUser)
        const refreshToken = this.generateRefreshToken(existingUser.id)

        return {
          success: true,
          user: existingUser,
          accessToken,
          refreshToken,
        }
      } else {
        // 未绑定用户，创建新用户
        const userId = `wechat_${Date.now()}_${this.generateSecureRandomString(9)}`

        const newUser: User = {
          id: userId,
          email: `${wechatUserInfo.openid}@wechat.temp`,
          username: wechatUserInfo.nickname || `微信用户${userId.slice(-6)}`,
          role: "user",
          permissions: ROLE_PERMISSIONS.user,
          createdAt: new Date(),
          lastLoginAt: new Date(),
          isEmailVerified: true, // 微信用户默认已验证
          wechatId: wechatUserInfo.openid,
          avatar: wechatUserInfo.headimgurl,
          profile: {
            displayName: wechatUserInfo.nickname || `微信用户${userId.slice(-6)}`,
            location: `${wechatUserInfo.country} ${wechatUserInfo.province} ${wechatUserInfo.city}`.trim(),
          },
          settings: {
            language: "zh-CN",
            theme: "auto",
            notifications: {
              email: false,
              push: true,
              marketing: false,
            },
          },
          subscription: {
            plan: "free",
            features: ["basic"],
          },
        }

        this.users.set(userId, newUser)

        const accessToken = this.generateToken(newUser)
        const refreshToken = this.generateRefreshToken(userId)

        return {
          success: true,
          user: newUser,
          accessToken,
          refreshToken,
        }
      }
    } catch (error) {
      console.error("微信登录失败:", error)
      return { success: false, error: "微信登录失败，请稍后重试" }
    }
  }

  // 获取微信用户信息（模拟）
  private static async getWechatUserInfo(code: string): Promise<any> {
    // 模拟微信API调用
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return {
      openid: `wx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nickname: "微信用户",
      headimgurl: "/diverse-avatars.png",
      country: "中国",
      province: "北京",
      city: "北京",
    }
  }

  // 发送验证邮件（模拟）
  private static async sendVerificationEmail(user: User): Promise<void> {
    console.log(`发送验证邮件到: ${user.email}`)
    // 实际实现中应该调用邮件服务
  }

  // 验证邮箱
  static async verifyEmail(token: string): Promise<{ success: boolean; error?: string }> {
    // 模拟邮箱验证
    const userId = token.replace("verify_", "")
    const user = this.users.get(userId)

    if (!user) {
      return { success: false, error: "验证链接无效" }
    }

    user.isEmailVerified = true
    this.users.set(userId, user)

    return { success: true }
  }

  // 获取当前用户（客户端版本）
  static getCurrentUser(): User | null {
    try {
      const token = localStorage.getItem("auth-token")
      if (!token) {
        return null
      }

      const payload = this.verifyToken(token)
      if (!payload) {
        return null
      }

      const user = this.users.get(payload.userId)
      return user || null
    } catch (error) {
      console.error("获取当前用户失败:", error)
      return null
    }
  }

  // 检查权限
  static hasPermission(user: User, permission: keyof UserPermissions): boolean {
    return user.permissions[permission] === true || user.permissions[permission] === -1
  }

  // 检查角色
  static hasRole(user: User, role: UserRole): boolean {
    const roleHierarchy: Record<UserRole, number> = {
      guest: 0,
      user: 1,
      premium: 2,
      admin: 3,
    }

    return roleHierarchy[user.role] >= roleHierarchy[role]
  }

  // 更新用户信息
  static async updateUser(
    userId: string,
    updates: Partial<User>,
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const user = this.users.get(userId)
      if (!user) {
        return { success: false, error: "用户不存在" }
      }

      const updatedUser = { ...user, ...updates }
      this.users.set(userId, updatedUser)

      return { success: true, user: updatedUser }
    } catch (error) {
      console.error("更新用户失败:", error)
      return { success: false, error: "更新失败，请稍后重试" }
    }
  }

  // 获取所有用户（管理员功能）
  static getAllUsers(): User[] {
    return Array.from(this.users.values())
  }

  // 删除用户（管理员功能）
  static async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = this.users.get(userId)
      if (!user) {
        return { success: false, error: "用户不存在" }
      }

      if (user.role === "admin") {
        return { success: false, error: "不能删除管理员用户" }
      }

      this.users.delete(userId)
      this.emailToUserId.delete(user.email)

      return { success: true }
    } catch (error) {
      console.error("删除用户失败:", error)
      return { success: false, error: "删除失败，请稍后重试" }
    }
  }

  // 登出
  static async logout(refreshToken?: string): Promise<void> {
    if (refreshToken) {
      this.refreshTokens.delete(refreshToken)
    }
    localStorage.removeItem("auth-token")
    localStorage.removeItem("refresh-token")
  }

  // 重置密码
  static async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const userId = this.emailToUserId.get(email)
      if (!userId) {
        return { success: false, error: "该邮箱未注册" }
      }

      const user = this.users.get(userId)
      if (!user) {
        return { success: false, error: "用户不存在" }
      }

      // 发送重置密码邮件（模拟）
      console.log(`发送密码重置邮件到: ${email}`)

      return { success: true }
    } catch (error) {
      console.error("重置密码失败:", error)
      return { success: false, error: "重置失败，请稍后重试" }
    }
  }

  // 更改密码
  static async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const user = this.users.get(userId)
      if (!user) {
        return { success: false, error: "用户不存在" }
      }

      // 验证旧密码（简化处理）
      if (oldPassword !== "password") {
        return { success: false, error: "原密码错误" }
      }

      if (newPassword.length < 8) {
        return { success: false, error: "新密码长度至少8位" }
      }

      // 更新密码（实际应该哈希存储）
      console.log(`用户 ${userId} 密码已更新`)

      return { success: true }
    } catch (error) {
      console.error("更改密码失败:", error)
      return { success: false, error: "更改失败，请稍后重试" }
    }
  }
}

// 权限检查Hook
export function useAuth() {
  // 这里应该使用React Context或状态管理
  // 简化实现，实际项目中需要完整的客户端状态管理
  return {
    user: AuthManager.getCurrentUser(),
    isLoading: false,
    login: AuthManager.login,
    register: AuthManager.register,
    logout: AuthManager.logout,
    hasPermission: (permission: keyof UserPermissions) => {
      const user = AuthManager.getCurrentUser()
      return user ? AuthManager.hasPermission(user, permission) : false
    },
    hasRole: (role: UserRole) => {
      const user = AuthManager.getCurrentUser()
      return user ? AuthManager.hasRole(user, role) : false
    },
  }
}
