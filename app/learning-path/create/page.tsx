"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Target, Clock, Star, Calendar, Plus, Trash2, BookOpen, FileText, Zap } from "lucide-react"
import { LearningPathManager } from "@/lib/learning-path"

export default function CreateLearningPathPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const concept = searchParams.get("concept") || ""

  const [formData, setFormData] = useState({
    title: concept ? `学习${concept}` : "",
    description: "",
    targetSkills: concept ? [concept] : [""],
    difficulty: 3 as 1 | 2 | 3 | 4 | 5,
    estimatedTime: 10,
    priority: "medium" as "low" | "medium" | "high",
    deadline: "",
  })

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSkillChange = (index: number, value: string) => {
    const newSkills = [...formData.targetSkills]
    newSkills[index] = value
    setFormData({ ...formData, targetSkills: newSkills })
  }

  const addSkill = () => {
    setFormData({
      ...formData,
      targetSkills: [...formData.targetSkills, ""],
    })
  }

  const removeSkill = (index: number) => {
    const newSkills = formData.targetSkills.filter((_, i) => i !== index)
    setFormData({ ...formData, targetSkills: newSkills })
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) return

    setIsSubmitting(true)

    try {
      // 创建学习目标
      const goal = LearningPathManager.createLearningGoal(
        formData.title,
        formData.description,
        formData.targetSkills.filter((skill) => skill.trim()),
        formData.difficulty,
        formData.estimatedTime,
        formData.priority,
        formData.deadline ? new Date(formData.deadline).getTime() : undefined,
      )

      // 生成学习路径
      const path = LearningPathManager.generateLearningPath(goal)

      // 跳转到学习路径详情页
      router.push(`/learning-path/${path.id}`)
    } catch (error) {
      console.error("创建学习路径失败:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getDifficultyLabel = (difficulty: number) => {
    const labels = ["", "入门", "初级", "中级", "高级", "专家"]
    return labels[difficulty]
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-700 border-green-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
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
          <h1 className="text-lg font-medium">创建学习路径</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">步骤 {currentStep}/3</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* 进度指示器 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step <= currentStep ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step}
                  </div>
                  <span className={`text-sm ${step <= currentStep ? "text-blue-600 font-medium" : "text-gray-500"}`}>
                    {step === 1 ? "基本信息" : step === 2 ? "学习目标" : "确认创建"}
                  </span>
                  {step < 3 && <div className="w-8 h-0.5 bg-gray-200 mx-2" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* 步骤1: 基本信息 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">设置学习路径基本信息</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">学习路径标题 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="例如：掌握React前端开发"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">详细描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="描述您的学习目标和期望达到的效果..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">难度等级</label>
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <label key={level} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="difficulty"
                          value={level}
                          checked={formData.difficulty === level}
                          onChange={(e) =>
                            setFormData({ ...formData, difficulty: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 })
                          }
                          className="text-blue-600"
                        />
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {Array.from({ length: level }, (_, i) => (
                              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            ))}
                            {Array.from({ length: 5 - level }, (_, i) => (
                              <Star key={i} className="w-4 h-4 text-gray-300" />
                            ))}
                          </div>
                          <span className="text-sm text-gray-700">{getDifficultyLabel(level)}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">预计学习时间</label>
                  <div className="space-y-3">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={formData.estimatedTime}
                      onChange={(e) => setFormData({ ...formData, estimatedTime: Number(e.target.value) })}
                      className="w-full"
                    />
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{formData.estimatedTime} 小时</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">优先级</label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value as "low" | "medium" | "high" })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="low">低优先级</option>
                    <option value="medium">中优先级</option>
                    <option value="high">高优先级</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">目标完成时间</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!formData.title.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一步
                </button>
              </div>
            </div>
          )}

          {/* 步骤2: 学习目标 */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">设置具体学习目标</h2>
                <p className="text-gray-600">添加您希望掌握的具体技能或知识点</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">目标技能/知识点</label>
                <div className="space-y-3">
                  {formData.targetSkills.map((skill, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={skill}
                          onChange={(e) => handleSkillChange(index, e.target.value)}
                          placeholder={`技能 ${index + 1}`}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      {formData.targetSkills.length > 1 && (
                        <button
                          onClick={() => removeSkill(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={addSkill}
                  className="mt-3 flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  添加技能
                </button>
              </div>

              {/* 预览卡片 */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-medium text-gray-900 mb-4">学习路径预览</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <span className="text-sm">基础概念学习 (约 {Math.round(formData.estimatedTime * 0.3)} 小时)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-green-600" />
                    <span className="text-sm">实践练习 (约 {Math.round(formData.estimatedTime * 0.4)} 小时)</span>
                  </div>
                  {formData.difficulty >= 3 && (
                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-purple-600" />
                      <span className="text-sm">进阶应用 (约 {Math.round(formData.estimatedTime * 0.2)} 小时)</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-orange-600" />
                    <span className="text-sm">复习与评估 (约 {Math.round(formData.estimatedTime * 0.1)} 小时)</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  上一步
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={formData.targetSkills.every((skill) => !skill.trim())}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一步
                </button>
              </div>
            </div>
          )}

          {/* 步骤3: 确认创建 */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">确认学习路径信息</h2>
                <p className="text-gray-600">请检查以下信息，确认无误后创建学习路径</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">{formData.title}</h3>
                  {formData.description && <p className="text-gray-600 text-sm">{formData.description}</p>}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      {Array.from({ length: formData.difficulty }, (_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">难度等级</span>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{formData.estimatedTime}h</div>
                    <span className="text-xs text-gray-500">预计时间</span>
                  </div>
                  <div className="text-center">
                    <div
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                        formData.priority,
                      )}`}
                    >
                      {formData.priority === "high" ? "高" : formData.priority === "medium" ? "中" : "低"}优先级
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{formData.targetSkills.length}</div>
                    <span className="text-xs text-gray-500">学习目标</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">学习目标：</h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.targetSkills
                      .filter((skill) => skill.trim())
                      .map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                  </div>
                </div>

                {formData.deadline && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">目标完成时间：</h4>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(formData.deadline).toLocaleDateString("zh-CN")}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  上一步
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      创建中...
                    </>
                  ) : (
                    "创建学习路径"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
