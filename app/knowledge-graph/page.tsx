"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Share2,
  Download,
  Settings,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Filter,
  Info,
  BookOpen,
  Target,
  Package,
} from "lucide-react"
import { KnowledgeGraphManager, type KnowledgeGraph, type KnowledgeNode } from "@/lib/knowledge-graph"

export default function KnowledgeGraphPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const question = searchParams.get("q") || ""
  const svgRef = useRef<SVGSVGElement>(null)

  const [knowledgeGraph, setKnowledgeGraph] = useState<KnowledgeGraph | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showFilters, setShowFilters] = useState(false)
  const [nodeTypeFilter, setNodeTypeFilter] = useState<string>("all")
  const [difficultyFilter, setDifficultyFilter] = useState<number>(0)

  // 模拟内容数据
  const mockContent = `
在智能学习的道路上坚持下去，需要掌握多个核心概念和技能。

首先是学习方法的选择和优化。不同的学习内容需要采用不同的学习策略，比如概念性知识适合使用思维导图和关联记忆，而技能性知识则需要大量的实践练习。

其次是时间管理和计划制定。合理的时间分配能够确保学习的连续性和系统性。制定学习计划时要考虑个人的学习节奏和能力水平。

心理调节也是非常重要的一环。面对学习中的困难和挫折，需要保持积极的心态，学会自我激励和压力管理。

最后是知识体系的构建。将零散的知识点整合成完整的知识网络，形成系统性的理解和掌握。
  `

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(selectedNode === nodeId ? null : nodeId)
  }

  const handleNodeHover = (nodeId: string | null) => {
    setHoveredNode(nodeId)
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
    setHoveredNode(null)
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

  const getNodeIcon = (type: KnowledgeNode["type"]) => {
    switch (type) {
      case "concept":
        return <Info className="w-4 h-4" />
      case "topic":
        return <BookOpen className="w-4 h-4" />
      case "skill":
        return <Target className="w-4 h-4" />
      case "resource":
        return <Package className="w-4 h-4" />
      default:
        return <Info className="w-4 h-4" />
    }
  }

  const getFilteredNodes = () => {
    if (!knowledgeGraph) return []

    let nodes = knowledgeGraph.nodes

    if (nodeTypeFilter !== "all") {
      nodes = nodes.filter((node) => node.type === nodeTypeFilter)
    }

    if (difficultyFilter > 0) {
      nodes = nodes.filter((node) => node.difficulty === difficultyFilter)
    }

    return nodes
  }

  const getFilteredEdges = () => {
    if (!knowledgeGraph) return []

    const filteredNodes = getFilteredNodes()
    const nodeIds = new Set(filteredNodes.map((n) => n.id))

    return knowledgeGraph.edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
  }

  const renderNode = (node: KnowledgeNode) => {
    const isSelected = selectedNode === node.id
    const isHovered = hoveredNode === node.id
    const radius = (node.size || 30) * (isSelected ? 1.2 : isHovered ? 1.1 : 1)

    return (
      <g key={node.id}>
        {/* 节点圆圈 */}
        <circle
          cx={node.x}
          cy={node.y}
          r={radius}
          fill={isSelected ? "#FEF3C7" : node.color || "#94A3B8"}
          stroke={isSelected ? "#F59E0B" : isHovered ? "#6B7280" : "#E5E7EB"}
          strokeWidth={isSelected ? 3 : isHovered ? 2 : 1}
          className="cursor-pointer transition-all duration-200"
          onClick={() => handleNodeClick(node.id)}
          onMouseEnter={() => handleNodeHover(node.id)}
          onMouseLeave={() => handleNodeHover(null)}
          opacity={isHovered || isSelected ? 1 : 0.8}
        />

        {/* 节点图标 */}
        <foreignObject x={node.x! - 8} y={node.y! - 8} width={16} height={16} className="pointer-events-none">
          <div className="text-white flex items-center justify-center">{getNodeIcon(node.type)}</div>
        </foreignObject>

        {/* 节点标签 */}
        <text
          x={node.x}
          y={node.y! + radius + 15}
          textAnchor="middle"
          className="text-xs font-medium fill-gray-700 pointer-events-none"
          style={{ fontSize: "12px" }}
        >
          {node.label.length > 8 ? node.label.slice(0, 8) + "..." : node.label}
        </text>

        {/* 难度指示器 */}
        <g transform={`translate(${node.x! + radius - 8}, ${node.y! - radius + 8})`}>
          {Array.from({ length: node.difficulty }, (_, i) => (
            <circle key={i} cx={i * 3} cy={0} r={1.5} fill="#F59E0B" className="opacity-80" />
          ))}
        </g>
      </g>
    )
  }

  const renderEdge = (edge: any) => {
    const sourceNode = knowledgeGraph?.nodes.find((n) => n.id === edge.source)
    const targetNode = knowledgeGraph?.nodes.find((n) => n.id === edge.target)

    if (!sourceNode || !targetNode) return null

    const strokeWidth = edge.weight * 3 + 1
    const opacity = edge.weight * 0.6 + 0.2

    // 根据边的类型设置颜色
    const getEdgeColor = (type: string) => {
      switch (type) {
        case "prerequisite":
          return "#EF4444" // 红色
        case "leads_to":
          return "#10B981" // 绿色
        case "contains":
          return "#3B82F6" // 蓝色
        default:
          return "#6B7280" // 灰色
      }
    }

    return (
      <g key={edge.id}>
        <line
          x1={sourceNode.x}
          y1={sourceNode.y}
          x2={targetNode.x}
          y2={targetNode.y}
          stroke={getEdgeColor(edge.type)}
          strokeWidth={strokeWidth}
          opacity={opacity}
          markerEnd="url(#arrowhead)"
        />
      </g>
    )
  }

  useEffect(() => {
    if (question && mockContent) {
      const graph = KnowledgeGraphManager.generateKnowledgeGraph(question, mockContent)
      setKnowledgeGraph(graph)
      KnowledgeGraphManager.saveKnowledgeGraph(graph)
    }
  }, [question])

  if (!knowledgeGraph) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">正在生成知识图谱...</p>
        </div>
      </div>
    )
  }

  const filteredNodes = getFilteredNodes()
  const filteredEdges = getFilteredEdges()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-medium">知识图谱 - {knowledgeGraph.metadata.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowFilters(!showFilters)} className="p-2 hover:bg-gray-100 rounded">
            <Filter className="w-5 h-5" />
          </button>
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
        <div className="w-80 bg-white border-r overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* 筛选器 */}
            {showFilters && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">筛选选项</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">节点类型</label>
                    <select
                      value={nodeTypeFilter}
                      onChange={(e) => setNodeTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      <option value="all">全部类型</option>
                      <option value="concept">概念</option>
                      <option value="topic">主题</option>
                      <option value="skill">技能</option>
                      <option value="resource">资源</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">难度等级</label>
                    <select
                      value={difficultyFilter}
                      onChange={(e) => setDifficultyFilter(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      <option value={0}>全部难度</option>
                      <option value={1}>初级 (1星)</option>
                      <option value={2}>入门 (2星)</option>
                      <option value={3}>中级 (3星)</option>
                      <option value={4}>高级 (4星)</option>
                      <option value={5}>专家 (5星)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 视图控制 */}
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
                  重置视图
                </button>
              </div>
              <div className="mt-3 text-xs text-gray-500">当前缩放: {Math.round(zoom * 100)}%</div>
            </div>

            {/* 图谱统计 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">图谱信息</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>总节点数:</span>
                  <span>{knowledgeGraph.nodes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>显示节点:</span>
                  <span>{filteredNodes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>连接数:</span>
                  <span>{filteredEdges.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>平均难度:</span>
                  <span>
                    {(
                      knowledgeGraph.nodes.reduce((sum, n) => sum + n.difficulty, 0) / knowledgeGraph.nodes.length
                    ).toFixed(1)}
                    星
                  </span>
                </div>
              </div>
            </div>

            {/* 节点列表 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">节点列表</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredNodes.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => handleNodeClick(node.id)}
                    className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                      selectedNode === node.id ? "bg-blue-100 text-blue-800" : "hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: node.color }} />
                      <span className="font-medium truncate">{node.label}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span>{node.type}</span>
                      <span>•</span>
                      <span>{node.difficulty}星</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 主要图谱区域 */}
        <div className="flex-1 relative overflow-hidden">
          <svg
            ref={svgRef}
            className="w-full h-full cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* 定义箭头标记 */}
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
              </marker>
            </defs>

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* 渲染边 */}
              {filteredEdges.map((edge) => renderEdge(edge))}

              {/* 渲染节点 */}
              {filteredNodes.map((node) => renderNode(node))}
            </g>
          </svg>

          {/* 选中节点的详情面板 */}
          {selectedNode && (
            <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
              {(() => {
                const node = knowledgeGraph.nodes.find((n) => n.id === selectedNode)
                if (!node) return null

                return (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: node.color }} />
                      <h4 className="font-medium text-gray-900">{node.label}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{node.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">类型:</span>
                        <span className="font-medium">{node.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">难度:</span>
                        <span className="font-medium">{node.difficulty}星</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">重要性:</span>
                        <span className="font-medium">{Math.round(node.importance * 100)}%</span>
                      </div>
                      {node.metadata?.learningTime && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">学习时间:</span>
                          <span className="font-medium">{node.metadata.learningTime}分钟</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => router.push(`/learning-path/create?concept=${encodeURIComponent(node.label)}`)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        制定学习路径
                      </button>
                      <button
                        onClick={() => setSelectedNode(null)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                      >
                        关闭
                      </button>
                    </div>
                  </>
                )
              })()}
            </div>
          )}

          {/* 图例 */}
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">图例</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>概念</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>主题</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span>技能</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span>资源</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                <div>• 点击节点查看详情</div>
                <div>• 拖拽移动视图</div>
                <div>• 星级表示难度</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
