export interface Device {
  id: string
  name: string
  type: "desktop" | "mobile" | "tablet" | "watch" | "tv" | "ar" | "vr"
  platform: "windows" | "macos" | "linux" | "ios" | "android" | "web"
  capabilities: {
    screen: { width: number; height: number; density: number }
    input: ("touch" | "keyboard" | "mouse" | "voice" | "gesture")[]
    sensors: ("accelerometer" | "gyroscope" | "gps" | "camera" | "microphone")[]
    connectivity: ("wifi" | "cellular" | "bluetooth" | "nfc")[]
    storage: { available: number; total: number }
    battery?: { level: number; charging: boolean }
  }
  status: "online" | "offline" | "syncing" | "error"
  lastSeen: Date
  location?: {
    latitude: number
    longitude: number
    accuracy: number
    timestamp: Date
  }
  userAgent: string
  sessionId: string
}

export interface SyncSession {
  id: string
  userId: string
  devices: Device[]
  primaryDevice: string
  startTime: Date
  lastActivity: Date
  isActive: boolean
  syncedData: {
    conversations: string[]
    searches: string[]
    preferences: Record<string, any>
    history: string[]
    bookmarks: string[]
  }
  conflicts: SyncConflict[]
}

export interface SyncConflict {
  id: string
  type: "data" | "preference" | "state"
  description: string
  devices: string[]
  data: {
    local: any
    remote: any
    timestamp: Date
  }
  resolution: "manual" | "auto" | "pending"
  resolvedAt?: Date
}

export interface CrossDeviceContext {
  id: string
  userId: string
  type: "conversation" | "search" | "workflow" | "document"
  data: any
  metadata: {
    createdOn: string
    lastModified: Date
    version: number
    checksum: string
  }
  deviceStates: Map<string, {
    version: number
    lastSync: Date
    status: "synced" | "pending" | "conflict"
  }>
  transferHistory: Array<{
    fromDevice: string
    toDevice: string
    timestamp: Date
    success: boolean
    error?: string
  }>
}

export interface DeviceRecommendation {
  targetDevice: Device
  reason: string
  confidence: number
  benefits: string[]
  requirements: string[]
  estimatedTime: number
}

export class CrossDeviceSyncManager {
  private static devices: Map<string, Device> = new Map()
  private static syncSessions: Map<string, SyncSession> = new Map()
  private static contexts: Map<string, CrossDeviceContext> = new Map()
  private static syncQueue: Array<{
    contextId: string
    targetDevices: string[]
    priority: number
    timestamp: Date
  }> = []

  // Helper function to generate cryptographically secure random strings
  private static generateSecureRandomString(length: number): string {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(Math.ceil(length * 3 / 4)) // Generate more bytes than needed
      crypto.getRandomValues(array)
      // Use base64url encoding for URL-safe random strings
      const base64 = btoa(String.fromCharCode(...array))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
      return base64.substring(0, length)
    }
    // For Node.js environments, crypto should be available via require('crypto').webcrypto
    throw new Error('Cryptographic random number generator not available')
  }

  static async initialize(): Promise<void> {
    await this.detectCurrentDevice()
    this.startDeviceDiscovery()
    this.startSyncService()
    this.setupEventListeners()
  }

  private static async detectCurrentDevice(): Promise<Device> {
    const deviceId = this.generateDeviceId()
    
    const device: Device = {
      id: deviceId,
      name: this.getDeviceName(),
      type: this.detectDeviceType(),
      platform: this.detectPlatform(),
      capabilities: await this.detectCapabilities(),
      status: "online",
      lastSeen: new Date(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      sessionId: `session_${Date.now()}`,
    }

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        })
        
        device.location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(),
        }
      } catch (error) {
        console.warn("无法获取位置信息:", error)
      }
    }

    this.devices.set(deviceId, device)
    return device
  }

  private static generateDeviceId(): string {
    if (typeof localStorage !== "undefined") {
      const existingId = localStorage.getItem("deviceId")
      if (existingId) return existingId
    }

    const deviceId = `device_${Date.now()}_${this.generateSecureRandomString(9)}`
    
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("deviceId", deviceId)
    }
    
    return deviceId
  }

  private static getDeviceName(): string {
    if (typeof navigator !== "undefined") {
      const ua = navigator.userAgent
      
      if (ua.includes("iPhone")) return "iPhone"
      if (ua.includes("iPad")) return "iPad"
      if (ua.includes("Android")) return "Android设备"
      if (ua.includes("Mac")) return "Mac"
      if (ua.includes("Windows")) return "Windows PC"
      if (ua.includes("Linux")) return "Linux设备"
    }
    
    return "未知设备"
  }

  private static detectDeviceType(): Device["type"] {
    if (typeof window === "undefined") return "desktop"
    
    const ua = navigator.userAgent
    const screen = window.screen
    
    if (ua.includes("Mobile") || screen.width < 768) return "mobile"
    if (ua.includes("Tablet") || (screen.width >= 768 && screen.width < 1024)) return "tablet"
    
    return "desktop"
  }

  private static detectPlatform(): Device["platform"] {
    if (typeof navigator === "undefined") return "web"
    
    const ua = navigator.userAgent
    
    if (ua.includes("iPhone") || ua.includes("iPad")) return "ios"
    if (ua.includes("Android")) return "android"
    if (ua.includes("Mac")) return "macos"
    if (ua.includes("Windows")) return "windows"
    if (ua.includes("Linux")) return "linux"
    
    return "web"
  }

  private static async detectCapabilities(): Promise<Device["capabilities"]> {
    const capabilities: Device["capabilities"] = {
      screen: {
        width: typeof window !== "undefined" ? window.screen.width : 1920,
        height: typeof window !== "undefined" ? window.screen.height : 1080,
        density: typeof window !== "undefined" ? window.devicePixelRatio : 1,
      },
      input: ["keyboard", "mouse"],
      sensors: [],
      connectivity: ["wifi"],
      storage: {
        available: 0,
        total: 0,
      },
    }

    if (typeof navigator !== "undefined") {
      if ("ontouchstart" in window) {
        capabilities.input.push("touch")
      }

      if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
        capabilities.input.push("voice")
      }

      if ("DeviceMotionEvent" in window) {
        capabilities.sensors.push("accelerometer", "gyroscope")
      }

      if ("geolocation" in navigator) {
        capabilities.sensors.push("gps")
      }

      if (navigator.mediaDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices()
          if (devices.some(d => d.kind === "videoinput")) {
            capabilities.sensors.push("camera")
          }
          if (devices.some(d => d.kind === "audioinput")) {
            capabilities.sensors.push("microphone")
          }
        } catch (error) {
          console.warn("无法检测媒体设备:", error)
        }
      }

      if ("storage" in navigator && "estimate" in navigator.storage) {
        try {
          const estimate = await navigator.storage.estimate()
          capabilities.storage = {
            available: estimate.quota || 0,
            total: estimate.usage || 0,
          }
        } catch (error) {
          console.warn("无法检测存储信息:", error)
        }
      }

      if ("getBattery" in navigator) {
        try {
          const battery = await (navigator as any).getBattery()
          capabilities.battery = {
            level: battery.level,
            charging: battery.charging,
          }
        } catch (error) {
          console.warn("无法检测电池信息:", error)
        }
      }

      if ("connection" in navigator) {
        const connection = (navigator as any).connection
        if (connection.type === "cellular") {
          capabilities.connectivity.push("cellular")
        }
      }

      if ("bluetooth" in navigator) {
        capabilities.connectivity.push("bluetooth")
      }
    }

    return capabilities
  }

  private static startDeviceDiscovery(): void {
    setInterval(() => {
      this.discoverNearbyDevices()
    }, 30000)
  }

  static async discoverDevices(): Promise<Device[]> {
    return this.discoverNearbyDevices()
  }

  private static async discoverNearbyDevices(): Promise<Device[]> {
    const mockDevices: Device[] = [
      {
        id: "device_mobile_001",
        name: "iPhone 15 Pro",
        type: "mobile",
        platform: "ios",
        capabilities: {
          screen: { width: 393, height: 852, density: 3 },
          input: ["touch", "voice"],
          sensors: ["accelerometer", "gyroscope", "gps", "camera", "microphone"],
          connectivity: ["wifi", "cellular", "bluetooth"],
          storage: { available: 128000000000, total: 256000000000 },
          battery: { level: 0.85, charging: false },
        },
        status: "online",
        lastSeen: new Date(),
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
        sessionId: "session_mobile_001",
      },
      {
        id: "device_tablet_001",
        name: "iPad Pro",
        type: "tablet",
        platform: "ios",
        capabilities: {
          screen: { width: 1024, height: 1366, density: 2 },
          input: ["touch", "keyboard"],
          sensors: ["accelerometer", "gyroscope", "camera", "microphone"],
          connectivity: ["wifi", "bluetooth"],
          storage: { available: 512000000000, total: 1000000000000 },
          battery: { level: 0.92, charging: true },
        },
        status: "online",
        lastSeen: new Date(),
        userAgent: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)",
        sessionId: "session_tablet_001",
      },
    ]

    mockDevices.forEach(device => {
      this.devices.set(device.id, device)
    })

    return mockDevices
  }

  static createSyncSession(userId: string, deviceIds: string[]): SyncSession {
    const sessionId = `sync_${Date.now()}_${this.generateSecureRandomString(9)}`
    
    const devices = deviceIds.map(id => this.devices.get(id)).filter(Boolean) as Device[]
    
    const session: SyncSession = {
      id: sessionId,
      userId,
      devices,
      primaryDevice: deviceIds[0],
      startTime: new Date(),
      lastActivity: new Date(),
      isActive: true,
      syncedData: {
        conversations: [],
        searches: [],
        preferences: {},
        history: [],
        bookmarks: [],
      },
      conflicts: [],
    }

    this.syncSessions.set(sessionId, session)
    return session
  }

  static createCollaborationSession(sessionName: string): string {
    const sessionId = `collab_${Date.now()}_${this.generateSecureRandomString(9)}`
    
    console.log(`创建协作会话: ${sessionName} (ID: ${sessionId})`)
    
    return sessionId
  }

  static async syncContextToDevice(
    contextId: string,
    targetDeviceId: string,
    priority: number = 1
  ): Promise<boolean> {
    const context = this.contexts.get(contextId)
    const targetDevice = this.devices.get(targetDeviceId)

    if (!context || !targetDevice) {
      return false
    }

    try {
      if (targetDevice.status !== "online") {
        console.warn(`目标设备 ${targetDevice.name} 不在线`)
        return false
      }

      if (!this.isDeviceCompatible(targetDevice, context)) {
        console.warn(`设备 ${targetDevice.name} 不兼容此上下文`)
        return false
      }

      this.syncQueue.push({
        contextId,
        targetDevices: [targetDeviceId],
        priority,
        timestamp: new Date(),
      })

      await this.executeSyncOperation(contextId, targetDeviceId)

      const deviceState = context.deviceStates.get(targetDeviceId) || {
        version: 0,
        lastSync: new Date(0),
        status: "pending",
      }

      deviceState.version = context.metadata.version
      deviceState.lastSync = new Date()
      deviceState.status = "synced"
      context.deviceStates.set(targetDeviceId, deviceState)

      context.transferHistory.push({
        fromDevice: context.metadata.createdOn,
        toDevice: targetDeviceId,
        timestamp: new Date(),
        success: true,
      })

      return true

    } catch (error) {
      console.error("同步失败:", error)
      
      context.transferHistory.push({
        fromDevice: context.metadata.createdOn,
        toDevice: targetDeviceId,
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
      })

      return false
    }
  }

  static async handoffToDevice(deviceId: string, context: any): Promise<boolean> {
    const targetDevice = this.devices.get(deviceId)
    if (!targetDevice) {
      console.error(`设备 ${deviceId} 不存在`)
      return false
    }

    try {
      console.log(`正在切换到设备: ${targetDevice.name}`)
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log(`成功切换到设备: ${targetDevice.name}`)
      return true
      
    } catch (error) {
      console.error("设备切换失败:", error)
      return false
    }
  }

  private static isDeviceCompatible(device: Device, context: CrossDeviceContext): boolean {
    switch (context.type) {
      case "conversation":
        return device.capabilities.input.includes("keyboard") || 
               device.capabilities.input.includes("voice")
      
      case "search":
        return device.capabilities.connectivity.includes("wifi") || 
               device.capabilities.connectivity.includes("cellular")
      
      case "document":
        return device.capabilities.screen.width >= 320 && 
               device.capabilities.screen.height >= 480
      
      default:
        return true
    }
  }

  private static async executeSyncOperation(contextId: string, targetDeviceId: string): Promise<void> {
    const context = this.contexts.get(contextId)
    if (!context) throw new Error("上下文不存在")

    await new Promise(resolve => setTimeout(resolve, 1000))

    console.log(`同步上下文 ${contextId} 到设备 ${targetDeviceId}`)
  }

  static recommendBestDevice(
    contextType: CrossDeviceContext["type"],
    currentDeviceId: string
  ): DeviceRecommendation[] {
    const currentDevice = this.devices.get(currentDeviceId)
    if (!currentDevice) return []

    const recommendations: DeviceRecommendation[] = []
    const availableDevices = Array.from(this.devices.values())
      .filter(device => device.id !== currentDeviceId && device.status === "online")

    availableDevices.forEach(device => {
      const recommendation = this.evaluateDeviceForContext(device, contextType, currentDevice)
      if (recommendation.confidence > 0.5) {
        recommendations.push(recommendation)
      }
    })

    return recommendations.sort((a, b) => b.confidence - a.confidence)
  }

  private static evaluateDeviceForContext(
    device: Device,
    contextType: CrossDeviceContext["type"],
    currentDevice: Device
  ): DeviceRecommendation {
    let confidence = 0
    const benefits: string[] = []
    const requirements: string[] = []

    switch (contextType) {
      case "conversation":
        if (device.type === "desktop" && currentDevice.type === "mobile") {
          confidence += 0.3
          benefits.push("更大的屏幕便于长时间对话")
          benefits.push("更好的键盘输入体验")
        }
        
        if (device.capabilities.input.includes("voice")) {
          confidence += 0.2
          benefits.push("支持语音输入")
        }
        
        requirements.push("网络连接")
        break

      case "search":
        if (device.capabilities.screen.width > currentDevice.capabilities.screen.width) {
          confidence += 0.2
          benefits.push("更大屏幕显示更多搜索结果")
        }
        
        if (device.type === "desktop") {
          confidence += 0.3
          benefits.push("更强的处理能力")
          benefits.push("更好的多任务处理")
        }
        
        requirements.push("网络连接", "足够的存储空间")
        break

      case "document":
        if (device.type === "tablet" || device.type === "desktop") {
          confidence += 0.4
          benefits.push("更适合文档阅读和编辑")
        }
        
        if (device.capabilities.screen.width >= 1024) {
          confidence += 0.2
          benefits.push("高分辨率显示")
        }
        
        requirements.push("足够的屏幕空间", "文档处理能力")
        break

      case "workflow":
        if (device.type === "desktop") {
          confidence += 0.5
          benefits.push("最佳的工作流程处理体验")
          benefits.push("多窗口支持")
        }
        
        requirements.push("高性能处理器", "充足内存")
        break
    }

    if (device.status === "online") {
      confidence += 0.1
    }

    if (device.capabilities.battery && device.capabilities.battery.level > 0.2) {
      confidence += 0.1
    } else if (device.capabilities.battery && device.capabilities.battery.level <= 0.2) {
      confidence -= 0.2
      requirements.push("充电")
    }

    return {
      targetDevice: device,
      reason: this.generateRecommendationReason(device, contextType),
      confidence: Math.min(1, confidence),
      benefits,
      requirements,
      estimatedTime: this.estimateTransferTime(contextType, device),
    }
  }

  private static generateRecommendationReason(
    device: Device,
    contextType: CrossDeviceContext["type"]
  ): string {
    const deviceTypeNames = {
      desktop: "桌面电脑",
      mobile: "手机",
      tablet: "平板电脑",
      watch: "智能手表",
      tv: "智能电视",
      ar: "AR设备",
      vr: "VR设备",
    }

    const contextTypeNames = {
      conversation: "对话",
      search: "搜索",
      document: "文档处理",
      workflow: "工作流程",
    }

    return `${deviceTypeNames[device.type]}更适合${contextTypeNames[contextType]}任务`
  }

  private static estimateTransferTime(
    contextType: CrossDeviceContext["type"],
    targetDevice: Device
  ): number {
    const baseTimes = {
      conversation: 2000,
      search: 1000,
      document: 5000,
      workflow: 3000,
    }

    let time = baseTimes[contextType]

    if (targetDevice.type === "mobile") {
      time *= 1.2
    } else if (targetDevice.type === "desktop") {
      time *= 0.8
    }

    if (targetDevice.capabilities.connectivity.includes("wifi")) {
      time *= 0.9
    } else if (targetDevice.capabilities.connectivity.includes("cellular")) {
      time *= 1.3
    }

    return Math.round(time)
  }

  static resolveSyncConflict(
    conflictId: string,
    resolution: "local" | "remote" | "merge"
  ): boolean {
    let targetSession: SyncSession | null = null
    let targetConflict: SyncConflict | null = null

    for (const session of this.syncSessions.values()) {
      const conflict = session.conflicts.find(c => c.id === conflictId)
      if (conflict) {
        targetSession = session
        targetConflict = conflict
        break
      }
    }

    if (!targetSession || !targetConflict) {
      return false
    }

    try {
      switch (resolution) {
        case "local":
          targetConflict.resolution = "auto"
          break
        
        case "remote":
          targetConflict.resolution = "auto"
          break
        
        case "merge":
          targetConflict.resolution = "auto"
          break
      }

      targetConflict.resolvedAt = new Date()
      
      const conflictIndex = targetSession.conflicts.indexOf(targetConflict)
      if (conflictIndex > -1) {
        targetSession.conflicts.splice(conflictIndex, 1)
      }

      return true

    } catch (error) {
      console.error("解决冲突失败:", error)
      return false
    }
  }

  private static startSyncService(): void {
    setInterval(() => {
      this.processSyncQueue()
    }, 5000)

    setInterval(() => {
      this.cleanupExpiredSessions()
    }, 300000)
  }

  private static async processSyncQueue(): Promise<void> {
    if (this.syncQueue.length === 0) return

    this.syncQueue.sort((a, b) => b.priority - a.priority)

    const batch = this.syncQueue.splice(0, 5)

    for (const item of batch) {
      for (const deviceId of item.targetDevices) {
        try {
          await this.syncContextToDevice(item.contextId, deviceId, item.priority)
        } catch (error) {
          console.error(`同步失败: ${item.contextId} -> ${deviceId}`, error)
        }
      }
    }
  }

  private static cleanupExpiredSessions(): void {
    const now = Date.now()
    const expireTime = 24 * 60 * 60 * 1000

    for (const [sessionId, session] of this.syncSessions.entries()) {
      if (now - session.lastActivity.getTime() > expireTime) {
        this.syncSessions.delete(sessionId)
      }
    }
  }

  private static setupEventListeners(): void {
    if (typeof window !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          this.pauseSync()
        } else {
          this.resumeSync()
        }
      })

      window.addEventListener("online", () => {
        this.resumeSync()
      })

      window.addEventListener("offline", () => {
        this.pauseSync()
      })
    }
  }

  private static pauseSync(): void {
    console.log("同步已暂停")
  }

  private static resumeSync(): void {
    console.log("同步已恢复")
  }

  static destroy(): void {
    this.devices.clear()
    this.syncSessions.clear()
    this.contexts.clear()
    this.syncQueue.length = 0
    console.log("跨设备同步管理器已销毁")
  }

  static getConnectedDevices(): Device[] {
    return Array.from(this.devices.values()).filter(device => device.status === "online")
  }

  static getActiveSyncSessions(): SyncSession[] {
    return Array.from(this.syncSessions.values()).filter(session => session.isActive)
  }

  static getSyncConflicts(): SyncConflict[] {
    const conflicts: SyncConflict[] = []
    this.syncSessions.forEach(session => {
      conflicts.push(...session.conflicts)
    })
    return conflicts
  }

  static createContext(
    userId: string,
    type: CrossDeviceContext["type"],
    data: any
  ): CrossDeviceContext {
    const contextId = `context_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const currentDeviceId = Array.from(this.devices.keys())[0]

    const context: CrossDeviceContext = {
      id: contextId,
      userId,
      type,
      data,
      metadata: {
        createdOn: currentDeviceId,
        lastModified: new Date(),
        version: 1,
        checksum: this.calculateChecksum(data),
      },
      deviceStates: new Map(),
      transferHistory: [],
    }

    this.contexts.set(contextId, context)
    return context
  }

  private static calculateChecksum(data: any): string {
    const str = JSON.stringify(data)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(36)
  }

  static getContext(contextId: string): CrossDeviceContext | undefined {
    return this.contexts.get(contextId)
  }

  static getUserContexts(userId: string): CrossDeviceContext[] {
    return Array.from(this.contexts.values()).filter(ctx => ctx.userId === userId)
  }
}

export const crossDeviceSync = CrossDeviceSyncManager
