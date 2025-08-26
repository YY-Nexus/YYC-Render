import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get("image") as File

    if (!imageFile) {
      return NextResponse.json({ error: "没有找到图片文件" }, { status: 400 })
    }

    // 验证图片类型
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json({ error: "不支持的图片格式" }, { status: 400 })
    }

    // 验证文件大小 (20MB)
    const maxSize = 20 * 1024 * 1024
    if (imageFile.size > maxSize) {
      return NextResponse.json({ error: "图片文件过大，请确保小于20MB" }, { status: 400 })
    }

    // 将图片转换为base64
    const bytes = await imageFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString("base64")
    const dataUrl = `data:${imageFile.type};base64,${base64Image}`

    // 使用AI分析图片
    const { text } = await generateText({
      model: openai("gpt-4o"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "请详细分析这张图片的内容，包括：1. 主要物体和场景 2. 颜色和构图 3. 可能的用途或含义 4. 任何文字内容。请用中文回答。",
            },
            {
              type: "image",
              image: dataUrl,
            },
          ],
        },
      ],
    })

    return NextResponse.json({
      success: true,
      data: {
        analysis: text,
        imageInfo: {
          filename: imageFile.name,
          type: imageFile.type,
          size: imageFile.size,
          dimensions: "需要额外处理获取",
        },
        processedAt: new Date().toISOString(),
      },
      message: "图片分析完成",
    })
  } catch (error) {
    console.error("图片分析错误:", error)

    // 如果AI分析失败，返回基本的图片信息
    return NextResponse.json({
      success: false,
      data: {
        analysis: "图片分析服务暂时不可用，但我可以确认这是一个有效的图片文件。请稍后重试或尝试其他功能。",
        imageInfo: {
          filename: "unknown",
          type: "image",
          size: 0,
        },
        processedAt: new Date().toISOString(),
      },
      error: "图片分析失败",
      details: error instanceof Error ? error.message : "未知错误",
    })
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "图片分析API正常运行",
    supportedFormats: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    maxSize: "20MB",
    features: ["物体识别", "场景分析", "文字提取(OCR)", "颜色分析", "构图评估"],
  })
}
