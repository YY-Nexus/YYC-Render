export default function AIAssistantLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航骨架 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-24 h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>

            <div className="flex items-center gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 主内容区域骨架 */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[600px] flex flex-col">
              {/* 聊天区域骨架 */}
              <div className="flex-1 p-6 space-y-4">
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 animate-pulse"></div>
                  <div className="w-32 h-6 bg-gray-200 rounded mx-auto mb-2 animate-pulse"></div>
                  <div className="w-48 h-4 bg-gray-200 rounded mx-auto animate-pulse"></div>
                </div>
              </div>

              {/* 输入区域骨架 */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex gap-3">
                  <div className="flex-1 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="w-16 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* 侧边栏骨架 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-16 h-5 bg-gray-200 rounded animate-pulse"></div>
              </div>

              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <div className="w-20 h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="w-full h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <div className="w-16 h-5 bg-gray-200 rounded mb-3 animate-pulse"></div>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-full h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
