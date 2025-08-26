"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Home, Search, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="p-8">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Search className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-2">404</h1>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">页面未找到</h2>
            <p className="text-gray-600 dark:text-gray-400">抱歉，您访问的页面不存在或已被移动。</p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push("/")}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Home className="w-4 h-4 mr-2" />
              返回首页
            </Button>

            <Button variant="outline" onClick={() => router.back()} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回上页
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">如果您认为这是一个错误，请联系我们的技术支持。</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
