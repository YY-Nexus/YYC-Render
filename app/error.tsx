"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { useRouter } from "next/navigation"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // 记录错误到监控服务
    console.error("应用错误:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="p-8">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-red-500 to-orange-600 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">出现了一些问题</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">应用遇到了意外错误，我们正在努力修复。</p>

            {process.env.NODE_ENV === "development" && (
              <details className="text-left bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  错误详情
                </summary>
                <pre className="text-xs text-red-600 dark:text-red-400 overflow-auto">{error.message}</pre>
              </details>
            )}
          </div>

          <div className="space-y-3">
            <Button
              onClick={reset}
              className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              重试
            </Button>

            <Button variant="outline" onClick={() => router.push("/")} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">错误ID: {error.digest || "未知"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
