export interface KnowledgeNode {
  id: string
  label: string
  type: "concept" | "topic" | "skill" | "resource"
  description?: string
  difficulty: 1 | 2 | 3 | 4 | 5 // 难度等级
  importance: number // 重要性权重 0-1
  x?: number
  y?: number
  size?: number
  color?: string
  metadata?: {
    tags?: string[]
    sources?: string[]
    lastUpdated?: number
    learningTime?: number // 预估学习时间（分钟）
  }
}

export interface KnowledgeEdge {
  id: string
  source: string
  target: string
  type: "prerequisite" | "related" | "contains" | "leads_to"
  weight: number // 关系强度 0-1
  description?: string
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
  metadata: {
    title: string
    description: string
    createdAt: number
    updatedAt: number
    version: string
  }
}

export class KnowledgeGraphManager {
  private static readonly STORAGE_KEY = "ai-search-knowledge-graphs"
  private static readonly NODE_COLORS = {
    concept: "#3B82F6", // 蓝色
    topic: "#10B981", // 绿色
    skill: "#F59E0B", // 橙色
    resource: "#8B5CF6", // 紫色
  }

  static getKnowledgeGraphs(): KnowledgeGraph[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  static generateKnowledgeGraph(question: string, content: string): KnowledgeGraph {
    const concepts = this.extractConcepts(content)
    const nodes = this.createNodes(concepts)
    const edges = this.createEdges(nodes, content)

    // 计算节点位置
    this.calculateLayout(nodes, edges)

    return {
      nodes,
      edges,
      metadata: {
        title: question.length > 50 ? question.slice(0, 50) + "..." : question,
        description: "基于AI分析生成的知识图谱",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: "1.0",
      },
    }
  }

  private static extractConcepts(content: string): Array<{
    name: string
    type: KnowledgeNode["type"]
    description: string
    difficulty: number
    importance: number
  }> {
    // 简化的概念提取逻辑
    const concepts = []

    // 提取关键概念
    const keywordPatterns = [
      { pattern: /学习方法|学习技巧|学习策略/g, type: "skill" as const, difficulty: 2 },
      { pattern: /时间管理|计划制定|目标设定/g, type: "skill" as const, difficulty: 3 },
      { pattern: /心理调节|心态调整|情绪管理/g, type: "concept" as const, difficulty: 4 },
      { pattern: /知识体系|知识结构|学科知识/g, type: "topic" as const, difficulty: 3 },
      { pattern: /实践应用|项目实战|案例分析/g, type: "resource" as const, difficulty: 4 },
    ]

    keywordPatterns.forEach((pattern, index) => {
      const matches = content.match(pattern.pattern)
      if (matches) {
        matches.forEach((match) => {
          concepts.push({
            name: match,
            type: pattern.type,
            description: `与${match}相关的重要概念`,
            difficulty: pattern.difficulty,
            importance: 0.8 - index * 0.1,
          })
        })
      }
    })

    // 如果没有找到足够的概念，添加默认概念
    if (concepts.length < 3) {
      const defaultConcepts = [
        { name: "核心理念", type: "concept" as const, description: "问题的核心思想", difficulty: 2, importance: 0.9 },
        { name: "实施方法", type: "skill" as const, description: "具体的实施步骤", difficulty: 3, importance: 0.8 },
        {
          name: "相关资源",
          type: "resource" as const,
          description: "支持性资源和工具",
          difficulty: 2,
          importance: 0.7,
        },
        { name: "进阶应用", type: "topic" as const, description: "高级应用场景", difficulty: 4, importance: 0.6 },
      ]
      concepts.push(...defaultConcepts.slice(0, 6 - concepts.length))
    }

    return concepts.slice(0, 8) // 限制节点数量
  }

  private static createNodes(
    concepts: Array<{
      name: string
      type: KnowledgeNode["type"]
      description: string
      difficulty: number
      importance: number
    }>,
  ): KnowledgeNode[] {
    return concepts.map((concept, index) => ({
      id: `node-${index}`,
      label: concept.name,
      type: concept.type,
      description: concept.description,
      difficulty: Math.min(5, Math.max(1, concept.difficulty)) as 1 | 2 | 3 | 4 | 5,
      importance: concept.importance,
      size: 20 + concept.importance * 30,
      color: this.NODE_COLORS[concept.type],
      metadata: {
        tags: [concept.type],
        lastUpdated: Date.now(),
        learningTime: concept.difficulty * 30, // 预估学习时间
      },
    }))
  }

  private static createEdges(nodes: KnowledgeNode[], content: string): KnowledgeEdge[] {
    const edges: KnowledgeEdge[] = []
    let edgeId = 0

    // 基于节点类型和重要性创建边
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i]
        const node2 = nodes[j]

        // 根据节点类型确定关系类型
        let edgeType: KnowledgeEdge["type"] = "related"
        let weight = 0.3

        if (node1.type === "concept" && node2.type === "skill") {
          edgeType = "leads_to"
          weight = 0.7
        } else if (node1.type === "skill" && node2.type === "resource") {
          edgeType = "contains"
          weight = 0.6
        } else if (node1.difficulty < node2.difficulty) {
          edgeType = "prerequisite"
          weight = 0.8
        }

        // 基于重要性调整权重
        weight *= (node1.importance + node2.importance) / 2

        if (weight > 0.4 || edges.length < 3) {
          edges.push({
            id: `edge-${edgeId++}`,
            source: node1.id,
            target: node2.id,
            type: edgeType,
            weight,
            description: `${node1.label}与${node2.label}的关系`,
          })
        }
      }
    }

    return edges.slice(0, 12) // 限制边的数量
  }

  private static calculateLayout(nodes: KnowledgeNode[], edges: KnowledgeEdge[]) {
    const centerX = 400
    const centerY = 300
    const radius = 150

    // 使用圆形布局
    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI
      node.x = centerX + Math.cos(angle) * radius
      node.y = centerY + Math.sin(angle) * radius
    })

    // 根据重要性调整位置
    const importantNodes = nodes.filter((n) => n.importance > 0.7)
    importantNodes.forEach((node, index) => {
      const angle = (index / importantNodes.length) * 2 * Math.PI
      node.x = centerX + Math.cos(angle) * (radius * 0.6)
      node.y = centerY + Math.sin(angle) * (radius * 0.6)
    })
  }

  static saveKnowledgeGraph(graph: KnowledgeGraph): void {
    const graphs = this.getKnowledgeGraphs()
    graphs.unshift(graph)

    // 限制保存的图谱数量
    if (graphs.length > 20) {
      graphs.splice(20)
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(graphs))
  }

  static getRelatedConcepts(nodeId: string, graph: KnowledgeGraph): KnowledgeNode[] {
    const relatedEdges = graph.edges.filter((edge) => edge.source === nodeId || edge.target === nodeId)
    const relatedNodeIds = relatedEdges.map((edge) => (edge.source === nodeId ? edge.target : edge.source))

    return graph.nodes.filter((node) => relatedNodeIds.includes(node.id))
  }

  static getLearningPath(startNodeId: string, endNodeId: string, graph: KnowledgeGraph): KnowledgeNode[] {
    // 简化的路径查找算法
    const visited = new Set<string>()
    const path: KnowledgeNode[] = []

    const findPath = (currentId: string, targetId: string): boolean => {
      if (currentId === targetId) return true
      if (visited.has(currentId)) return false

      visited.add(currentId)
      const currentNode = graph.nodes.find((n) => n.id === currentId)
      if (currentNode) path.push(currentNode)

      // 查找前置条件边
      const prerequisiteEdges = graph.edges.filter((edge) => edge.target === currentId && edge.type === "prerequisite")

      for (const edge of prerequisiteEdges) {
        if (findPath(edge.source, targetId)) return true
      }

      path.pop()
      return false
    }

    findPath(startNodeId, endNodeId)
    return path
  }
}
