export interface LocalLLMProvider {
  id: string
  name: string
  baseUrl: string
  apiKey?: string
  enabled: boolean
  models: LocalLLMModel[]
  type: "ollama" | "lm-studio" | "text-generation-webui" | "koboldcpp" | "custom"
}

export interface LocalLLMModel {
  id: string
  name: string
  displayName: string
  provider: string
  contextLength: number
  parameters?: string
  description?: string
  tags?: string[]
  size?: string
  quantization?: string
}

export interface LocalLLMConfig {
  providers: LocalLLMProvider[]
  defaultProvider: string
  defaultModel: string
  timeout: number
  maxRetries: number
  enableFallback: boolean
}

export class LocalLLMConfigManager {
  private static readonly CONFIG_KEY = "local-llm-config"

  static getDefaultConfig(): LocalLLMConfig {
    return {
      providers: [
        {
          id: "ollama",
          name: "Ollama",
          baseUrl: "http://localhost:11434",
          enabled: true,
          models: [],
          type: "ollama",
        },
        {
          id: "lm-studio",
          name: "LM Studio",
          baseUrl: "http://localhost:1234",
          enabled: false,
          models: [],
          type: "lm-studio",
        },
        {
          id: "text-generation-webui",
          name: "Text Generation WebUI",
          baseUrl: "http://localhost:5000",
          enabled: false,
          models: [],
          type: "text-generation-webui",
        },
        {
          id: "koboldcpp",
          name: "KoboldCpp",
          baseUrl: "http://localhost:5001",
          enabled: false,
          models: [],
          type: "koboldcpp",
        },
      ],
      defaultProvider: "ollama",
      defaultModel: "",
      timeout: 30000,
      maxRetries: 3,
      enableFallback: true,
    }
  }

  static getConfig(): LocalLLMConfig {
    if (typeof window === "undefined") return this.getDefaultConfig()

    try {
      const stored = localStorage.getItem(this.CONFIG_KEY)
      if (stored) {
        const config = JSON.parse(stored)
        return { ...this.getDefaultConfig(), ...config }
      }
    } catch (error) {
      console.error("获取本地大模型配置失败:", error)
    }

    return this.getDefaultConfig()
  }

  static saveConfig(config: LocalLLMConfig): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config))
    } catch (error) {
      console.error("保存本地大模型配置失败:", error)
    }
  }

  static updateProvider(providerId: string, updates: Partial<LocalLLMProvider>): void {
    const config = this.getConfig()
    const providerIndex = config.providers.findIndex((p) => p.id === providerId)

    if (providerIndex !== -1) {
      config.providers[providerIndex] = { ...config.providers[providerIndex], ...updates }
      this.saveConfig(config)
    }
  }

  static addCustomProvider(provider: LocalLLMProvider): void {
    const config = this.getConfig()
    config.providers.push(provider)
    this.saveConfig(config)
  }

  static removeProvider(providerId: string): void {
    const config = this.getConfig()
    config.providers = config.providers.filter((p) => p.id !== providerId)
    this.saveConfig(config)
  }

  static getEnabledProviders(): LocalLLMProvider[] {
    return this.getConfig().providers.filter((p) => p.enabled)
  }

  static getProvider(providerId: string): LocalLLMProvider | null {
    return this.getConfig().providers.find((p) => p.id === providerId) || null
  }

  static getAllModels(): LocalLLMModel[] {
    const config = this.getConfig()
    return config.providers.filter((p) => p.enabled).flatMap((p) => p.models)
  }

  static getModelsByProvider(providerId: string): LocalLLMModel[] {
    const provider = this.getProvider(providerId)
    return provider ? provider.models : []
  }
}
