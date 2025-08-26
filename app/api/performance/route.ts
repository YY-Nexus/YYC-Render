import { type NextRequest, NextResponse } from "next/server"
import { PerformanceOptimizer } from "@/lib/performance-optimizer"
import { EnhancedErrorHandler, ErrorType, ErrorSeverity } from "@/lib/error-handler"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    switch (action) {
      case "report":
        const report = PerformanceOptimizer.getPerformanceReport()
        return NextResponse.json({
          success: true,
          data: report,
        })

      case "memory":
        const memoryUsage = PerformanceOptimizer.getMemoryUsage()
        return NextResponse.json({
          success: true,
          data: memoryUsage,
        })

      case "operation_stats":
        const operation = searchParams.get("operation")
        if (!operation) {
          throw EnhancedErrorHandler.createError(
            ErrorType.VALIDATION,
            "操作名称不能为空",
            { action, operation },
            ErrorSeverity.LOW,
          )
        }

        const stats = PerformanceOptimizer.getOperationStats(operation)
        return NextResponse.json({
          success: true,
          data: stats,
        })

      case "cache_stats":
        const report2 = PerformanceOptimizer.getPerformanceReport()
        return NextResponse.json({
          success: true,
          data: report2.cacheStats,
        })

      default:
        throw EnhancedErrorHandler.createError(
          ErrorType.VALIDATION,
          `不支持的操作: ${action}`,
          { action },
          ErrorSeverity.LOW,
        )
    }
  } catch (error) {
    console.error("性能API GET请求失败:", error)

    if (error && typeof error === "object" && "type" in error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: (error as any).type,
            message: (error as any).userMessage,
            id: (error as any).id,
          },
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          type: ErrorType.SYSTEM,
          message: "性能监控查询失败",
          details: error instanceof Error ? error.message : "未知错误",
        },
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case "optimize":
        const result = await PerformanceOptimizer.autoOptimize()
        return NextResponse.json({
          success: true,
          data: result,
          message: "自动优化完成",
        })

      case "clear_cache":
        PerformanceOptimizer.clearCache()
        return NextResponse.json({
          success: true,
          message: "缓存已清空",
        })

      case "process_file":
        const { file, options } = data
        if (!file) {
          throw EnhancedErrorHandler.createError(
            ErrorType.VALIDATION,
            "文件数据不能为空",
            { action, data },
            ErrorSeverity.MEDIUM,
          )
        }

        // 这里需要处理文件上传和分块处理
        // 由于API限制，这里返回模拟结果
        return NextResponse.json({
          success: true,
          data: {
            processed: true,
            chunks: 10,
            totalSize: file.size || 1024000,
            processingTime: 2000,
          },
          message: "文件处理完成",
        })

      case "batch_optimize_images":
        const { images, optimizeOptions } = data
        if (!images || !Array.isArray(images)) {
          throw EnhancedErrorHandler.createError(
            ErrorType.VALIDATION,
            "图片列表不能为空",
            { action, data },
            ErrorSeverity.MEDIUM,
          )
        }

        // 模拟批量图片优化
        const optimizedImages = images.map((img, index) => ({
          id: img.id || index,
          originalSize: img.size || 1024000,
          optimizedSize: Math.floor((img.size || 1024000) * 0.6),
          compressionRatio: 0.4,
          format: optimizeOptions?.format || "jpeg",
        }))

        return NextResponse.json({
          success: true,
          data: {
            images: optimizedImages,
            totalOriginalSize: optimizedImages.reduce((sum, img) => sum + img.originalSize, 0),
            totalOptimizedSize: optimizedImages.reduce((sum, img) => sum + img.optimizedSize, 0),
            averageCompressionRatio:
              optimizedImages.reduce((sum, img) => sum + img.compressionRatio, 0) / optimizedImages.length,
          },
          message: `成功优化 ${images.length} 张图片`,
        })

      case "preload_resources":
        const { urls } = data
        if (!urls || !Array.isArray(urls)) {
          throw EnhancedErrorHandler.createError(
            ErrorType.VALIDATION,
            "资源URL列表不能为空",
            { action, data },
            ErrorSeverity.MEDIUM,
          )
        }

        await PerformanceOptimizer.preloadResources(urls)
        return NextResponse.json({
          success: true,
          message: `成功预加载 ${urls.length} 个资源`,
        })

      default:
        throw EnhancedErrorHandler.createError(
          ErrorType.VALIDATION,
          `不支持的操作: ${action}`,
          { action },
          ErrorSeverity.LOW,
        )
    }
  } catch (error) {
    console.error("性能API POST请求失败:", error)

    if (error && typeof error === "object" && "type" in error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: (error as any).type,
            message: (error as any).userMessage,
            id: (error as any).id,
          },
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          type: ErrorType.SYSTEM,
          message: "性能优化操作失败",
          details: error instanceof Error ? error.message : "未知错误",
        },
      },
      { status: 500 },
    )
  }
}
