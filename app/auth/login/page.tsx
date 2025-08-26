"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Mail, Lock, Loader2, MessageCircle } from "lucide-react"
import { AuthManager, type LoginCredentials } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<LoginCredentials>({
    email: "",
    password: "",
    rememberMe: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await AuthManager.login(formData)

      if (result.success && result.user && result.accessToken) {
        // 保存令牌到cookie
        document.cookie = `auth-token=${result.accessToken}; path=/; max-age=${7 * 24 * 60 * 60}`
        if (result.refreshToken) {
          document.cookie = `refresh-token=${result.refreshToken}; path=/; max-age=${30 * 24 * 60 * 60}`
        }

        // 保存用户信息到localStorage
        localStorage.setItem("current-user", JSON.stringify(result.user))

        // 根据用户角色跳转
        if (result.user.role === "admin") {
          router.push("/admin/users")
        } else {
          router.push("/")
        }
      } else {
        setError(result.error || "登录失败")
      }
    } catch (error) {
      console.error("登录错误:", error)
      setError("登录失败，请稍后重试")
    } finally {
      setIsLoading(false)
    }
  }

  const handleWechatLogin = async () => {
    setIsLoading(true)
    setError("")

    try {
      // 模拟微信登录
      const result = await AuthManager.loginWithWechat({
        code: `wx_${Date.now()}`,
        state: "login",
      })

      if (result.success && result.user && result.accessToken) {
        document.cookie = `auth-token=${result.accessToken}; path=/; max-age=${7 * 24 * 60 * 60}`
        if (result.refreshToken) {
          document.cookie = `refresh-token=${result.refreshToken}; path=/; max-age=${30 * 24 * 60 * 60}`
        }

        localStorage.setItem("current-user", JSON.stringify(result.user))
        router.push("/")
      } else {
        setError(result.error || "微信登录失败")
      }
    } catch (error) {
      console.error("微信登录错误:", error)
      setError("微信登录失败，请稍后重试")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">AI</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">欢迎回来</h1>
          <p className="text-gray-600">登录您的AI搜索助手账户</p>
        </div>

        {/* 登录表单 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 邮箱输入 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                邮箱地址
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入邮箱地址"
                  required
                />
              </div>
            </div>

            {/* 密码输入 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入密码"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* 记住我和忘记密码 */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">记住我</span>
              </label>
              <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
                忘记密码？
              </Link>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  登录中...
                </div>
              ) : (
                "登录"
              )}
            </button>

            {/* 分割线 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">或</span>
              </div>
            </div>

            {/* 微信登录 */}
            <button
              type="button"
              onClick={handleWechatLogin}
              disabled={isLoading}
              className="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <div className="flex items-center justify-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                微信登录
              </div>
            </button>
          </form>

          {/* 注册链接 */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              还没有账户？{" "}
              <Link href="/auth/register" className="text-blue-600 hover:text-blue-800 font-medium">
                立即注册
              </Link>
            </p>
          </div>

          {/* 测试账户提示 */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm font-medium mb-1">测试账户</p>
            <p className="text-blue-600 text-xs">
              邮箱: admin@example.com
              <br />
              密码: password
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
