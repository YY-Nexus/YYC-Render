export default function MindMapResultLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">正在加载思维导图</h2>
        <p className="text-gray-600">请稍候...</p>
      </div>
    </div>
  )
}
