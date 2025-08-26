// AI智能搜索平台 Service Worker v1.0.0
const CACHE_NAME = "ai-search-app-v1.0.0"
const STATIC_CACHE_URLS = [
  "/",
  "/offline",
  "/pwa-test",
  "/search",
  "/history",
  "/settings",
  "/manifest.json",
  "/icon-72.png",
  "/icon-192.png",
  "/icon-512.png",
]

// 动态缓存配置
const CACHE_STRATEGIES = {
  // 静态资源：缓存优先
  static: ["/", "/offline", "/pwa-test"],
  // API请求：网络优先
  api: ["/api/"],
  // 图片资源：缓存优先，过期时间长
  images: ["/images/", "/icons/", ".png", ".jpg", ".jpeg", ".gif", ".webp"],
}

// 安装事件 - 缓存静态资源
self.addEventListener("install", (event) => {
  console.log("🔧 Service Worker: 安装中...")

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("📦 Service Worker: 缓存静态资源")
        return cache.addAll(STATIC_CACHE_URLS)
      })
      .then(() => {
        console.log("✅ Service Worker: 安装完成")
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error("❌ Service Worker: 安装失败", error)
      }),
  )
})

// 激活事件 - 清理旧缓存
self.addEventListener("activate", (event) => {
  console.log("🚀 Service Worker: 激活中...")

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("🗑️ Service Worker: 删除旧缓存", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        console.log("✅ Service Worker: 激活完成")
        return self.clients.claim()
      }),
  )
})

// 拦截网络请求
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 跳过非GET请求和外部资源
  if (request.method !== "GET" || !url.origin.includes(self.location.origin)) {
    return
  }

  // 跳过Chrome扩展请求
  if (url.protocol === "chrome-extension:") {
    return
  }

  // API请求策略：网络优先，失败时返回缓存
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(handleApiRequest(request))
    return
  }

  // 静态资源策略：缓存优先，失败时网络获取
  event.respondWith(handleStaticRequest(request))
})

// 处理API请求
async function handleApiRequest(request) {
  const url = new URL(request.url)

  try {
    // 网络优先策略
    const response = await fetch(request)

    // 成功响应时更新缓存
    if (response.status === 200) {
      const responseClone = response.clone()
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, responseClone)
    }

    return response
  } catch (error) {
    console.log("🌐 网络请求失败，尝试缓存:", url.pathname)

    // 网络失败时返回缓存
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // 返回离线数据
    if (url.pathname.includes("/api/test-offline")) {
      return new Response(
        JSON.stringify({
          message: "离线模式",
          offline: true,
          timestamp: new Date().toISOString(),
          data: {
            items: [
              { id: "offline-1", title: "离线数据1", description: "这是缓存的离线数据" },
              { id: "offline-2", title: "离线数据2", description: "这是另一条缓存数据" },
            ],
          },
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        },
      )
    }

    // 返回通用离线响应
    return new Response(
      JSON.stringify({
        error: "离线模式 - 数据不可用",
        offline: true,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 503,
      },
    )
  }
}

// 处理静态资源请求
async function handleStaticRequest(request) {
  try {
    // 先检查缓存
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // 缓存未命中，从网络获取
    const response = await fetch(request)

    // 缓存成功的响应
    if (response.status === 200) {
      const responseClone = response.clone()
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, responseClone)
    }

    return response
  } catch (error) {
    console.log("🌐 静态资源请求失败:", request.url)

    // 如果是页面请求且失败，返回离线页面
    if (request.mode === "navigate") {
      const offlinePage = await caches.match("/offline")
      if (offlinePage) {
        return offlinePage
      }

      // 如果离线页面也没有缓存，返回基本的离线HTML
      return new Response(
        `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>离线模式 - AI搜索</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                   margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 400px; margin: 50px auto; background: white; 
                        padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
            .icon { font-size: 48px; margin-bottom: 20px; }
            h1 { color: #333; margin-bottom: 10px; }
            p { color: #666; margin-bottom: 20px; }
            button { background: #3b82f6; color: white; border: none; padding: 10px 20px; 
                     border-radius: 5px; cursor: pointer; font-size: 16px; }
            button:hover { background: #2563eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">📡</div>
            <h1>您当前处于离线状态</h1>
            <p>网络连接不可用，请检查您的网络设置</p>
            <button onclick="window.location.reload()">重新加载</button>
          </div>
        </body>
        </html>
        `,
        {
          headers: { "Content-Type": "text/html; charset=utf-8" },
          status: 200,
        },
      )
    }

    return new Response("资源不可用", { status: 404 })
  }
}

// 后台同步
self.addEventListener("sync", (event) => {
  console.log("🔄 Service Worker: 后台同步", event.tag)

  if (event.tag === "background-sync") {
    event.waitUntil(syncOfflineData())
  }
})

// 推送通知
self.addEventListener("push", (event) => {
  console.log("📢 Service Worker: 收到推送消息")

  const options = {
    body: event.data ? event.data.text() : "您有新消息",
    icon: "/icon-192.png",
    badge: "/icon-72.png",
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "查看详情",
        icon: "/icon-192.png",
      },
      {
        action: "close",
        title: "关闭",
        icon: "/icon-192.png",
      },
    ],
    requireInteraction: true,
    silent: false,
  }

  event.waitUntil(self.registration.showNotification("AI搜索应用", options))
})

// 通知点击
self.addEventListener("notificationclick", (event) => {
  console.log("👆 Service Worker: 通知被点击", event.action)

  event.notification.close()

  if (event.action === "explore") {
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        // 如果已有窗口打开，则聚焦到该窗口
        for (const client of clientList) {
          if (client.url === "/" && "focus" in client) {
            return client.focus()
          }
        }
        // 否则打开新窗口
        if (clients.openWindow) {
          return clients.openWindow("/")
        }
      }),
    )
  }
})

// 消息处理
self.addEventListener("message", (event) => {
  console.log("💬 Service Worker: 收到消息", event.data)

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }

  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    const { title, options } = event.data
    self.registration.showNotification(title, options)
  }

  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
})

// 同步离线数据
async function syncOfflineData() {
  try {
    console.log("🔄 Service Worker: 开始同步离线数据")

    const response = await fetch("/api/sync", {
      method: "GET",
    })

    if (response.ok) {
      console.log("✅ Service Worker: 数据同步成功")

      // 通知所有客户端数据已同步
      const clients = await self.clients.matchAll()
      clients.forEach((client) => {
        client.postMessage({
          type: "SYNC_COMPLETE",
          timestamp: new Date().toISOString(),
        })
      })
    } else {
      console.error("❌ Service Worker: 数据同步失败")
    }
  } catch (error) {
    console.error("❌ Service Worker: 同步过程中出错", error)
  }
}

// 错误处理
self.addEventListener("error", (event) => {
  console.error("❌ Service Worker: 发生错误", event.error)
})

self.addEventListener("unhandledrejection", (event) => {
  console.error("❌ Service Worker: 未处理的Promise拒绝", event.reason)
  event.preventDefault()
})

// 定期清理过期缓存
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "cache-cleanup") {
    event.waitUntil(cleanupExpiredCache())
  }
})

// 清理过期缓存
async function cleanupExpiredCache() {
  try {
    const cache = await caches.open(CACHE_NAME)
    const requests = await cache.keys()

    const now = Date.now()
    const maxAge = 7 * 24 * 60 * 60 * 1000 // 7天

    for (const request of requests) {
      const response = await cache.match(request)
      if (response) {
        const dateHeader = response.headers.get("date")
        if (dateHeader) {
          const responseDate = new Date(dateHeader).getTime()
          if (now - responseDate > maxAge) {
            await cache.delete(request)
            console.log("🗑️ 清理过期缓存:", request.url)
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ 清理缓存失败:", error)
  }
}

console.log("🚀 Service Worker: 脚本加载完成")
