import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File

    if (!audioFile) {
      return NextResponse.json({ error: "没有找到音频文件" }, { status: 400 })
    }

    // 验证音频文件类型
    const allowedTypes = ["audio/wav", "audio/mp3", "audio/m4a", "audio/webm"]
    if (!allowedTypes.includes(audioFile.type)) {
      return NextResponse.json({ error: "不支持的音频格式" }, { status: 400 })
    }

    // 验证文件大小 (25MB)
    const maxSize = 25 * 1024 * 1024
    if (audioFile.size > maxSize) {
      return NextResponse.json({ error: "音频文件过大，请确保小于25MB" }, { status: 400 })
    }

    // 模拟语音识别处理
    // 在实际应用中，这里会调用真实的语音识别服务
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // 模拟识别结果
    const mockTranscriptions = [
      "你好，我想了解人工智能的基本概念",
      "请帮我解释一下机器学习的原理",
      "什么是深度学习，它有什么应用",
      "如何开始学习编程",
      "请介绍一下前端开发的技术栈",
    ]

    const randomTranscription = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)]

    return NextResponse.json({
      success: true,
      data: {
        text: randomTranscription,
        confidence: 0.95,
        language: "zh-CN",
        duration: audioFile.size / 16000, // 估算音频时长
        processedAt: new Date().toISOString(),
      },
      message: "语音识别完成",
    })
  } catch (error) {
    console.error("语音识别错误:", error)

    return NextResponse.json(
      {
        error: "语音识别失败",
        details: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "语音识别API正常运行",
    supportedFormats: ["audio/wav", "audio/mp3", "audio/m4a", "audio/webm"],
    maxSize: "25MB",
    languages: ["zh-CN", "en-US"],
  })
}
