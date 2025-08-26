export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶部导航骨架 */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="w-12 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 标签页骨架 */}
        <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>

        {/* 设置卡片骨架 */}
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow animate-pulse">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="w-32 h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="w-48 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="p-6 space-y-6">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="space-y-2">
                    <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="w-full h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
