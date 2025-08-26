// AI API 集成模块
export interface AIMessage {
  role: "system" | "user" | "assistant"
  content: string
  timestamp?: number
}

export interface AIResponse {
  id: string
  choices: {
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface FileUploadResult {
  id: string
  filename: string
  content: string
  type: string
  size: number
  extractedText?: string
  analysis?: string
}

export class AIService {
  private static readonly API_BASE = "/api"

  // 发送聊天请求
  static async chat(
    messages: AIMessage[],
    options?: {
      temperature?: number
      maxTokens?: number
      stream?: boolean
    },
  ): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.API_BASE}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          temperature: options?.temperature || 0.7,
          max_tokens: options?.maxTokens || 2000,
          stream: options?.stream || false,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("AI聊天请求失败:", error)
      throw error
    }
  }

  // 流式聊天
  static async streamChat(
    messages: AIMessage[],
    onChunk: (chunk: string) => void,
    onComplete: (fullResponse: string) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE}/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          stream: true,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("无法获取响应流")
      }

      const decoder = new TextDecoder()
      let fullResponse = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") {
              onComplete(fullResponse)
              return
            }

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content || ""
              if (content) {
                fullResponse += content
                onChunk(content)
              }
            } catch (error) {
              console.warn("解析流数据失败:", error)
            }
          }
        }
      }
    } catch (error) {
      console.error("流式聊天失败:", error)
      onError(error instanceof Error ? error : new Error("未知错误"))
    }
  }

  // 文件上传和分析
  static async uploadFile(file: File): Promise<FileUploadResult> {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`${this.API_BASE}/upload`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("文件上传失败:", error)
      throw error
    }
  }

  // 语音转文字
  static async speechToText(audioBlob: Blob): Promise<string> {
    try {
      const formData = new FormData()
      formData.append("audio", audioBlob, "audio.wav")

      const response = await fetch(`${this.API_BASE}/speech-to-text`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return result.text || ""
    } catch (error) {
      console.error("语音识别失败:", error)
      throw error
    }
  }

  // 图片分析
  static async analyzeImage(imageFile: File): Promise<string> {
    try {
      const formData = new FormData()
      formData.append("image", imageFile)

      const response = await fetch(`${this.API_BASE}/analyze-image`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return result.analysis || "无法分析图片内容"
    } catch (error) {
      console.error("图片分析失败:", error)
      throw error
    }
  }

  // 生成摘要
  static async generateSummary(content: string, maxLength = 200): Promise<string> {
    try {
      const response = await this.chat([
        {
          role: "system",
          content: `你是一个专业的内容摘要专家。请为给定的内容生成简洁、准确的摘要，长度不超过${maxLength}字。`,
        },
        {
          role: "user",
          content: `请为以下内容生成摘要：\n\n${content}`,
        },
      ])

      return response.choices[0]?.message?.content || "生成摘要失败"
    } catch (error) {
      console.error("生成摘要失败:", error)
      throw error
    }
  }

  // 翻译文本
  static async translateText(text: string, targetLanguage = "zh-CN"): Promise<string> {
    try {
      const response = await this.chat([
        {
          role: "system",
          content: `你是一个专业的翻译专家。请将用户提供的文本翻译成${targetLanguage === "zh-CN" ? "中文" : "英文"}，保持原意和语调。`,
        },
        {
          role: "user",
          content: text,
        },
      ])

      return response.choices[0]?.message?.content || "翻译失败"
    } catch (error) {
      console.error("翻译失败:", error)
      throw error
    }
  }

  // 检查服务状态
  static async checkStatus(): Promise<{ status: string; message: string }> {
    try {
      const response = await fetch(`${this.API_BASE}/status`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("检查服务状态失败:", error)
      return {
        status: "error",
        message: "服务不可用",
      }
    }
  }
}

// 语音识别工具类
export class SpeechRecognition {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: BlobPart[] = []
  private isRecording = false

  async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.mediaRecorder = new MediaRecorder(stream)
      this.audioChunks = []

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data)
      }

      this.mediaRecorder.start()
      this.isRecording = true
    } catch (error) {
      console.error("启动录音失败:", error)
      throw new Error("无法访问麦克风，请检查权限设置")
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error("录音未开始"))
        return
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: "audio/wav" })
        this.isRecording = false

        // 停止所有音频轨道
        this.mediaRecorder?.stream.getTracks().forEach((track) => track.stop())

        resolve(audioBlob)
      }

      this.mediaRecorder.stop()
    })
  }

  getRecordingStatus(): boolean {
    return this.isRecording
  }
}

// 文件处理工具类
export class FileProcessor {
  // 支持的文件类型
  static readonly SUPPORTED_TYPES = {
    text: [".txt", ".md", ".csv"],
    document: [".pdf", ".doc", ".docx"],
    image: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
    audio: [".mp3", ".wav", ".m4a"],
  }

  // 检查文件类型
  static getFileType(file: File): string {
    const extension = "." + file.name.split(".").pop()?.toLowerCase()

    for (const [type, extensions] of Object.entries(this.SUPPORTED_TYPES)) {
      if (extensions.includes(extension)) {
        return type
      }
    }

    return "unknown"
  }

  // 读取文本文件
  static async readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (event) => {
        resolve(event.target?.result as string)
      }

      reader.onerror = () => {
        reject(new Error("读取文件失败"))
      }

      reader.readAsText(file)
    })
  }

  // 读取图片文件为Base64
  static async readImageAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (event) => {
        resolve(event.target?.result as string)
      }

      reader.onerror = () => {
        reject(new Error("读取图片失败"))
      }

      reader.readAsDataURL(file)
    })
  }

  // 验证文件大小
  static validateFileSize(file: File, maxSizeMB = 10): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    return file.size <= maxSizeBytes
  }

  // 格式化文件大小
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes"

    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }
}
