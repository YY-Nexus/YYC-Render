"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Plus,
  Filter,
  Download,
  Share2,
  Settings,
  Zap,
  Target,
  GitBranch,
  Eye,
  Edit,
  Trash2,
  Link,
  BookOpen,
  Brain,
  Network,
} from "lucide-react"
import { knowledgeGraphManager, type KnowledgeGraph, type KnowledgeNode, type Connection } from "@/lib/knowledge-graph"

export default function KnowledgeGraphPage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [graphs, setGraphs] = useState<KnowledgeGraph[]>([])
  const [selectedGraph, setSelectedGraph] = useState<KnowledgeGraph | null>(null)
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [viewMode, setViewMode] = useState<"list" | "graph">("list")
  const [filter, setFilter] = useState({
    domain: "",
    nodeType: "",
    sortBy: "newest" as "newest" | "oldest" | "nodes" | "connections",
  })

  // 新建图谱表单
  const [newGraph, setNewGraph] = useState({
    title: "",
    description: "",
    domain: "",
  })

  // 新建节点表单
  const [newNode, setNewNode] = useState({
    title: "",
    content: "",
    type: "concept" as KnowledgeNode["type"],
    category: "",
    tags: "",
    importance: 3,
    difficulty: 3,
  })

  const [showNodeForm, setShowNodeForm] = useState(false)
  const [showConnectionSuggestions, setShowConnectionSuggestions] = useState(false)
  const [connectionSuggestions, setConnectionSuggestions] = useState<any[]>([])

  useEffect(() => {
    loadGraphs()
  }, [])

  useEffect(() => {
    if (selectedGraph && viewMode === "graph") {
      drawGraph()
    }
  }, [selectedGraph, viewMode])

  const loadGraphs = () => {
    const allGraphs = knowledgeGraphManager.getAllGraphs()
    setGraphs(allGraphs)
    if (allGraphs.length > 0 && !selectedGraph) {
      setSelectedGraph(allGraphs[0])
    }
  }

  const handleCreateGraph = () => {
    if (!newGraph.title.trim()) return

    const graph = knowledgeGraphManager.createGraph(newGraph.title, newGraph.description, newGraph.domain)

    setGraphs((prev) => [graph, ...prev])
    setSelectedGraph(graph)
    setNewGraph({ title: "", description: "", domain: "" })
    setIsCreating(false)
  }

  const handleAddNode = () => {
    if (!selectedGraph || !newNode.title.trim()) return

    const node = knowledgeGraphManager.addNode(selectedGraph.id, {
      title: newNode.title,
      content: newNode.content,
      type: newNode.type,
      category: newNode.category,
      tags: newNode.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      importance: newNode.importance,
      difficulty: newNode.difficulty,
    })

    // 更新图谱
    const updatedGraph = knowledgeGraphManager.getGraph(selectedGraph.id)
    if (updatedGraph) {
      setSelectedGraph(updatedGraph)
      setGraphs((prev) => prev.map((g) => (g.id === updatedGraph.id ? updatedGraph : g)))
    }

    setNewNode({
      title: "",
      content: "",
      type: "concept",
      category: "",
      tags: "",
      importance: 3,
      difficulty: 3,
    })
    setShowNodeForm(false)
  }

  const handleNodeClick = (node: KnowledgeNode) => {
    setSelectedNode(node)

    // 获取连接建议
    if (selectedGraph) {
      const suggestions = knowledgeGraphManager.suggestConnections(selectedGraph.id, node.id)
      setConnectionSuggestions(suggestions)
      setShowConnectionSuggestions(true)
    }
  }

  const handleCreateConnection = (targetNodeId: string, type: Connection["type"]) => {
    if (!selectedGraph || !selectedNode) return

    knowledgeGraphManager.createConnection(selectedGraph.id, selectedNode.id, targetNodeId, {
      type,
      strength: 0.8,
      bidirectional: type === "related",
    })

    // 更新图谱
    const updatedGraph = knowledgeGraphManager.getGraph(selectedGraph.id)
    if (updatedGraph) {
      setSelectedGraph(updatedGraph)
      setGraphs((prev) => prev.map((g) => (g.id === updatedGraph.id ? updatedGraph : g)))
    }

    setShowConnectionSuggestions(false)
  }

  const drawGraph = () => {
    const canvas = canvasRef.current
    if (!canvas || !selectedGraph) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // 设置画布大小
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 简单的力导向布局
    const nodes = selectedGraph.nodes
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(canvas.width, canvas.height) * 0.3

    // 为节点分配位置（圆形布局）
    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI
      node.position = {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      }
    })

    // 绘制连接线
    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 2
    nodes.forEach((node) => {
      if (!node.position) return

      node.connections.forEach((connection) => {
        const targetNode = nodes.find((n) => n.id === connection.targetId)
        if (!targetNode?.position) return

        ctx.beginPath()
        ctx.moveTo(node.position.x, node.position.y)
        ctx.lineTo(targetNode.position.x, targetNode.position.y)
        ctx.stroke()

        // 绘制箭头
        const angle = Math.atan2(targetNode.position.y - node.position.y, targetNode.position.x - node.position.x)
        const arrowLength = 10
        const arrowAngle = Math.PI / 6

        ctx.beginPath()
        ctx.moveTo(
          targetNode.position.x - arrowLength * Math.cos(angle - arrowAngle),
          targetNode.position.y - arrowLength * Math.sin(angle - arrowAngle),
        )
        ctx.lineTo(targetNode.position.x, targetNode.position.y)
        ctx.lineTo(
          targetNode.position.x - arrowLength * Math.cos(angle + arrowAngle),
          targetNode.position.y - arrowLength * Math.sin(angle + arrowAngle),
        )
        ctx.stroke()
      })
    })

    // 绘制节点
    nodes.forEach((node) => {
      if (!node.position) return

      // 节点颜色根据类型
      const colors = {
        concept: "#3b82f6",
        fact: "#10b981",
        process: "#f59e0b",
        example: "#8b5cf6",
        definition: "#ef4444",
      }

      ctx.fillStyle = colors[node.type] || "#6b7280"
      ctx.beginPath()
      ctx.arc(node.position.x, node.position.y, 20, 0, 2 * Math.PI)
      ctx.fill()

      // 选中状态
      if (selectedNode?.id === node.id) {
        ctx.strokeStyle = "#1f2937"
        ctx.lineWidth = 3
        ctx.stroke()
      }

      // 节点标签
      ctx.fillStyle = "#1f2937"
      ctx.font = "12px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(
        node.title.length > 15 ? node.title.substring(0, 15) + "..." : node.title,
        node.position.x,
        node.position.y + 35,
      )
    })
  }

  const filteredGraphs = graphs
    .filter((graph) => {
      if (
        searchQuery &&
        !graph.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !graph.description.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false
      }
      if (filter.domain && graph.domain !== filter.domain) return false
      return true
    })
    .sort((a, b) => {
      switch (filter.sortBy) {
        case "oldest":
          return a.createdAt.getTime() - b.createdAt.getTime()
        case "nodes":
          return b.stats.nodeCount - a.stats.nodeCount
        case "connections":
          return b.stats.connectionCount - a.stats.connectionCount
        case "newest":
        default:
          return b.createdAt.getTime() - a.createdAt.getTime()
      }
    })

  const domains = [...new Set(graphs.map((g) => g.domain))].filter(Boolean)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Network className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">知识图谱</h1>
              <p className="text-sm text-gray-600">构建和探索知识之间的关联</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setViewMode(viewMode === "list" ? "graph" : "list")}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              {viewMode === "list" ? <Eye className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
              {viewMode === "list" ? "图谱视图" : "列表视图"}
            </button>

            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              新建图谱
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* 左侧边栏 */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* 搜索和过滤 */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索知识图谱..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">筛选</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">领域</label>
                <select
                  value={filter.domain}
                  onChange={(e) => setFilter((prev) => ({ ...prev, domain: e.target.value }))}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">全部领域</option>
                  {domains.map((domain) => (
                    <option key={domain} value={domain}>
                      {domain}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">排序</label>
                <select
                  value={filter.sortBy}
                  onChange={(e) => setFilter((prev) => ({ ...prev, sortBy: e.target.value as any }))}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="newest">最新创建</option>
                  <option value="oldest">最早创建</option>
                  <option value="nodes">节点数量</option>
                  <option value="connections">连接数量</option>
                </select>
              </div>
            </div>
          </div>

          {/* 图谱列表 */}
          <div className="flex-1 overflow-y-auto">
            {filteredGraphs.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">暂无知识图谱</p>
                <button onClick={() => setIsCreating(true)} className="mt-2 text-blue-600 hover:text-blue-700 text-sm">
                  创建第一个图谱
                </button>
              </div>
            ) : (
              <div className="p-2">
                {filteredGraphs.map((graph) => (
                  <div
                    key={graph.id}
                    onClick={() => setSelectedGraph(graph)}
                    className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors ${
                      selectedGraph?.id === graph.id
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-gray-50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900 text-sm line-clamp-1">{graph.title}</h3>
                      <div className="flex items-center space-x-1 ml-2">
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <Edit className="w-3 h-3 text-gray-500" />
                        </button>
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <Trash2 className="w-3 h-3 text-gray-500" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{graph.description}</p>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded">{graph.domain}</span>
                      <div className="flex items-center space-x-3">
                        <span>{graph.stats.nodeCount} 节点</span>
                        <span>{graph.stats.connectionCount} 连接</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 flex flex-col">
          {selectedGraph ? (
            <>
              {/* 图谱标题栏 */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{selectedGraph.title}</h2>
                    <p className="text-sm text-gray-600 mt-1">{selectedGraph.description}</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowNodeForm(true)}
                      className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      添加节点
                    </button>

                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                      <Share2 className="w-4 h-4" />
                    </button>

                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                      <Download className="w-4 h-4" />
                    </button>

                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 统计信息 */}
                <div className="flex items-center space-x-6 mt-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    <span>{selectedGraph.stats.nodeCount} 个节点</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <GitBranch className="w-4 h-4" />
                    <span>{selectedGraph.stats.connectionCount} 个连接</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    <span>覆盖率 {Math.round(selectedGraph.stats.coverage * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* 图谱内容 */}
              <div className="flex-1 relative">
                {viewMode === "graph" ? (
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full cursor-pointer"
                    onClick={(e) => {
                      const canvas = canvasRef.current
                      if (!canvas || !selectedGraph) return

                      const rect = canvas.getBoundingClientRect()
                      const x = e.clientX - rect.left
                      const y = e.clientY - rect.top

                      // 检查点击的节点
                      const clickedNode = selectedGraph.nodes.find((node) => {
                        if (!node.position) return false
                        const distance = Math.sqrt(Math.pow(x - node.position.x, 2) + Math.pow(y - node.position.y, 2))
                        return distance <= 20
                      })

                      if (clickedNode) {
                        handleNodeClick(clickedNode)
                      }
                    }}
                  />
                ) : (
                  <div className="p-6 overflow-y-auto">
                    {selectedGraph.nodes.length === 0 ? (
                      <div className="text-center py-12">
                        <Brain className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">图谱为空</h3>
                        <p className="text-gray-600 mb-4">开始添加知识节点来构建您的知识图谱</p>
                        <button
                          onClick={() => setShowNodeForm(true)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          添加第一个节点
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {selectedGraph.nodes.map((node) => (
                          <div
                            key={node.id}
                            onClick={() => handleNodeClick(node)}
                            className={`p-4 bg-white rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                              selectedNode?.id === node.id
                                ? "border-blue-500 ring-2 ring-blue-200"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-gray-900 text-sm">{node.title}</h4>
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  node.type === "concept"
                                    ? "bg-blue-100 text-blue-800"
                                    : node.type === "fact"
                                      ? "bg-green-100 text-green-800"
                                      : node.type === "process"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : node.type === "example"
                                          ? "bg-purple-100 text-purple-800"
                                          : "bg-red-100 text-red-800"
                                }`}
                              >
                                {node.type}
                              </span>
                            </div>

                            <p className="text-xs text-gray-600 mb-3 line-clamp-2">{node.content}</p>

                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span className="bg-gray-100 px-2 py-1 rounded">{node.category}</span>
                              <div className="flex items-center gap-2">
                                <span>重要度: {node.importance}</span>
                                <span>难度: {node.difficulty}</span>
                              </div>
                            </div>

                            {node.connections.length > 0 && (
                              <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                                <Link className="w-3 h-3" />
                                <span>{node.connections.length} 个连接</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Network className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">选择一个知识图谱</h3>
                <p className="text-gray-600">从左侧列表中选择一个图谱来查看和编辑</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 创建图谱模态框 */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">创建新的知识图谱</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">图谱标题</label>
                <input
                  type="text"
                  value={newGraph.title}
                  onChange={(e) => setNewGraph((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="例如：机器学习基础概念"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  value={newGraph.description}
                  onChange={(e) => setNewGraph((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="简要描述这个知识图谱的内容和用途"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">领域</label>
                <input
                  type="text"
                  value={newGraph.domain}
                  onChange={(e) => setNewGraph((prev) => ({ ...prev, domain: e.target.value }))}
                  placeholder="例如：人工智能、编程、设计"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateGraph}
                disabled={!newGraph.title.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                创建图谱
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 添加节点模态框 */}
      {showNodeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">添加知识节点</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">节点标题</label>
                <input
                  type="text"
                  value={newNode.title}
                  onChange={(e) => setNewNode((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="例如：神经网络"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">内容描述</label>
                <textarea
                  value={newNode.content}
                  onChange={(e) => setNewNode((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="详细描述这个知识点的内容"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">节点类型</label>
                  <select
                    value={newNode.type}
                    onChange={(e) => setNewNode((prev) => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="concept">概念</option>
                    <option value="fact">事实</option>
                    <option value="process">过程</option>
                    <option value="example">示例</option>
                    <option value="definition">定义</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                  <input
                    type="text"
                    value={newNode.category}
                    onChange={(e) => setNewNode((prev) => ({ ...prev, category: e.target.value }))}
                    placeholder="例如：基础概念"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标签 (用逗号分隔)</label>
                <input
                  type="text"
                  value={newNode.tags}
                  onChange={(e) => setNewNode((prev) => ({ ...prev, tags: e.target.value }))}
                  placeholder="例如：机器学习, 深度学习, AI"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">重要度 (1-5)</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={newNode.importance}
                    onChange={(e) => setNewNode((prev) => ({ ...prev, importance: Number.parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-gray-600 mt-1">{newNode.importance}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">难度 (1-5)</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={newNode.difficulty}
                    onChange={(e) => setNewNode((prev) => ({ ...prev, difficulty: Number.parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-gray-600 mt-1">{newNode.difficulty}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowNodeForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddNode}
                disabled={!newNode.title.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                添加节点
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 连接建议模态框 */}
      {showConnectionSuggestions && selectedNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[70vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">为 "{selectedNode.title}" 建立连接</h3>

            {connectionSuggestions.length === 0 ? (
              <p className="text-gray-600 text-center py-4">暂无连接建议</p>
            ) : (
              <div className="space-y-3">
                {connectionSuggestions.map((suggestion, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{suggestion.targetNode.title}</h4>
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        {Math.round(suggestion.confidence * 100)}%
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 mb-2">{suggestion.reason}</p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">建议类型: {suggestion.suggestedType}</span>
                      <button
                        onClick={() => handleCreateConnection(suggestion.targetNode.id, suggestion.suggestedType)}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                      >
                        创建连接
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowConnectionSuggestions(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
