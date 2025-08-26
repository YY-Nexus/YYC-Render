export default function GenerateWebpageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-200 rounded-full animate-pulse mx-auto mb-4"></div>
          <div className="h-8 bg-blue-200 rounded-md w-64 mx-auto mb-2 animate-pulse"></div>
          <div className="h-4 bg-blue-100 rounded-md w-48 mx-auto animate-pulse"></div>
        </div>

        {/* 步骤指示器骨架 */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              {step < 3 && <div className="w-16 h-1 bg-gray-200 mx-2 animate-pulse"></div>}
            </div>
          ))}
        </div>

        {/* 内容区域骨架 */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="space-y-6">
            <div className="text-center">
              <div className="h-6 bg-gray-200 rounded-md w-48 mx-auto mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-100 rounded-md w-64 mx-auto animate-pulse"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="border rounded-lg p-4">
                  <div className="aspect-video bg-gray-100 rounded-md mb-3 animate-pulse"></div>
                  <div className="h-5 bg-gray-200 rounded-md mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-100 rounded-md mb-2 animate-pulse"></div>
                  <div className="flex gap-1">
                    <div className="h-6 bg-gray-100 rounded w-16 animate-pulse"></div>
                    <div className="h-6 bg-gray-100 rounded w-20 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <div className="h-10 bg-gray-200 rounded-md w-20 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
