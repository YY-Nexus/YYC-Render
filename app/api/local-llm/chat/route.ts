import { type NextRequest, NextResponse } from "next/server"
import { localLLMManager, type ChatCompletionRequest } from "@/lib/local-llm"

export async function POST(request: NextRequest) {
  try {
    const body: ChatCompletionRequest = await request.json()

    // 验证请求参数
    if (!body.model || !body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request: model and messages are required",
        },
        { status: 400 },
      )
    }

    if (body.messages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request: messages array cannot be empty",
        },
        { status: 400 },
      )
    }

    // 处理流式响应
    if (body.stream) {
      return handleStreamingResponse(body)
    }

    // 处理普通响应
    const response = await localLLMManager.chatCompletion(body)

    return NextResponse.json({
      success: true,
      data: response,
    })
  } catch (error) {
    console.error("Local LLM chat error:", error)

    let errorMessage = "Internal server error"
    let statusCode = 500

    if (error instanceof Error) {
      errorMessage = error.message

      // 根据错误类型设置状态码
      if (error.message.includes("No available provider")) {
        statusCode = 503
      } else if (error.message.includes("not available")) {
        statusCode = 503
      } else if (error.message.includes("timeout")) {
        statusCode = 408
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: statusCode },
    )
  }
}

async function handleStreamingResponse(request: ChatCompletionRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 发送开始事件
        const startEvent = {
          type: "start",
          timestamp: Date.now(),
          model: request.model,
          provider: request.provider,
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(startEvent)}\n\n`))

        // 获取聊天完成响应
        const response = await localLLMManager.chatCompletion({
          ...request,
          stream: false,
        })

        const content = response.choices[0].message.content
        const words = content.split(/(\s+)/) // 保留空格
        const totalWords = words.length

        // 流式发送内容
        let accumulatedContent = ""
        for (let i = 0; i < words.length; i++) {
          const word = words[i]
          accumulatedContent += word

          const chunk = {
            id: response.id,
            object: "chat.completion.chunk",
            created: response.created,
            model: response.model,
            provider: response.provider,
            choices: [
              {
                index: 0,
                delta: {
                  role: i === 0 ? "assistant" : undefined,
                  content: word,
                },
                finish_reason: null,
              },
            ],
            usage: {
              prompt_tokens: response.usage.prompt_tokens,
              completion_tokens: Math.floor(((i + 1) * response.usage.completion_tokens) / totalWords),
              total_tokens:
                response.usage.prompt_tokens + Math.floor(((i + 1) * response.usage.completion_tokens) / totalWords),
            },
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))

          // 动态延迟：开始快，然后逐渐变慢，模拟真实的生成过程
          const progress = (i + 1) / totalWords
          let delay = 30 // 基础延迟

          if (progress < 0.1) {
            delay = 20 // 开始很快
          } else if (progress < 0.5) {
            delay = 40 // 中间正常
          } else if (progress < 0.8) {
            delay = 60 // 后期稍慢
          } else {
            delay = 80 // 结尾最慢
          }

          // 如果是标点符号，稍微停顿一下
          if (/[.!?。！？]/.test(word)) {
            delay += 100
          }

          await new Promise((resolve) => setTimeout(resolve, delay))
        }

        // 发送最终块
        const finalChunk = {
          id: response.id,
          object: "chat.completion.chunk",
          created: response.created,
          model: response.model,
          provider: response.provider,
          choices: [
            {
              index: 0,
              delta: {},
              finish_reason: "stop",
            },
          ],
          usage: response.usage,
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalChunk)}\n\n`))

        // 发送完成事件
        const endEvent = {
          type: "end",
          timestamp: Date.now(),
          total_tokens: response.usage.total_tokens,
          completion_time: Date.now() - startEvent.timestamp,
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(endEvent)}\n\n`))

        // 发送结束标记
        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
        controller.close()
      } catch (error) {
        console.error("Streaming error:", error)

        const errorEvent = {
          type: "error",
          timestamp: Date.now(),
          error: {
            message: error instanceof Error ? error.message : "Stream processing failed",
            type: "stream_error",
            code: "STREAM_ERROR",
          },
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`))
        controller.close()
      }
    },

    cancel() {
      console.log("Stream cancelled by client")
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}

// 处理 OPTIONS 请求（CORS 预检）
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}
