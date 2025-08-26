import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 无边界交互工具函数
export const gestureUtils = {
  // 计算手势距离
  calculateDistance: (x1: number, y1: number, x2: number, y2: number): number => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
  },

  // 计算手势角度
  calculateAngle: (x1: number, y1: number, x2: number, y2: number): number => {
    return (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI
  },

  // 判断手势类型
  getGestureType: (deltaX: number, deltaY: number, threshold = 50): string => {
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    if (absX < threshold && absY < threshold) return "tap"
    if (absX > absY) return deltaX > 0 ? "swipe-right" : "swipe-left"
    return deltaY > 0 ? "swipe-down" : "swipe-up"
  },

  // 触觉反馈
  hapticFeedback: (pattern: number | number[] = 100): void => {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern)
    }
  },
}

// 语音识别工具
export const voiceUtils = {
  // 初始化语音识别
  initSpeechRecognition: (
    onResult: (transcript: string) => void,
    onStart?: () => void,
    onEnd?: () => void,
    continuous = true,
  ) => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.continuous = continuous
      recognition.interimResults = true
      recognition.lang = "zh-CN"

      recognition.onresult = (event: any) => {
        let finalTranscript = ""
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          }
        }
        if (finalTranscript) {
          onResult(finalTranscript)
        }
      }

      recognition.onstart = () => onStart?.()
      recognition.onend = () => onEnd?.()

      return recognition
    }
    return null
  },

  // 语音合成
  speak: (text: string, lang = "zh-CN"): void => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang
      utterance.rate = 0.9
      utterance.pitch = 1
      speechSynthesis.speak(utterance)
    }
  },
}

// 眼动追踪工具
export const gazeUtils = {
  // 计算注视点
  calculateGazePoint: (mouseX: number, mouseY: number, screenWidth: number, screenHeight: number) => {
    return {
      x: mouseX / screenWidth,
      y: mouseY / screenHeight,
      isCenter: Math.abs(mouseX - screenWidth / 2) < 100 && Math.abs(mouseY - screenHeight / 2) < 100,
    }
  },

  // 注视时间追踪
  trackGazeDuration: (callback: () => void, duration = 2000) => {
    return setTimeout(callback, duration)
  },
}

// AI上下文分析工具
export const aiUtils = {
  // 分析用户意图
  analyzeIntent: (query: string): { intent: string; confidence: number; suggestions: string[] } => {
    const keywords = {
      search: ["搜索", "查找", "寻找", "找到"],
      generate: ["生成", "创建", "制作", "思维导图", "PPT", "海报"],
      learn: ["学习", "教程", "课程", "路径", "指导"],
      analyze: ["分析", "解析", "研究", "探讨"],
    }

    let maxConfidence = 0
    let detectedIntent = "search"
    const suggestions: string[] = []

    Object.entries(keywords).forEach(([intent, words]) => {
      const matches = words.filter((word) => query.includes(word)).length
      const confidence = matches / words.length

      if (confidence > maxConfidence) {
        maxConfidence = confidence
        detectedIntent = intent
      }
    })

    // 生成建议
    switch (detectedIntent) {
      case "generate":
        suggestions.push("生成思维导图", "制作演示文稿", "创建海报")
        break
      case "learn":
        suggestions.push("创建学习路径", "查找教程", "制定学习计划")
        break
      case "analyze":
        suggestions.push("深度分析", "数据可视化", "趋势预测")
        break
      default:
        suggestions.push("智能搜索", "相关推荐", "扩展查询")
    }

    return {
      intent: detectedIntent,
      confidence: maxConfidence,
      suggestions,
    }
  },

  // 生成上下文操作
  generateContextActions: (query: string, intent: string) => {
    const actions = []

    if (query.includes("思维导图") || intent === "generate") {
      actions.push({ title: "生成思维导图", path: "/generate/mindmap", icon: "brain" })
    }

    if (query.includes("学习") || intent === "learn") {
      actions.push({ title: "创建学习路径", path: "/learning-path/create", icon: "target" })
    }

    if (query.includes("PPT") || query.includes("演示")) {
      actions.push({ title: "制作演示文稿", path: "/generate/ppt", icon: "presentation" })
    }

    if (query.includes("海报") || query.includes("设计")) {
      actions.push({ title: "设计海报", path: "/generate/poster", icon: "image" })
    }

    actions.push({ title: "智能搜索", path: "/results", icon: "search" })

    return actions
  },
}

// 性能监控工具
export const performanceUtils = {
  // 测量交互延迟
  measureInteractionLatency: (startTime: number): number => {
    return performance.now() - startTime
  },

  // 节流函数
  throttle: <T extends (...args: any[]) => any>(func: T, limit: number): T => {
    let inThrottle: boolean
    return ((...args: any[]) => {
      if (!inThrottle) {
        func.apply(null, args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }) as T
  },

  // 防抖函数
  debounce: <T extends (...args: any[]) => any>(func: T, delay: number): T => {
    let timeoutId: NodeJS.Timeout
    return ((...args: any[]) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func.apply(null, args), delay)
    }) as T
  },
}
