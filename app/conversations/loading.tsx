export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏骨架 */}
      <header className="bg-white border-b px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="w-32 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-24 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="w-20 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </header>

      {/* 对话列表骨架 */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="w-3/4 h-5 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
              </div>

              <div className="mb-3">
                <div className="w-full h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="w-2/3 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <div className="w-16 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="w-12 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
                <div className="flex gap-1">
                  <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
