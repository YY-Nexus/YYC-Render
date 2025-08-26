import { NextResponse } from "next/server"

interface ServiceStatus {
  name: string
  status: "healthy" | "degraded" | "down"
  responseTime: number
  lastCheck: string
  details?: string
}

// 模拟检查各个服务的状态
async function checkServiceHealth(): Promise<ServiceStatus[]> {
  const services = [
    { name: "AI Chat Service", endpoint: "/api/chat" },
    { name: "File Upload Service", endpoint: "/api/upload" },
    { name: "Speech Recognition", endpoint: "/api/speech-to-text" },
    { name: "Image Analysis", endpoint: "/api/analyze-image" },
    { name: "Database", endpoint: null },
    { name: "Cache", endpoint: null },
  ]

  const results: ServiceStatus[] = []

  for (const service of services) {
    const startTime = Date.now()
    let status: ServiceStatus["status"] = "healthy"
    let details = ""

    try {
      if (service.endpoint) {
        // 模拟服务检查
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 100 + 50))

        // 随机模拟一些服务状态
        const random = Math.random()
        if (random < 0.1) {
          status = "down"
          details = "Service temporarily unavailable"
        } else if (random < 0.2) {
          status = "degraded"
          details = "High response time detected"
        }
      } else {
        // 对于没有端点的服务，模拟检查
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 50 + 20))
      }
    } catch (error) {
      status = "down"
      details = error instanceof Error ? error.message : "Unknown error"
    }

    const responseTime = Date.now() - startTime

    results.push({
      name: service.name,
      status,
      responseTime,
      lastCheck: new Date().toISOString(),
      details: details || undefined,
    })
  }

  return results
}

// 计算系统整体状态
function calculateOverallStatus(services: ServiceStatus[]): "healthy" | "degraded" | "down" {
  const downServices = services.filter((s) => s.status === "down").length
  const degradedServices = services.filter((s) => s.status === "degraded").length

  if (downServices > 0) {
    return downServices >= services.length / 2 ? "down" : "degraded"
  }

  if (degradedServices > 0) {
    return "degraded"
  }

  return "healthy"
}

// 获取系统指标
function getSystemMetrics() {
  return {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: {
      usage: Math.random() * 100, // 模拟CPU使用率
      cores: require("os").cpus().length,
    },
    timestamp: new Date().toISOString(),
    version: process.version,
    platform: process.platform,
  }
}

export async function GET() {
  try {
    const startTime = Date.now()

    // 检查所有服务状态
    const services = await checkServiceHealth()
    const overallStatus = calculateOverallStatus(services)
    const systemMetrics = getSystemMetrics()

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      services: services.reduce(
        (acc, service) => {
          acc[service.name] = {
            status: service.status,
            responseTime: service.responseTime,
            lastCheck: service.lastCheck,
            details: service.details,
          }
          return acc
        },
        {} as Record<string, any>,
      ),
      system: systemMetrics,
      summary: {
        totalServices: services.length,
        healthyServices: services.filter((s) => s.status === "healthy").length,
        degradedServices: services.filter((s) => s.status === "degraded").length,
        downServices: services.filter((s) => s.status === "down").length,
        averageResponseTime: services.reduce((sum, s) => sum + s.responseTime, 0) / services.length,
      },
      endpoints: {
        chat: "/api/chat",
        streamChat: "/api/chat/stream",
        upload: "/api/upload",
        speechToText: "/api/speech-to-text",
        imageAnalysis: "/api/analyze-image",
        status: "/api/status",
      },
    }

    // 根据状态设置HTTP状态码
    const httpStatus = overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 207 : 503

    return NextResponse.json(response, { status: httpStatus })
  } catch (error) {
    console.error("Status check error:", error)
    return NextResponse.json(
      {
        status: "down",
        timestamp: new Date().toISOString(),
        error: "Failed to check system status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  // 健康检查端点，用于负载均衡器等
  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    message: "Service is running",
  })
}
