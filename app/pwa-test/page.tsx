"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Wifi,
  WifiOff,
  Download,
  Bell,
  Smartphone,
  Database,
  FolderSyncIcon as Sync,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react"

interface TestResult {
  name: string
  status: "pending" | "running" | "success" | "error"
  message: string
  details?: string
}

export default function PWATestPage() {
  const [isOnline, setIsOnline] = useState(true)
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([
    { name: "网络状态检测", status: "pending", message: "等待测试..." },
    { name: "Service Worker", status: "pending", message: "等待测试..." },
    { name: "离线功能", status: "pending", message: "等待测试..." },
    { name: "应用安装", status: "pending", message: "等待测试..." },
    { name: "推送通知", status: "pending", message: "等待测试..." },
    { name: "缓存管理", status: "pending", message: "等待测试..." },
    { name: "后台同步", status: "pending", message: "等待测试..." },
    { name: "数据持久化", status: "pending", message: "等待测试..." },
  ])
  const [currentTest, setCurrentTest] = useState(-1)
  const [overallProgress, setOverallProgress] = useState(0)

  useEffect(() => {
    // 监听网络状态
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    setIsOnline(navigator.onLine)

    // 监听安装提示
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setInstallPrompt(e)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // 检查是否已安装
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const updateTestResult = (index: number, status: TestResult["status"], message: string, details?: string) => {
    setTestResults((prev) => prev.map((test, i) => (i === index ? { ...test, status, message, details } : test)))
  }

  const runAllTests = async () => {
    setCurrentTest(0)
    setOverallProgress(0)

    for (let i = 0; i < testResults.length; i++) {
      setCurrentTest(i)
      updateTestResult(i, "running", "测试中...")

      try {
        await runSingleTest(i)
      } catch (error) {
        updateTestResult(i, "error", "测试失败", error instanceof Error ? error.message : "未知错误")
      }

      setOverallProgress(((i + 1) / testResults.length) * 100)
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    setCurrentTest(-1)
  }

  const runSingleTest = async (testIndex: number) => {
    switch (testIndex) {
      case 0: // 网络状态检测
        await testNetworkStatus()
        break
      case 1: // Service Worker
        await testServiceWorker()
        break
      case 2: // 离线功能
        await testOfflineCapability()
        break
      case 3: // 应用安装
        await testAppInstallation()
        break
      case 4: // 推送通知
        await testPushNotifications()
        break
      case 5: // 缓存管理
        await testCacheManagement()
        break
      case 6: // 后台同步
        await testBackgroundSync()
        break
      case 7: // 数据持久化
        await testDataPersistence()
        break
    }
  }

  const testNetworkStatus = async () => {
    const online = navigator.onLine
    const connection = (navigator as any).connection

    let details = `在线状态: ${online ? "在线" : "离线"}`
    if (connection) {
      details += `\n连接类型: ${connection.effectiveType || "未知"}`
      details += `\n下载速度: ${connection.downlink || "未知"} Mbps`
    }

    updateTestResult(0, "success", online ? "网络连接正常" : "当前离线状态", details)
  }

  const testServiceWorker = async () => {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          const details = `状态: ${registration.active ? "活跃" : "未激活"}\n作用域: ${registration.scope}`
          updateTestResult(1, "success", "Service Worker 运行正常", details)
        } else {
          updateTestResult(1, "error", "Service Worker 未注册")
        }
      } catch (error) {
        updateTestResult(1, "error", "Service Worker 测试失败", error instanceof Error ? error.message : "未知错误")
      }
    } else {
      updateTestResult(1, "error", "浏览器不支持 Service Worker")
    }
  }

  const testOfflineCapability = async () => {
    try {
      const response = await fetch("/api/test-offline")
      if (response.ok) {
        const data = await response.json()
        updateTestResult(2, "success", "离线功能正常", `数据项: ${data.data?.searchResults?.length || 0}`)
      } else {
        updateTestResult(2, "error", "离线API响应异常")
      }
    } catch (error) {
      // 网络错误时测试缓存
      try {
        const cachedResponse = await caches.match("/api/test-offline")
        if (cachedResponse) {
          updateTestResult(2, "success", "离线缓存可用", "使用缓存数据")
        } else {
          updateTestResult(2, "error", "离线缓存不可用")
        }
      } catch (cacheError) {
        updateTestResult(2, "error", "离线功能测试失败")
      }
    }
  }

  const testAppInstallation = async () => {
    if (isInstalled) {
      updateTestResult(3, "success", "应用已安装", "运行在独立模式")
    } else if (installPrompt) {
      updateTestResult(3, "success", "支持应用安装", "可以安装为PWA应用")
    } else {
      updateTestResult(3, "error", "不支持应用安装", "可能已安装或浏览器不支持")
    }
  }

  const testPushNotifications = async () => {
    if ("Notification" in window) {
      const permission = Notification.permission

      if (permission === "granted") {
        updateTestResult(4, "success", "通知权限已授予", "可以发送推送通知")
      } else if (permission === "default") {
        updateTestResult(4, "pending", "需要通知权限", "点击下方按钮请求权限")
      } else {
        updateTestResult(4, "error", "通知权限被拒绝", "用户拒绝了通知权限")
      }
    } else {
      updateTestResult(4, "error", "浏览器不支持通知")
    }
  }

  const testCacheManagement = async () => {
    if ("caches" in window) {
      try {
        const cacheNames = await caches.keys()
        const totalCaches = cacheNames.length

        let totalSize = 0
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName)
          const requests = await cache.keys()
          totalSize += requests.length
        }

        const details = `缓存数量: ${totalCaches}\n缓存项目: ${totalSize}`
        updateTestResult(5, "success", "缓存管理正常", details)
      } catch (error) {
        updateTestResult(5, "error", "缓存管理测试失败")
      }
    } else {
      updateTestResult(5, "error", "浏览器不支持缓存API")
    }
  }

  const testBackgroundSync = async () => {
    if ("serviceWorker" in navigator && "sync" in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready
        await registration.sync.register("background-sync")
        updateTestResult(6, "success", "后台同步可用", "已注册后台同步任务")
      } catch (error) {
        updateTestResult(6, "error", "后台同步注册失败")
      }
    } else {
      updateTestResult(6, "error", "浏览器不支持后台同步")
    }
  }

  const testDataPersistence = async () => {
    try {
      // 测试 localStorage
      const testKey = "pwa-test-data"
      const testData = { timestamp: Date.now(), test: true }

      localStorage.setItem(testKey, JSON.stringify(testData))
      const retrieved = JSON.parse(localStorage.getItem(testKey) || "{}")

      if (retrieved.test) {
        localStorage.removeItem(testKey)

        // 测试 IndexedDB
        if ("indexedDB" in window) {
          updateTestResult(7, "success", "数据持久化正常", "localStorage 和 IndexedDB 可用")
        } else {
          updateTestResult(7, "success", "基础持久化可用", "仅 localStorage 可用")
        }
      } else {
        updateTestResult(7, "error", "数据持久化失败")
      }
    } catch (error) {
      updateTestResult(7, "error", "数据持久化测试失败")
    }
  }

  const installApp = async () => {
    if (installPrompt) {
      try {
        const result = await installPrompt.prompt()
        if (result.outcome === "accepted") {
          setIsInstalled(true)
          setInstallPrompt(null)
          updateTestResult(3, "success", "应用安装成功", "应用已添加到主屏幕")
        }
      } catch (error) {
        console.error("安装失败:", error)
      }
    }
  }

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      try {
        const permission = await Notification.requestPermission()
        if (permission === "granted") {
          updateTestResult(4, "success", "通知权限已授予", "可以发送推送通知")

          // 发送测试通知
          new Notification("PWA测试", {
            body: "通知功能测试成功！",
            icon: "/icon-192.png",
            badge: "/icon-72.png",
          })
        } else {
          updateTestResult(4, "error", "通知权限被拒绝")
        }
      } catch (error) {
        updateTestResult(4, "error", "请求通知权限失败")
      }
    }
  }

  const clearAllCaches = async () => {
    if ("caches" in window) {
      try {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map((name) => caches.delete(name)))
        updateTestResult(5, "success", "缓存已清理", "所有缓存已删除")
      } catch (error) {
        updateTestResult(5, "error", "清理缓存失败")
      }
    }
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />
      case "running":
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: TestResult["status"]) => {
    const variants = {
      success: "default",
      error: "destructive",
      running: "secondary",
      pending: "outline",
    } as const

    const labels = {
      success: "通过",
      error: "失败",
      running: "运行中",
      pending: "待测试",
    }

    return <Badge variant={variants[status]}>{labels[status]}</Badge>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">PWA功能测试中心</h1>
          <p className="text-gray-600 dark:text-gray-300">全面测试Progressive Web App的各项功能和性能</p>
        </div>

        {/* 网络状态指示器 */}
        <Alert className={`mb-6 ${isOnline ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
          <div className="flex items-center">
            {isOnline ? <Wifi className="w-4 h-4 text-green-600" /> : <WifiOff className="w-4 h-4 text-red-600" />}
            <AlertDescription className={`ml-2 ${isOnline ? "text-green-800" : "text-red-800"}`}>
              当前网络状态: {isOnline ? "在线" : "离线"}
              {!isOnline && " - 正在使用离线模式"}
            </AlertDescription>
          </div>
        </Alert>

        {/* 测试控制面板 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              测试控制面板
            </CardTitle>
            <CardDescription>运行全面的PWA功能测试，检查应用的各项能力</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-4">
              <Button onClick={runAllTests} disabled={currentTest !== -1}>
                {currentTest !== -1 ? "测试进行中..." : "开始全面测试"}
              </Button>

              {installPrompt && !isInstalled && (
                <Button onClick={installApp} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  安装应用
                </Button>
              )}

              {testResults[4]?.status === "pending" && (
                <Button onClick={requestNotificationPermission} variant="outline">
                  <Bell className="w-4 h-4 mr-2" />
                  请求通知权限
                </Button>
              )}

              <Button onClick={clearAllCaches} variant="outline">
                <Database className="w-4 h-4 mr-2" />
                清理缓存
              </Button>
            </div>

            {currentTest !== -1 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>测试进度</span>
                  <span>{Math.round(overallProgress)}%</span>
                </div>
                <Progress value={overallProgress} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* 测试结果列表 */}
        <div className="grid gap-4 md:grid-cols-2">
          {testResults.map((test, index) => (
            <Card key={index} className={`${currentTest === index ? "ring-2 ring-blue-500" : ""}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    {getStatusIcon(test.status)}
                    <span className="ml-2">{test.name}</span>
                  </CardTitle>
                  {getStatusBadge(test.status)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{test.message}</p>
                {test.details && (
                  <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded whitespace-pre-wrap">
                    {test.details}
                  </pre>
                )}

                {/* 特殊操作按钮 */}
                {index === 3 && installPrompt && !isInstalled && (
                  <Button size="sm" onClick={installApp} className="mt-2">
                    <Smartphone className="w-4 h-4 mr-1" />
                    立即安装
                  </Button>
                )}

                {index === 4 && test.status === "pending" && (
                  <Button size="sm" onClick={requestNotificationPermission} className="mt-2">
                    <Bell className="w-4 h-4 mr-1" />
                    授权通知
                  </Button>
                )}

                {index === 6 && test.status === "success" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 bg-transparent"
                    onClick={async () => {
                      try {
                        const response = await fetch("/api/sync", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            type: "test_sync",
                            data: { test: true, timestamp: Date.now() },
                            deviceId: "pwa-test",
                          }),
                        })

                        if (response.ok) {
                          updateTestResult(6, "success", "后台同步测试成功", "数据同步完成")
                        }
                      } catch (error) {
                        updateTestResult(6, "error", "后台同步测试失败")
                      }
                    }}
                  >
                    <Sync className="w-4 h-4 mr-1" />
                    测试同步
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 测试统计 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>测试统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {testResults.filter((t) => t.status === "success").length}
                </div>
                <div className="text-sm text-gray-600">通过</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {testResults.filter((t) => t.status === "error").length}
                </div>
                <div className="text-sm text-gray-600">失败</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {testResults.filter((t) => t.status === "running").length}
                </div>
                <div className="text-sm text-gray-600">运行中</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {testResults.filter((t) => t.status === "pending").length}
                </div>
                <div className="text-sm text-gray-600">待测试</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
