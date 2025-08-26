export default function PluginsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-32 mb-6"></div>

          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4 bg-white">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="h-5 bg-gray-300 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-full mb-1"></div>
                    <div className="h-3 bg-gray-300 rounded w-64"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-gray-300 rounded w-16"></div>
                    <div className="h-8 bg-gray-300 rounded w-12"></div>
                  </div>
                </div>
                <div className="h-3 bg-gray-300 rounded w-80"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
