export default function FavoritesLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏骨架 */}
      <header className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-24 h-6 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-20 h-5 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex gap-2">
              <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* 搜索和过滤栏骨架 */}
        <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
          <div className="flex flex-col gap-4">
            <div className="w-full h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="flex gap-4">
              <div className="w-32 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-32 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-32 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* 收藏列表骨架 */}
        <div className="grid gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="w-3/4 h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="w-full h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="w-2/3 h-4 bg-gray-200 rounded animate-pulse mb-3"></div>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="flex gap-1">
                      <div className="w-12 h-5 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="w-12 h-5 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
