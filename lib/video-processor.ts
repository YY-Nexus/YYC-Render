"use client"

import { useState } from "react"

// 视频处理和分析系统
export interface VideoMetadata {
  duration: number
  width: number
  height: number
  fps: number
  bitrate: number
  format: string
  size: number
  aspectRatio: string
}

export interface VideoFrame {
  timestamp: number
  imageData: ImageData
  canvas: HTMLCanvasElement
  blob: Blob
}

export interface VideoAnalysisResult {
  id: string
  filename: string
  metadata: VideoMetadata
  frames: VideoFrame[]
  transcript?: string
  summary: string
  keyMoments: Array<{
    timestamp: number
    description: string
    confidence: number
  }>
  objects: Array<{
    name: string
    confidence: number
    timestamps: number[]
  }>
  faces: Array<{
    id: string
    confidence: number
    timestamps: number[]
    emotions: Record<string, number>
  }>
  scenes: Array<{
    startTime: number
    endTime: number
    description: string
    type: "action" | "dialogue" | "scene_change" | "text"
  }>
}

export interface VideoProcessingProgress {
  stage: "loading" | "extracting" | "analyzing" | "transcribing" | "complete"
  progress: number
  currentFrame: number
  totalFrames: number
  message: string
}

export class VideoProcessor {
  private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
  private static readonly SUPPORTED_FORMATS = ["mp4", "webm", "avi", "mov", "mkv"]
  private static readonly FRAME_EXTRACT_INTERVAL = 1000 // 每秒提取一帧

  // 验证视频文件
  static validateVideo(file: File): { valid: boolean; error?: string } {
    const extension = file.name.split(".").pop()?.toLowerCase()

    if (!extension || !this.SUPPORTED_FORMATS.includes(extension)) {
      return {
        valid: false,
        error: `不支持的视频格式。支持的格式: ${this.SUPPORTED_FORMATS.join(", ")}`,
      }
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `文件大小超过限制 (${Math.round(this.MAX_FILE_SIZE / 1024 / 1024)}MB)`,
      }
    }

    return { valid: true }
  }

  // 获取视频元数据
  static async getVideoMetadata(file: File): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video")
      const url = URL.createObjectURL(file)

      video.onloadedmetadata = () => {
        const metadata: VideoMetadata = {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          fps: 30, // 默认值，实际需要更复杂的检测
          bitrate: Math.round((file.size * 8) / video.duration), // 估算码率
          format: file.type,
          size: file.size,
          aspectRatio: `${video.videoWidth}:${video.videoHeight}`,
        }

        URL.revokeObjectURL(url)
        resolve(metadata)
      }

      video.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error("无法读取视频元数据"))
      }

      video.src = url
    })
  }

  // 提取视频帧
  static async extractFrames(
    file: File,
    interval: number = this.FRAME_EXTRACT_INTERVAL,
    onProgress?: (progress: VideoProcessingProgress) => void,
  ): Promise<VideoFrame[]> {
    const video = document.createElement("video")
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")!
    const url = URL.createObjectURL(file)

    const frames: VideoFrame[] = []

    return new Promise((resolve, reject) => {
      video.onloadedmetadata = async () => {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        const duration = video.duration
        const totalFrames = Math.floor((duration * 1000) / interval)
        let currentFrame = 0

        const extractFrame = async (timestamp: number): Promise<VideoFrame> => {
          return new Promise((frameResolve) => {
            video.onseeked = () => {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    frameResolve({
                      timestamp,
                      imageData,
                      canvas: canvas.cloneNode(true) as HTMLCanvasElement,
                      blob,
                    })
                  }
                },
                "image/jpeg",
                0.8,
              )
            }

            video.currentTime = timestamp / 1000
          })
        }

        try {
          for (let time = 0; time < duration * 1000; time += interval) {
            const frame = await extractFrame(time)
            frames.push(frame)
            currentFrame++

            if (onProgress) {
              onProgress({
                stage: "extracting",
                progress: (currentFrame / totalFrames) * 100,
                currentFrame,
                totalFrames,
                message: `提取帧 ${currentFrame}/${totalFrames}`,
              })
            }

            // 避免阻塞UI
            await new Promise((resolve) => setTimeout(resolve, 10))
          }

          URL.revokeObjectURL(url)
          resolve(frames)
        } catch (error) {
          URL.revokeObjectURL(url)
          reject(error)
        }
      }

      video.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error("视频加载失败"))
      }

      video.src = url
    })
  }

  // 分析视频内容
  static async analyzeVideo(
    file: File,
    onProgress?: (progress: VideoProcessingProgress) => void,
  ): Promise<VideoAnalysisResult> {
    const analysisId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      // 阶段1: 获取元数据
      if (onProgress) {
        onProgress({
          stage: "loading",
          progress: 10,
          currentFrame: 0,
          totalFrames: 0,
          message: "加载视频文件...",
        })
      }

      const metadata = await this.getVideoMetadata(file)

      // 阶段2: 提取关键帧
      if (onProgress) {
        onProgress({
          stage: "extracting",
          progress: 20,
          currentFrame: 0,
          totalFrames: 0,
          message: "提取视频帧...",
        })
      }

      const frames = await this.extractFrames(file, 2000, onProgress) // 每2秒一帧

      // 阶段3: 分析内容
      if (onProgress) {
        onProgress({
          stage: "analyzing",
          progress: 60,
          currentFrame: 0,
          totalFrames: 0,
          message: "分析视频内容...",
        })
      }

      const analysis = await this.performContentAnalysis(frames, metadata)

      // 阶段4: 生成转录（如果有音频）
      if (onProgress) {
        onProgress({
          stage: "transcribing",
          progress: 80,
          currentFrame: 0,
          totalFrames: 0,
          message: "转录音频内容...",
        })
      }

      const transcript = await this.extractAudioTranscript(file)

      // 阶段5: 完成
      if (onProgress) {
        onProgress({
          stage: "complete",
          progress: 100,
          currentFrame: 0,
          totalFrames: 0,
          message: "分析完成",
        })
      }

      return {
        id: analysisId,
        filename: file.name,
        metadata,
        frames,
        transcript,
        ...analysis,
      }
    } catch (error) {
      throw new Error(`视频分析失败: ${error instanceof Error ? error.message : "未知错误"}`)
    }
  }

  // 执行内容分析
  private static async performContentAnalysis(
    frames: VideoFrame[],
    metadata: VideoMetadata,
  ): Promise<Partial<VideoAnalysisResult>> {
    // 模拟AI分析过程
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const keyMoments = frames.map((frame, index) => ({
      timestamp: frame.timestamp,
      description: this.generateFrameDescription(frame, index),
      confidence: 0.7 + Math.random() * 0.3,
    }))

    const objects = [
      { name: "人物", confidence: 0.95, timestamps: frames.map((f) => f.timestamp) },
      { name: "文字", confidence: 0.8, timestamps: frames.slice(0, 3).map((f) => f.timestamp) },
      { name: "建筑", confidence: 0.7, timestamps: frames.slice(2, 5).map((f) => f.timestamp) },
    ]

    const faces = [
      {
        id: "face_1",
        confidence: 0.9,
        timestamps: frames.slice(0, 4).map((f) => f.timestamp),
        emotions: {
          happy: 0.6,
          neutral: 0.3,
          surprised: 0.1,
        },
      },
    ]

    const scenes = [
      {
        startTime: 0,
        endTime: metadata.duration * 0.3,
        description: "开场介绍",
        type: "dialogue" as const,
      },
      {
        startTime: metadata.duration * 0.3,
        endTime: metadata.duration * 0.7,
        description: "主要内容",
        type: "action" as const,
      },
      {
        startTime: metadata.duration * 0.7,
        endTime: metadata.duration,
        description: "结尾总结",
        type: "dialogue" as const,
      },
    ]

    const summary = `这是一个时长${Math.round(metadata.duration)}秒的${metadata.width}x${metadata.height}视频，包含${frames.length}个关键帧。视频内容丰富，包含人物、场景和文字信息。`

    return {
      summary,
      keyMoments,
      objects,
      faces,
      scenes,
    }
  }

  // 生成帧描述
  private static generateFrameDescription(frame: VideoFrame, index: number): string {
    const descriptions = [
      "画面显示主要人物",
      "出现重要文字信息",
      "场景发生变化",
      "人物表情变化",
      "背景环境展示",
      "关键动作时刻",
    ]

    return descriptions[index % descriptions.length]
  }

  // 提取音频转录
  private static async extractAudioTranscript(file: File): Promise<string> {
    // 模拟音频转录
    await new Promise((resolve) => setTimeout(resolve, 1500))

    return `这是视频的音频转录内容。由于这是演示版本，这里显示的是模拟的转录文本。在实际应用中，这里会显示通过语音识别技术提取的真实音频内容。视频时长约${Math.round(file.size / 1024 / 1024)}分钟。`
  }

  // 生成视频缩略图
  static async generateThumbnail(file: File, timestamp = 0, width = 320, height = 180): Promise<Blob> {
    const video = document.createElement("video")
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")!
    const url = URL.createObjectURL(file)

    return new Promise((resolve, reject) => {
      video.onloadedmetadata = () => {
        canvas.width = width
        canvas.height = height

        video.onseeked = () => {
          // 计算缩放比例以保持宽高比
          const scale = Math.min(width / video.videoWidth, height / video.videoHeight)
          const scaledWidth = video.videoWidth * scale
          const scaledHeight = video.videoHeight * scale
          const x = (width - scaledWidth) / 2
          const y = (height - scaledHeight) / 2

          // 清除画布并绘制视频帧
          ctx.fillStyle = "#000"
          ctx.fillRect(0, 0, width, height)
          ctx.drawImage(video, x, y, scaledWidth, scaledHeight)

          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(url)
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error("生成缩略图失败"))
              }
            },
            "image/jpeg",
            0.8,
          )
        }

        video.currentTime = timestamp
      }

      video.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error("视频加载失败"))
      }

      video.src = url
    })
  }

  // 视频格式转换
  static async convertVideo(
    file: File,
    targetFormat: "mp4" | "webm",
    quality = 0.8,
    onProgress?: (progress: number) => void,
  ): Promise<Blob> {
    // 注意: 浏览器端视频转换功能有限，实际项目中建议使用服务端处理
    const video = document.createElement("video")
    const canvas = document.createElement("canvas")
    const url = URL.createObjectURL(file)

    return new Promise((resolve, reject) => {
      video.onloadedmetadata = async () => {
        try {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight

          // 这里只是演示概念，实际的视频转换需要更复杂的处理
          const mediaRecorder = new MediaRecorder(canvas.captureStream(), {
            mimeType: `video/${targetFormat}`,
            videoBitsPerSecond: ((file.size * 8) / video.duration) * quality,
          })

          const chunks: BlobPart[] = []

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunks.push(event.data)
            }
          }

          mediaRecorder.onstop = () => {
            const convertedBlob = new Blob(chunks, { type: `video/${targetFormat}` })
            URL.revokeObjectURL(url)
            resolve(convertedBlob)
          }

          mediaRecorder.start()

          // 模拟转换过程
          setTimeout(() => {
            mediaRecorder.stop()
          }, 3000)
        } catch (error) {
          URL.revokeObjectURL(url)
          reject(error)
        }
      }

      video.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error("视频加载失败"))
      }

      video.src = url
    })
  }

  // 批量处理视频
  static async processBatch(
    files: File[],
    onProgress?: (fileIndex: number, fileProgress: VideoProcessingProgress) => void,
    onComplete?: (results: VideoAnalysisResult[]) => void,
  ): Promise<VideoAnalysisResult[]> {
    const results: VideoAnalysisResult[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      try {
        const result = await this.analyzeVideo(file, (progress) => {
          if (onProgress) {
            onProgress(i, progress)
          }
        })

        results.push(result)
      } catch (error) {
        console.error(`处理视频 ${file.name} 失败:`, error)
      }
    }

    if (onComplete) {
      onComplete(results)
    }

    return results
  }
}

// React Hook for video processing
export function useVideoProcessor() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<VideoProcessingProgress | null>(null)
  const [result, setResult] = useState<VideoAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const processVideo = async (file: File) => {
    setIsProcessing(true)
    setError(null)
    setResult(null)

    try {
      const validation = VideoProcessor.validateVideo(file)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      const analysisResult = await VideoProcessor.analyzeVideo(file, setProgress)
      setResult(analysisResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : "处理失败")
    } finally {
      setIsProcessing(false)
      setProgress(null)
    }
  }

  const generateThumbnail = async (file: File, timestamp?: number) => {
    try {
      return await VideoProcessor.generateThumbnail(file, timestamp)
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成缩略图失败")
      return null
    }
  }

  return {
    isProcessing,
    progress,
    result,
    error,
    processVideo,
    generateThumbnail,
    reset: () => {
      setIsProcessing(false)
      setProgress(null)
      setResult(null)
      setError(null)
    },
  }
}
