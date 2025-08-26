"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { AuthManager, type User } from "@/lib/auth"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  hasPermission: (permission: keyof User["permissions"]) => boolean
  hasRole: (role: User["role"]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      // 从localStorage获取用户信息
      const storedUser = localStorage.getItem("current-user")
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }

      // 验证token并获取最新用户信息
      const response = await fetch("/api/auth?action=current_user")
      const result = await response.json()

      if (result.success && result.data) {
        setUser(result.data)
        localStorage.setItem("current-user", JSON.stringify(result.data))
      } else {
        // Token无效，清除本地存储
        setUser(null)
        localStorage.removeItem("current-user")
      }
    } catch (error) {
      console.error("加载用户信息失败:", error)
      setUser(null)
      localStorage.removeItem("current-user")
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          email,
          password,
        }),
      })

      const result = await response.json()

      if (result.success && result.user) {
        setUser(result.user)
        localStorage.setItem("current-user", JSON.stringify(result.user))
        return true
      }

      return false
    } catch (error) {
      console.error("登录失败:", error)
      return false
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      })
    } catch (error) {
      console.error("登出失败:", error)
    } finally {
      setUser(null)
      localStorage.removeItem("current-user")
      // 清除所有认证相关的cookie
      document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT"
      document.cookie = "refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT"
    }
  }

  const refreshUser = async () => {
    await loadUser()
  }

  const hasPermission = (permission: keyof User["permissions"]): boolean => {
    if (!user) return false
    return AuthManager.hasPermission(user, permission)
  }

  const hasRole = (role: User["role"]): boolean => {
    if (!user) return false
    return AuthManager.hasRole(user, role)
  }

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    refreshUser,
    hasPermission,
    hasRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// 权限保护组件
export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  fallback,
}: {
  children: ReactNode
  requiredRole?: User["role"]
  requiredPermission?: keyof User["permissions"]
  fallback?: ReactNode
}) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">验证权限中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      fallback || (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">需要登录</h2>
            <p className="text-gray-600 mb-4">请先登录以访问此页面</p>
            <a
              href="/auth/login"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              前往登录
            </a>
          </div>
        </div>
      )
    )
  }

  if (requiredRole && !AuthManager.hasRole(user, requiredRole)) {
    return (
      fallback || (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">权限不足</h2>
            <p className="text-gray-600">您没有访问此页面的权限</p>
          </div>
        </div>
      )
    )
  }

  if (requiredPermission && !AuthManager.hasPermission(user, requiredPermission)) {
    return (
      fallback || (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">功能受限</h2>
            <p className="text-gray-600">您的账户类型无法使用此功能</p>
          </div>
        </div>
      )
    )
  }

  return <>{children}</>
}
