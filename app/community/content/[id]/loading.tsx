export default function ContentDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航骨架 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="w-24 h-5 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 内容主体骨架 */}
        <article className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {/* 作者信息骨架 */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <div className="w-24 h-5 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* 标题骨架 */}
          <div className="w-3/4 h-8 bg-gray-200 rounded animate-pulse mb-4"></div>

          {/* 标签骨架 */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-16 h-6 bg-gray-200 rounded-full animate-pulse"></div>
            ))}
          </div>

          {/* 内容骨架 */}
          <div className="space-y-3 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
            ))}
            <div className="w-2/3 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* 互动按钮骨架 */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-16 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
            <div className="w-12 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </article>

        {/* 评论区骨架 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-4"></div>

          {/* 发表评论骨架 */}
          <div className="mb-6">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="w-full h-20 bg-gray-200 rounded-lg animate-pulse mb-3"></div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                  <div className="w-20 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* 评论列表骨架 */}
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b border-gray-100 pb-6">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="space-y-2 mb-3">
                      <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-6 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-8 h-6 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
