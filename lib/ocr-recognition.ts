"use client"

import { useState } from "react"

// OCR文字识别系统
import { PerformanceOptimizer } from "./performance-optimizer"

export interface OCRResult {
  id: string
  text: string
  confidence: number
  language: string
  words: OCRWord[]
  lines: OCRLine[]
  paragraphs: OCRParagraph[]
  boundingBox: BoundingBox
  processingTime: number
  imageInfo: {
    width: number
    height: number
    format: string
    size: number
  }
}

export interface OCRWord {
  text: string
  confidence: number
  boundingBox: BoundingBox
  fontSize?: number
  fontFamily?: string
  color?: string
}

export interface OCRLine {
  text: string
  confidence: number
  words: OCRWord[]
  boundingBox: BoundingBox
  angle?: number
}

export interface OCRParagraph {
  text: string
  confidence: number
  lines: OCRLine[]
  boundingBox: BoundingBox
  alignment?: "left" | "center" | "right" | "justify"
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface OCROptions {
  language?: string
  psm?: number // Page Segmentation Mode
  oem?: number // OCR Engine Mode
  whitelist?: string
  blacklist?: string
  dpi?: number
  preprocessImage?: boolean
  enhanceContrast?: boolean
  removeNoise?: boolean
}

export interface OCRProgress {
  stage: "preprocessing" | "recognizing" | "postprocessing" | "complete"
  progress: number
  message: string
}

export class OCRRecognition {
  private static readonly SUPPORTED_FORMATS = ["image/jpeg", "image/png", "image/webp", "image/bmp", "image/tiff"]
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  private static readonly SUPPORTED_LANGUAGES = {
    "zh-CN": "中文简体",
    "zh-TW": "中文繁体",
    en: "英语",
    ja: "日语",
    ko: "韩语",
    fr: "法语",
    de: "德语",
    es: "西班牙语",
    ru: "俄语",
    ar: "阿拉伯语",
  }

  // 验证图片文件
  static validateImage(file: File): { valid: boolean; error?: string } {
    if (!this.SUPPORTED_FORMATS.includes(file.type)) {
      return {
        valid: false,
        error: `不支持的图片格式。支持的格式: ${this.SUPPORTED_FORMATS.join(", ")}`,
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

  // 图像预处理
  static async preprocessImage(
    imageData: ImageData,
    options: {
      enhanceContrast?: boolean
      removeNoise?: boolean
      sharpen?: boolean
      binarize?: boolean
    } = {},
  ): Promise<ImageData> {
    const { data, width, height } = imageData
    const processedData = new Uint8ClampedArray(data)

    // 增强对比度
    if (options.enhanceContrast) {
      this.enhanceContrast(processedData)
    }

    // 去噪
    if (options.removeNoise) {
      this.removeNoise(processedData, width, height)
    }

    // 锐化
    if (options.sharpen) {
      this.sharpenImage(processedData, width, height)
    }

    // 二值化
    if (options.binarize) {
      this.binarizeImage(processedData)
    }

    return new ImageData(processedData, width, height)
  }

  // 增强对比度
  private static enhanceContrast(data: Uint8ClampedArray, factor = 1.5): void {
    for (let i = 0; i < data.length; i += 4) {
      // 转换为灰度
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]

      // 应用对比度增强
      const enhanced = Math.min(255, Math.max(0, (gray - 128) * factor + 128))

      data[i] = enhanced // R
      data[i + 1] = enhanced // G
      data[i + 2] = enhanced // B
      // Alpha通道保持不变
    }
  }

  // 去噪（简单的中值滤波）
  private static removeNoise(data: Uint8ClampedArray, width: number, height: number): void {
    const original = new Uint8ClampedArray(data)

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4

        // 获取3x3邻域的像素值
        const neighbors: number[] = []
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((y + dy) * width + (x + dx)) * 4
            const gray = 0.299 * original[nIdx] + 0.587 * original[nIdx + 1] + 0.114 * original[nIdx + 2]
            neighbors.push(gray)
          }
        }

        // 中值滤波
        neighbors.sort((a, b) => a - b)
        const median = neighbors[4] // 中位数

        data[idx] = median
        data[idx + 1] = median
        data[idx + 2] = median
      }
    }
  }

  // 图像锐化
  private static sharpenImage(data: Uint8ClampedArray, width: number, height: number): void {
    const original = new Uint8ClampedArray(data)
    const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0]

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4

        let sum = 0
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const nIdx = ((y + ky) * width + (x + kx)) * 4
            const gray = 0.299 * original[nIdx] + 0.587 * original[nIdx + 1] + 0.114 * original[nIdx + 2]
            sum += gray * kernel[(ky + 1) * 3 + (kx + 1)]
          }
        }

        const sharpened = Math.min(255, Math.max(0, sum))
        data[idx] = sharpened
        data[idx + 1] = sharpened
        data[idx + 2] = sharpened
      }
    }
  }

  // 二值化
  private static binarizeImage(data: Uint8ClampedArray, threshold = 128): void {
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      const binary = gray > threshold ? 255 : 0

      data[i] = binary
      data[i + 1] = binary
      data[i + 2] = binary
    }
  }

  // 主要OCR识别方法
  static async recognizeText(
    file: File,
    options: OCROptions = {},
    onProgress?: (progress: OCRProgress) => void,
  ): Promise<OCRResult> {
    const startTime = Date.now()
    const ocrId = `ocr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      // 验证文件
      const validation = this.validateImage(file)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      // 阶段1: 预处理
      if (onProgress) {
        onProgress({
          stage: "preprocessing",
          progress: 10,
          message: "预处理图像...",
        })
      }

      const imageData = await this.loadImageData(file)
      const processedImageData = options.preprocessImage
        ? await this.preprocessImage(imageData, {
            enhanceContrast: options.enhanceContrast,
            removeNoise: options.removeNoise,
            binarize: true,
          })
        : imageData

      // 阶段2: 文字识别
      if (onProgress) {
        onProgress({
          stage: "recognizing",
          progress: 50,
          message: "识别文字内容...",
        })
      }

      const recognitionResult = await this.performOCR(processedImageData, options)

      // 阶段3: 后处理
      if (onProgress) {
        onProgress({
          stage: "postprocessing",
          progress: 80,
          message: "优化识别结果...",
        })
      }

      const optimizedResult = this.postProcessResult(recognitionResult)

      // 阶段4: 完成
      if (onProgress) {
        onProgress({
          stage: "complete",
          progress: 100,
          message: "识别完成",
        })
      }

      const processingTime = Date.now() - startTime

      return {
        id: ocrId,
        ...optimizedResult,
        processingTime,
        imageInfo: {
          width: imageData.width,
          height: imageData.height,
          format: file.type,
          size: file.size,
        },
      }
    } catch (error) {
      throw new Error(`OCR识别失败: ${error instanceof Error ? error.message : "未知错误"}`)
    }
  }

  // 加载图像数据
  private static async loadImageData(file: File): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!

      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        const imageData = ctx.getImageData(0, 0, img.width, img.height)
        URL.revokeObjectURL(img.src)
        resolve(imageData)
      }

      img.onerror = () => {
        URL.revokeObjectURL(img.src)
        reject(new Error("图像加载失败"))
      }

      img.src = URL.createObjectURL(file)
    })
  }

  // 执行OCR识别（模拟实现）
  private static async performOCR(
    imageData: ImageData,
    options: OCROptions,
  ): Promise<Omit<OCRResult, "id" | "processingTime" | "imageInfo">> {
    // 模拟OCR处理时间
    await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 3000))

    // 模拟文字检测和识别
    const mockText = this.generateMockOCRText(imageData, options.language || "zh-CN")
    const words = this.generateMockWords(mockText)
    const lines = this.generateMockLines(words)
    const paragraphs = this.generateMockParagraphs(lines)

    return {
      text: mockText,
      confidence: 0.85 + Math.random() * 0.1,
      language: options.language || "zh-CN",
      words,
      lines,
      paragraphs,
      boundingBox: {
        x: 0,
        y: 0,
        width: imageData.width,
        height: imageData.height,
      },
    }
  }

  // 生成模拟OCR文本
  private static generateMockOCRText(imageData: ImageData, language: string): string {
    const templates = {
      "zh-CN": [
        "这是一段中文文本识别结果。",
        "图像中包含了重要的文字信息。",
        "通过OCR技术可以准确识别出文字内容。",
        "支持多种语言的文字识别功能。",
      ],
      en: [
        "This is an English text recognition result.",
        "The image contains important textual information.",
        "OCR technology can accurately recognize text content.",
        "Supports text recognition in multiple languages.",
      ],
      ja: [
        "これは日本語のテキスト認識結果です。",
        "画像には重要なテキスト情報が含まれています。",
        "OCR技術により正確にテキストを認識できます。",
      ],
    }

    const textTemplates = templates[language as keyof typeof templates] || templates["zh-CN"]
    const selectedTexts = textTemplates.slice(0, Math.floor(Math.random() * 3) + 1)

    return selectedTexts.join("\n")
  }

  // 生成模拟单词数据
  private static generateMockWords(text: string): OCRWord[] {
    const words: OCRWord[] = []
    const lines = text.split("\n")
    let yOffset = 0

    lines.forEach((line, lineIndex) => {
      const lineWords = line.split(/\s+/).filter((word) => word.length > 0)
      let xOffset = 0

      lineWords.forEach((word, wordIndex) => {
        const wordWidth = word.length * 12 // 估算宽度
        const wordHeight = 20

        words.push({
          text: word,
          confidence: 0.8 + Math.random() * 0.2,
          boundingBox: {
            x: xOffset,
            y: yOffset,
            width: wordWidth,
            height: wordHeight,
          },
          fontSize: 14,
          fontFamily: "Arial",
          color: "#000000",
        })

        xOffset += wordWidth + 8 // 单词间距
      })

      yOffset += 25 // 行间距
    })

    return words
  }

  // 生成模拟行数据
  private static generateMockLines(words: OCRWord[]): OCRLine[] {
    const lines: OCRLine[] = []
    const lineGroups: { [key: number]: OCRWord[] } = {}

    // 按Y坐标分组单词
    words.forEach((word) => {
      const lineY = Math.floor(word.boundingBox.y / 25) * 25
      if (!lineGroups[lineY]) {
        lineGroups[lineY] = []
      }
      lineGroups[lineY].push(word)
    })

    // 为每行创建OCRLine对象
    Object.entries(lineGroups).forEach(([y, lineWords]) => {
      const sortedWords = lineWords.sort((a, b) => a.boundingBox.x - b.boundingBox.x)
      const lineText = sortedWords.map((w) => w.text).join(" ")
      const avgConfidence = sortedWords.reduce((sum, w) => sum + w.confidence, 0) / sortedWords.length

      const minX = Math.min(...sortedWords.map((w) => w.boundingBox.x))
      const maxX = Math.max(...sortedWords.map((w) => w.boundingBox.x + w.boundingBox.width))
      const lineY = Number.parseInt(y)

      lines.push({
        text: lineText,
        confidence: avgConfidence,
        words: sortedWords,
        boundingBox: {
          x: minX,
          y: lineY,
          width: maxX - minX,
          height: 20,
        },
        angle: 0,
      })
    })

    return lines.sort((a, b) => a.boundingBox.y - b.boundingBox.y)
  }

  // 生成模拟段落数据
  private static generateMockParagraphs(lines: OCRLine[]): OCRParagraph[] {
    const paragraphs: OCRParagraph[] = []
    let currentParagraph: OCRLine[] = []

    lines.forEach((line, index) => {
      currentParagraph.push(line)

      // 简单的段落分割逻辑
      const isLastLine = index === lines.length - 1
      const nextLineGap = !isLastLine ? lines[index + 1].boundingBox.y - line.boundingBox.y : 0
      const isNewParagraph = isLastLine || nextLineGap > 35

      if (isNewParagraph) {
        const paragraphText = currentParagraph.map((l) => l.text).join("\n")
        const avgConfidence = currentParagraph.reduce((sum, l) => sum + l.confidence, 0) / currentParagraph.length

        const minX = Math.min(...currentParagraph.map((l) => l.boundingBox.x))
        const maxX = Math.max(...currentParagraph.map((l) => l.boundingBox.x + l.boundingBox.width))
        const minY = Math.min(...currentParagraph.map((l) => l.boundingBox.y))
        const maxY = Math.max(...currentParagraph.map((l) => l.boundingBox.y + l.boundingBox.height))

        paragraphs.push({
          text: paragraphText,
          confidence: avgConfidence,
          lines: [...currentParagraph],
          boundingBox: {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
          },
          alignment: "left",
        })

        currentParagraph = []
      }
    })

    return paragraphs
  }

  // 后处理识别结果
  private static postProcessResult(
    result: Omit<OCRResult, "id" | "processingTime" | "imageInfo">,
  ): Omit<OCRResult, "id" | "processingTime" | "imageInfo"> {
    // 文本清理
    const cleanedText = result.text
      .replace(/\s+/g, " ") // 合并多个空格
      .replace(/\n\s*\n/g, "\n") // 合并多个换行
      .trim()

    // 置信度调整
    const avgWordConfidence = result.words.reduce((sum, w) => sum + w.confidence, 0) / result.words.length
    const adjustedConfidence = Math.min(result.confidence, avgWordConfidence + 0.1)

    return {
      ...result,
      text: cleanedText,
      confidence: adjustedConfidence,
    }
  }

  // 批量OCR识别
  static async recognizeBatch(
    files: File[],
    options: OCROptions = {},
    onProgress?: (fileIndex: number, progress: OCRProgress) => void,
    onComplete?: (results: OCRResult[]) => void,
  ): Promise<OCRResult[]> {
    const results: OCRResult[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      try {
        const result = await this.recognizeText(file, options, (progress) => {
          if (onProgress) {
            onProgress(i, progress)
          }
        })

        results.push(result)
      } catch (error) {
        console.error(`OCR识别文件 ${file.name} 失败:`, error)
      }
    }

    if (onComplete) {
      onComplete(results)
    }

    return results
  }

  // 获取支持的语言列表
  static getSupportedLanguages(): Record<string, string> {
    return { ...this.SUPPORTED_LANGUAGES }
  }

  // 检测图像中的文字区域
  static async detectTextRegions(imageData: ImageData): Promise<BoundingBox[]> {
    // 简化的文字区域检测算法
    const regions: BoundingBox[] = []
    const { data, width, height } = imageData

    // 转换为灰度并检测边缘
    const grayData = new Uint8ClampedArray(width * height)
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      grayData[i / 4] = gray
    }

    // 简单的文字区域检测（基于像素密度）
    const blockSize = 50
    for (let y = 0; y < height - blockSize; y += blockSize) {
      for (let x = 0; x < width - blockSize; x += blockSize) {
        let textPixels = 0

        for (let by = 0; by < blockSize; by++) {
          for (let bx = 0; bx < blockSize; bx++) {
            const idx = (y + by) * width + (x + bx)
            if (grayData[idx] < 128) {
              // 暗像素可能是文字
              textPixels++
            }
          }
        }

        const textDensity = textPixels / (blockSize * blockSize)
        if (textDensity > 0.1 && textDensity < 0.8) {
          // 合理的文字密度范围
          regions.push({
            x,
            y,
            width: blockSize,
            height: blockSize,
          })
        }
      }
    }

    return regions
  }
}

// React Hook for OCR
export function useOCR() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<OCRProgress | null>(null)
  const [result, setResult] = useState<OCRResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const recognizeText = async (file: File, options?: OCROptions) => {
    setIsProcessing(true)
    setError(null)
    setResult(null)

    try {
      const ocrResult = await OCRRecognition.recognizeText(file, options, setProgress)
      setResult(ocrResult)

      // 缓存结果
      PerformanceOptimizer.setCache(`ocr_${file.name}_${file.size}`, ocrResult, 3600000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "识别失败")
    } finally {
      setIsProcessing(false)
      setProgress(null)
    }
  }

  const detectTextRegions = async (file: File) => {
    try {
      const imageData = await OCRRecognition["loadImageData"](file)
      return await OCRRecognition.detectTextRegions(imageData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "检测失败")
      return []
    }
  }

  return {
    isProcessing,
    progress,
    result,
    error,
    recognizeText,
    detectTextRegions,
    supportedLanguages: OCRRecognition.getSupportedLanguages(),
    reset: () => {
      setIsProcessing(false)
      setProgress(null)
      setResult(null)
      setError(null)
    },
  }
}
