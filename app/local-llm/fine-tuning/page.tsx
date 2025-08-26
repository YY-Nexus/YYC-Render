"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Upload,
  Play,
  Square,
  FileText,
  Brain,
  CheckCircle,
  AlertCircle,
  Trash2,
  Eye,
  Plus,
  RefreshCw,
} from "lucide-react"
import {
  ModelFineTuningManager,
  type FineTuningDataset,
  type FineTuningJob,
  type FineTuningConfig,
  type DataSample,
} from "@/lib/model-fine-tuning"
import { LocalLLMConfigManager } from "@/lib/local-llm-config"

export default function FineTuningPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"datasets" | "jobs" | "create">("datasets")
  const [datasets, setDatasets] = useState<FineTuningDataset[]>([])
  const [jobs, setJobs] = useState<FineTuningJob[]>([])
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [selectedDataset, setSelectedDataset] = useState<string>("")
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [jobName, setJobName] = useState<string>("")
  const [config, setConfig] = useState<FineTuningConfig>(ModelFineTuningManager.getDefaultConfig())
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [datasetName, setDatasetName] = useState<string>("")
  const [datasetDescription, setDatasetDescription] = useState<string>("")
  const [previewData, setPreviewData] = useState<DataSample[]>([])
  const [validationResult, setValidationResult] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setDatasets(ModelFineTuningManager.getDatasets())
    setJobs(ModelFineTuningManager.getJobs())

    // 加载可用模型
    const models = LocalLLMConfigManager.getAllModels()
    setAvailableModels(models)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadedFile(file)
    setDatasetName(file.name.replace(/\.[^/.]+$/, ""))

    try {
      const text = await file.text()
      let samples: DataSample[] = []

      if (file.name.endsWith(".jsonl")) {
        // JSONL 格式
        const lines = text.split("\n").filter((line) => line.trim())
        samples = lines.map((line) => {
          const data = JSON.parse(line)
          return {
            input: data.input || data.prompt || "",
            output: data.output || data.completion || data.response || "",
            instruction: data.instruction || data.system || "",
            context: data.context || "",
            category: data.category || "",
            difficulty: data.difficulty || 1,
          }
        })
      } else if (file.name.endsWith(".csv")) {
        // CSV 格式
        const lines = text.split("\n")
        const headers = lines[0].split(",").map((h) => h.trim())

        samples = lines
          .slice(1)
          .filter((line) => line.trim())
          .map((line) => {
            const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""))
            const sample: DataSample = { input: "", output: "" }

            headers.forEach((header, index) => {
              const value = values[index] || ""
              switch (header.toLowerCase()) {
                case "input":
                case "prompt":
                case "question":
                  sample.input = value
                  break
                case "output":
                case "completion":
                case "response":
                case "answer":
                  sample.output = value
                  break
                case "instruction":
                case "system":
                  sample.instruction = value
                  break
                case "context":
                  sample.context = value
                  break
                case "category":
                  sample.category = value
                  break
                case "difficulty":
                  sample.difficulty = Number.parseInt(value) || 1
                  break
              }
            })

            return sample
          })
      } else {
        // 纯文本格式，假设每行是一个问答对，用制表符分隔
        const lines = text.split("\n").filter((line) => line.trim())
        samples = lines.map((line) => {
          const parts = line.split("\t")
          return {
            input: parts[0] || "",
            output: parts[1] || "",
            instruction: parts[2] || "",
          }
        })
      }

      setPreviewData(samples.slice(0, 10)) // 只预览前10条

      // 验证数据
      const validation = ModelFineTuningManager.validateDataset(samples)
      setValidationResult(validation)
    } catch (error) {
      console.error("文件解析失败:", error)
      alert("文件格式不正确，请检查文件内容")
    }
  }

  const handleCreateDataset = async () => {
    if (!uploadedFile || !datasetName) {
      alert("请选择文件并输入数据集名称")
      return
    }

    if (validationResult && !validationResult.valid) {
      alert("数据集验证失败，请修复错误后重试")
      return
    }

    setIsProcessing(true)

    try {
      const text = await uploadedFile.text()
      const samples = previewData.length > 0 ? previewData : []

      const dataset = ModelFineTuningManager.addDataset({
        name: datasetName,
        description: datasetDescription,
        format: uploadedFile.name.endsWith(".jsonl") ? "jsonl" : uploadedFile.name.endsWith(".csv") ? "csv" : "txt",
        size: uploadedFile.size,
        samples: samples.length,
        filePath: `datasets/${datasetName}_${Date.now()}.${uploadedFile.name.split(".").pop()}`,
      })

      // 这里应该将文件上传到服务器或本地存储
      console.log("数据集创建成功:", dataset)

      loadData()
      setActiveTab("datasets")

      // 重置表单
      setUploadedFile(null)
      setDatasetName("")
      setDatasetDescription("")
      setPreviewData([])
      setValidationResult(null)

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("创建数据集失败:", error)
      alert("创建数据集失败，请重试")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreateJob = () => {
    if (!selectedDataset || !selectedModel || !jobName) {
      alert("请填写所有必需字段")
      return
    }

    const job = ModelFineTuningManager.createJob({
      name: jobName,
      baseModel: selectedModel,
      dataset: selectedDataset,
      provider: "ollama", // 默认使用 Ollama
      config: config,
    })

    console.log("微调任务创建成功:", job)
    loadData()
    setActiveTab("jobs")

    // 重置表单
    setJobName("")
    setSelectedDataset("")
    setSelectedModel("")
  }

  const handleStartJob = (jobId: string) => {
    ModelFineTuningManager.updateJob(jobId, {
      status: "running",
      startedAt: Date.now(),
      progress: 0,
    })

    // 模拟训练进度
    simulateTraining(jobId)
    loadData()
  }

  const simulateTraining = (jobId: string) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 10
      if (progress >= 100) {
        progress = 100
        ModelFineTuningManager.updateJob(jobId, {
          status: "completed",
          progress: 100,
          completedAt: Date.now(),
          outputModel: `fine_tuned_${Date.now()}`,
        })
        clearInterval(interval)
        loadData()
      } else {
        ModelFineTuningManager.updateJob(jobId, { progress })
        loadData()
      }
    }, 1000)
  }

  const handleCancelJob = (jobId: string) => {
    ModelFineTuningManager.cancelJob(jobId)
    loadData()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case "running":
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case "cancelled":
        return <Square className="w-4 h-4 text-gray-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "running":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/local-llm")}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>返回</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">模型微调</h1>
                <p className="text-gray-600">训练和优化您的本地大模型</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 标签页导航 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab("datasets")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "datasets"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  数据集管理
                </div>
              </button>
              <button
                onClick={() => setActiveTab("jobs")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "jobs"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  微调任务
                </div>
              </button>
              <button
                onClick={() => setActiveTab("create")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "create"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  创建任务
                </div>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* 数据集管理 */}
            {activeTab === "datasets" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-800">数据集列表</h2>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    上传数据集
                  </button>
                </div>

                {datasets.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">暂无数据集</h3>
                    <p className="text-gray-600 mb-4">上传您的训练数据开始微调模型</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      上传第一个数据集
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {datasets.map((dataset) => (
                      <div key={dataset.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-gray-800">{dataset.name}</h3>
                          <div className="flex items-center gap-1">
                            <button
                              className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                              title="查看详情"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => ModelFineTuningManager.deleteDataset(dataset.id)}
                              className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-3">{dataset.description}</p>

                        <div className="space-y-2 text-xs text-gray-500">
                          <div className="flex justify-between">
                            <span>格式:</span>
                            <span className="uppercase">{dataset.format}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>样本数:</span>
                            <span>{dataset.samples.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>大小:</span>
                            <span>{(dataset.size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                          <div className="flex justify-between">
                            <span>创建时间:</span>
                            <span>{new Date(dataset.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 隐藏的文件输入 */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jsonl,.csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* 文件上传预览 */}
                {uploadedFile && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="font-semibold text-blue-800 mb-4">数据集预览</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">数据集名称</label>
                        <input
                          type="text"
                          value={datasetName}
                          onChange={(e) => setDatasetName(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="输入数据集名称"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
                        <input
                          type="text"
                          value={datasetDescription}
                          onChange={(e) => setDatasetDescription(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="输入数据集描述"
                        />
                      </div>
                    </div>

                    {/* 验证结果 */}
                    {validationResult && (
                      <div
                        className={`p-3 rounded-lg mb-4 ${
                          validationResult.valid
                            ? "bg-green-100 border border-green-200"
                            : "bg-red-100 border border-red-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {validationResult.valid ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span className={`font-medium ${validationResult.valid ? "text-green-800" : "text-red-800"}`}>
                            {validationResult.valid ? "数据集验证通过" : "数据集验证失败"}
                          </span>
                        </div>

                        {validationResult.errors.length > 0 && (
                          <div className="mb-2">
                            <p className="text-sm font-medium text-red-800 mb-1">错误:</p>
                            <ul className="text-sm text-red-700 list-disc list-inside">
                              {validationResult.errors.map((error: string, index: number) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {validationResult.warnings.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-yellow-800 mb-1">警告:</p>
                            <ul className="text-sm text-yellow-700 list-disc list-inside">
                              {validationResult.warnings.map((warning: string, index: number) => (
                                <li key={index}>{warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 数据预览 */}
                    {previewData.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-800 mb-2">数据预览 (前10条)</h4>
                        <div className="bg-white rounded border border-gray-200 max-h-64 overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                              <tr>
                                <th className="px-3 py-2 text-left font-medium text-gray-700">输入</th>
                                <th className="px-3 py-2 text-left font-medium text-gray-700">输出</th>
                                <th className="px-3 py-2 text-left font-medium text-gray-700">指令</th>
                              </tr>
                            </thead>
                            <tbody>
                              {previewData.map((sample, index) => (
                                <tr key={index} className="border-b border-gray-100">
                                  <td className="px-3 py-2 text-gray-800 max-w-xs truncate">{sample.input}</td>
                                  <td className="px-3 py-2 text-gray-800 max-w-xs truncate">{sample.output}</td>
                                  <td className="px-3 py-2 text-gray-600 max-w-xs truncate">
                                    {sample.instruction || "-"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleCreateDataset}
                        disabled={isProcessing || !validationResult?.valid}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isProcessing ? "创建中..." : "创建数据集"}
                      </button>
                      <button
                        onClick={() => {
                          setUploadedFile(null)
                          setPreviewData([])
                          setValidationResult(null)
                          if (fileInputRef.current) {
                            fileInputRef.current.value = ""
                          }
                        }}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 微调任务 */}
            {activeTab === "jobs" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-800">微调任务</h2>
                  <button
                    onClick={() => setActiveTab("create")}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    创建任务
                  </button>
                </div>

                {jobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">暂无微调任务</h3>
                    <p className="text-gray-600 mb-4">创建您的第一个微调任务</p>
                    <button
                      onClick={() => setActiveTab("create")}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      创建任务
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {jobs.map((job) => (
                      <div key={job.id} className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-1">{job.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>基础模型: {job.baseModel}</span>
                              <span>数据集: {job.dataset}</span>
                              <span>提供商: {job.provider}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div
                              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}
                            >
                              {getStatusIcon(job.status)}
                              {job.status}
                            </div>

                            {job.status === "pending" && (
                              <button
                                onClick={() => handleStartJob(job.id)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="开始训练"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            )}

                            {job.status === "running" && (
                              <button
                                onClick={() => handleCancelJob(job.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="取消训练"
                              >
                                <Square className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 进度条 */}
                        {job.status === "running" && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                              <span>训练进度</span>
                              <span>{job.progress.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${job.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {/* 时间信息 */}
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          {job.startedAt && <span>开始时间: {new Date(job.startedAt).toLocaleString()}</span>}
                          {job.completedAt && <span>完成时间: {new Date(job.completedAt).toLocaleString()}</span>}
                          {job.outputModel && <span className="text-green-600">输出模型: {job.outputModel}</span>}
                        </div>

                        {/* 错误信息 */}
                        {job.error && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800">{job.error}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 创建任务 */}
            {activeTab === "create" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800">创建微调任务</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 基本设置 */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-800">基本设置</h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">任务名称</label>
                      <input
                        type="text"
                        value={jobName}
                        onChange={(e) => setJobName(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="输入任务名称"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">基础模型</label>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">选择基础模型</option>
                        {availableModels.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.displayName} ({model.provider})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">训练数据集</label>
                      <select
                        value={selectedDataset}
                        onChange={(e) => setSelectedDataset(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">选择数据集</option>
                        {datasets.map((dataset) => (
                          <option key={dataset.id} value={dataset.id}>
                            {dataset.name} ({dataset.samples} 样本)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 高级配置 */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-800">训练参数</h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">学习率</label>
                        <input
                          type="number"
                          step="0.00001"
                          value={config.learningRate}
                          onChange={(e) => setConfig({ ...config, learningRate: Number.parseFloat(e.target.value) })}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">批次大小</label>
                        <input
                          type="number"
                          min="1"
                          value={config.batchSize}
                          onChange={(e) => setConfig({ ...config, batchSize: Number.parseInt(e.target.value) })}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">训练轮数</label>
                        <input
                          type="number"
                          min="1"
                          value={config.epochs}
                          onChange={(e) => setConfig({ ...config, epochs: Number.parseInt(e.target.value) })}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">最大长度</label>
                        <input
                          type="number"
                          min="128"
                          value={config.maxLength}
                          onChange={(e) => setConfig({ ...config, maxLength: Number.parseInt(e.target.value) })}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={config.useLoRA}
                          onChange={(e) => setConfig({ ...config, useLoRA: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">使用 LoRA 微调</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1">LoRA 可以显著减少训练时间和内存使用</p>
                    </div>

                    {config.useLoRA && (
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">LoRA Rank</label>
                          <input
                            type="number"
                            min="1"
                            value={config.loraRank}
                            onChange={(e) => setConfig({ ...config, loraRank: Number.parseInt(e.target.value) })}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">LoRA Alpha</label>
                          <input
                            type="number"
                            min="1"
                            value={config.loraAlpha}
                            onChange={(e) => setConfig({ ...config, loraAlpha: Number.parseInt(e.target.value) })}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">LoRA Dropout</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="1"
                            value={config.loraDropout}
                            onChange={(e) => setConfig({ ...config, loraDropout: Number.parseFloat(e.target.value) })}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 训练估算 */}
                {selectedDataset && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-3">训练估算</h4>
                    {(() => {
                      const dataset = datasets.find((d) => d.id === selectedDataset)
                      if (!dataset) return null

                      const estimation = ModelFineTuningManager.estimateTraining(dataset.samples, config)

                      return (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-blue-700 font-medium">预计时间:</span>
                            <p className="text-blue-800">{estimation.estimatedTime} 分钟</p>
                          </div>
                          <div>
                            <span className="text-blue-700 font-medium">内存需求:</span>
                            <p className="text-blue-800">{estimation.memoryUsage} GB</p>
                          </div>
                          <div>
                            <span className="text-blue-700 font-medium">磁盘空间:</span>
                            <p className="text-blue-800">{estimation.diskSpace} GB</p>
                          </div>
                          <div>
                            <span className="text-blue-700 font-medium">样本数:</span>
                            <p className="text-blue-800">{dataset.samples.toLocaleString()}</p>
                          </div>

                          {estimation.recommendations.length > 0 && (
                            <div className="col-span-full mt-2">
                              <span className="text-blue-700 font-medium">建议:</span>
                              <ul className="text-blue-800 text-xs mt-1 list-disc list-inside">
                                {estimation.recommendations.map((rec, index) => (
                                  <li key={index}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                )}

                {/* 创建按钮 */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCreateJob}
                    disabled={!selectedDataset || !selectedModel || !jobName}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    创建微调任务
                  </button>
                  <button
                    onClick={() => setConfig(ModelFineTuningManager.getDefaultConfig())}
                    className="px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    重置配置
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
