export default function GeneratePosterLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto">
              <div className="absolute inset-0 border-4 border-green-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-green-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-800 mb-2">正在设计海报...</h2>
          <p className="text-gray-600 text-sm mb-6">AI正在根据您的需求创作专业海报设计</p>

          <div className="space-y-3 text-left bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">分析设计需求</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-700">选择配色方案</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <span className="text-sm text-gray-500">布局设计元素</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <span className="text-sm text-gray-500">生成最终作品</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
