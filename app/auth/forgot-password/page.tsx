"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react"
import { AuthManager } from "@/lib/auth"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await AuthManager.resetPassword(email)

      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error || "重置失败")
      }
    } catch (error) {
      console.error("重置密码错误:", error)
      setError("重置失败，请稍后重试")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">邮件已发送</h2>
            <p className="text-gray-600 mb-6">
              我们已向 <span className="font-medium">{email}</span>{" "}
              发送了密码重置邮件，请查收并按照邮件中的说明重置您的密码。
            </p>
            <div className="space-y-3">
              <Link
                href="/auth/login"
                className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                返回登录
              </Link>
              <button
                onClick={() => {
                  setSuccess(false)
                  setEmail("")
                }}
                className="block w-full text-gray-600 hover:text-gray-800 py-2"
              >
                重新发送
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link
            href="/auth/login"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回登录
          </Link>
        </div>

        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">AI</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">忘记密码</h1>
          <p className="text-gray-600">输入您的邮箱地址，我们将发送重置密码的链接</p>
        </div>

        {/* 重置表单 */}
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入注册时使用的邮箱"
                  required
                />
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  发送中...
                </div>
              ) : (
                "发送重置邮件"
              )}
            </button>
          </form>

          {/* 帮助信息 */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">找不到重置邮件？</h3>
            <ul className="text-xs text-blue-600 space-y-1">
              <li>• 请检查垃圾邮件文件夹</li>
              <li>• 确认邮箱地址输入正确</li>
              <li>• 邮件可能需要几分钟才能到达</li>
              <li>• 如仍有问题，请联系客服</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
