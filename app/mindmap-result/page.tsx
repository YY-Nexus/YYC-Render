"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft, Share2, Download, Settings, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import { MindMapGenerator, type MindMapData, type MindMapNode } from "@/lib/mindmap"

export default function MindMapResultPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const question = searchParams.get("q") || ""
  const svgRef = useRef<SVGSVGElement>(null)

  const [mindMapData, setMindMapData] = useState<MindMapData | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // 模拟内容数据
  const mockContent = `
在智能学习的道路上坚持下去，是一个需要长期投入、心理调整和策略支持的过程。

1. 找到学习的乐趣与意义
学习不应只是枯燥的任务，而应是一个充满乐趣和挑战的过程。要明确学习的意义，认识到学习能为你带来哪些实际的好处。

2. 保持积极的心态
面对他人的反对态度，最重要的是保持冷静和理性。要以谦逊和包容的态度去回应，专注于自己的目标和成长。

3. 制定合理的计划并坚持执行
制定一个可行的学习计划，并坚定不移地执行下去。将学习目标分为多个阶段，每个阶段设定具体的目标和时间节点。

4. 建立支持系统
寻找志同道合的学习伙伴，加入学习社群，获得外部支持和鼓励。

5. 持续自我激励
设定小目标，庆祝每一个进步，保持学习的成就感和满足感。
  `

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(selectedNode === nodeId ? null : nodeId)
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.2, 3))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.2, 0.3))
  }

  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setSelectedNode(null)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const renderNode = (node: MindMapNode) => {
    const isSelected = selectedNode === node.id
    const isRoot = node.level === 0
    const radius = isRoot ? 80 : node.level === 1 ? 60 : 40
    const fontSize = isRoot ? 14 : node.level === 1 ? 12 : 10

    return (
      <g key={node.id}>
        {/* 连接线 */}
        {node.children.map((child) => (
          <line
            key={`line-${node.id}-${child.id}`}
            x1={node.x}
            y1={node.y}
            x2={child.x}
            y2={child.y}
            stroke={node.color || "#94A3B8"}
            strokeWidth={node.level === 0 ? 3 : 2}
            opacity={0.6}
          />
        ))}

        {/* 节点圆圈 */}
        <circle
          cx={node.x}
          cy={node.y}
          r={radius}
          fill={isSelected ? "#FEF3C7" : "white"}
          stroke={node.color || "#94A3B8"}
          strokeWidth={isSelected ? 4 : isRoot ? 3 : 2}
          className="cursor-pointer transition-all duration-200 hover:stroke-4"
          onClick={() => handleNodeClick(node.id)}
        />

        {/* 节点文本 */}
        <foreignObject
          x={node.x! - radius + 10}
          y={node.y! - 10}
          width={(radius - 10) * 2}
          height={20}
          className="pointer-events-none"
        >
          <div className="text-center text-gray-800 font-medium leading-tight" style={{ fontSize: `${fontSize}px` }}>
            {node.text}
          </div>
        </foreignObject>

        {/* 递归渲染子节点 */}
        {node.children.map((child) => renderNode(child))}
      </g>
    )
  }

  useEffect(() => {
    if (question && mockContent) {
      const data = MindMapGenerator.generateMindMap(question, mockContent)
      setMindMapData(data)
    }
  }, [question])

  if (!mindMapData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">正在生成思维导图...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-medium">思维导图 - {question.slice(0, 30)}...</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded">
            <Settings className="w-5 h-5" />
          </button>
          <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm flex items-center gap-1">
            <Share2 className="w-4 h-4" />
            分享
          </button>
          <button className="px-3 py-1 bg-green-600 text-white rounded text-sm flex items-center gap-1">
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* 左侧控制面板 */}
        <div className="w-64 bg-white border-r p-4 overflow-y-auto">
          <div className="space-y-4">
            {/* 缩放控制 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">视图控制</h3>
              <div className="space-y-2">
                <button
                  onClick={handleZoomIn}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-sm"
                >
                  <ZoomIn className="w-4 h-4" />
                  放大
                </button>
                <button
                  onClick={handleZoomOut}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-sm"
                >
                  <ZoomOut className="w-4 h-4" />
                  缩小
                </button>
                <button
                  onClick={handleReset}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  重置
                </button>
              </div>
              <div className="mt-3 text-xs text-gray-500">当前缩放: {Math.round(zoom * 100)}%</div>
            </div>

            {/* 节点信息 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">导图信息</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>总节点数: {mindMapData.totalNodes}</div>
                <div>主要分支: {mindMapData.rootNode.children.length}</div>
                <div>层级深度: 3</div>
              </div>
            </div>

            {/* 操作提示 */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">操作提示</h3>
              <div className="space-y-1 text-xs text-blue-700">
                <div>• 点击节点查看详情</div>
                <div>• 拖拽画布移动视图</div>
                <div>• 使用控制按钮缩放</div>
                <div>• 滚轮缩放（即将支持）</div>
              </div>
            </div>
          </div>
        </div>

        {/* 主要思维导图区域 */}
        <div className="flex-1 relative overflow-hidden">
          <svg
            ref={svgRef}
            className="w-full h-full cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {mindMapData.rootNode && renderNode(mindMapData.rootNode)}
            </g>
          </svg>

          {/* 选中节点的详情面板 */}
          {selectedNode && (
            <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
              <h4 className="font-medium text-gray-900 mb-2">节点详情</h4>
              <p className="text-sm text-gray-600">
                {selectedNode === "root"
                  ? "这是思维导图的中心主题，展示了您提出的核心问题。"
                  : "这是思维导图的一个分支节点，包含了相关的概念或要点。"}
              </p>
              <button
                onClick={() => setSelectedNode(null)}
                className="mt-3 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
              >
                关闭
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
