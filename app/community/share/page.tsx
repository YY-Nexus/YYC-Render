"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, MessageCircle, BookOpen, Brain, Award } from "lucide-react"
import { CollaborationManager } from "@/lib/collaboration"

export default function ShareContentPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    type: "question" as "question" | "answer" | "conversation" | "mindmap" | "learning_path",
    title: "",
    content: "",
    tags: [""],
    isPublic: true,
    difficulty: 3,
    estimatedTime: 30,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const contentTypes = [
    { value: "question", label: "问题", icon: MessageCircle, description: "分享学习中遇到的问题" },
    { value: "answer", label: "回答", icon: BookOpen, description: "分享知识和经验" },
    { value: "conversation", label: "对话", icon: MessageCircle, description: "分享AI对话记录" },
    { value: "mindmap", label: "思维导图", icon: Brain, description: "分享知识结构图" },
    { value: "learning_path", label: "学习路径", icon: Award, description: "分享学习计划" },
  ]

  const handleTagChange = (index: number, value: string) => {
    const newTags = [...formData.tags]
    newTags[index] = value
    setFormData({ ...formData, tags: newTags })
  }

  const addTag = () => {
    setFormData({
      ...formData,
      tags: [...formData.tags, ""],
    })
  }

  const removeTag = (index: number) => {
    const newTags = formData.tags.filter((_, i) => i !== index)
    setFormData({ ...formData, tags: newTags })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.content.trim()) return

    setIsSubmitting(true)

    try {
      const sharedContent = await CollaborationManager.shareContent(
        formData.type,
        formData.title,
        formData.content,
        formData.isPublic,
        formData.tags.filter((tag) => tag.trim()),
        {
          difficulty: formData.difficulty,
          estimatedTime: formData.estimatedTime,
        },
      )

      router.push(`/community/content/${sharedContent.id}`)
    } catch (error) {
      console.error("分享内容失败:", error)
      // 这里可以添加错误提示
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-medium">分享内容</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 内容类型选择 */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">选择内容类型</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contentTypes.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.type === type.value ? "border-primary bg-primary/5" : "border-gray-200 hover:border-primary"
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={type.value}
                    checked={formData.type === type.value}
                    onChange={() => setFormData({ ...formData, type: type.value })}
                    className="mt-1 text-primary focus:ring-primary"
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <type.icon className="w-5 h-5 text-primary" />
                      <span className="font-medium text-gray-900">{type.label}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 标题和内容 */}
          <div className="bg-white rounded-lg p-6 shadow-sm space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                标题
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
                placeholder="请输入标题..."
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                内容
              </label>
              <textarea
                id="content"
                rows="10"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
                placeholder="请输入内容..."
              />
            </div>
          </div>

          {/* 标签 */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">标签</h2>
            <p className="text-sm text-gray-500 mb-4">添加标签有助于其他人更容易找到你的内容</p>
            <div className="space-y-3">
              {formData.tags.map((tag, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => handleTagChange(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
                    placeholder="输入标签..."
                  />
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addTag} className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1">
                <i className="ri-add-circle-line"></i> 添加标签
              </button>
            </div>
          </div>

          {/* 选项设置 */}
          <div className="bg-white rounded-lg p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <label htmlFor="isPublic" className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={() => setFormData({ ...formData, isPublic: !formData.isPublic })}
                  className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">公开内容</span>
              </label>
              <p className="text-xs text-gray-500">
                {formData.isPublic ? "所有人可见" : "仅自己可见"}
              </p>
            </div>

            {formData.type !== "conversation" && (
              <div>
                <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
                  难度级别
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    id="difficulty"
                    min="1"
                    max="5"
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: Number(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <span className="text-sm font-medium text-gray-700 min-w-[40px]">
                    {["入门", "初级", "中级", "高级", "专家"][formData.difficulty - 1]}
                  </span>
                </div>
              </div>
            )}

            {formData.type === "learning_path" && (
              <div>
                <label htmlFor="estimatedTime" className="block text-sm font-medium text-gray-700 mb-1">
                  预计学习时间 (分钟)
                </label>
                <input
                  type="number"
                  id="estimatedTime"
                  min="5"
                  max="720"
                  value={formData.estimatedTime}
                  onChange={(e) => setFormData({ ...formData, estimatedTime: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
                />
              </div>
            )}
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <i className="ri-loader-2-line animate-spin"></i> 发布中...
                </>
              ) : (
                <>
                  <i className="ri-share-forward-line"></i> 发布内容
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
