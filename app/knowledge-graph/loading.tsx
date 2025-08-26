export default function KnowledgeGraphLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航骨架 */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div>
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* 左侧边栏骨架 */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="h-10 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="space-y-3">
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          <div className="flex-1 p-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-3 mb-2 border border-gray-200 rounded-lg">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="flex justify-between">
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 主内容区骨架 */}
        <div className="flex-1 flex flex-col">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center space-x-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-6 mt-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>

          <div className="flex-1 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse mb-3"></div>
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
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
