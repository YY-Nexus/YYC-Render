"use client"

import React from "react"

// PWA管理器类
export class PWAManager {
  static async requestNotificationPermission(): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === "granted"
  }

  static async showNotification(title: string, options: NotificationOptions = {}) {
    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") {
      return
    }

    return new Notification(title, options)
  }

  static async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      console.log("Service Worker 不支持")
      return null
    }

    try {
      // 使用API路由提供的Service Worker
      const registration = await navigator.serviceWorker.register("/api/sw", {
        scope: "/",
      })

      console.log("Service Worker 注册成功:", registration)

      // 监听更新
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              console.log("Service Worker 更新可用")
              // 可以在这里通知用户有更新
            }
          })
        }
      })

      return registration
    } catch (error) {
      console.error("Service Worker 注册失败:", error)
      return null
    }
  }

  static async checkForUpdates(): Promise<boolean> {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return false
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        await registration.update()
        return !!registration.waiting
      }
    } catch (error) {
      console.error("检查更新失败:", error)
    }

    return false
  }

  static async installUpdate(): Promise<void> {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return
    }

    const registration = await navigator.serviceWorker.getRegistration()
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" })
      window.location.reload()
    }
  }
}

// 网络信息接口
export interface NetworkInfo {
  type: string
  effectiveType: string
  downlink: number
  rtt: number
}

// PWA状态接口
export interface PWAState {
  isInstallable: boolean
  isInstalled: boolean
  isStandalone: boolean
  isOnline: boolean
  updateAvailable: boolean
  networkInfo: NetworkInfo | null
}

// 网络状态组件
export function NetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(true)

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(window.navigator.onLine)

      const handleOnline = () => setIsOnline(true)
      const handleOffline = () => setIsOnline(false)

      window.addEventListener("online", handleOnline)
      window.addEventListener("offline", handleOffline)

      return () => {
        window.removeEventListener("online", handleOnline)
        window.removeEventListener("offline", handleOffline)
      }
    }
  }, [])

  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 z-50">您当前处于离线状态</div>
  )
}

// PWA安装按钮组件
export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null)
  const [isInstallable, setIsInstallable] = React.useState(false)

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e)
        setIsInstallable(true)
      }

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      }
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      setIsInstallable(false)
      setDeferredPrompt(null)
    }
  }

  if (!isInstallable) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button onClick={handleInstall} className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
        安装应用
      </button>
    </div>
  )
}

// 自定义PWA Hook
export function usePWA() {
  const [state, setState] = React.useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isStandalone: false,
    isOnline: true,
    updateAvailable: false,
    networkInfo: null,
  })

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      // 检查是否为独立应用模式
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true

      // 检查网络状态
      const isOnline = window.navigator.onLine

      // 获取网络信息
      let networkInfo: NetworkInfo | null = null
      if ("connection" in window.navigator) {
        const connection = (window.navigator as any).connection
        networkInfo = {
          type: connection.type || "unknown",
          effectiveType: connection.effectiveType || "unknown",
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0,
        }
      }

      setState((prev) => ({
        ...prev,
        isStandalone,
        isOnline,
        networkInfo,
      }))

      // 监听网络状态变化
      const handleOnline = () => setState((prev) => ({ ...prev, isOnline: true }))
      const handleOffline = () => setState((prev) => ({ ...prev, isOnline: false }))

      window.addEventListener("online", handleOnline)
      window.addEventListener("offline", handleOffline)

      // 监听安装提示
      const handleBeforeInstallPrompt = () => {
        setState((prev) => ({ ...prev, isInstallable: true }))
      }

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

      // 自动注册Service Worker
      PWAManager.registerServiceWorker()

      return () => {
        window.removeEventListener("online", handleOnline)
        window.removeEventListener("offline", handleOffline)
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      }
    }
  }, [])

  const installApp = async (): Promise<boolean> => {
    // 这里应该触发安装提示
    return false
  }

  const updateApp = async (): Promise<void> => {
    if ("serviceWorker" in window.navigator) {
      const registration = await window.navigator.serviceWorker.getRegistration()
      if (registration) {
        registration.update()
      }
    }
  }

  return {
    ...state,
    installApp,
    updateApp,
  }
}
