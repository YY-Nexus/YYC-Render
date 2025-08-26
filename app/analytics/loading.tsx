export default function AnalyticsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div>
              <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="w-48 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 核心指标卡片骨架 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="w-16 h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* 图表区域骨架 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="flex-1 h-2 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-20 h-2 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 技能进度骨架 */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-12 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 月度趋势骨架 */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
                    <div className="flex-1 h-2 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-8 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
                    <div className="flex-1 h-2 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-8 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
