"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Share2,
  Settings,
  Volume2,
  Camera,
  Mail,
  GraduationCap,
  Grid3X3,
  Globe,
  FileImage,
  Presentation,
  Building,
  User,
  ChevronDown,
  Send,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Star,
  Brain,
  Lightbulb,
} from "lucide-react"
import { FavoritesManager } from "@/lib/favorites"
import { RatingsManager } from "@/lib/ratings"
import { RecommendationEngine, type RecommendationItem } from "@/lib/recommendations"

export default function ResultsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const question = searchParams.get("q") || ""

  const [isFavorited, setIsFavorited] = useState(false)
  const [currentRating, setCurrentRating] = useState<"like" | "dislike" | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackText, setFeedbackText] = useState("")
  const [showFavoriteSuccess, setShowFavoriteSuccess] = useState(false)
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([])

  // 模拟AI回答数据
  const mockAnswer = {
    question: question,
    summary:
      "在智能学习的道路上坚持下去，是一个需要长期投入、心理调整和策略支持的过程。你已经坚持了一年，说明你具备一定的毅力和学习能力，但面对身边人的反对态度，可能会对你的坚持产生一定影响。以下是一些帮助你在智能学习的道路上继续前行的建议：",
    sections: [
      {
        title: "1. 找到学习的乐趣与意义",
        content:
          "学习不应只是枯燥的任务，而应是一个充满乐趣和挑战的过程。你可以尝试不同的学习方式，比如通过阅读、观看视频、参与讨论等方式来学习，让学习变得更加生动有趣。同时，要明确学习的意义，认识到学习能为你带来哪些实际的好处，比如提升技能、拓宽视野、增强竞争力等。只有当你深刻体会到学习的价值，才能真正从内心深处坚持下去的动力。",
      },
      {
        title: "2. 保持积极的心态",
        content:
          "面对他人的反对态度，最重要的是保持冷静和理性，不要因为别人的看法而动摇自己的信念。在面对不同意见时，要以谦逊和包容的态度去回应，而不是用激烈的言辞去反驳。你可以选择不与他人争论，而是专注于自己的目标和成长。正如一位朋友的经历所示，坚持学习的人往往能够克服困难，最终取得成功。",
      },
      {
        title: "3. 制定合理的计划并坚持执行",
        content:
          "制定一个可行的学习计划，并坚定不移地执行下去，是坚持学习的关键。你可以将学习目标分为多个阶段，每个阶段设定具体的目标和时间节点，这样可以让学习过程更加有条理和可控。同时，要学会调整计划，根据实际情况灵活应对，避免因为过于严格的计划而产生挫败感。",
      },
    ],
    sources: [
      { title: "维持智慧知识体系", count: 30 },
      { title: "为什么坚持学习？", count: null },
      { title: "为什么坚持不下去，那是因为生活未来你输入无用", count: null },
    ],
    relatedQuestions: ["你的学习方法未必正确", "面对反对和道德的态度"],
  }

  const fullAnswer = `${mockAnswer.summary}\n\n${mockAnswer.sections.map((section) => `${section.title}\n${section.content}`).join("\n\n")}`

  const handleFavorite = () => {
    if (isFavorited) {
      // 取消收藏
      const favorite = FavoritesManager.getFavoriteByQuestion(question)
      if (favorite) {
        FavoritesManager.removeFavorite(favorite.id)
      }
      setIsFavorited(false)
    } else {
      // 添加收藏
      FavoritesManager.addFavorite(question, fullAnswer, currentRating || undefined)
      setIsFavorited(true)
      setShowFavoriteSuccess(true)
      setTimeout(() => setShowFavoriteSuccess(false), 2000)
    }
  }

  const handleRating = (rating: "like" | "dislike") => {
    setCurrentRating(rating)
    RatingsManager.addRating(question, rating, feedbackText || undefined)

    if (rating === "dislike") {
      setShowFeedback(true)
    } else {
      setShowFeedback(false)
    }

    // 如果已收藏，更新收藏中的评价
    if (isFavorited) {
      const favorite = FavoritesManager.getFavoriteByQuestion(question)
      if (favorite) {
        FavoritesManager.updateFavorite(favorite.id, { rating })
      }
    }

    // 重新生成推荐
    loadRecommendations()
  }

  const handleFeedbackSubmit = () => {
    if (currentRating) {
      RatingsManager.addRating(question, currentRating, feedbackText)
      setShowFeedback(false)
      setFeedbackText("")
    }
  }

  const handleRecommendationClick = (recommendedQuestion: string) => {
    router.push(`/thinking?q=${encodeURIComponent(recommendedQuestion)}`)
  }

  const loadRecommendations = () => {
    const recs = RecommendationEngine.generateRecommendations(question, 6)
    setRecommendations(recs)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "similar":
        return <Star className="w-4 h-4" />
      case "personalized":
        return <Heart className="w-4 h-4" />
      case "related":
        return <Lightbulb className="w-4 h-4" />
      default:
        return <Brain className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "similar":
        return "bg-yellow-100 text-yellow-700"
      case "personalized":
        return "bg-pink-100 text-pink-700"
      case "related":
        return "bg-green-100 text-green-700"
      default:
        return "bg-blue-100 text-blue-700"
    }
  }

  useEffect(() => {
    // 检查是否已收藏
    setIsFavorited(FavoritesManager.isFavorited(question))

    // 检查是否已评价
    const rating = RatingsManager.getRating(question)
    if (rating) {
      setCurrentRating(rating.rating)
      setFeedbackText(rating.feedback || "")
    }

    // 加载推荐
    loadRecommendations()
  }, [question])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 收藏成功提示 */}
      {showFavoriteSuccess && (
        <div className="fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-slide-in">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            <span>已添加到收藏夹</span>
          </div>
        </div>
      )}

      {/* 顶部导航栏 */}
      <header className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-blue-700 rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-medium">智能AI搜索 - {question.slice(0, 30)}...</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-blue-700 rounded">
            <Settings className="w-5 h-5" />
          </button>
          <button className="px-3 py-1 bg-blue-700 rounded text-sm flex items-center gap-1">
            <Share2 className="w-4 h-4" />
            分享
          </button>
        </div>
      </header>

      <div className="flex">
        {/* 左侧菜单 */}
        <aside className="hidden lg:block w-16 bg-white border-r border-gray-200 min-h-screen">
          <nav className="flex flex-col items-center py-4 space-y-6">
            <button className="p-3 text-blue-600 hover:bg-blue-50 rounded-lg">
              <Volume2 className="w-6 h-6" />
            </button>
            <button className="p-3 text-gray-600 hover:bg-gray-50 rounded-lg">
              <Camera className="w-6 h-6" />
            </button>
            <button className="p-3 text-gray-600 hover:bg-gray-50 rounded-lg">
              <Mail className="w-6 h-6" />
            </button>
            <button className="p-3 text-gray-600 hover:bg-gray-50 rounded-lg">
              <Settings className="w-6 h-6" />
            </button>
            <button className="p-3 text-gray-600 hover:bg-gray-50 rounded-lg">
              <GraduationCap className="w-6 h-6" />
            </button>
            <button className="p-3 text-gray-600 hover:bg-gray-50 rounded-lg">
              <Grid3X3 className="w-6 h-6" />
            </button>
            <button className="p-3 text-gray-600 hover:bg-gray-50 rounded-lg">
              <Globe className="w-6 h-6" />
            </button>
          </nav>
        </aside>

        {/* 主内容区域 */}
        <main className="flex-1 max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-6">
          {/* 问题标题 */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 leading-relaxed mb-4">{question}</h1>

            {/* 搜索类型标签 */}
            <div className="flex items-center gap-4 text-sm">
              <button className="text-blue-600 border-b-2 border-blue-600 pb-1">全网</button>
              <button className="text-gray-600 hover:text-blue-600">文库</button>
              <button className="text-gray-600 hover:text-blue-600">学术</button>
              <button className="text-gray-600 hover:text-blue-600">图片</button>
              <button className="text-gray-600 hover:text-blue-600">视频</button>
              <button className="text-gray-600 hover:text-blue-600">播客</button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* 左侧主要内容 */}
            <div className="flex-1">
              {/* 操作按钮区域 */}
              <div className="mb-6 flex items-center justify-between">
                <button className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg">
                  <Volume2 className="w-4 h-4" />
                  <span className="text-sm">听讲解</span>
                </button>

                {/* 评价和收藏按钮 */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => handleRating("like")}
                      className={`p-2 rounded-md transition-colors ${
                        currentRating === "like" ? "bg-green-500 text-white" : "hover:bg-green-100 text-gray-600"
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRating("dislike")}
                      className={`p-2 rounded-md transition-colors ${
                        currentRating === "dislike" ? "bg-red-500 text-white" : "hover:bg-red-100 text-gray-600"
                      }`}
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={handleFavorite}
                    className={`p-2 rounded-lg transition-colors ${
                      isFavorited ? "bg-yellow-500 text-white" : "bg-gray-100 hover:bg-yellow-100 text-gray-600"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`} />
                  </button>
                </div>
              </div>

              {/* 反馈输入框 */}
              {showFeedback && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="text-sm font-medium text-red-800 mb-2">帮助我们改进</h3>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="请告诉我们哪里需要改进..."
                    className="w-full p-3 border border-red-300 rounded-lg resize-none focus:outline-none focus:border-red-500"
                    rows={3}
                  />
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={handleFeedbackSubmit}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      提交反馈
                    </button>
                    <button
                      onClick={() => setShowFeedback(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}

              {/* 回答内容 */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <p className="text-gray-800 leading-relaxed mb-6">{mockAnswer.summary}</p>

                {/* 详细回答部分 */}
                <div className="space-y-6">
                  {mockAnswer.sections.map((section, index) => (
                    <div key={index}>
                      <h2 className="text-lg font-semibold text-gray-900 mb-3">{section.title}</h2>
                      <p className="text-gray-700 leading-relaxed">{section.content}</p>
                    </div>
                  ))}
                </div>

                {/* 功能按钮区域 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-4">
                  <button
                    onClick={() => router.push(`/generate/webpage?q=${encodeURIComponent(question)}`)}
                    className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <Globe className="w-5 h-5" />
                    <span>互动网页</span>
                  </button>
                  <button
                    onClick={() => router.push(`/generate/poster?q=${encodeURIComponent(question)}`)}
                    className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <FileImage className="w-5 h-5" />
                    <span>展示海报</span>
                  </button>
                  <button
                    onClick={() => router.push(`/generate/ppt?q=${encodeURIComponent(question)}`)}
                    className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <Presentation className="w-5 h-5" />
                    <span>转PPT</span>
                  </button>
                  <button
                    onClick={() => router.push(`/generate/mindmap?q=${encodeURIComponent(question)}`)}
                    className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Brain className="w-5 h-5" />
                    <span>思维导图</span>
                  </button>
                </div>

                {/* 继续追问输入框 */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="继续追问..."
                      className="flex-1 px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                    <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* 相关组织折叠区域 */}
                <div className="mt-6 bg-white rounded-lg border">
                  <button className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <Building className="w-5 h-5 text-gray-600" />
                      <span className="font-medium">相关组织</span>
                    </div>
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </button>
                  <div className="border-t">
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-sm font-medium text-gray-700">组织名称</div>
                        <div className="text-sm font-medium text-gray-700">概述</div>
                        <div className="text-sm text-gray-600">娃哈哈集团</div>
                        <div className="text-sm text-gray-600">
                          食品/饮料 一家中国知名的饮料和食品公司，由宗庆后创立。
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 相关人物折叠区域 */}
                <div className="mt-4 bg-white rounded-lg border">
                  <button className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-gray-600" />
                      <span className="font-medium">相关人物</span>
                    </div>
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* 右侧边栏 */}
            <aside className="w-full lg:w-80 mt-6 lg:mt-0">
              {/* 来源 */}
              <div className="bg-white rounded-lg p-4 mb-6 border">
                <h3 className="font-medium text-gray-900 mb-3">信息来源</h3>
                <div className="space-y-2">
                  {mockAnswer.sources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <a href="#" className="text-blue-600 hover:underline text-sm">
                        {source.title}
                      </a>
                      {source.count !== null && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {source.count}篇
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <button className="mt-3 text-sm text-blue-600 hover:underline">查看更多来源</button>
              </div>

              {/* 相关问题 */}
              <div className="bg-white rounded-lg p-4 mb-6 border">
                <h3 className="font-medium text-gray-900 mb-3">相关问题</h3>
                <div className="space-y-3">
                  {mockAnswer.relatedQuestions.map((question, index) => (
                    <a
                      href={`/thinking?q=${encodeURIComponent(question)}`}
                      key={index}
                      className="block text-sm text-gray-700 hover:text-blue-600 hover:underline"
                    >
                      {question}
                    </a>
                  ))}
                </div>
              </div>

              {/* 推荐问题 */}
              <div className="bg-white rounded-lg p-4 border">
                <h3 className="font-medium text-gray-900 mb-3">为您推荐</h3>
                <div className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="border-b border-gray-100 pb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`${getCategoryColor(rec.category)} text-xs px-2 py-0.5 rounded-full`}>
                          {getCategoryIcon(rec.category)} {rec.category}
                        </span>
                      </div>
                      <a
                        href={`/thinking?q=${encodeURIComponent(rec.question)}`}
                        className="text-sm text-gray-800 hover:text-blue-600 hover:underline"
                        onClick={() => handleRecommendationClick(rec.question)}
                      >
                        {rec.question}
                      </a>
                    </div>
                  ))}
                </div>
                <button className="mt-3 text-sm text-blue-600 hover:underline">获取更多推荐</button>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}
