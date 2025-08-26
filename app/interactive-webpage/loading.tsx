export default function InteractiveWebpageLoading() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* 工具栏骨架 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-6 bg-gray-200 rounded animate-pulse"></div>
              <div>
                <div className="h-5 bg-gray-200 rounded w-48 mb-1 animate-pulse"></div>
                <div className="h-4 bg-gray-100 rounded w-64 animate-pulse"></div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="w-16 h-8 bg-gray-200 rounded-md mx-1 animate-pulse"></div>
                ))}
              </div>
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="w-16 h-8 bg-gray-200 rounded-md animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区域骨架 */}
      <div className="h-[calc(100vh-73px)] p-4">
        <div className="w-full h-full">
          <div className="border border-gray-300 rounded-lg overflow-hidden shadow-lg bg-white h-full">
            <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-48 mx-auto mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-100 rounded w-32 mx-auto animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 信息面板骨架 */}
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
        <div className="h-5 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-4 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  )
}
