"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center">
            <CardContent className="p-8">
              <div className="mb-6">
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-red-500 to-orange-600 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">系统错误</h1>
                <p className="text-gray-600 mb-4">应用遇到了严重错误，请刷新页面重试。</p>
              </div>

              <Button
                onClick={reset}
                className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                刷新页面
              </Button>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">如果问题持续存在，请联系技术支持</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  )
}
