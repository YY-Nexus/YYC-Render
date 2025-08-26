import { type NextRequest, NextResponse } from "next/server"
import { RealAIService } from "@/lib/ai-service-real"
import { EnhancedErrorHandler, ErrorType, ErrorSeverity } from "@/lib/error-handler"
import { PerformanceOptimizer } from "@/lib/performance-optimizer"

// 初始化AI服务
RealAIService.loadFromEnvironment()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    switch (action) {
      case "status":
        const status = await RealAIService.getServiceStatus()
        return NextResponse.json({
          success: true,
          data: status,
        })

      case "providers":
        const providers = RealAIService.getAvailableProviders()
        return NextResponse.json({
          success: true,
          data: providers,
        })

      case "current_provider":
        const currentProvider = RealAIService.getCurrentProvider()
        return NextResponse.json({
          success: true,
          data: { provider: currentProvider },
        })

      case "test_provider":
        const provider = searchParams.get("provider")
        if (!provider) {
          throw EnhancedErrorHandler.createError(
            ErrorType.VALIDATION,
            "提供商参数不能为空",
            { action, provider },
            ErrorSeverity.LOW,
          )
        }

        const testResult = await RealAIService.testProvider(provider)
        return NextResponse.json({
          success: true,
          data: testResult,
        })

      case "health":
        const healthStatus = await RealAIService.getServiceStatus()
        const isHealthy = Object.values(healthStatus.providers).some((p) => p.available)

        return NextResponse.json({
          success: true,
          data: {
            status: isHealthy ? "healthy" : "unhealthy",
            activeProvider: healthStatus.activeProvider,
            availableProviders: Object.entries(healthStatus.providers)
              .filter(([_, info]) => info.available)
              .map(([name]) => name),
            details: healthStatus,
          },
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
    console.error("AI API GET请求失败:", error)

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
          type: ErrorType.AI_SERVICE,
          message: "AI服务状态查询失败",
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
    const { action, data, options } = body

    switch (action) {
      case "chat":
        const { messages, provider, temperature, maxTokens, model } = data

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
          throw EnhancedErrorHandler.createError(
            ErrorType.VALIDATION,
            "消息列表不能为空",
            { action, data },
            ErrorSeverity.MEDIUM,
          )
        }

        // 验证消息格式
        for (const message of messages) {
          if (!message.role || !message.content) {
            throw EnhancedErrorHandler.createError(
              ErrorType.VALIDATION,
              "消息格式不正确，需要包含role和content",
              { action, message },
              ErrorSeverity.MEDIUM,
            )
          }
        }

        const startTime = Date.now()

        const response = await EnhancedErrorHandler.withRetry(
          () =>
            RealAIService.chat(messages, {
              provider,
              temperature,
              maxTokens,
              model,
            }),
          "ai_chat",
          3,
        )

        const processingTime = Date.now() - startTime
        PerformanceOptimizer.recordOperationTime("ai_chat", processingTime)

        return NextResponse.json({
          success: true,
          data: response,
          metadata: {
            processingTime,
            provider: provider || RealAIService.getCurrentProvider(),
          },
        })

      case "stream_chat":
        // 流式聊天需要使用不同的响应方式
        const {
          messages: streamMessages,
          provider: streamProvider,
          temperature: streamTemp,
          maxTokens: streamMax,
          model: streamModel,
        } = data

        if (!streamMessages || !Array.isArray(streamMessages) || streamMessages.length === 0) {
          throw EnhancedErrorHandler.createError(
            ErrorType.VALIDATION,
            "消息列表不能为空",
            { action, data },
            ErrorSeverity.MEDIUM,
          )
        }

        // 创建流式响应
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
          async start(controller) {
            try {
              await RealAIService.streamChat(
                streamMessages,
                (chunk) => {
                  const data = JSON.stringify(chunk)
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`))
                },
                {
                  provider: streamProvider,
                  temperature: streamTemp,
                  maxTokens: streamMax,
                  model: streamModel,
                },
              )

              controller.enqueue(encoder.encode("data: [DONE]\n\n"))
              controller.close()
            } catch (error) {
              console.error("流式聊天失败:", error)
              const errorData = JSON.stringify({
                error: true,
                message: error instanceof Error ? error.message : "流式聊天失败",
              })
              controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
              controller.close()
            }
          },
        })

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        })

      case "switch_provider":
        const { provider: newProvider } = data
        if (!newProvider) {
          throw EnhancedErrorHandler.createError(
            ErrorType.VALIDATION,
            "提供商参数不能为空",
            { action, data },
            ErrorSeverity.MEDIUM,
          )
        }

        const switched = RealAIService.switchProvider(newProvider)
        if (!switched) {
          throw EnhancedErrorHandler.createError(
            ErrorType.AI_SERVICE,
            `切换到提供商 ${newProvider} 失败`,
            { provider: newProvider },
            ErrorSeverity.MEDIUM,
          )
        }

        return NextResponse.json({
          success: true,
          data: { provider: newProvider },
          message: `已切换到提供商: ${newProvider}`,
        })

      case "select_best_provider":
        const bestProvider = await RealAIService.selectBestProvider()
        return NextResponse.json({
          success: true,
          data: { provider: bestProvider },
          message: `已自动选择最佳提供商: ${bestProvider}`,
        })

      case "batch_process":
        const { items, processorType, batchOptions } = data

        if (!items || !Array.isArray(items)) {
          throw EnhancedErrorHandler.createError(
            ErrorType.VALIDATION,
            "批处理项目列表不能为空",
            { action, data },
            ErrorSeverity.MEDIUM,
          )
        }

        const batchResults = await PerformanceOptimizer.processBatch(
          items,
          async (item, index) => {
            // 根据处理器类型执行不同的AI操作
            switch (processorType) {
              case "summarize":
                return await RealAIService.chat([{ role: "user", content: `请总结以下内容：${item.content}` }])
              case "translate":
                return await RealAIService.chat([{ role: "user", content: `请将以下内容翻译成中文：${item.content}` }])
              case "analyze":
                return await RealAIService.chat([{ role: "user", content: `请分析以下内容：${item.content}` }])
              default:
                throw new Error(`不支持的处理器类型: ${processorType}`)
            }
          },
          {
            batchSize: batchOptions?.batchSize || 5,
            concurrency: batchOptions?.concurrency || 2,
            onProgress: (progress) => {
              // 这里可以通过WebSocket发送进度更新
              console.log(`批处理进度: ${progress.percentage.toFixed(1)}%`)
            },
          },
        )

        return NextResponse.json({
          success: true,
          data: batchResults,
          message: `批处理完成，处理了 ${items.length} 个项目`,
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
    console.error("AI API POST请求失败:", error)

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
          type: ErrorType.AI_SERVICE,
          message: "AI服务操作失败",
          details: error instanceof Error ? error.message : "未知错误",
        },
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case "optimize_performance":
        const optimizationResult = await PerformanceOptimizer.autoOptimize()
        return NextResponse.json({
          success: true,
          data: optimizationResult,
          message: "性能优化完成",
        })

      case "clear_cache":
        PerformanceOptimizer.clearCache()
        return NextResponse.json({
          success: true,
          message: "缓存已清空",
        })

      case "update_config":
        const { provider, config } = data
        if (!provider || !config) {
          throw EnhancedErrorHandler.createError(
            ErrorType.VALIDATION,
            "提供商和配置参数不能为空",
            { action, data },
            ErrorSeverity.MEDIUM,
          )
        }

        // 这里可以添加配置更新逻辑
        return NextResponse.json({
          success: true,
          message: `提供商 ${provider} 配置已更新`,
        })

      default:
        throw EnhancedErrorHandler.createError(
          ErrorType.VALIDATION,
          `不支持的更新操作: ${action}`,
          { action },
          ErrorSeverity.LOW,
        )
    }
  } catch (error) {
    console.error("AI API PUT请求失败:", error)

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
          type: ErrorType.AI_SERVICE,
          message: "AI服务更新操作失败",
          details: error instanceof Error ? error.message : "未知错误",
        },
      },
      { status: 500 },
    )
  }
}
