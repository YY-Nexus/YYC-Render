"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Settings,
  Palette,
  Eye,
  Hand,
  Mic,
  Moon,
  Sun,
  Monitor,
  Globe,
  Shield,
  Database,
  Trash2,
  Download,
  Upload,
} from "lucide-react"
import { gestureUtils, voiceUtils } from "@/lib/utils"

interface SettingsState {
  // 交互设置
  voiceEnabled: boolean
  gestureEnabled: boolean
  eyeTrackingEnabled: boolean
  hapticFeedback: boolean
  voiceVolume: number
  gestureSensitivity: number

  // 界面设置
  theme: "light" | "dark" | "auto"
  language: "zh-CN" | "en-US"
  fontSize: "small" | "medium" | "large"
  animationSpeed: "slow" | "normal" | "fast"

  // 隐私设置
  dataCollection: boolean
  personalizedRecommendations: boolean
  voiceDataStorage: boolean
  analyticsEnabled: boolean

  // 高级设置
  autoSave: boolean
  offlineMode: boolean
  debugMode: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<SettingsState>({
    // 交互设置
    voiceEnabled: true,
    gestureEnabled: true,
    eyeTrackingEnabled: true,
    hapticFeedback: true,
    voiceVolume: 80,
    gestureSensitivity: 70,

    // 界面设置
    theme: "dark",
    language: "zh-CN",
    fontSize: "medium",
    animationSpeed: "normal",

    // 隐私设置
    dataCollection: true,
    personalizedRecommendations: true,
    voiceDataStorage: false,
    analyticsEnabled: true,

    // 高级设置
    autoSave: true,
    offlineMode: false,
    debugMode: false,
  })

  const [activeSection, setActiveSection] = useState<"interaction" | "interface" | "privacy" | "advanced">(
    "interaction",
  )
  const [isListening, setIsListening] = useState(false)
  const [gestureMode, setGestureMode] = useState<"idle" | "swipe">("idle")
  const [hasChanges, setHasChanges] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)

  // 监听设置变化
  useEffect(() => {
    setHasChanges(true)
  }, [settings])

  // 手势控制
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let startX = 0,
      startY = 0
    let isPointerDown = false

    const handlePointerDown = (e: PointerEvent) => {
      isPointerDown = true
      startX = e.clientX
      startY = e.clientY
      setGestureMode("swipe")
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return

      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY

      if (Math.abs(deltaX) > 100) {
        if (deltaX > 0) {
          // 右滑返回
          router.back()
          isPointerDown = false
        }
      }

      if (Math.abs(deltaY) > 100) {
        const sections = ["interaction", "interface", "privacy", "advanced"]
        const currentIndex = sections.indexOf(activeSection)

        if (deltaY > 0 && currentIndex > 0) {
          // 下滑 - 上一个部分
          setActiveSection(sections[currentIndex - 1] as any)
        } else if (deltaY < 0 && currentIndex < sections.length - 1) {
          // 上滑 - 下一个部分
          setActiveSection(sections[currentIndex + 1] as any)
        }
        isPointerDown = false
      }
    }

    const handlePointerUp = () => {
      isPointerDown = false
      setTimeout(() => setGestureMode("idle"), 300)
    }

    container.addEventListener("pointerdown", handlePointerDown)
    container.addEventListener("pointermove", handlePointerMove)
    container.addEventListener("pointerup", handlePointerUp)

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown)
      container.removeEventListener("pointermove", handlePointerMove)
      container.removeEventListener("pointerup", handlePointerUp)
    }
  }, [activeSection, router])

  // 语音控制
  useEffect(() => {
    if (!settings.voiceEnabled) return

    const recognition = voiceUtils.initSpeechRecognition(
      (transcript) => {
        const command = transcript.toLowerCase()

        if (command.includes("交互设置")) {
          setActiveSection("interaction")
        } else if (command.includes("界面设置")) {
          setActiveSection("interface")
        } else if (command.includes("隐私设置")) {
          setActiveSection("privacy")
        } else if (command.includes("高级设置")) {
          setActiveSection("advanced")
        } else if (command.includes("保存设置")) {
          saveSettings()
        } else if (command.includes("返回")) {
          router.back()
        }
      },
      () => setIsListening(true),
      () => setIsListening(false),
    )

    recognition?.start()
    return () => recognition?.stop()
  }, [settings.voiceEnabled, router])

  // 更新设置
  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))

    // 触觉反馈
    if (settings.hapticFeedback) {
      gestureUtils.hapticFeedback(50)
    }
  }

  // 保存设置
  const saveSettings = () => {
    localStorage.setItem("yyc-ai-settings", JSON.stringify(settings))
    setHasChanges(false)

    if (settings.hapticFeedback) {
      gestureUtils.hapticFeedback([100, 50, 100])
    }

    voiceUtils.speak("设置已保存")
  }

  // 重置设置
  const resetSettings = () => {
    const defaultSettings: SettingsState = {
      voiceEnabled: true,
      gestureEnabled: true,
      eyeTrackingEnabled: true,
      hapticFeedback: true,
      voiceVolume: 80,
      gestureSensitivity: 70,
      theme: "dark",
      language: "zh-CN",
      fontSize: "medium",
      animationSpeed: "normal",
      dataCollection: true,
      personalizedRecommendations: true,
      voiceDataStorage: false,
      analyticsEnabled: true,
      autoSave: true,
      offlineMode: false,
      debugMode: false,
    }

    setSettings(defaultSettings)

    if (settings.hapticFeedback) {
      gestureUtils.hapticFeedback([100, 100, 100])
    }
  }

  // 导出设置
  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "yyc-ai-settings.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  // 导入设置
  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string)
        setSettings(importedSettings)
        voiceUtils.speak("设置导入成功")
      } catch (error) {
        voiceUtils.speak("设置导入失败")
      }
    }
    reader.readAsText(file)
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 顶部工具栏 */}
      <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center space-x-3">
              <Settings className="w-8 h-8 text-purple-400" />
              <h1 className="text-xl font-bold text-white">设置中心</h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {hasChanges && (
              <button
                onClick={saveSettings}
                className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 rounded-lg text-green-400 text-sm transition-colors"
              >
                保存更改
              </button>
            )}

            <button
              onClick={resetSettings}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-lg text-red-400 text-sm transition-colors"
            >
              重置
            </button>
          </div>
        </div>

        {/* 导航标签 */}
        <div className="flex space-x-1 mt-4 bg-white/5 rounded-lg p-1">
          {[
            { key: "interaction", label: "交互", icon: Hand },
            { key: "interface", label: "界面", icon: Palette },
            { key: "privacy", label: "隐私", icon: Shield },
            { key: "advanced", label: "高级", icon: Settings },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key as any)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeSection === key
                  ? "bg-purple-500/20 text-purple-400 border border-purple-400/30"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 设置内容 */}
      <div className="px-6 py-6">
        {/* 交互设置 */}
        {activeSection === "interaction" && (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                <Mic className="w-5 h-5 mr-2 text-blue-400" />
                语音交互
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">启用语音控制</span>
                  <button
                    onClick={() => updateSetting("voiceEnabled", !settings.voiceEnabled)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      settings.voiceEnabled ? "bg-green-500" : "bg-gray-600"
                    }`}
                  >
                    <div
                      className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                        settings.voiceEnabled ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">语音音量</span>
                    <span className="text-purple-400">{settings.voiceVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.voiceVolume}
                    onChange={(e) => updateSetting("voiceVolume", Number.parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                <Hand className="w-5 h-5 mr-2 text-green-400" />
                手势控制
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">启用手势识别</span>
                  <button
                    onClick={() => updateSetting("gestureEnabled", !settings.gestureEnabled)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      settings.gestureEnabled ? "bg-green-500" : "bg-gray-600"
                    }`}
                  >
                    <div
                      className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                        settings.gestureEnabled ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">手势灵敏度</span>
                    <span className="text-green-400">{settings.gestureSensitivity}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={settings.gestureSensitivity}
                    onChange={(e) => updateSetting("gestureSensitivity", Number.parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                <Eye className="w-5 h-5 mr-2 text-orange-400" />
                其他交互
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">眼动追踪</span>
                  <button
                    onClick={() => updateSetting("eyeTrackingEnabled", !settings.eyeTrackingEnabled)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      settings.eyeTrackingEnabled ? "bg-green-500" : "bg-gray-600"
                    }`}
                  >
                    <div
                      className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                        settings.eyeTrackingEnabled ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">触觉反馈</span>
                  <button
                    onClick={() => updateSetting("hapticFeedback", !settings.hapticFeedback)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      settings.hapticFeedback ? "bg-green-500" : "bg-gray-600"
                    }`}
                  >
                    <div
                      className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                        settings.hapticFeedback ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 界面设置 */}
        {activeSection === "interface" && (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                <Palette className="w-5 h-5 mr-2 text-purple-400" />
                主题外观
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">主题模式</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "light", label: "浅色", icon: Sun },
                      { key: "dark", label: "深色", icon: Moon },
                      { key: "auto", label: "自动", icon: Monitor },
                    ].map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => updateSetting("theme", key as any)}
                        className={`flex items-center justify-center space-x-2 p-3 rounded-lg transition-colors ${
                          settings.theme === key
                            ? "bg-purple-500/20 text-purple-400 border border-purple-400/30"
                            : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">字体大小</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "small", label: "小" },
                      { key: "medium", label: "中" },
                      { key: "large", label: "大" },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => updateSetting("fontSize", key as any)}
                        className={`p-3 rounded-lg transition-colors ${
                          settings.fontSize === key
                            ? "bg-purple-500/20 text-purple-400 border border-purple-400/30"
                            : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <span className={`${key === "small" ? "text-sm" : key === "large" ? "text-lg" : "text-base"}`}>
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">动画速度</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "slow", label: "慢速" },
                      { key: "normal", label: "正常" },
                      { key: "fast", label: "快速" },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => updateSetting("animationSpeed", key as any)}
                        className={`p-3 rounded-lg transition-colors ${
                          settings.animationSpeed === key
                            ? "bg-purple-500/20 text-purple-400 border border-purple-400/30"
                            : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <span className="text-sm">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                <Globe className="w-5 h-5 mr-2 text-blue-400" />
                语言设置
              </h3>

              <div>
                <label className="block text-gray-300 mb-2">界面语言</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "zh-CN", label: "简体中文" },
                    { key: "en-US", label: "English" },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => updateSetting("language", key as any)}
                      className={`p-3 rounded-lg transition-colors ${
                        settings.language === key
                          ? "bg-blue-500/20 text-blue-400 border border-blue-400/30"
                          : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className="text-sm">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 隐私设置 */}
        {activeSection === "privacy" && (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-green-400" />
                数据隐私
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-gray-300 block">数据收集</span>
                    <span className="text-sm text-gray-400">允许收集使用数据以改进服务</span>
                  </div>
                  <button
                    onClick={() => updateSetting("dataCollection", !settings.dataCollection)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      settings.dataCollection ? "bg-green-500" : "bg-gray-600"
                    }`}
                  >
                    <div
                      className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                        settings.dataCollection ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-gray-300 block">个性化推荐</span>
                    <span className="text-sm text-gray-400">基于使用习惯提供个性化内容</span>
                  </div>
                  <button
                    onClick={() => updateSetting("personalizedRecommendations", !settings.personalizedRecommendations)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      settings.personalizedRecommendations ? "bg-green-500" : "bg-gray-600"
                    }`}
                  >
                    <div
                      className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                        settings.personalizedRecommendations ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-gray-300 block">语音数据存储</span>
                    <span className="text-sm text-gray-400">本地存储语音数据用于改进识别</span>
                  </div>
                  <button
                    onClick={() => updateSetting("voiceDataStorage", !settings.voiceDataStorage)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      settings.voiceDataStorage ? "bg-green-500" : "bg-gray-600"
                    }`}
                  >
                    <div
                      className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                        settings.voiceDataStorage ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-gray-300 block">使用分析</span>
                    <span className="text-sm text-gray-400">发送匿名使用统计数据</span>
                  </div>
                  <button
                    onClick={() => updateSetting("analyticsEnabled", !settings.analyticsEnabled)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      settings.analyticsEnabled ? "bg-green-500" : "bg-gray-600"
                    }`}
                  >
                    <div
                      className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                        settings.analyticsEnabled ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                <Trash2 className="w-5 h-5 mr-2 text-red-400" />
                数据管理
              </h3>

              <div className="space-y-3">
                <button className="w-full p-3 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-lg text-red-400 text-sm transition-colors">
                  清除所有历史记录
                </button>
                <button className="w-full p-3 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-lg text-red-400 text-sm transition-colors">
                  清除语音数据
                </button>
                <button className="w-full p-3 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-lg text-red-400 text-sm transition-colors">
                  重置所有数据
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 高级设置 */}
        {activeSection === "advanced" && (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                <Database className="w-5 h-5 mr-2 text-blue-400" />
                系统设置
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-gray-300 block">自动保存</span>
                    <span className="text-sm text-gray-400">自动保存用户数据和设置</span>
                  </div>
                  <button
                    onClick={() => updateSetting("autoSave", !settings.autoSave)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      settings.autoSave ? "bg-green-500" : "bg-gray-600"
                    }`}
                  >
                    <div
                      className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                        settings.autoSave ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-gray-300 block">离线模式</span>
                    <span className="text-sm text-gray-400">启用离线功能支持</span>
                  </div>
                  <button
                    onClick={() => updateSetting("offlineMode", !settings.offlineMode)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      settings.offlineMode ? "bg-green-500" : "bg-gray-600"
                    }`}
                  >
                    <div
                      className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                        settings.offlineMode ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-gray-300 block">调试模式</span>
                    <span className="text-sm text-gray-400">显示详细的调试信息</span>
                  </div>
                  <button
                    onClick={() => updateSetting("debugMode", !settings.debugMode)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      settings.debugMode ? "bg-green-500" : "bg-gray-600"
                    }`}
                  >
                    <div
                      className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                        settings.debugMode ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2 text-green-400" />
                设置备份
              </h3>

              <div className="space-y-3">
                <button
                  onClick={exportSettings}
                  className="w-full flex items-center justify-center space-x-2 p-3 bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 rounded-lg text-green-400 text-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>导出设置</span>
                </button>

                <label className="w-full flex items-center justify-center space-x-2 p-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg text-blue-400 text-sm transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>导入设置</span>
                  <input type="file" accept=".json" onChange={importSettings} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 状态指示器 */}
      <div className="fixed bottom-8 right-8 flex flex-col space-y-2">
        {isListening && (
          <div className="bg-red-500/20 backdrop-blur-sm rounded-full p-3 border border-red-400/30">
            <Mic className="w-5 h-5 text-red-400 animate-pulse" />
          </div>
        )}
        {gestureMode !== "idle" && (
          <div className="bg-blue-500/20 backdrop-blur-sm rounded-full p-3 border border-blue-400/30">
            <Hand className="w-5 h-5 text-blue-400" />
          </div>
        )}
      </div>

      {/* 交互提示 */}
      <div className="fixed bottom-8 left-8 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 p-4">
        <div className="text-white text-sm space-y-1">
          <p>👆 右滑: 返回上页</p>
          <p>📱 上下滑动: 切换设置分类</p>
          <p>🗣️ 语音: "交互设置"、"保存设置"</p>
          <p>⚙️ 实时保存: 更改即时生效</p>
        </div>
      </div>
    </div>
  )
}
