"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft, Share2, Moon, Calendar, Target, Lightbulb, Users } from "lucide-react"

export default function InteractiveWebpagePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const question = searchParams.get("q") || ""

  const strategies = [
    {
      icon: Target,
      title: "明确学习目标与内在动机",
      description: "坚持学习的关键在于内在动机。你需要不断反思学习的意义，找到学习的乐趣和价值。",
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: Calendar,
      title: "制定合理的学习计划与习惯",
      description: "坚持学习需要系统性和规律性。可以尝试将学习任务分解为小目标。",
      color: "bg-purple-100 text-purple-600",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-blue-700 rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-medium">智能学习的坚持之道</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-blue-700 rounded">
            <Moon className="w-5 h-5" />
          </button>
          <button className="px-3 py-1 bg-blue-700 rounded text-sm flex items-center gap-1">
            <Share2 className="w-4 h-4" />
            分享
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* 主标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">在智能学习的道路上坚持走下去</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">一个需要长期投入、心理调整和外部支持的系统性过程</p>
        </div>

        {/* 三大支柱 */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">长期投入</h3>
            <p className="text-gray-600">持续学习是关键</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">心理调整</h3>
            <p className="text-gray-600">保持积极心态</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">外部支持</h3>
            <p className="text-gray-600">建立支持系统</p>
          </div>
        </div>

        {/* 坚持时间线 */}
        <div className="bg-white rounded-2xl p-8 shadow-lg mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">你已经坚持了一年</h2>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-blue-600">坚持时间</span>
              <span className="text-lg font-bold text-blue-600">1年</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full w-full animate-pulse"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
            </div>
            <p className="text-gray-600 mt-4 leading-relaxed">
              这说明你具备一定的毅力和目标感，但面对身边人的反对态度，可能会对你的坚持产生一定影响。
              以下给合理搜索到的资料，从多个角度为你提供一些建议和方法。
            </p>
          </div>
        </div>

        {/* 七大策略 */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 bg-blue-600 rounded"></div>
            <h2 className="text-2xl font-bold text-gray-900">七大策略帮助你坚持学习</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {strategies.map((strategy, index) => (
              <div
                key={index}
                className="group hover:shadow-lg transition-all duration-300 rounded-xl p-6 border border-gray-100"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${strategy.color} group-hover:scale-110 transition-transform duration-300`}
                  >
                    <strategy.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {strategy.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">{strategy.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 更多策略提示 */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg text-center">
            <p className="text-blue-700 font-medium">还有5个策略等待展开...</p>
            <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              查看完整策略
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  )
}
