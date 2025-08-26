import { type NextRequest, NextResponse } from "next/server"
import { AIEnhancedEngine, type ContentGenerationRequest } from "@/lib/ai-enhanced"

export async function POST(request: NextRequest) {
  try {
    const body: ContentGenerationRequest = await request.json()

    // 验证请求参数
    if (!body.topic || typeof body.topic !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request: topic is required",
        },
        { status: 400 },
      )
    }

    if (body.topic.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request: topic cannot be empty",
        },
        { status: 400 },
      )
    }

    // 验证内容类型
    const validTypes = ["article", "summary", "quiz", "flashcards", "outline", "explanation"]
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid content type",
        },
        { status: 400 },
      )
    }

    // 调用AI增强引擎进行内容生成
    const content = await AIEnhancedEngine.generateContent(body)

    return NextResponse.json({
      success: true,
      data: content,
    })
  } catch (error) {
    console.error("AI Assistant content generation error:", error)

    let errorMessage = "Internal server error"
    let statusCode = 500

    if (error instanceof Error) {
      errorMessage = error.message

      // 根据错误类型设置状态码
      if (error.message.includes("暂��不可用")) {
        statusCode = 503
      } else if (error.message.includes("quota")) {
        statusCode = 429
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
