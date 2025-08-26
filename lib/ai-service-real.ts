// 真实AI服务集成
import { generateText, streamText } from "ai"
import { openai } from "@ai-sdk/openai"

export interface AIServiceConfig {
  provider: "openai" | "anthropic" | "google" | "local"
  apiKey: string
  baseUrl?: string
  model: string
  temperature?: number
  maxTokens?: number
  timeout?: number
}

export interface AIMessage {
  role: "system" | "user" | "assistant"
  content: string
  timestamp?: number
}

export interface AIResponse {
  id: string
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
  finishReason: string
  timestamp: number
}

export interface StreamChunk {
  content: string
  isComplete: boolean
  usage?: AIResponse["usage"]
}

export class RealAIService {
  private static configs: Map<string, AIServiceConfig> = new Map()
  private static activeProvider = "openai"

  // 预定义配置
  static readonly DEFAULT_CONFIGS: Record<string, Partial<AIServiceConfig>> = {
    openai: {
      provider: "openai",
      model: "gpt-4o",
      temperature: 0.7,
      maxTokens: 2000,
      timeout: 30000,
    },
    anthropic: {
      provider: "anthropic",
      model: "claude-3-sonnet-20240229",
      temperature: 0.7,
      maxTokens: 2000,
      timeout: 30000,
    },
    google: {
      provider: "google",
      model: "gemini-pro",
      temperature: 0.7,
      maxTokens: 2000,
      timeout: 30000,
    },
    local: {
      provider: "local",
      baseUrl: "http://localhost:11434",
      model: "llama2",
      temperature: 0.7,
      maxTokens: 2000,
      timeout: 60000,
    },
  }

  // 初始化AI服务
  static initialize(configs: Record<string, AIServiceConfig>): void {
    Object.entries(configs).forEach(([name, config]) => {
      this.configs.set(name, config)
    })

    // 设置默认提供商
    if (configs.openai?.apiKey) {
      this.activeProvider = "openai"
    } else if (configs.anthropic?.apiKey) {
      this.activeProvider = "anthropic"
    } else if (configs.google?.apiKey) {
      this.activeProvider = "google"
    } else if (configs.local) {
      this.activeProvider = "local"
    }
  }

  // 从环境变量加载配置
  static loadFromEnvironment(): void {
    const configs: Record<string, AIServiceConfig> = {}

    // OpenAI配置
    if (process.env.OPENAI_API_KEY) {
      configs.openai = {
        ...this.DEFAULT_CONFIGS.openai,
        apiKey: process.env.OPENAI_API_KEY,
        baseUrl: process.env.OPENAI_BASE_URL,
      } as AIServiceConfig
    }

    // Anthropic配置
    if (process.env.ANTHROPIC_API_KEY) {
      configs.anthropic = {
        ...this.DEFAULT_CONFIGS.anthropic,
        apiKey: process.env.ANTHROPIC_API_KEY,
      } as AIServiceConfig
    }

    // Google配置
    if (process.env.GOOGLE_API_KEY) {
      configs.google = {
        ...this.DEFAULT_CONFIGS.google,
        apiKey: process.env.GOOGLE_API_KEY,
      } as AIServiceConfig
    }

    // 本地配置
    if (process.env.LOCAL_AI_URL) {
      configs.local = {
        ...this.DEFAULT_CONFIGS.local,
        baseUrl: process.env.LOCAL_AI_URL,
        apiKey: process.env.LOCAL_AI_KEY || "",
      } as AIServiceConfig
    }

    this.initialize(configs)
  }

  // 获取可用的提供商
  static getAvailableProviders(): string[] {
    return Array.from(this.configs.keys())
  }

  // 切换提供商
  static switchProvider(provider: string): boolean {
    if (this.configs.has(provider)) {
      this.activeProvider = provider
      return true
    }
    return false
  }

  // 获取当前提供商
  static getCurrentProvider(): string {
    return this.activeProvider
  }

  // 测试提供商连接
  static async testProvider(provider: string): Promise<{
    success: boolean
    latency: number
    error?: string
  }> {
    const config = this.configs.get(provider)
    if (!config) {
      return { success: false, latency: 0, error: "提供商配置不存在" }
    }

    const startTime = Date.now()

    try {
      const testMessage: AIMessage[] = [{ role: "user", content: "Hello, this is a connection test." }]

      await this.chat(testMessage, { provider })

      return {
        success: true,
        latency: Date.now() - startTime,
      }
    } catch (error) {
      return {
        success: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : "未知错误",
      }
    }
  }

  // 智能对话
  static async chat(
    messages: AIMessage[],
    options: {
      provider?: string
      temperature?: number
      maxTokens?: number
      model?: string
    } = {},
  ): Promise<AIResponse> {
    const provider = options.provider || this.activeProvider
    const config = this.configs.get(provider)

    if (!config) {
      throw new Error(`AI提供商 ${provider} 未配置`)
    }

    try {
      const startTime = Date.now()

      // 根据提供商选择不同的实现
      let result: any

      switch (config.provider) {
        case "openai":
          result = await this.callOpenAI(messages, config, options)
          break
        case "anthropic":
          result = await this.callAnthropic(messages, config, options)
          break
        case "google":
          result = await this.callGoogle(messages, config, options)
          break
        case "local":
          result = await this.callLocal(messages, config, options)
          break
        default:
          throw new Error(`不支持的AI提供商: ${config.provider}`)
      }

      return {
        id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: result.text,
        usage: {
          promptTokens: result.usage?.promptTokens || 0,
          completionTokens: result.usage?.completionTokens || 0,
          totalTokens: result.usage?.totalTokens || 0,
        },
        model: options.model || config.model,
        finishReason: result.finishReason || "stop",
        timestamp: Date.now(),
      }
    } catch (error) {
      console.error(`AI服务调用失败 (${provider}):`, error)

      // 尝试备用提供商
      if (provider !== this.activeProvider) {
        console.log("尝试使用备用提供商...")
        return this.chat(messages, { ...options, provider: this.activeProvider })
      }

      throw new Error(`AI服务不可用: ${error instanceof Error ? error.message : "未知错误"}`)
    }
  }

  // 流式对话
  static async streamChat(
    messages: AIMessage[],
    onChunk: (chunk: StreamChunk) => void,
    options: {
      provider?: string
      temperature?: number
      maxTokens?: number
      model?: string
    } = {},
  ): Promise<void> {
    const provider = options.provider || this.activeProvider
    const config = this.configs.get(provider)

    if (!config) {
      throw new Error(`AI提供商 ${provider} 未配置`)
    }

    try {
      switch (config.provider) {
        case "openai":
          await this.streamOpenAI(messages, config, options, onChunk)
          break
        case "anthropic":
          await this.streamAnthropic(messages, config, options, onChunk)
          break
        case "google":
          await this.streamGoogle(messages, config, options, onChunk)
          break
        case "local":
          await this.streamLocal(messages, config, options, onChunk)
          break
        default:
          throw new Error(`不支持的AI提供商: ${config.provider}`)
      }
    } catch (error) {
      console.error(`流式AI服务调用失败 (${provider}):`, error)
      throw error
    }
  }

  // OpenAI实现
  private static async callOpenAI(messages: AIMessage[], config: AIServiceConfig, options: any): Promise<any> {
    const { text, usage, finishReason } = await generateText({
      model: openai(options.model || config.model),
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options.temperature || config.temperature,
      maxTokens: options.maxTokens || config.maxTokens,
    })

    return { text, usage, finishReason }
  }

  private static async streamOpenAI(
    messages: AIMessage[],
    config: AIServiceConfig,
    options: any,
    onChunk: (chunk: StreamChunk) => void,
  ): Promise<void> {
    const { textStream, usage } = await streamText({
      model: openai(options.model || config.model),
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options.temperature || config.temperature,
      maxTokens: options.maxTokens || config.maxTokens,
    })

    for await (const chunk of textStream) {
      onChunk({
        content: chunk,
        isComplete: false,
      })
    }

    onChunk({
      content: "",
      isComplete: true,
      usage: await usage,
    })
  }

  // Anthropic实现
  private static async callAnthropic(messages: AIMessage[], config: AIServiceConfig, options: any): Promise<any> {
    // 这里需要实际的Anthropic SDK调用
    // 目前返回模拟数据
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return {
      text: "这是来自Anthropic Claude的回答。",
      usage: { promptTokens: 50, completionTokens: 20, totalTokens: 70 },
      finishReason: "stop",
    }
  }

  private static async streamAnthropic(
    messages: AIMessage[],
    config: AIServiceConfig,
    options: any,
    onChunk: (chunk: StreamChunk) => void,
  ): Promise<void> {
    // 模拟流式响应
    const response = "这是来自Anthropic Claude的流式回答。"
    const words = response.split("")

    for (const word of words) {
      await new Promise((resolve) => setTimeout(resolve, 50))
      onChunk({ content: word, isComplete: false })
    }

    onChunk({
      content: "",
      isComplete: true,
      usage: { promptTokens: 50, completionTokens: 20, totalTokens: 70 },
    })
  }

  // Google实现
  private static async callGoogle(messages: AIMessage[], config: AIServiceConfig, options: any): Promise<any> {
    // 这里需要实际的Google AI SDK调用
    await new Promise((resolve) => setTimeout(resolve, 800))

    return {
      text: "这是来自Google Gemini的回答。",
      usage: { promptTokens: 45, completionTokens: 25, totalTokens: 70 },
      finishReason: "stop",
    }
  }

  private static async streamGoogle(
    messages: AIMessage[],
    config: AIServiceConfig,
    options: any,
    onChunk: (chunk: StreamChunk) => void,
  ): Promise<void> {
    const response = "这是来自Google Gemini的流式回答。"
    const words = response.split("")

    for (const word of words) {
      await new Promise((resolve) => setTimeout(resolve, 40))
      onChunk({ content: word, isComplete: false })
    }

    onChunk({
      content: "",
      isComplete: true,
      usage: { promptTokens: 45, completionTokens: 25, totalTokens: 70 },
    })
  }

  // 本地AI实现
  private static async callLocal(messages: AIMessage[], config: AIServiceConfig, options: any): Promise<any> {
    const response = await fetch(`${config.baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
      },
      body: JSON.stringify({
        model: options.model || config.model,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature: options.temperature || config.temperature,
        max_tokens: options.maxTokens || config.maxTokens,
        stream: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`本地AI服务错误: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    return {
      text: data.message?.content || data.response || "",
      usage: {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      },
      finishReason: "stop",
    }
  }

  private static async streamLocal(
    messages: AIMessage[],
    config: AIServiceConfig,
    options: any,
    onChunk: (chunk: StreamChunk) => void,
  ): Promise<void> {
    const response = await fetch(`${config.baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
      },
      body: JSON.stringify({
        model: options.model || config.model,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature: options.temperature || config.temperature,
        max_tokens: options.maxTokens || config.maxTokens,
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`本地AI服务错误: ${response.status} ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error("无法获取响应流")
    }

    const decoder = new TextDecoder()
    let buffer = ""

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") {
              onChunk({ content: "", isComplete: true })
              return
            }

            try {
              const parsed = JSON.parse(data)
              const content = parsed.message?.content || parsed.response || ""
              if (content) {
                onChunk({ content, isComplete: false })
              }
            } catch (error) {
              console.warn("解析流数据失败:", error)
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  // 获取服务状态
  static async getServiceStatus(): Promise<{
    activeProvider: string
    providers: Record<
      string,
      {
        available: boolean
        latency?: number
        error?: string
        model: string
      }
    >
  }> {
    const providers: Record<string, any> = {}

    for (const [name, config] of this.configs.entries()) {
      try {
        const testResult = await this.testProvider(name)
        providers[name] = {
          available: testResult.success,
          latency: testResult.latency,
          error: testResult.error,
          model: config.model,
        }
      } catch (error) {
        providers[name] = {
          available: false,
          error: error instanceof Error ? error.message : "未知错误",
          model: config.model,
        }
      }
    }

    return {
      activeProvider: this.activeProvider,
      providers,
    }
  }

  // 智能提供商选择
  static async selectBestProvider(): Promise<string> {
    const status = await this.getServiceStatus()

    // 找到延迟最低的可用提供商
    let bestProvider = this.activeProvider
    let bestLatency = Number.POSITIVE_INFINITY

    for (const [name, info] of Object.entries(status.providers)) {
      if (info.available && info.latency && info.latency < bestLatency) {
        bestProvider = name
        bestLatency = info.latency
      }
    }

    if (bestProvider !== this.activeProvider) {
      this.switchProvider(bestProvider)
      console.log(`自动切换到最佳提供商: ${bestProvider} (延迟: ${bestLatency}ms)`)
    }

    return bestProvider
  }
}

// 初始化AI服务
if (typeof window === "undefined") {
  // 服务器端初始化
  RealAIService.loadFromEnvironment()
}
