export default function HistoryLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶部导航骨架 */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="w-24 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计信息骨架 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow animate-pulse">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded mr-3"></div>
                <div>
                  <div className="w-12 h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 侧边栏骨架 */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow animate-pulse">
              <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="space-y-4">
                <div className="w-full h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-full h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 主内容骨架 */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow animate-pulse">
                  <div className="flex items-start space-x-3">
                    <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                      <div className="w-3/4 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="w-2/3 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
