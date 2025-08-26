export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="flex-1 flex flex-col">
        {/* 顶部导航栏骨架 */}
        <header className="bg-white border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div>
              <div className="w-48 h-5 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </header>

        {/* 消息列表骨架 */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="space-y-2">
                    <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 输入区域骨架 */}
        <div className="bg-white border-t p-4">
          <div className="max-w-4xl mx-auto flex gap-3">
            <div className="flex-1 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="w-20 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
