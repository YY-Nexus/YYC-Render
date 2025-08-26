export interface MindMapNode {
  id: string
  text: string
  x: number
  y: number
  level: number
  parentId?: string
  children: string[]
  color: string
  isExpanded: boolean
}

export interface MindMapData {
  id: string
  title: string
  nodes: MindMapNode[]
  connections: { from: string; to: string }[]
  createdAt: number
  updatedAt: number
}

export class MindMapManager {
  private static readonly STORAGE_KEY = "ai-search-mindmaps"

  static getMindMaps(): MindMapData[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("获取思维导图失败:", error)
      return []
    }
  }

  static createMindMap(title: string, content: string): MindMapData {
    const id = `mindmap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const nodes = this.parseContentToNodes(content)
    const connections = this.generateConnections(nodes)

    const mindMap: MindMapData = {
      id,
      title,
      nodes,
      connections,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    this.saveMindMap(mindMap)
    return mindMap
  }

  private static parseContentToNodes(content: string): MindMapNode[] {
    const lines = content.split("\n").filter((line) => line.trim())
    const nodes: MindMapNode[] = []
    const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"]

    // 创建根节点
    const rootNode: MindMapNode = {
      id: "root",
      text: "主题",
      x: 400,
      y: 300,
      level: 0,
      children: [],
      color: colors[0],
      isExpanded: true,
    }
    nodes.push(rootNode)

    // 解析内容创建子节点
    lines.forEach((line, index) => {
      const level = this.getIndentLevel(line)
      const text = line.trim().replace(/^[-*•]\s*/, "")

      if (text) {
        const nodeId = `node_${index}`
        const angle = index * 60 * (Math.PI / 180)
        const radius = 150 + level * 100

        const node: MindMapNode = {
          id: nodeId,
          text,
          x: 400 + Math.cos(angle) * radius,
          y: 300 + Math.sin(angle) * radius,
          level: level + 1,
          parentId: level === 0 ? "root" : this.findParentId(nodes, level),
          children: [],
          color: colors[(level + 1) % colors.length],
          isExpanded: true,
        }

        nodes.push(node)

        // 更新父节点的children数组
        const parent = nodes.find((n) => n.id === node.parentId)
        if (parent) {
          parent.children.push(nodeId)
        }
      }
    })

    return nodes
  }

  private static getIndentLevel(line: string): number {
    const match = line.match(/^(\s*)/)
    return match ? Math.floor(match[1].length / 2) : 0
  }

  private static findParentId(nodes: MindMapNode[], level: number): string {
    // 简化的父节点查找逻辑
    const parentLevel = level - 1
    const parentNodes = nodes.filter((n) => n.level === parentLevel)
    return parentNodes.length > 0 ? parentNodes[parentNodes.length - 1].id : "root"
  }

  private static generateConnections(nodes: MindMapNode[]): { from: string; to: string }[] {
    const connections: { from: string; to: string }[] = []

    nodes.forEach((node) => {
      if (node.parentId) {
        connections.push({
          from: node.parentId,
          to: node.id,
        })
      }
    })

    return connections
  }

  static saveMindMap(mindMap: MindMapData): void {
    if (typeof window === "undefined") return

    try {
      const mindMaps = this.getMindMaps()
      const existingIndex = mindMaps.findIndex((m) => m.id === mindMap.id)

      if (existingIndex !== -1) {
        mindMaps[existingIndex] = { ...mindMap, updatedAt: Date.now() }
      } else {
        mindMaps.unshift(mindMap)
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(mindMaps))
    } catch (error) {
      console.error("保存思维导图失败:", error)
    }
  }

  static getMindMapById(id: string): MindMapData | null {
    const mindMaps = this.getMindMaps()
    return mindMaps.find((m) => m.id === id) || null
  }

  static deleteMindMap(id: string): void {
    if (typeof window === "undefined") return

    try {
      const mindMaps = this.getMindMaps()
      const filteredMindMaps = mindMaps.filter((m) => m.id !== id)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredMindMaps))
    } catch (error) {
      console.error("删除思维导图失败:", error)
    }
  }

  static updateNodePosition(mindMapId: string, nodeId: string, x: number, y: number): void {
    const mindMap = this.getMindMapById(mindMapId)
    if (!mindMap) return

    const node = mindMap.nodes.find((n) => n.id === nodeId)
    if (node) {
      node.x = x
      node.y = y
      this.saveMindMap(mindMap)
    }
  }

  static toggleNodeExpansion(mindMapId: string, nodeId: string): void {
    const mindMap = this.getMindMapById(mindMapId)
    if (!mindMap) return

    const node = mindMap.nodes.find((n) => n.id === nodeId)
    if (node) {
      node.isExpanded = !node.isExpanded
      this.saveMindMap(mindMap)
    }
  }

  static addChildNode(mindMapId: string, parentId: string, text: string): void {
    const mindMap = this.getMindMapById(mindMapId)
    if (!mindMap) return

    const parent = mindMap.nodes.find((n) => n.id === parentId)
    if (!parent) return

    const newNodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"]

    const newNode: MindMapNode = {
      id: newNodeId,
      text,
      x: parent.x + 150,
      y: parent.y + 50,
      level: parent.level + 1,
      parentId: parentId,
      children: [],
      color: colors[parent.level % colors.length],
      isExpanded: true,
    }

    mindMap.nodes.push(newNode)
    parent.children.push(newNodeId)
    mindMap.connections.push({ from: parentId, to: newNodeId })

    this.saveMindMap(mindMap)
  }

  static exportMindMap(id: string): string {
    const mindMap = this.getMindMapById(id)
    return mindMap ? JSON.stringify(mindMap, null, 2) : ""
  }
}
