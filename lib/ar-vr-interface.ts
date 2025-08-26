// AR/VR界面管理系统
export interface XRDevice {
  id: string
  name: string
  type: "ar" | "vr" | "mixed"
  capabilities: {
    handTracking: boolean
    eyeTracking: boolean
    spatialMapping: boolean
    passthrough: boolean
    roomScale: boolean
  }
  status: "connected" | "disconnected" | "error"
  batteryLevel?: number
  lastConnected: Date
}

export interface SpatialElement {
  id: string
  type: "panel" | "button" | "menu" | "content" | "widget"
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  scale: { x: number; y: number; z: number }
  content: any
  interactive: boolean
  visible: boolean
  anchored: boolean
  metadata: Record<string, any>
}

export interface GestureEvent {
  type: "tap" | "pinch" | "swipe" | "grab" | "point" | "voice"
  position: { x: number; y: number; z: number }
  direction?: { x: number; y: number; z: number }
  intensity: number
  duration: number
  targetId?: string
  timestamp: number
}

export interface XRSession {
  id: string
  type: "immersive-ar" | "immersive-vr" | "inline"
  device: XRDevice
  startTime: Date
  duration: number
  elements: SpatialElement[]
  interactions: GestureEvent[]
  userPosition: { x: number; y: number; z: number }
  userRotation: { x: number; y: number; z: number }
  isActive: boolean
  status: "starting" | "active" | "paused" | "ended"
}

export class ARVRInterfaceManager {
  private static xrSession: XRSession | null = null
  private static spatialElements: Map<string, SpatialElement> = new Map()
  private static gestureHandlers: Map<string, (event: GestureEvent) => void> = new Map()
  private static isXRSupported = false
  private static currentDevice: XRDevice | null = null

  static async initialize(): Promise<boolean> {
    try {
      if (typeof navigator !== "undefined" && "xr" in navigator) {
        const xr = (navigator as any).xr
        const arSupported = await xr.isSessionSupported("immersive-ar")
        const vrSupported = await xr.isSessionSupported("immersive-vr")
        this.isXRSupported = arSupported || vrSupported
        
        if (this.isXRSupported) {
          console.log("XR支持已启用")
          await this.detectDevices()
        }
        return this.isXRSupported
      }
      return false
    } catch (error) {
      console.warn("XR初始化失败:", error)
      return false
    }
  }

  private static async detectDevices(): Promise<XRDevice[]> {
    const devices: XRDevice[] = []
    
    try {
      const mockDevices: XRDevice[] = [
        {
          id: "hololens-001",
          name: "Microsoft HoloLens 2",
          type: "ar",
          capabilities: {
            handTracking: true,
            eyeTracking: true,
            spatialMapping: true,
            passthrough: true,
            roomScale: true,
          },
          status: "connected",
          batteryLevel: 85,
          lastConnected: new Date(),
        },
        {
          id: "quest-001",
          name: "Meta Quest 3",
          type: "mixed",
          capabilities: {
            handTracking: true,
            eyeTracking: false,
            spatialMapping: true,
            passthrough: true,
            roomScale: true,
          },
          status: "connected",
          batteryLevel: 72,
          lastConnected: new Date(),
        },
      ]
      
      devices.push(...mockDevices)
      if (devices.length > 0) {
        this.currentDevice = devices[0]
      }
    } catch (error) {
      console.error("设备检测失败:", error)
    }
    
    return devices
  }

  static async startARSession(): Promise<boolean> {
    try {
      const session = await this.startXRSession("immersive-ar")
      return session !== null
    } catch (error) {
      console.error("启动AR会话失败:", error)
      return false
    }
  }

  static async startVRSession(): Promise<boolean> {
    try {
      const session = await this.startXRSession("immersive-vr")
      return session !== null
    } catch (error) {
      console.error("启动VR会话失败:", error)
      return false
    }
  }

  static async startXRSession(type: "immersive-ar" | "immersive-vr" | "inline" = "immersive-ar"): Promise<XRSession | null> {
    if (!this.isXRSupported || !this.currentDevice) {
      throw new Error("XR不支持或设备未连接")
    }

    try {
      const sessionId = `xr_session_${Date.now()}`
      
      this.xrSession = {
        id: sessionId,
        type,
        device: this.currentDevice,
        startTime: new Date(),
        duration: 0,
        elements: [],
        interactions: [],
        userPosition: { x: 0, y: 1.6, z: 0 },
        userRotation: { x: 0, y: 0, z: 0 },
        isActive: true,
        status: "starting",
      }

      await this.setupDefaultEnvironment()
      this.xrSession.status = "active"
      console.log(`XR会话已启动: ${sessionId}`)
      return this.xrSession
      
    } catch (error) {
      console.error("启动XR会话失败:", error)
      return null
    }
  }

  private static async setupDefaultEnvironment(): Promise<void> {
    if (!this.xrSession) return

    const mainMenu = this.createSpatialElement({
      type: "menu",
      position: { x: 0, y: 1.5, z: -2 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      content: {
        title: "AI搜索助手",
        items: [
          { id: "search", label: "智能搜索", icon: "🔍" },
          { id: "history", label: "搜索历史", icon: "📚" },
          { id: "settings", label: "设置", icon: "⚙️" },
          { id: "help", label: "帮助", icon: "❓" },
        ],
      },
      interactive: true,
      visible: true,
      anchored: true,
      metadata: { menuType: "main" },
    })

    const searchPanel = this.createSpatialElement({
      type: "panel",
      position: { x: 0, y: 1.2, z: -1.5 },
      rotation: { x: -15, y: 0, z: 0 },
      scale: { x: 1.2, y: 0.8, z: 1 },
      content: {
        type: "search_input",
        placeholder: "请说出您的问题或使用手势输入...",
        voiceEnabled: true,
        gestureEnabled: true,
      },
      interactive: true,
      visible: true,
      anchored: false,
      metadata: { panelType: "search" },
    })

    const resultsArea = this.createSpatialElement({
      type: "content",
      position: { x: 0, y: 1, z: -3 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 2, y: 1.5, z: 1 },
      content: {
        type: "results_container",
        maxItems: 5,
        layout: "grid",
        results: [],
      },
      interactive: true,
      visible: false,
      anchored: true,
      metadata: { containerType: "results" },
    })

    this.xrSession.elements.push(mainMenu, searchPanel, resultsArea)
  }

  static createSpatialElement(config: Omit<SpatialElement, "id">): SpatialElement {
    const element: SpatialElement = {
      id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...config,
    }

    this.spatialElements.set(element.id, element)
    return element
  }

  static createSpatialMenu(items: Array<{ label: string; action: string }>): string {
    const menuElement = this.createSpatialElement({
      type: "menu",
      position: { x: 0, y: 1.5, z: -2 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      content: {
        title: "空间菜单",
        items: items.map((item, index) => ({
          id: `menu_item_${index}`,
          label: item.label,
          action: item.action,
        })),
      },
      interactive: true,
      visible: true,
      anchored: true,
      metadata: { menuType: "spatial" },
    })

    if (this.xrSession) {
      this.xrSession.elements.push(menuElement)
    }

    return menuElement.id
  }

  static updateSpatialElement(elementId: string, updates: Partial<SpatialElement>): boolean {
    const element = this.spatialElements.get(elementId)
    if (!element) return false

    Object.assign(element, updates)
    this.spatialElements.set(elementId, element)
    this.renderElement(element)
    return true
  }

  private static renderElement(element: SpatialElement): void {
    if (!this.xrSession || !element.visible) return
    console.log(`渲染空间元素: ${element.id}`, element)
  }

  static handleGesture(gesture: Omit<GestureEvent, "timestamp">): void {
    const event: GestureEvent = {
      ...gesture,
      timestamp: Date.now(),
    }

    if (this.xrSession) {
      this.xrSession.interactions.push(event)
    }

    const targetElement = gesture.targetId 
      ? this.spatialElements.get(gesture.targetId)
      : this.findElementAtPosition(gesture.position)

    if (targetElement) {
      this.processElementInteraction(targetElement, event)
    }

    const handler = this.gestureHandlers.get(gesture.type)
    if (handler) {
      handler(event)
    }
  }

  private static findElementAtPosition(position: { x: number; y: number; z: number }): SpatialElement | null {
    for (const element of this.spatialElements.values()) {
      if (!element.visible || !element.interactive) continue

      const distance = Math.sqrt(
        Math.pow(element.position.x - position.x, 2) +
        Math.pow(element.position.y - position.y, 2) +
        Math.pow(element.position.z - position.z, 2)
      )

      if (distance < 0.5) {
        return element
      }
    }

    return null
  }

  private static processElementInteraction(element: SpatialElement, event: GestureEvent): void {
    switch (element.type) {
      case "button":
        if (event.type === "tap") {
          this.handleButtonClick(element, event)
        }
        break
      case "menu":
        if (event.type === "tap" || event.type === "point") {
          this.handleMenuInteraction(element, event)
        }
        break
      case "panel":
        if (event.type === "voice") {
          this.handleVoiceInput(element, event)
        }
        break
    }
  }

  private static handleButtonClick(element: SpatialElement, event: GestureEvent): void {
    console.log(`按钮被点击: ${element.id}`)
    this.showElementFeedback(element, "click")
    
    if (element.content?.action) {
      this.executeAction(element.content.action, element, event)
    }
  }

  private static handleMenuInteraction(element: SpatialElement, event: GestureEvent): void {
    if (!element.content?.items) return

    const selectedItem = this.getSelectedMenuItem(element, event.position)
    if (selectedItem) {
      console.log(`菜单项被选中: ${selectedItem.id}`)
      this.executeAction(selectedItem.action || selectedItem.id, element, event)
    }
  }

  private static getSelectedMenuItem(element: SpatialElement, position: { x: number; y: number; z: number }): any {
    return element.content?.items?.[0] || null
  }

  private static handleVoiceInput(element: SpatialElement, event: GestureEvent): void {
    if (element.content?.type === "search_input") {
      console.log("处理语音搜索输入")
      this.processVoiceSearch("示例语音查询")
    }
  }

  private static processVoiceSearch(query: string): void {
    console.log(`语音搜索: ${query}`)
    
    const resultsElement = Array.from(this.spatialElements.values())
      .find(e => e.content?.type === "results_container")
    
    if (resultsElement) {
      this.updateSpatialElement(resultsElement.id, { visible: true })
      
      const mockResults = [
        { title: "搜索结果1", content: "相关内容..." },
        { title: "搜索结果2", content: "相关内容..." },
        { title: "搜索结果3", content: "相关内容..." },
      ]
      
      this.updateSpatialElement(resultsElement.id, {
        content: { ...resultsElement.content, results: mockResults }
      })
    }
  }

  private static executeAction(action: string, element: SpatialElement, event: GestureEvent): void {
    switch (action) {
      case "search":
        this.activateSearchMode()
        break
      case "history":
        this.showSearchHistory()
        break
      case "settings":
        this.openSettings()
        break
      case "help":
        this.showHelp()
        break
      case "ai-assistant":
        this.openAIAssistant()
        break
      case "visualization":
        this.openDataVisualization()
        break
      case "collaboration":
        this.openCollaborationSpace()
        break
      default:
        console.log(`未知动作: ${action}`)
    }
  }

  private static activateSearchMode(): void {
    console.log("激活搜索模式")
    
    const searchPanel = Array.from(this.spatialElements.values())
      .find(e => e.content?.type === "search_input")
    
    if (searchPanel) {
      this.showElementFeedback(searchPanel, "highlight")
    }
  }

  private static showSearchHistory(): void {
    console.log("显示搜索历史")
    
    const historyPanel = this.createSpatialElement({
      type: "panel",
      position: { x: 1.5, y: 1.5, z: -2 },
      rotation: { x: 0, y: -30, z: 0 },
      scale: { x: 1, y: 1.2, z: 1 },
      content: {
        type: "history_list",
        items: [
          "人工智能的发展历程",
          "机器学习算法比较",
          "深度学习应用案例",
        ],
      },
      interactive: true,
      visible: true,
      anchored: true,
      metadata: { panelType: "history" },
    })

    if (this.xrSession) {
      this.xrSession.elements.push(historyPanel)
    }
  }

  private static openSettings(): void {
    console.log("打开设置")
    
    const settingsPanel = this.createSpatialElement({
      type: "panel",
      position: { x: -1.5, y: 1.5, z: -2 },
      rotation: { x: 0, y: 30, z: 0 },
      scale: { x: 1, y: 1.2, z: 1 },
      content: {
        type: "settings_panel",
        sections: [
          { title: "显示设置", options: ["亮度", "对比度", "字体大小"] },
          { title: "交互设置", options: ["手势灵敏度", "语音识别", "眼动追踪"] },
          { title: "隐私设置", options: ["数据收集", "位置信息", "使用统计"] },
        ],
      },
      interactive: true,
      visible: true,
      anchored: true,
      metadata: { panelType: "settings" },
    })

    if (this.xrSession) {
      this.xrSession.elements.push(settingsPanel)
    }
  }

  private static showHelp(): void {
    console.log("显示帮助")
    
    const helpPanel = this.createSpatialElement({
      type: "panel",
      position: { x: 0, y: 2, z: -1 },
      rotation: { x: -30, y: 0, z: 0 },
      scale: { x: 1.5, y: 1, z: 1 },
      content: {
        type: "help_content",
        sections: [
          {
            title: "手势操作",
            content: [
              "👆 点击 - 选择和确认",
              "👋 挥手 - 返回上级",
              "👌 捏合 - 缩放内容",
              "🗣️ 语音 - 说出问题进行搜索",
            ],
          },
          {
            title: "快速开始",
            content: [
              "1. 说出您的问题或点击搜索框",
              "2. 查看搜索结果和相关建议",
              "3. 点击结果获取详细信息",
              "4. 使用手势浏览和操作内容",
            ],
          },
        ],
      },
      interactive: true,
      visible: true,
      anchored: false,
      metadata: { panelType: "help" },
    })

    if (this.xrSession) {
      this.xrSession.elements.push(helpPanel)
    }
  }

  private static openAIAssistant(): void {
    console.log("打开AI助手")
    
    const aiPanel = this.createSpatialElement({
      type: "panel",
      position: { x: 0, y: 1.5, z: -1.5 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1.5, y: 1.2, z: 1 },
      content: {
        type: "ai_assistant",
        title: "AI智能助手",
        status: "ready",
        capabilities: ["问答", "分析", "建议", "创作"],
      },
      interactive: true,
      visible: true,
      anchored: true,
      metadata: { panelType: "ai_assistant" },
    })

    if (this.xrSession) {
      this.xrSession.elements.push(aiPanel)
    }
  }

  private static openDataVisualization(): void {
    console.log("打开数据可视化")
    
    const vizPanel = this.createSpatialElement({
      type: "content",
      position: { x: 2, y: 1.5, z: -2 },
      rotation: { x: 0, y: -45, z: 0 },
      scale: { x: 1.5, y: 1.5, z: 1 },
      content: {
        type: "data_visualization",
        charts: ["柱状图", "折线图", "饼图", "散点图"],
        data: [],
      },
      interactive: true,
      visible: true,
      anchored: true,
      metadata: { panelType: "visualization" },
    })

    if (this.xrSession) {
      this.xrSession.elements.push(vizPanel)
    }
  }

  private static openCollaborationSpace(): void {
    console.log("打开协作空间")
    
    const collabPanel = this.createSpatialElement({
      type: "content",
      position: { x: -2, y: 1.5, z: -2 },
      rotation: { x: 0, y: 45, z: 0 },
      scale: { x: 1.5, y: 1.5, z: 1 },
      content: {
        type: "collaboration_space",
        participants: [],
        tools: ["白板", "便签", "投票", "讨论"],
      },
      interactive: true,
      visible: true,
      anchored: true,
      metadata: { panelType: "collaboration" },
    })

    if (this.xrSession) {
      this.xrSession.elements.push(collabPanel)
    }
  }

  private static showElementFeedback(element: SpatialElement, type: "click" | "highlight" | "error"): void {
    console.log(`显示元素反馈: ${element.id}, 类型: ${type}`)
  }

  static registerGestureHandler(gestureType: string, handler: (event: GestureEvent) => void): void {
    this.gestureHandlers.set(gestureType, handler)
  }

  static unregisterGestureHandler(gestureType: string): void {
    this.gestureHandlers.delete(gestureType)
  }

  static updateUserPosition(position: { x: number; y: number; z: number }): void {
    if (this.xrSession) {
      this.xrSession.userPosition = position
      this.adjustUIForUserPosition(position)
    }
  }

  private static adjustUIForUserPosition(position: { x: number; y: number; z: number }): void {
    for (const element of this.spatialElements.values()) {
      if (element.anchored) continue

      const distance = Math.sqrt(
        Math.pow(element.position.x - position.x, 2) +
        Math.pow(element.position.z - position.z, 2)
      )

      if (distance > 5) {
        const direction = {
          x: (element.position.x - position.x) / distance,
          z: (element.position.z - position.z) / distance,
        }

        this.updateSpatialElement(element.id, {
          position: {
            x: position.x + direction.x * 3,
            y: element.position.y,
            z: position.z + direction.z * 3,
          },
        })
      }
    }
  }

  static endSession(): boolean {
    if (!this.xrSession) return false

    this.xrSession.isActive = false
    this.xrSession.status = "ended"
    this.xrSession.duration = Date.now() - this.xrSession.startTime.getTime()

    console.log(`XR会话已结束: ${this.xrSession.id}, 持续时间: ${this.xrSession.duration}ms`)

    this.spatialElements.clear()
    this.gestureHandlers.clear()
    this.xrSession = null

    return true
  }

  static getSession(): XRSession | null {
    return this.xrSession
  }

  static isSupported(): boolean {
    return this.isXRSupported
  }

  static getCurrentDevice(): XRDevice | null {
    return this.currentDevice
  }

  static getSpatialElements(): SpatialElement[] {
    return Array.from(this.spatialElements.values())
  }

  static getSessionStats(): {
    duration: number
    interactions: number
    elementsCreated: number
    gesturesProcessed: number
  } | null {
    if (!this.xrSession) return null

    return {
      duration: this.xrSession.isActive 
        ? Date.now() - this.xrSession.startTime.getTime()
        : this.xrSession.duration,
      interactions: this.xrSession.interactions.length,
      elementsCreated: this.xrSession.elements.length,
      gesturesProcessed: this.xrSession.interactions.filter(i => 
        ["tap", "pinch", "swipe", "grab", "point"].includes(i.type)
      ).length,
    }
  }
}

export const arvrInterface = ARVRInterfaceManager
