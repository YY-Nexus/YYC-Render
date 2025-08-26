"use client"

import React from "react"

// 语音识别增强库 - 提升浏览器兼容性
export interface SpeechRecognitionConfig {
  language: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  timeout: number
}

export interface SpeechRecognitionResult {
  transcript: string
  confidence: number
  isFinal: boolean
  alternatives: Array<{
    transcript: string
    confidence: number
  }>
}

export interface SpeechRecognitionCallbacks {
  onStart?: () => void
  onEnd?: () => void
  onResult?: (result: SpeechRecognitionResult) => void
  onError?: (error: string) => void
  onNoMatch?: () => void
}

export class EnhancedSpeechRecognition {
  private recognition: any = null
  private isSupported = false
  private isListening = false
  private config: SpeechRecognitionConfig
  private callbacks: SpeechRecognitionCallbacks
  private timeoutId: NodeJS.Timeout | null = null
  private fallbackRecording = false
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []

  constructor(config: Partial<SpeechRecognitionConfig> = {}, callbacks: SpeechRecognitionCallbacks = {}) {
    this.config = {
      language: "zh-CN",
      continuous: false,
      interimResults: true,
      maxAlternatives: 3,
      timeout: 10000,
      ...config,
    }
    this.callbacks = callbacks

    this.initializeRecognition()
  }

  private initializeRecognition() {
    // 检查浏览器支持
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      this.isSupported = true
      this.recognition = new SpeechRecognition()
      this.setupRecognition()
    } else {
      console.warn("浏览器不支持语音识别，将使用录音回退方案")
      this.isSupported = false
    }
  }

  private setupRecognition() {
    if (!this.recognition) return

    // 配置识别器
    this.recognition.lang = this.config.language
    this.recognition.continuous = this.config.continuous
    this.recognition.interimResults = this.config.interimResults
    this.recognition.maxAlternatives = this.config.maxAlternatives

    // 事件监听
    this.recognition.onstart = () => {
      this.isListening = true
      this.callbacks.onStart?.()

      // 设置超时
      if (this.config.timeout > 0) {
        this.timeoutId = setTimeout(() => {
          this.stop()
          this.callbacks.onError?.("语音识别超时")
        }, this.config.timeout)
      }
    }

    this.recognition.onend = () => {
      this.isListening = false
      this.callbacks.onEnd?.()

      if (this.timeoutId) {
        clearTimeout(this.timeoutId)
        this.timeoutId = null
      }
    }

    this.recognition.onresult = (event: any) => {
      const results = Array.from(event.results)
      const lastResult = results[results.length - 1]

      if (lastResult) {
        const alternatives = Array.from(lastResult).map((alternative: any) => ({
          transcript: alternative.transcript,
          confidence: alternative.confidence,
        }))

        const result: SpeechRecognitionResult = {
          transcript: lastResult[0].transcript,
          confidence: lastResult[0].confidence,
          isFinal: lastResult.isFinal,
          alternatives,
        }

        this.callbacks.onResult?.(result)
      }
    }

    this.recognition.onerror = (event: any) => {
      this.isListening = false

      let errorMessage = "语音识别错误"
      switch (event.error) {
        case "no-speech":
          errorMessage = "未检测到语音输入"
          break
        case "audio-capture":
          errorMessage = "无法访问麦克风"
          break
        case "not-allowed":
          errorMessage = "麦克风权限被拒绝"
          break
        case "network":
          errorMessage = "网络连接错误"
          break
        case "service-not-allowed":
          errorMessage = "语音识别服务不可用"
          break
        default:
          errorMessage = `语音识别错误: ${event.error}`
      }

      this.callbacks.onError?.(errorMessage)
    }

    this.recognition.onnomatch = () => {
      this.callbacks.onNoMatch?.()
    }
  }

  // 开始语音识别
  async start(): Promise<void> {
    if (this.isListening) {
      return
    }

    if (this.isSupported && this.recognition) {
      try {
        this.recognition.start()
      } catch (error) {
        console.error("启动语音识别失败:", error)
        this.callbacks.onError?.("启动语音识别失败")
      }
    } else {
      // 使用录音回退方案
      await this.startFallbackRecording()
    }
  }

  // 停止语音识别
  stop(): void {
    if (this.isSupported && this.recognition && this.isListening) {
      this.recognition.stop()
    }

    if (this.fallbackRecording && this.mediaRecorder) {
      this.mediaRecorder.stop()
    }

    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
  }

  // 中止语音识别
  abort(): void {
    if (this.isSupported && this.recognition) {
      this.recognition.abort()
    }

    this.stop()
  }

  // 录音回退方案
  private async startFallbackRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      this.mediaRecorder = new MediaRecorder(stream)
      this.audioChunks = []
      this.fallbackRecording = true

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: "audio/wav" })
        await this.processAudioBlob(audioBlob)

        // 清理资源
        stream.getTracks().forEach((track) => track.stop())
        this.fallbackRecording = false
      }

      this.mediaRecorder.start()
      this.callbacks.onStart?.()

      // 设置超时
      if (this.config.timeout > 0) {
        this.timeoutId = setTimeout(() => {
          this.stop()
          this.callbacks.onError?.("录音超时")
        }, this.config.timeout)
      }
    } catch (error) {
      console.error("录音回退方案失败:", error)
      this.callbacks.onError?.("无法访问麦克风")
    }
  }

  // 处理录音数据
  private async processAudioBlob(audioBlob: Blob): Promise<void> {
    try {
      // 这里可以集成第三方语音识别服务
      // 例如：百度语音、阿里云、腾讯云等

      const formData = new FormData()
      formData.append("audio", audioBlob)
      formData.append("language", this.config.language)

      const response = await fetch("/api/speech-to-text", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()

        const speechResult: SpeechRecognitionResult = {
          transcript: result.transcript || "",
          confidence: result.confidence || 0.8,
          isFinal: true,
          alternatives: result.alternatives || [],
        }

        this.callbacks.onResult?.(speechResult)
      } else {
        throw new Error("语音识别服务响应错误")
      }
    } catch (error) {
      console.error("处理录音数据失败:", error)
      this.callbacks.onError?.("语音识别处理失败")
    } finally {
      this.callbacks.onEnd?.()
    }
  }

  // 检查浏览器支持
  static isSupported(): boolean {
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      navigator.mediaDevices?.getUserMedia
    )
  }

  // 获取支持的语言列表
  static getSupportedLanguages(): string[] {
    return [
      "zh-CN", // 中文（普通话）
      "zh-TW", // 中文（台湾）
      "zh-HK", // 中文（香港）
      "en-US", // 英语（美国）
      "en-GB", // 英语（英国）
      "ja-JP", // 日语
      "ko-KR", // 韩语
      "fr-FR", // 法语
      "de-DE", // 德语
      "es-ES", // 西班牙语
      "it-IT", // 意大利语
      "pt-BR", // 葡萄牙语（巴西）
      "ru-RU", // 俄语
      "ar-SA", // 阿拉伯语
      "hi-IN", // 印地语
      "th-TH", // 泰语
    ]
  }

  // 获取当前状态
  getStatus() {
    return {
      isSupported: this.isSupported,
      isListening: this.isListening,
      fallbackMode: this.fallbackRecording,
      language: this.config.language,
    }
  }

  // 更新配置
  updateConfig(newConfig: Partial<SpeechRecognitionConfig>) {
    this.config = { ...this.config, ...newConfig }

    if (this.recognition) {
      this.recognition.lang = this.config.language
      this.recognition.continuous = this.config.continuous
      this.recognition.interimResults = this.config.interimResults
      this.recognition.maxAlternatives = this.config.maxAlternatives
    }
  }

  // 清理资源
  destroy() {
    this.stop()

    if (this.recognition) {
      this.recognition = null
    }

    if (this.mediaRecorder) {
      this.mediaRecorder = null
    }

    this.audioChunks = []
  }
}

// 语音识别工具函数
export const createSpeechRecognition = (
  config?: Partial<SpeechRecognitionConfig>,
  callbacks?: SpeechRecognitionCallbacks,
) => {
  return new EnhancedSpeechRecognition(config, callbacks)
}

// React Hook
export const useSpeechRecognition = (config?: Partial<SpeechRecognitionConfig>) => {
  const [isListening, setIsListening] = React.useState(false)
  const [transcript, setTranscript] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [isSupported, setIsSupported] = React.useState(false)

  const recognitionRef = React.useRef<EnhancedSpeechRecognition | null>(null)

  React.useEffect(() => {
    setIsSupported(EnhancedSpeechRecognition.isSupported())

    recognitionRef.current = new EnhancedSpeechRecognition(config, {
      onStart: () => setIsListening(true),
      onEnd: () => setIsListening(false),
      onResult: (result) => {
        if (result.isFinal) {
          setTranscript(result.transcript)
        }
      },
      onError: (errorMessage) => {
        setError(errorMessage)
        setIsListening(false)
      },
    })

    return () => {
      recognitionRef.current?.destroy()
    }
  }, [])

  const startListening = React.useCallback(() => {
    setError(null)
    setTranscript("")
    recognitionRef.current?.start()
  }, [])

  const stopListening = React.useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const resetTranscript = React.useCallback(() => {
    setTranscript("")
    setError(null)
  }, [])

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  }
}
