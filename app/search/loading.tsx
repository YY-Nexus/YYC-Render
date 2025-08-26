export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶部导航骨架 */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 搜索框骨架 */}
        <div className="mb-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="flex-1 h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="flex space-x-2">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="w-16 h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 搜索类型标签骨架 */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* 搜索结果骨架 */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow animate-pulse">
              <div className="flex space-x-4">
                <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="w-12 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                  <div className="w-3/4 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="w-2/3 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="flex justify-between items-center">
                    <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="flex space-x-2">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
