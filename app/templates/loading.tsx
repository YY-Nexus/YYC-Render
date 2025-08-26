export default function TemplatesLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部骨架 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* 标签页骨架 */}
          <div className="mt-6">
            <div className="flex space-x-8 border-b border-gray-200">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 搜索和筛选骨架 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* 模板网格骨架 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="aspect-video bg-gray-200 animate-pulse"></div>
              <div className="p-4">
                <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse mb-3"></div>
                <div className="flex gap-1 mb-3">
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-8 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
