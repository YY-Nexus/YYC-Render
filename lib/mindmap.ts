export interface MindMapNode {
  id: string
  text: string
  level: number
  children: MindMapNode[]
  x?: number
  y?: number
  color?: string
}

export interface MindMapData {
  title: string
  rootNode: MindMapNode
  totalNodes: number
}

export class MindMapGenerator {
  private static readonly COLORS = [
    "#3B82F6", // blue
    "#10B981", // green
    "#F59E0B", // yellow
    "#EF4444", // red
    "#8B5CF6", // purple
    "#06B6D4", // cyan
    "#F97316", // orange
    "#84CC16", // lime
  ]

  static generateMindMap(question: string, content: string): MindMapData {
    const sections = this.parseContent(content)
    const rootNode = this.createRootNode(question)

    let nodeId = 1
    sections.forEach((section, index) => {
      const sectionNode: MindMapNode = {
        id: `node-${nodeId++}`,
        text: section.title,
        level: 1,
        children: [],
        color: this.COLORS[index % this.COLORS.length],
      }

      // 添加子节点
      section.points.forEach((point) => {
        const pointNode: MindMapNode = {
          id: `node-${nodeId++}`,
          text: point,
          level: 2,
          children: [],
          color: this.COLORS[index % this.COLORS.length],
        }
        sectionNode.children.push(pointNode)
      })

      rootNode.children.push(sectionNode)
    })

    // 计算节点位置
    this.calculatePositions(rootNode)

    return {
      title: question,
      rootNode,
      totalNodes: nodeId - 1,
    }
  }

  private static parseContent(content: string): Array<{ title: string; points: string[] }> {
    const sections: Array<{ title: string; points: string[] }> = []

    // 按段落分割内容
    const paragraphs = content.split("\n\n").filter((p) => p.trim())

    paragraphs.forEach((paragraph) => {
      const lines = paragraph.split("\n").filter((l) => l.trim())

      if (lines.length > 0) {
        // 检查是否是标题（包含数字编号或特殊格式）
        const firstLine = lines[0].trim()
        if (this.isTitle(firstLine)) {
          const title = this.cleanTitle(firstLine)
          const points = this.extractPoints(lines.slice(1).join(" "))

          sections.push({ title, points })
        } else {
          // 如果不是标题，尝试提取关键点
          const points = this.extractPoints(paragraph)
          if (points.length > 0) {
            sections.push({
              title: "关键要点",
              points,
            })
          }
        }
      }
    })

    // 如果没有找到明确的章节，创建默认结构
    if (sections.length === 0) {
      const points = this.extractPoints(content)
      sections.push({
        title: "主要内容",
        points: points.slice(0, 6), // 限制点数
      })
    }

    return sections.slice(0, 6) // 限制章节数
  }

  private static isTitle(text: string): boolean {
    // 检查是否包含数字编号、特殊符号等标题特征
    return /^[\d��二三四五六七八九十]+[、．.]/.test(text) || /^#+\s/.test(text) || text.length < 30
  }

  private static cleanTitle(title: string): string {
    return title
      .replace(/^[\d一二三四五六七八九十]+[、．.]\s*/, "")
      .replace(/^#+\s*/, "")
      .trim()
  }

  private static extractPoints(text: string): string[] {
    const sentences = text.split(/[。！？；]/).filter((s) => s.trim() && s.length > 10)

    return sentences
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length > 5 && sentence.length < 100)
      .slice(0, 4) // 每个章节最多4个要点
  }

  private static createRootNode(question: string): MindMapNode {
    return {
      id: "root",
      text: question.length > 30 ? question.slice(0, 30) + "..." : question,
      level: 0,
      children: [],
      x: 0,
      y: 0,
      color: "#1F2937",
    }
  }

  private static calculatePositions(rootNode: MindMapNode) {
    const centerX = 400
    const centerY = 300
    const levelDistance = 200
    const nodeSpacing = 120

    rootNode.x = centerX
    rootNode.y = centerY

    // 计算第一级节点位置（围绕中心节点）
    const firstLevelNodes = rootNode.children
    const angleStep = (2 * Math.PI) / Math.max(firstLevelNodes.length, 1)

    firstLevelNodes.forEach((node, index) => {
      const angle = index * angleStep - Math.PI / 2 // 从顶部开始
      node.x = centerX + Math.cos(angle) * levelDistance
      node.y = centerY + Math.sin(angle) * levelDistance

      // 计算第二级节点位置
      const secondLevelNodes = node.children
      if (secondLevelNodes.length > 0) {
        const startAngle = angle - (Math.PI / 6) * (secondLevelNodes.length - 1) * 0.5
        const childAngleStep = Math.PI / 6

        secondLevelNodes.forEach((childNode, childIndex) => {
          const childAngle = startAngle + childIndex * childAngleStep
          childNode.x = node.x! + Math.cos(childAngle) * (levelDistance * 0.7)
          childNode.y = node.y! + Math.sin(childAngle) * (levelDistance * 0.7)
        })
      }
    })
  }
}
