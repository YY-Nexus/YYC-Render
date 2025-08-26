import { type NextRequest, NextResponse } from "next/server"
import { AIEnhancedEngine, type SmartQARequest } from "@/lib/ai-enhanced"

export async function POST(request: NextRequest) {
  try {
    const body: SmartQARequest = await request.json()

    // 验证请求参数
    if (!body.question || typeof body.question !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request: question is required",
        },
        { status: 400 },
      )
    }

    if (body.question.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request: question cannot be empty",
        },
        { status: 400 },
      )
    }

    // 调用AI增强引擎进行智能问答
    const response = await AIEnhancedEngine.smartQA(body)

    return NextResponse.json({
      success: true,
      data: response,
    })
  } catch (error) {
    console.error("AI Assistant chat error:", error)

    let errorMessage = "Internal server error"
    let statusCode = 500

    if (error instanceof Error) {
      errorMessage = error.message

      // 根据错误类型设置状态码
      if (error.message.includes("暂时不可用")) {
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
