export interface KnowledgeNode {
  id: string
  title: string
  content: string
  type: "concept" | "fact" | "process" | "example" | "definition"
  category: string
  tags: string[]
  importance: number
  difficulty: number
  connections: Connection[]
  metadata: {
    createdAt: Date
    updatedAt: Date
    source?: string
    confidence: number
    verified: boolean
  }
  position?: { x: number; y: number }
}

export interface Connection {
  targetId: string
  type: "prerequisite" | "related" | "example" | "application" | "opposite" | "part-of"
  strength: number
  description?: string
  bidirectional: boolean
}

export interface KnowledgeGraph {
  id: string
  title: string
  description: string
  nodes: KnowledgeNode[]
  domain: string
  createdAt: Date
  updatedAt: Date
  stats: {
    nodeCount: number
    connectionCount: number
    avgConnections: number
    coverage: number
  }
}

export class KnowledgeGraphManager {
  private graphs: Map<string, KnowledgeGraph> = new Map()
  private nodeIndex: Map<string, string[]> = new Map() // keyword -> graphIds

  // 创建知识图谱
  createGraph(title: string, description: string, domain: string): KnowledgeGraph {
    const graph: KnowledgeGraph = {
      id: `graph_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      domain,
      nodes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      stats: {
        nodeCount: 0,
        connectionCount: 0,
        avgConnections: 0,
        coverage: 0,
      },
    }

    this.graphs.set(graph.id, graph)
    return graph
  }

  // 添加知识节点
  addNode(graphId: string, nodeData: Omit<KnowledgeNode, "id" | "connections" | "metadata">): KnowledgeNode {
    const graph = this.graphs.get(graphId)
    if (!graph) throw new Error("Graph not found")

    const node: KnowledgeNode = {
      ...nodeData,
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      connections: [],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        confidence: 0.8,
        verified: false,
      },
    }

    graph.nodes.push(node)
    this.updateGraphStats(graphId)
    this.updateNodeIndex(node, graphId)

    return node
  }

  // 创建节点连接
  createConnection(
    graphId: string,
    sourceId: string,
    targetId: string,
    connectionData: Omit<Connection, "targetId">,
  ): void {
    const graph = this.graphs.get(graphId)
    if (!graph) throw new Error("Graph not found")

    const sourceNode = graph.nodes.find((n) => n.id === sourceId)
    const targetNode = graph.nodes.find((n) => n.id === targetId)

    if (!sourceNode || !targetNode) throw new Error("Node not found")

    const connection: Connection = {
      ...connectionData,
      targetId,
    }

    sourceNode.connections.push(connection)

    // 如果是双向连接，也添加反向连接
    if (connection.bidirectional) {
      const reverseConnection: Connection = {
        ...connectionData,
        targetId: sourceId,
      }
      targetNode.connections.push(reverseConnection)
    }

    this.updateGraphStats(graphId)
  }

  // 智能连接推荐
  suggestConnections(
    graphId: string,
    nodeId: string,
  ): Array<{
    targetNode: KnowledgeNode
    suggestedType: Connection["type"]
    confidence: number
    reason: string
  }> {
    const graph = this.graphs.get(graphId)
    if (!graph) return []

    const sourceNode = graph.nodes.find((n) => n.id === nodeId)
    if (!sourceNode) return []

    const suggestions: Array<{
      targetNode: KnowledgeNode
      suggestedType: Connection["type"]
      confidence: number
      reason: string
    }> = []

    graph.nodes.forEach((targetNode) => {
      if (targetNode.id === nodeId) return
      if (sourceNode.connections.some((c) => c.targetId === targetNode.id)) return

      // 基于标签相似度
      const commonTags = sourceNode.tags.filter((tag) => targetNode.tags.includes(tag))
      if (commonTags.length > 0) {
        suggestions.push({
          targetNode,
          suggestedType: "related",
          confidence: Math.min(0.9, commonTags.length * 0.3),
          reason: `共同标签: ${commonTags.join(", ")}`,
        })
      }

      // 基于类型关系
      if (sourceNode.type === "concept" && targetNode.type === "example") {
        suggestions.push({
          targetNode,
          suggestedType: "example",
          confidence: 0.7,
          reason: "概念与示例的关系",
        })
      }

      // 基于难度层次
      if (sourceNode.difficulty < targetNode.difficulty && sourceNode.category === targetNode.category) {
        suggestions.push({
          targetNode,
          suggestedType: "prerequisite",
          confidence: 0.6,
          reason: "难度递进关系",
        })
      }

      // 基于内容相似度
      const contentSimilarity = this.calculateContentSimilarity(sourceNode.content, targetNode.content)
      if (contentSimilarity > 0.3) {
        suggestions.push({
          targetNode,
          suggestedType: "related",
          confidence: contentSimilarity,
          reason: "内容相似度高",
        })
      }
    })

    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5)
  }

  // 查找学习路径
  findLearningPath(graphId: string, startNodeId: string, endNodeId: string): KnowledgeNode[] {
    const graph = this.graphs.get(graphId)
    if (!graph) return []

    const visited = new Set<string>()
    const queue: Array<{ nodeId: string; path: string[] }> = [{ nodeId: startNodeId, path: [startNodeId] }]

    while (queue.length > 0) {
      const { nodeId, path } = queue.shift()!

      if (nodeId === endNodeId) {
        return path.map((id) => graph.nodes.find((n) => n.id === id)!).filter(Boolean)
      }

      if (visited.has(nodeId)) continue
      visited.add(nodeId)

      const node = graph.nodes.find((n) => n.id === nodeId)
      if (!node) continue

      // 优先选择前置条件连接
      const sortedConnections = node.connections.sort((a, b) => {
        const typeWeight = { prerequisite: 3, related: 2, example: 1, application: 1, opposite: 0, "part-of": 2 }
        return (typeWeight[b.type] || 0) - (typeWeight[a.type] || 0)
      })

      sortedConnections.forEach((connection) => {
        if (!visited.has(connection.targetId)) {
          queue.push({
            nodeId: connection.targetId,
            path: [...path, connection.targetId],
          })
        }
      })
    }

    return []
  }

  // 获取节点的邻居
  getNodeNeighbors(graphId: string, nodeId: string, depth = 1): KnowledgeNode[] {
    const graph = this.graphs.get(graphId)
    if (!graph) return []

    const visited = new Set<string>()
    const neighbors: KnowledgeNode[] = []
    const queue: Array<{ nodeId: string; currentDepth: number }> = [{ nodeId, currentDepth: 0 }]

    while (queue.length > 0) {
      const { nodeId: currentNodeId, currentDepth } = queue.shift()!

      if (visited.has(currentNodeId) || currentDepth > depth) continue
      visited.add(currentNodeId)

      const node = graph.nodes.find((n) => n.id === currentNodeId)
      if (!node) continue

      if (currentDepth > 0) {
        neighbors.push(node)
      }

      if (currentDepth < depth) {
        node.connections.forEach((connection) => {
          queue.push({
            nodeId: connection.targetId,
            currentDepth: currentDepth + 1,
          })
        })
      }
    }

    return neighbors
  }

  // 搜索知识节点
  searchNodes(
    query: string,
    domain?: string,
  ): Array<{
    node: KnowledgeNode
    graphId: string
    relevance: number
  }> {
    const results: Array<{
      node: KnowledgeNode
      graphId: string
      relevance: number
    }> = []

    this.graphs.forEach((graph, graphId) => {
      if (domain && graph.domain !== domain) return

      graph.nodes.forEach((node) => {
        let relevance = 0

        // 标题匹配
        if (node.title.toLowerCase().includes(query.toLowerCase())) {
          relevance += 0.8
        }

        // 内容匹配
        if (node.content.toLowerCase().includes(query.toLowerCase())) {
          relevance += 0.6
        }

        // 标签匹配
        node.tags.forEach((tag) => {
          if (tag.toLowerCase().includes(query.toLowerCase())) {
            relevance += 0.4
          }
        })

        if (relevance > 0) {
          results.push({ node, graphId, relevance })
        }
      })
    })

    return results.sort((a, b) => b.relevance - a.relevance)
  }

  // 获取图谱统计
  getGraphStats(graphId: string) {
    const graph = this.graphs.get(graphId)
    if (!graph) return null

    const nodesByType = graph.nodes.reduce(
      (acc, node) => {
        acc[node.type] = (acc[node.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const connectionsByType = graph.nodes.reduce(
      (acc, node) => {
        node.connections.forEach((conn) => {
          acc[conn.type] = (acc[conn.type] || 0) + 1
        })
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      ...graph.stats,
      nodesByType,
      connectionsByType,
      avgImportance: graph.nodes.reduce((sum, node) => sum + node.importance, 0) / graph.nodes.length,
      avgDifficulty: graph.nodes.reduce((sum, node) => sum + node.difficulty, 0) / graph.nodes.length,
    }
  }

  // 导出图谱
  exportGraph(graphId: string): string {
    const graph = this.graphs.get(graphId)
    if (!graph) throw new Error("Graph not found")

    return JSON.stringify(graph, null, 2)
  }

  // 导入图谱
  importGraph(data: string): KnowledgeGraph {
    const graph = JSON.parse(data) as KnowledgeGraph
    graph.id = `graph_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    graph.createdAt = new Date()
    graph.updatedAt = new Date()

    this.graphs.set(graph.id, graph)

    // 重建索引
    graph.nodes.forEach((node) => {
      this.updateNodeIndex(node, graph.id)
    })

    return graph
  }

  // 私有方法
  private updateGraphStats(graphId: string): void {
    const graph = this.graphs.get(graphId)
    if (!graph) return

    const totalConnections = graph.nodes.reduce((sum, node) => sum + node.connections.length, 0)

    graph.stats = {
      nodeCount: graph.nodes.length,
      connectionCount: totalConnections,
      avgConnections: graph.nodes.length > 0 ? totalConnections / graph.nodes.length : 0,
      coverage: this.calculateCoverage(graph),
    }

    graph.updatedAt = new Date()
  }

  private updateNodeIndex(node: KnowledgeNode, graphId: string): void {
    const keywords = [
      ...node.title.toLowerCase().split(/\s+/),
      ...node.tags.map((tag) => tag.toLowerCase()),
      node.category.toLowerCase(),
    ]

    keywords.forEach((keyword) => {
      if (!this.nodeIndex.has(keyword)) {
        this.nodeIndex.set(keyword, [])
      }
      const graphIds = this.nodeIndex.get(keyword)!
      if (!graphIds.includes(graphId)) {
        graphIds.push(graphId)
      }
    })
  }

  private calculateContentSimilarity(content1: string, content2: string): number {
    const words1 = content1.toLowerCase().split(/\s+/)
    const words2 = content2.toLowerCase().split(/\s+/)

    const intersection = words1.filter((word) => words2.includes(word))
    const union = [...new Set([...words1, ...words2])]

    return intersection.length / union.length
  }

  private calculateCoverage(graph: KnowledgeGraph): number {
    if (graph.nodes.length === 0) return 0

    const connectedNodes = new Set<string>()
    graph.nodes.forEach((node) => {
      if (node.connections.length > 0) {
        connectedNodes.add(node.id)
        node.connections.forEach((conn) => connectedNodes.add(conn.targetId))
      }
    })

    return connectedNodes.size / graph.nodes.length
  }

  // 获取所有图谱
  getAllGraphs(): KnowledgeGraph[] {
    return Array.from(this.graphs.values())
  }

  // 获取图谱
  getGraph(graphId: string): KnowledgeGraph | undefined {
    return this.graphs.get(graphId)
  }

  // 删除图谱
  deleteGraph(graphId: string): boolean {
    return this.graphs.delete(graphId)
  }

  // 更新节点
  updateNode(graphId: string, nodeId: string, updates: Partial<KnowledgeNode>): boolean {
    const graph = this.graphs.get(graphId)
    if (!graph) return false

    const nodeIndex = graph.nodes.findIndex((n) => n.id === nodeId)
    if (nodeIndex === -1) return false

    graph.nodes[nodeIndex] = {
      ...graph.nodes[nodeIndex],
      ...updates,
      metadata: {
        ...graph.nodes[nodeIndex].metadata,
        updatedAt: new Date(),
      },
    }

    this.updateGraphStats(graphId)
    return true
  }

  // 删除节点
  deleteNode(graphId: string, nodeId: string): boolean {
    const graph = this.graphs.get(graphId)
    if (!graph) return false

    // 删除节点
    graph.nodes = graph.nodes.filter((n) => n.id !== nodeId)

    // 删除指向该节点的连接
    graph.nodes.forEach((node) => {
      node.connections = node.connections.filter((conn) => conn.targetId !== nodeId)
    })

    this.updateGraphStats(graphId)
    return true
  }
}

// 单例实例
export const knowledgeGraphManager = new KnowledgeGraphManager()
