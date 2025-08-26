"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Settings,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  Wifi,
  Server,
  Cpu,
  HardDrive,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react"
import type { LocalLLMProvider, LocalLLMModel, LocalLLMConfig } from "@/lib/local-llm-config"

interface HealthStatus {
  providerId: string
  providerName: string
  success: boolean
  message: string
  latency?: number
}

export default function LocalLLMPage() {
  const router = useRouter()
  const [config, setConfig] = useState<LocalLLMConfig | null>(null)
  const [models, setModels] = useState<LocalLLMModel[]>([])
  const [healthStatus, setHealthStatus] = useState<HealthStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string>("")
  const [showAddProvider, setShowAddProvider] = useState(false)
  const [editingProvider, setEditingProvider] = useState<string | null>(null)

  // 新增提供商表单
  const [newProvider, setNewProvider] = useState({
    id: "",
    name: "",
    baseUrl: "",
    apiKey: "",
    type: "ollama" as LocalLLMProvider["type"],
  })

  const loadData = async () => {
    try {
      setLoading(true)

      // 加载配置
      const configResponse = await fetch("/api/local-llm?action=config")
      const configData = await configResponse.json()
      if (configData.success) {
        setConfig(configData.data)
        setSelectedProvider(configData.data.defaultProvider)
      }

      // 加载模型
      const modelsResponse = await fetch("/api/local-llm?action=models")
      const modelsData = await modelsResponse.json()
      if (modelsData.success) {
        setModels(modelsData.data)
      }

      // 检查健康状态
      const healthResponse = await fetch("/api/local-llm?action=health")
      const healthData = await healthResponse.json()
      if (healthData.success) {
        setHealthStatus(healthData.data)
      }
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setLoading(false)
    }
  }

  const refreshModels = async (providerId?: string) => {
    try {
      setRefreshing(true)
      const response = await fetch("/api/local-llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "refresh-models",
          providerId,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setModels(data.data)
      }
    } catch (error) {
      console.error("Failed to refresh models:", error)
    } finally {
      setRefreshing(false)
    }
  }

  const testConnection = async (providerId: string) => {
    try {
      const response = await fetch("/api/local-llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test-connection",
          providerId,
        }),
      })

      const data = await response.json()
      if (data.success) {
        // 更新健康状态
        setHealthStatus((prev) =>
          prev.map((status) => (status.providerId === providerId ? { ...status, ...data.data } : status)),
        )
      }
    } catch (error) {
      console.error("Failed to test connection:", error)
    }
  }

  const toggleProvider = async (providerId: string, enabled: boolean) => {
    try {
      const response = await fetch("/api/local-llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-provider",
          providerId,
          updates: { enabled },
        }),
      })

      if (response.ok) {
        await loadData()
      }
    } catch (error) {
      console.error("Failed to toggle provider:", error)
    }
  }

  const addProvider = async () => {
    try {
      const provider: LocalLLMProvider = {
        ...newProvider,
        enabled: true,
        models: [],
      }

      const response = await fetch("/api/local-llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add-provider",
          provider,
        }),
      })

      if (response.ok) {
        setShowAddProvider(false)
        setNewProvider({
          id: "",
          name: "",
          baseUrl: "",
          apiKey: "",
          type: "ollama",
        })
        await loadData()
      }
    } catch (error) {
      console.error("Failed to add provider:", error)
    }
  }

  const removeProvider = async (providerId: string) => {
    if (!confirm("确定要删除这个提供商吗？")) return

    try {
      const response = await fetch("/api/local-llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove-provider",
          providerId,
        }),
      })

      if (response.ok) {
        await loadData()
      }
    } catch (error) {
      console.error("Failed to remove provider:", error)
    }
  }

  const getProviderStatus = (providerId: string) => {
    return healthStatus.find((status) => status.providerId === providerId)
  }

  const getProviderModels = (providerId: string) => {
    return models.filter((model) => model.provider === providerId)
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">加载本地大模型配置...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Server className="w-5 h-5 text-blue-600" />
          <h1 className="text-lg font-medium">本地大模型管理</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshModels()}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            刷新模型
          </button>
          <button
            onClick={() => setShowAddProvider(true)}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            添加提供商
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 概览卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Server className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">提供商</p>
                <p className="text-2xl font-bold">{config?.providers.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">在线服务</p>
                <p className="text-2xl font-bold">{healthStatus.filter((s) => s.success).length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Cpu className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">可用模型</p>
                <p className="text-2xl font-bold">{models.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">默认模型</p>
                <p className="text-sm font-medium truncate">{config?.defaultModel || "未设置"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 提供商列表 */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-medium">提供商配置</h2>
          </div>

          <div className="divide-y">
            {config?.providers.map((provider) => {
              const status = getProviderStatus(provider.id)
              const providerModels = getProviderModels(provider.id)

              return (
                <div key={provider.id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${status?.success ? "bg-green-500" : "bg-red-500"}`} />
                        <h3 className="text-lg font-medium">{provider.name}</h3>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {provider.type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => testConnection(provider.id)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                        title="测试连接"
                      >
                        <Wifi className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => refreshModels(provider.id)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                        title="刷新模型"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingProvider(provider.id)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                        title="编辑"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeProvider(provider.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={provider.enabled}
                          onChange={(e) => toggleProvider(provider.id, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">服务地址</p>
                      <p className="font-mono text-sm">{provider.baseUrl}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">状态</p>
                      <div className="flex items-center gap-2">
                        {status?.success ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm">{status?.message || "未检测"}</span>
                        {status?.latency && <span className="text-xs text-gray-500">({status.latency}ms)</span>}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">可用模型</p>
                      <p className="text-sm">{providerModels.length} 个</p>
                    </div>
                  </div>

                  {/* 模型列表 */}
                  {providerModels.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">模型列表</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {providerModels.map((model) => (
                          <div key={model.id} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-sm truncate">{model.displayName}</h5>
                              {model.size && (
                                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">{model.size}</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-600 space-y-1">
                              <div className="flex items-center gap-2">
                                <HardDrive className="w-3 h-3" />
                                <span>上下文: {model.contextLength}</span>
                              </div>
                              {model.description && (
                                <div className="flex items-center gap-2">
                                  <Cpu className="w-3 h-3" />
                                  <span className="truncate">{model.description}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 添加提供商弹窗 */}
      {showAddProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">添加新提供商</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                <input
                  type="text"
                  value={newProvider.id}
                  onChange={(e) => setNewProvider((prev) => ({ ...prev, id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="例如: my-ollama"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                <input
                  type="text"
                  value={newProvider.name}
                  onChange={(e) => setNewProvider((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="例如: 我的 Ollama"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
                <select
                  value={newProvider.type}
                  onChange={(e) => setNewProvider((prev) => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="ollama">Ollama</option>
                  <option value="lm-studio">LM Studio</option>
                  <option value="text-generation-webui">Text Generation WebUI</option>
                  <option value="koboldcpp">KoboldCpp</option>
                  <option value="custom">自定义</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">服务地址</label>
                <input
                  type="text"
                  value={newProvider.baseUrl}
                  onChange={(e) => setNewProvider((prev) => ({ ...prev, baseUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="例如: http://localhost:11434"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API密钥（可选）</label>
                <input
                  type="password"
                  value={newProvider.apiKey}
                  onChange={(e) => setNewProvider((prev) => ({ ...prev, apiKey: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="如果需要认证请填写"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={addProvider}
                disabled={!newProvider.id || !newProvider.name || !newProvider.baseUrl}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                添加
              </button>
              <button
                onClick={() => setShowAddProvider(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
