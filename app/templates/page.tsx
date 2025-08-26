"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { TemplateManager, type CustomTemplate } from "@/lib/template-manager"
import { WebpageGenerator } from "@/lib/webpage-generator"
import { PosterGenerator } from "@/lib/poster-generator"
import { PPTGenerator } from "@/lib/ppt-generator"

export default function TemplatesPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"webpage" | "poster" | "ppt">("webpage")
  const [templates, setTemplates] = useState<CustomTemplate[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [activeTab])

  const loadTemplates = () => {
    const customTemplates = TemplateManager.getCustomTemplates(activeTab)
    setTemplates(customTemplates)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    const filtered = TemplateManager.searchTemplates(query, activeTab, selectedCategory)
    setTemplates(filtered)
  }

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category)
    const filtered = TemplateManager.searchTemplates(searchQuery, activeTab, category || undefined)
    setTemplates(filtered)
  }

  const handleUseTemplate = (template: CustomTemplate) => {
    switch (template.type) {
      case "webpage":
        router.push(`/generate/webpage?template=${template.id}`)
        break
      case "poster":
        router.push(`/generate/poster?template=${template.id}`)
        break
      case "ppt":
        router.push(`/generate/ppt?template=${template.id}`)
        break
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm("确定要删除这个模板吗？")) {
      TemplateManager.deleteCustomTemplate(templateId)
      loadTemplates()
    }
  }

  const handleDuplicateTemplate = async (templateId: string) => {
    const newName = prompt("请输入新模板名称:")
    if (newName) {
      const duplicated = TemplateManager.duplicateTemplate(templateId, newName)
      if (duplicated) {
        loadTemplates()
      }
    }
  }

  const getBuiltInTemplates = () => {
    switch (activeTab) {
      case "webpage":
        return WebpageGenerator.getTemplates()
      case "poster":
        return PosterGenerator.getTemplates()
      case "ppt":
        return PPTGenerator.getTemplates()
      default:
        return []
    }
  }

  const builtInTemplates = getBuiltInTemplates()
  const categories = [...new Set([...templates.map((t) => t.category), ...builtInTemplates.map((t) => t.category)])]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">模板管理</h1>
              <p className="text-gray-600 mt-1">管理和使用您的自定义模板</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              创建模板
            </button>
          </div>

          {/* 标签页 */}
          <div className="mt-6">
            <div className="flex space-x-8 border-b border-gray-200">
              {[
                { key: "webpage", label: "网页模板" },
                { key: "poster", label: "海报模板" },
                { key: "ppt", label: "PPT模板" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜索模板..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">所有分类</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* 内置模板 */}
        {builtInTemplates.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">内置模板</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {builtInTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400">模板预览</span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.features.slice(0, 3).map((feature, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                          {feature}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        switch (activeTab) {
                          case "webpage":
                            router.push(`/generate/webpage?template=${template.id}`)
                            break
                          case "poster":
                            router.push(`/generate/poster?template=${template.id}`)
                            break
                          case "ppt":
                            router.push(`/generate/ppt?template=${template.id}`)
                            break
                        }
                      }}
                      className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                      使用模板
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 自定义模板 */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">自定义模板</h2>
          {templates.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无自定义模板</h3>
              <p className="text-gray-600 mb-4">创建您的第一个自定义模板</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                创建模板
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400">自定义模板</span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <div className="flex items-center space-x-1">
                        <span className="text-yellow-400">★</span>
                        <span className="text-sm text-gray-600">{template.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-xs text-blue-600 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUseTemplate(template)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                      >
                        使用
                      </button>
                      <button
                        onClick={() => handleDuplicateTemplate(template.id)}
                        className="px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                      >
                        复制
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 创建模板模态框 */}
      {showCreateModal && (
        <CreateTemplateModal
          type={activeTab}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadTemplates()
          }}
        />
      )}
    </div>
  )
}

// 创建模板模态框组件
function CreateTemplateModal({
  type,
  onClose,
  onSuccess,
}: {
  type: "webpage" | "poster" | "ppt"
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    prompt: "",
    tags: "",
  })
  const [isGenerating, setIsGenerating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)

    try {
      const tags = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)

      await TemplateManager.generateTemplateFromPrompt(
        formData.prompt,
        type,
        "用户", // 这里可以替换为实际的用户名
      )

      onSuccess()
    } catch (error) {
      console.error("创建模板失败:", error)
      alert("创建模板失败，请稍后重试")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          创建{type === "webpage" ? "网页" : type === "poster" ? "海报" : "PPT"}模板
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">模板名称</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如：商务、创意、教育"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">AI生成提示</label>
            <textarea
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="描述您想要的模板特点和风格..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">标签（用逗号分隔）</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如：现代,简约,专业"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isGenerating ? "生成中..." : "创建模板"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
