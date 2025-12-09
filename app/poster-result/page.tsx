"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft, Share2, Download, Settings } from "lucide-react"

export default function PosterResultPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const question = searchParams.get("q") || ""

  const posterContent = {
    title: "智能学习的坚持之道",
    subtitle: "EDITION SPECIAL",
    description: "在数字时代，如何保持学习的动力与热情",
    quote: "学习是一个探索的过程，充满惊喜和发现。坚持下去，需要内在动机、系统规划和积极心态的完美融合。",
    strategies: [
      {
        number: "1",
        title: "明确内在动机",
        description: "认清学习带来的美好体验，将学习转化为生活方式，而非短期任务。兴趣是坚持的天然催化剂。",
      },
      {
        number: "2",
        title: "制定合理计划",
        description: "将大目标分解为小任务，形成每天进步1%的微习惯破解路径，减轻压力，建立正向反馈。",
      },
      {
        number: "3",
        title: "应对外界反对",
        description: "保持谦和态度，不陷入无意义争论，远离意志不坚定的人，寻找志同道合的学习伙伴。",
      },
      {
        number: "4",
        title: "保持积极心态",
        description: "通过记录进展、设定小目标、适当奖励等方式增强自信心，让大脑支持自己的学习行为。",
      },
      {
        number: "5",
        title: "利用外部资源",
        description: "尝试不同学习方法，利用在线课程、学习社群等资源，丰富学习体验，增加趣味性。",
      },
    ],
  }

  return (
    <div className="min-h-screen bg-black">
      {/* 顶部导航栏 */}
      <header className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-medium">展示海报</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-800 rounded">
            <Settings className="w-5 h-5" />
          </button>
          <button className="px-3 py-1 bg-blue-600 rounded text-sm flex items-center gap-1">
            <Share2 className="w-4 h-4" />
            分享
          </button>
          <button className="px-3 py-1 bg-green-600 rounded text-sm flex items-center gap-1">
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>
      </header>

      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-8">
        {/* 海报主体 */}
        <div className="w-full max-w-4xl bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-2xl p-12 text-white shadow-2xl">
          {/* 头部 */}
          <div className="text-center mb-8">
            <div className="text-sm font-light tracking-widest text-purple-200 mb-2">{posterContent.subtitle}</div>
            <h1 className="text-4xl font-bold mb-4">{posterContent.title}</h1>
            <p className="text-lg text-purple-100 max-w-2xl mx-auto">{posterContent.description}</p>
          </div>

          {/* 引言卡片 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/20">
            <p className="text-lg leading-relaxed italic">{posterContent.quote}</p>
          </div>

          {/* 策略列表 */}
          <div className="space-y-4">
            {posterContent.strategies.map((strategy, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-lg border-l-4 border-cyan-400 hover:bg-white/10 transition-all duration-300"
              >
                <div className="w-8 h-8 bg-cyan-400 text-black rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {strategy.number}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2 text-cyan-100">{strategy.title}</h3>
                  <p className="text-purple-100 leading-relaxed">{strategy.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 底部装饰 */}
          <div className="mt-8 pt-6 border-t border-white/20 text-center">
            <div className="flex items-center justify-center gap-2 text-purple-200">
              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
              <span className="text-sm">持续学习，成就更好的自己</span>
              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
