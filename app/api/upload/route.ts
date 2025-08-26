import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "没有找到上传的文件" }, { status: 400 })
    }

    // 验证文件类型
    const allowedTypes = [
      "text/plain",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "不支持的文件类型" }, { status: 400 })
    }

    // 验证文件大小 (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: "文件大小超过限制 (10MB)" }, { status: 400 })
    }

    // 创建上传目录
    const uploadDir = join(process.cwd(), "uploads")
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // 生成唯一文件名
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split(".").pop()
    const fileName = `${timestamp}_${randomString}.${fileExtension}`
    const filePath = join(uploadDir, fileName)

    // 保存文件
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // 处理文件内容
    let extractedText = ""
    let analysis = ""

    if (file.type.startsWith("text/")) {
      // 处理文本文件
      extractedText = buffer.toString("utf-8")
      analysis = `文本文件包含 ${extractedText.length} 个字符`
    } else if (file.type.startsWith("image/")) {
      // 处理图片文件
      analysis = `图片文件，大小: ${(file.size / 1024).toFixed(1)} KB`
      extractedText = "这是一个图片文件，需要使用图像识别技术来提取内容。"
    } else {
      // 处理其他文档
      analysis = `文档文件，类型: ${file.type}`
      extractedText = "文档内容需要专门的解析器来提取。"
    }

    const result = {
      id: `upload_${timestamp}_${randomString}`,
      filename: file.name,
      originalName: file.name,
      type: file.type,
      size: file.size,
      path: fileName,
      extractedText,
      analysis,
      uploadedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: "文件上传成功",
    })
  } catch (error) {
    console.error("文件上传错误:", error)

    return NextResponse.json(
      {
        error: "文件上传失败",
        details: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "文件上传API正常运行",
    supportedTypes: [
      "text/plain",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ],
    maxSize: "10MB",
  })
}
