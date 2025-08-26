export default function LearningLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航骨架 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
              <div className="w-24 h-6 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-32 h-9 bg-gray-200 rounded animate-pulse" />
              <div className="w-24 h-9 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 统计卡片骨架 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="w-12 h-8 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* 目标卡片骨架 */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
            <div className="w-32 h-6 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
              <div className="w-8 h-4 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="w-full h-2 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        {/* 标签页骨架 */}
        <div className="space-y-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex-1 h-10 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>

          {/* 搜索筛选骨架 */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse" />
              <div className="w-48 h-10 bg-gray-200 rounded animate-pulse" />
              <div className="w-32 h-10 bg-gray-200 rounded animate-pulse" />
              <div className="w-32 h-10 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>

          {/* 学习路径卡片骨架 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 space-y-2">
                      <div className="w-3/4 h-6 bg-gray-200 rounded animate-pulse" />
                      <div className="w-full h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="w-2/3 h-4 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="w-12 h-6 bg-gray-200 rounded animate-pulse" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-4">
                        <div className="w-12 h-4 bg-gray-200 rounded animate-pulse" />
                        <div className="w-12 h-4 bg-gray-200 rounded animate-pulse" />
                      </div>
                      <div className="w-8 h-4 bg-gray-200 rounded animate-pulse" />
                    </div>

                    <div className="flex space-x-1">
                      {[...Array(3)].map((_, j) => (
                        <div key={j} className="w-12 h-6 bg-gray-200 rounded animate-pulse" />
                      ))}
                    </div>

                    <div className="flex space-x-2">
                      <div className="flex-1 h-9 bg-gray-200 rounded animate-pulse" />
                      <div className="w-9 h-9 bg-gray-200 rounded animate-pulse" />
                    </div>
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
