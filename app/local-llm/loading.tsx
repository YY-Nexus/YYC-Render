export default function LocalLLMLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="animate-pulse">
        {/* 顶部导航栏骨架 */}
        <div className="bg-white border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-gray-300 rounded"></div>
            <div className="w-5 h-5 bg-gray-300 rounded"></div>
            <div className="w-32 h-5 bg-gray-300 rounded"></div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* 概览卡片骨架 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="w-16 h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="w-8 h-6 bg-gray-300 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 提供商列表骨架 */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b">
              <div className="w-24 h-5 bg-gray-300 rounded"></div>
            </div>

            <div className="divide-y">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                      <div className="w-24 h-5 bg-gray-300 rounded"></div>
                      <div className="w-16 h-5 bg-gray-300 rounded-full"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      {[...Array(4)].map((_, j) => (
                        <div key={j} className="w-8 h-8 bg-gray-300 rounded"></div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, j) => (
                      <div key={j}>
                        <div className="w-16 h-4 bg-gray-300 rounded mb-1"></div>
                        <div className="w-32 h-4 bg-gray-300 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
