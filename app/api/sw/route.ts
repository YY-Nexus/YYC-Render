import { NextResponse } from "next/server"

export async function GET() {
  const swContent = `
// AI智能搜索平台 Service Worker
const CACHE_NAME = "ai-search-app-v1.0.0"
const STATIC_CACHE_URLS = [
  "/",
  "/offline",
  "/pwa-test",
  "/manifest.json",
  "/icon-72.png",
  "/icon-192.png",
  "/icon-512.png",
]

// 安装事件 - 缓存静态资源
self.addEventListener("install", (event) => {
  console.log("Service Worker: 安装中...")

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: 缓存静态资源")
        return cache.addAll(STATIC_CACHE_URLS)
      })
      .then(() => {
        console.log("Service Worker: 安装完成")
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error("Service Worker: 安装失败", error)
      }),
  )
})

// 激活事件 - 清理旧缓存
self.addEventListener("activate", (event) => {
  console.log("Service Worker: 激活中...")

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("Service Worker: 删除旧缓存", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        console.log("Service Worker: 激活完成")
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

  // API请求策略：网络优先，失败时返回缓存
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 成功响应时更新缓存
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // 网络失败时返回缓存
          return caches.match(request).then((cachedResponse) => {
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

            return new Response("离线模式 - 数据不可用", { status: 503 })
          })
        }),
    )
    return
  }

  // 静态资源策略：缓存优先，失败时网络获取
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(request)
        .then((response) => {
          // 缓存成功的响应
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // 如果是页面请求且失败，返回离线页面
          if (request.mode === "navigate") {
            return caches.match("/offline").then((offlinePage) => {
              return (
                offlinePage ||
                new Response("页面不可用", {
                  status: 404,
                  headers: { "Content-Type": "text/html" },
                })
              )
            })
          }

          return new Response("资源不可用", { status: 404 })
        })
    }),
  )
})

// 后台同步
self.addEventListener("sync", (event) => {
  console.log("Service Worker: 后台同步", event.tag)

  if (event.tag === "background-sync") {
    event.waitUntil(syncOfflineData())
  }
})

// 推送通知
self.addEventListener("push", (event) => {
  console.log("Service Worker: 收到推送消息")

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
  }

  event.waitUntil(self.registration.showNotification("AI搜索应用", options))
})

// 通知点击
self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: 通知被点击", event.action)

  event.notification.close()

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/"))
  }
})

// 消息处理
self.addEventListener("message", (event) => {
  console.log("Service Worker: 收到消息", event.data)

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }

  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    const { title, options } = event.data
    self.registration.showNotification(title, options)
  }
})

// 同步离线数据
async function syncOfflineData() {
  try {
    console.log("Service Worker: 开始同步离线数据")

    const response = await fetch("/api/sync", {
      method: "GET",
    })

    if (response.ok) {
      console.log("Service Worker: 数据同步成功")
    } else {
      console.error("Service Worker: 数据同步失败")
    }
  } catch (error) {
    console.error("Service Worker: 同步过程中出错", error)
  }
}

// 错误处理
self.addEventListener("error", (event) => {
  console.error("Service Worker: 发生错误", event.error)
})

self.addEventListener("unhandledrejection", (event) => {
  console.error("Service Worker: 未处理的Promise拒绝", event.reason)
})

console.log("Service Worker: 脚本加载完成")
`

  return new NextResponse(swContent, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  })
}
