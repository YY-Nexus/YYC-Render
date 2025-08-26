import {
  LocalLLMConfigManager,
  type LocalLLMProvider,
  type LocalLLMModel,
  type LocalLLMConfig,
} from "./local-llm-config"

export interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
  timestamp?: number
}

export interface ChatCompletionRequest {
  model: string
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
  top_p?: number
  stream?: boolean
  provider?: string
}

export interface ChatCompletionResponse {
  id: string
  object: string
  created: number
  model: string
  provider: string
  choices: {
    index: number
    message: ChatMessage
    finish_reason: string
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface ModelInfo {
  id: string
  name: string
  provider: string
  status: "available" | "loading" | "error"
  size?: string
  modified_at?: string
}

export class LocalLLMManager {
  private config: LocalLLMConfig
  private modelCache: Map<string, LocalLLMModel[]> = new Map()
  private healthCache: Map<string, { healthy: boolean; lastCheck: number }> = new Map()

  constructor() {
    this.config = LocalLLMConfigManager.getConfig()
  }

  // 健康检查 - 增强错误处理
  async checkProviderHealth(provider: LocalLLMProvider): Promise<boolean> {
    const cacheKey = provider.id
    const cached = this.healthCache.get(cacheKey)
    const now = Date.now()

    // 缓存5分钟
    if (cached && now - cached.lastCheck < 5 * 60 * 1000) {
      return cached.healthy
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000) // 减少超时时间

      let healthUrl = ""
      switch (provider.type) {
        case "ollama":
          healthUrl = `${provider.baseUrl}/api/tags`
          break
        case "lm-studio":
          healthUrl = `${provider.baseUrl}/v1/models`
          break
        case "text-generation-webui":
          healthUrl = `${provider.baseUrl}/api/v1/models`
          break
        case "koboldcpp":
          healthUrl = `${provider.baseUrl}/api/v1/models`
          break
        default:
          healthUrl = `${provider.baseUrl}/health`
      }

      const response = await fetch(healthUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(provider.apiKey && { Authorization: `Bearer ${provider.apiKey}` }),
        },
        signal: controller.signal,
        mode: "cors", // 添加CORS模式
      })

      clearTimeout(timeoutId)
      const healthy = response.ok

      this.healthCache.set(cacheKey, { healthy, lastCheck: now })
      return healthy
    } catch (error) {
      // 更详细的错误日志，但不抛出错误
      console.warn(`Provider ${provider.name} health check failed:`, {
        error: error instanceof Error ? error.message : String(error),
        provider: provider.name,
        baseUrl: provider.baseUrl,
        type: provider.type,
      })

      this.healthCache.set(cacheKey, { healthy: false, lastCheck: now })
      return false
    }
  }

  // 获取可用的模型列表 - 增强错误处理
  async getAvailableModels(providerId?: string): Promise<LocalLLMModel[]> {
    try {
      const providers = providerId
        ? ([LocalLLMConfigManager.getProvider(providerId)].filter(Boolean) as LocalLLMProvider[])
        : LocalLLMConfigManager.getEnabledProviders()

      if (providers.length === 0) {
        console.info("No local LLM providers configured")
        return []
      }

      const allModels: LocalLLMModel[] = []

      for (const provider of providers) {
        try {
          const models = await this.fetchModelsFromProvider(provider)
          allModels.push(...models)
        } catch (error) {
          console.warn(`Failed to fetch models from ${provider.name}:`, error)
          // 继续处理其他提供商，不中断整个流程
        }
      }

      return allModels
    } catch (error) {
      console.error("Error getting available models:", error)
      return []
    }
  }

  // 从提供商获取模型列表 - 增强错误处理
  private async fetchModelsFromProvider(provider: LocalLLMProvider): Promise<LocalLLMModel[]> {
    const cacheKey = provider.id
    const cached = this.modelCache.get(cacheKey)

    // 缓存10分钟
    if (cached && Date.now() - (cached as any).lastFetch < 10 * 60 * 1000) {
      return cached
    }

    try {
      const isHealthy = await this.checkProviderHealth(provider)
      if (!isHealthy) {
        console.info(`Provider ${provider.name} is not healthy, skipping model fetch`)
        return []
      }

      let modelsUrl = ""
      switch (provider.type) {
        case "ollama":
          modelsUrl = `${provider.baseUrl}/api/tags`
          break
        case "lm-studio":
        case "text-generation-webui":
        case "koboldcpp":
          modelsUrl = `${provider.baseUrl}/v1/models`
          break
        default:
          modelsUrl = `${provider.baseUrl}/models`
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(modelsUrl, {
        headers: {
          "Content-Type": "application/json",
          ...(provider.apiKey && { Authorization: `Bearer ${provider.apiKey}` }),
        },
        signal: controller.signal,
        mode: "cors",
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const models = this.parseModelsResponse(data, provider)

      // 更新缓存
      ;(models as any).lastFetch = Date.now()
      this.modelCache.set(cacheKey, models)

      // 更新配置中的模型列表
      try {
        LocalLLMConfigManager.updateProvider(provider.id, { models })
      } catch (configError) {
        console.warn("Failed to update provider config:", configError)
      }

      return models
    } catch (error) {
      console.warn(`Failed to fetch models from ${provider.name}:`, error)
      return []
    }
  }

  // 解析不同提供商的模型响应
  private parseModelsResponse(data: any, provider: LocalLLMProvider): LocalLLMModel[] {
    const models: LocalLLMModel[] = []

    try {
      switch (provider.type) {
        case "ollama":
          if (data.models && Array.isArray(data.models)) {
            data.models.forEach((model: any) => {
              models.push({
                id: model.name,
                name: model.name,
                displayName: model.name,
                provider: provider.id,
                contextLength: model.details?.parameter_size || 4096,
                size: model.size ? this.formatBytes(model.size) : undefined,
                description: model.details?.family || undefined,
                tags: model.details?.families || [],
                quantization: model.details?.quantization_level || undefined,
              })
            })
          }
          break

        case "lm-studio":
        case "text-generation-webui":
        case "koboldcpp":
          if (data.data && Array.isArray(data.data)) {
            data.data.forEach((model: any) => {
              models.push({
                id: model.id,
                name: model.id,
                displayName: model.id,
                provider: provider.id,
                contextLength: model.context_length || 4096,
                description: model.description || undefined,
              })
            })
          }
          break

        default:
          // 通用格式
          if (Array.isArray(data)) {
            data.forEach((model: any) => {
              models.push({
                id: model.id || model.name,
                name: model.name || model.id,
                displayName: model.display_name || model.name || model.id,
                provider: provider.id,
                contextLength: model.context_length || 4096,
              })
            })
          }
      }
    } catch (error) {
      console.error("Failed to parse models response:", error)
    }

    return models
  }

  // 聊天完成 - 增强错误处理
  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const provider = this.findBestProvider(request.provider, request.model)
    if (!provider) {
      throw new Error("No available provider found")
    }

    const isHealthy = await this.checkProviderHealth(provider)
    if (!isHealthy) {
      throw new Error(`Provider ${provider.name} is not available`)
    }

    try {
      const response = await this.sendChatRequest(provider, request)
      return response
    } catch (error) {
      console.error(`Chat completion failed with ${provider.name}:`, error)

      // 尝试备用提供商
      if (this.config.enableFallback) {
        const fallbackProvider = this.findFallbackProvider(provider.id, request.model)
        if (fallbackProvider) {
          console.log(`Trying fallback provider: ${fallbackProvider.name}`)
          try {
            return await this.sendChatRequest(fallbackProvider, request)
          } catch (fallbackError) {
            console.error(`Fallback provider also failed:`, fallbackError)
          }
        }
      }

      throw error
    }
  }

  // 发送聊天请求
  private async sendChatRequest(
    provider: LocalLLMProvider,
    request: ChatCompletionRequest,
  ): Promise<ChatCompletionResponse> {
    let apiUrl = ""
    let requestBody: any = {}

    switch (provider.type) {
      case "ollama":
        apiUrl = `${provider.baseUrl}/api/chat`
        requestBody = {
          model: request.model,
          messages: request.messages,
          stream: false,
          options: {
            temperature: request.temperature || 0.7,
            top_p: request.top_p || 0.9,
            num_predict: request.max_tokens || -1,
          },
        }
        break

      case "lm-studio":
      case "text-generation-webui":
      case "koboldcpp":
        apiUrl = `${provider.baseUrl}/v1/chat/completions`
        requestBody = {
          model: request.model,
          messages: request.messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.max_tokens || 1000,
          top_p: request.top_p || 0.9,
          stream: request.stream || false,
        }
        break

      default:
        apiUrl = `${provider.baseUrl}/chat/completions`
        requestBody = request
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(provider.apiKey && { Authorization: `Bearer ${provider.apiKey}` }),
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
        mode: "cors",
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return this.normalizeResponse(data, provider, request.model)
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  // 标准化响应格式
  private normalizeResponse(data: any, provider: LocalLLMProvider, model: string): ChatCompletionResponse {
    const now = Math.floor(Date.now() / 1000)

    // Ollama 格式
    if (provider.type === "ollama" && data.message) {
      return {
        id: `chatcmpl-${Date.now()}`,
        object: "chat.completion",
        created: now,
        model: model,
        provider: provider.id,
        choices: [
          {
            index: 0,
            message: {
              role: data.message.role,
              content: data.message.content,
            },
            finish_reason: data.done ? "stop" : "length",
          },
        ],
        usage: {
          prompt_tokens: data.prompt_eval_count || 0,
          completion_tokens: data.eval_count || 0,
          total_tokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
      }
    }

    // OpenAI 兼容格式
    if (data.choices && Array.isArray(data.choices)) {
      return {
        id: data.id || `chatcmpl-${Date.now()}`,
        object: data.object || "chat.completion",
        created: data.created || now,
        model: data.model || model,
        provider: provider.id,
        choices: data.choices,
        usage: data.usage || {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
      }
    }

    // 备用格式
    return {
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: now,
      model: model,
      provider: provider.id,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: data.response || data.text || JSON.stringify(data),
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
    }
  }

  // 查找最佳提供商
  private findBestProvider(preferredProviderId?: string, model?: string): LocalLLMProvider | null {
    const enabledProviders = LocalLLMConfigManager.getEnabledProviders()

    if (preferredProviderId) {
      const preferred = enabledProviders.find((p) => p.id === preferredProviderId)
      if (preferred) return preferred
    }

    if (model) {
      // 查找有该模型的提供商
      for (const provider of enabledProviders) {
        if (provider.models.some((m) => m.id === model || m.name === model)) {
          return provider
        }
      }
    }

    // 返回默认提供商或第一个可用的
    const defaultProvider = enabledProviders.find((p) => p.id === this.config.defaultProvider)
    return defaultProvider || enabledProviders[0] || null
  }

  // 查找备用提供商
  private findFallbackProvider(excludeProviderId: string, model?: string): LocalLLMProvider | null {
    const enabledProviders = LocalLLMConfigManager.getEnabledProviders().filter((p) => p.id !== excludeProviderId)

    if (model) {
      for (const provider of enabledProviders) {
        if (provider.models.some((m) => m.id === model || m.name === model)) {
          return provider
        }
      }
    }

    return enabledProviders[0] || null
  }

  // 格式化字节大小
  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes"

    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // 刷新模型缓存
  async refreshModels(providerId?: string): Promise<void> {
    if (providerId) {
      this.modelCache.delete(providerId)
      const provider = LocalLLMConfigManager.getProvider(providerId)
      if (provider) {
        await this.fetchModelsFromProvider(provider)
      }
    } else {
      this.modelCache.clear()
      await this.getAvailableModels()
    }
  }

  // 测试连接
  async testConnection(provider: LocalLLMProvider): Promise<{ success: boolean; message: string; latency?: number }> {
    const startTime = Date.now()

    try {
      const isHealthy = await this.checkProviderHealth(provider)
      const latency = Date.now() - startTime

      if (isHealthy) {
        return {
          success: true,
          message: "连接成功",
          latency,
        }
      } else {
        return {
          success: false,
          message: "连接失败：服务不可用",
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `连接失败：${error instanceof Error ? error.message : "未知错误"}`,
      }
    }
  }

  // 检查是否有可用的本地模型
  async hasAvailableModels(): Promise<boolean> {
    try {
      const models = await this.getAvailableModels()
      return models.length > 0
    } catch (error) {
      console.warn("Error checking available models:", error)
      return false
    }
  }

  // 获取提供商状态
  async getProviderStatus(): Promise<{ [providerId: string]: { healthy: boolean; modelCount: number } }> {
    const providers = LocalLLMConfigManager.getEnabledProviders()
    const status: { [providerId: string]: { healthy: boolean; modelCount: number } } = {}

    for (const provider of providers) {
      try {
        const healthy = await this.checkProviderHealth(provider)
        const models = healthy ? await this.fetchModelsFromProvider(provider) : []
        status[provider.id] = {
          healthy,
          modelCount: models.length,
        }
      } catch (error) {
        status[provider.id] = {
          healthy: false,
          modelCount: 0,
        }
      }
    }

    return status
  }
}

// 单例实例
export const localLLMManager = new LocalLLMManager()
