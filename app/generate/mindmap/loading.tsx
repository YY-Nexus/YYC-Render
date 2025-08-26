export default function GenerateMindMapLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">正在生成思维导图</h2>
        <p className="text-gray-600">AI正在分析内容结构...</p>

        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <span>分析关键概念</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
            <span>构建知识结构</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
            <span>生成可视化图表</span>
          </div>
        </div>
      </div>
    </div>
  )
}
