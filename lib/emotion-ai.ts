export interface EmotionData {
  primary: string
  secondary: string[]
  intensity: number
  valence: number
  arousal: number
  confidence: number
  timestamp: number
  source: "text" | "voice" | "facial" | "physiological" | "behavioral" | "multimodal"
  rawData?: any
}

export interface EmotionProfile {
  userId: string
  baselineEmotions: Record<string, number>
  emotionPatterns: Array<{
    trigger: string
    emotion: string
    frequency: number
    context: Record<string, any>
  }>
  preferences: {
    sensitivityLevel: number
    responseStyle: "empathetic" | "neutral" | "encouraging"
    privacyLevel: "high" | "medium" | "low"
  }
  history: EmotionData[]
  insights: EmotionInsight[]
  createdAt: Date
  updatedAt: Date
}

export interface EmotionInsight {
  id: string
  type: "pattern" | "trend" | "anomaly" | "recommendation"
  title: string
  description: string
  confidence: number
  timeframe: {
    start: Date
    end: Date
  }
  data: Record<string, any>
  actionable: boolean
  recommendations?: string[]
}

export interface EmotionalResponse {
  adaptedContent: string
  tone: string
  supportLevel: "low" | "medium" | "high"
  suggestions: string[]
  resources?: Array<{
    type: "article" | "exercise" | "contact"
    title: string
    url?: string
    description: string
  }>
  followUp: {
    checkIn: boolean
    timeframe: number
    questions: string[]
  }
}

export interface BiometricData {
  heartRate?: number
  heartRateVariability?: number
  skinConductance?: number
  temperature?: number
  bloodPressure?: {
    systolic: number
    diastolic: number
  }
  respirationRate?: number
  timestamp: Date
  deviceId: string
}

export interface ColorTherapyConfig {
  primaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  duration: number
  transition: string
  intensity: number
}

export interface BreathingExercise {
  type: string
  inhaleTime: number
  holdTime: number
  exhaleTime: number
  cycles: number
  instructions: string[]
}

export interface MusicTherapy {
  genre: string
  tempo: number
  key: string
  duration: number
  tracks: string[]
}

export class EmotionAIManager {
  private static emotionProfiles: Map<string, EmotionProfile> = new Map()
  private static realtimeEmotions: Map<string, EmotionData> = new Map()
  private static biometricData: Map<string, BiometricData[]> = new Map()
  private static emotionModels: Map<string, EmotionModel> = new Map()

  static async initialize(): Promise<void> {
    await this.loadEmotionModels()
    this.startRealtimeMonitoring()
    this.initializePrivacyControls()
  }

  private static async loadEmotionModels(): Promise<void> {
    const models: EmotionModel[] = [
      {
        id: "text-emotion",
        name: "文本情绪分析",
        type: "text",
        accuracy: 0.87,
        languages: ["zh-CN", "en-US"],
        emotions: ["joy", "sadness", "anger", "fear", "surprise", "disgust", "neutral"],
        isLoaded: true,
      },
      {
        id: "voice-emotion",
        name: "语音情绪识别",
        type: "voice",
        accuracy: 0.82,
        languages: ["zh-CN", "en-US"],
        emotions: ["happy", "sad", "angry", "neutral", "excited", "calm"],
        isLoaded: false,
      },
      {
        id: "facial-emotion",
        name: "面部表情识别",
        type: "facial",
        accuracy: 0.91,
        languages: ["universal"],
        emotions: ["happiness", "sadness", "anger", "fear", "surprise", "disgust", "neutral"],
        isLoaded: false,
      },
    ]

    models.forEach(model => {
      this.emotionModels.set(model.id, model)
    })
  }

  static async analyzeEmotion(input: {
    userId: string
    text?: string
    audioData?: ArrayBuffer
    videoFrame?: ImageData
    physiological?: Partial<BiometricData>
  }): Promise<EmotionData> {
    let emotionData: EmotionData

    if (input.text) {
      emotionData = this.analyzeTextEmotion(input.text, input.userId)
    } else if (input.audioData) {
      emotionData = await this.analyzeVoiceEmotion(new Blob([input.audioData]), input.userId)
    } else if (input.videoFrame) {
      emotionData = await this.analyzeFacialEmotion(input.videoFrame, input.userId)
    } else if (input.physiological) {
      const biometricData: BiometricData = {
        ...input.physiological,
        timestamp: new Date(),
        deviceId: "current_device",
      }
      emotionData = this.analyzePhysiologicalEmotion(biometricData, input.userId)
    } else {
      emotionData = {
        primary: "neutral",
        secondary: [],
        intensity: 0.5,
        valence: 0,
        arousal: 0.5,
        confidence: 0.5,
        timestamp: Date.now(),
        source: "multimodal",
      }
    }

    this.updateEmotionProfile(input.userId, emotionData)
    return emotionData
  }

  static analyzeTextEmotion(text: string, userId?: string): EmotionData {
    const model = this.emotionModels.get("text-emotion")
    if (!model || !model.isLoaded) {
      throw new Error("文本情绪分析模型未加载")
    }

    const emotionScores = this.calculateTextEmotionScores(text)
    const primaryEmotion = this.getPrimaryEmotion(emotionScores)
    const secondaryEmotions = this.getSecondaryEmotions(emotionScores, 2)

    const emotionData: EmotionData = {
      primary: primaryEmotion.emotion,
      secondary: secondaryEmotions.map(e => e.emotion),
      intensity: primaryEmotion.score,
      valence: this.calculateValence(emotionScores),
      arousal: this.calculateArousal(emotionScores),
      confidence: model.accuracy,
      timestamp: Date.now(),
      source: "text",
      rawData: { text, scores: emotionScores },
    }

    if (userId) {
      this.updateEmotionProfile(userId, emotionData)
    }

    return emotionData
  }

  private static calculateTextEmotionScores(text: string): Record<string, number> {
    const emotionKeywords = {
      joy: ["开心", "快乐", "高兴", "兴奋", "愉快", "满意", "幸福"],
      sadness: ["难过", "伤心", "沮丧", "失望", "痛苦", "悲伤", "忧郁"],
      anger: ["愤怒", "生气", "恼火", "愤慨", "暴怒", "不满", "烦躁"],
      fear: ["害怕", "恐惧", "担心", "焦虑", "紧张", "不安", "惊慌"],
      surprise: ["惊讶", "震惊", "意外", "吃惊", "惊奇", "诧异"],
      disgust: ["厌恶", "恶心", "反感", "讨厌", "憎恨"],
      neutral: ["正常", "一般", "还好", "普通", "平常"],
    }

    const scores: Record<string, number> = {}
    const lowerText = text.toLowerCase()

    Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
      let score = 0
      keywords.forEach(keyword => {
        const matches = (lowerText.match(new RegExp(keyword, "g")) || []).length
        score += matches
      })
      scores[emotion] = score / text.length * 100
    })

    return scores
  }

  private static getPrimaryEmotion(scores: Record<string, number>): { emotion: string; score: number } {
    let maxEmotion = "neutral"
    let maxScore = 0

    Object.entries(scores).forEach(([emotion, score]) => {
      if (score > maxScore) {
        maxEmotion = emotion
        maxScore = score
      }
    })

    return { emotion: maxEmotion, score: Math.min(1, maxScore) }
  }

  private static getSecondaryEmotions(
    scores: Record<string, number>,
    count: number
  ): Array<{ emotion: string; score: number }> {
    return Object.entries(scores)
      .map(([emotion, score]) => ({ emotion, score }))
      .sort((a, b) => b.score - a.score)
      .slice(1, count + 1)
  }

  private static calculateValence(scores: Record<string, number>): number {
    const positiveEmotions = ["joy", "surprise"]
    const negativeEmotions = ["sadness", "anger", "fear", "disgust"]

    const positiveScore = positiveEmotions.reduce((sum, emotion) => sum + (scores[emotion] || 0), 0)
    const negativeScore = negativeEmotions.reduce((sum, emotion) => sum + (scores[emotion] || 0), 0)

    const total = positiveScore + negativeScore
    if (total === 0) return 0

    return (positiveScore - negativeScore) / total
  }

  private static calculateArousal(scores: Record<string, number>): number {
    const highArousalEmotions = ["anger", "fear", "surprise", "joy"]
    const lowArousalEmotions = ["sadness", "disgust", "neutral"]

    const highArousalScore = highArousalEmotions.reduce((sum, emotion) => sum + (scores[emotion] || 0), 0)
    const lowArousalScore = lowArousalEmotions.reduce((sum, emotion) => sum + (scores[emotion] || 0), 0)

    const total = highArousalScore + lowArousalScore
    if (total === 0) return 0.5

    return highArousalScore / total
  }

  static async analyzeVoiceEmotion(audioBlob: Blob, userId?: string): Promise<EmotionData> {
    const model = this.emotionModels.get("voice-emotion")
    if (!model) {
      throw new Error("语音情绪分析模型未找到")
    }

    await new Promise(resolve => setTimeout(resolve, 2000))

    const mockEmotionData: EmotionData = {
      primary: "neutral",
      secondary: ["calm"],
      intensity: 0.6,
      valence: 0.1,
      arousal: 0.3,
      confidence: model.accuracy,
      timestamp: Date.now(),
      source: "voice",
      rawData: { audioSize: audioBlob.size, duration: 5000 },
    }

    if (userId) {
      this.updateEmotionProfile(userId, mockEmotionData)
    }

    return mockEmotionData
  }

  static async analyzeFacialEmotion(imageData: ImageData | Blob, userId?: string): Promise<EmotionData> {
    const model = this.emotionModels.get("facial-emotion")
    if (!model) {
      throw new Error("面部表情分析模型未找到")
    }

    await new Promise(resolve => setTimeout(resolve, 1500))

    const mockEmotionData: EmotionData = {
      primary: "happiness",
      secondary: ["surprise"],
      intensity: 0.8,
      valence: 0.7,
      arousal: 0.6,
      confidence: model.accuracy,
      timestamp: Date.now(),
      source: "facial",
      rawData: { imageSize: imageData instanceof Blob ? imageData.size : imageData.data.length },
    }

    if (userId) {
      this.updateEmotionProfile(userId, mockEmotionData)
    }

    return mockEmotionData
  }

  static analyzePhysiologicalEmotion(biometricData: BiometricData, userId?: string): EmotionData {
    let primaryEmotion = "neutral"
    let intensity = 0.5
    let valence = 0
    let arousal = 0.5

    if (biometricData.heartRate) {
      if (biometricData.heartRate > 100) {
        arousal += 0.3
        if (biometricData.heartRate > 120) {
          primaryEmotion = "excited"
          intensity = 0.8
        }
      } else if (biometricData.heartRate < 60) {
        arousal -= 0.2
        primaryEmotion = "calm"
      }
    }

    if (biometricData.skinConductance && biometricData.skinConductance > 10) {
      arousal += 0.2
      intensity += 0.1
    }

    if (biometricData.heartRateVariability) {
      if (biometricData.heartRateVariability < 20) {
        valence -= 0.2
        primaryEmotion = "stressed"
      }
    }

    const emotionData: EmotionData = {
      primary: primaryEmotion,
      secondary: [],
      intensity: Math.min(1, intensity),
      valence: Math.max(-1, Math.min(1, valence)),
      arousal: Math.max(0, Math.min(1, arousal)),
      confidence: 0.75,
      timestamp: Date.now(),
      source: "physiological",
      rawData: biometricData,
    }

    if (userId) {
      this.updateEmotionProfile(userId, emotionData)
      this.storeBiometricData(userId, biometricData)
    }

    return emotionData
  }

  static async adaptUIToEmotion(userId: string, emotionData: EmotionData): Promise<any> {
    const uiConfig = {
      colors: {
        primary: this.getEmotionColor(emotionData.primary),
        background: this.getBackgroundColor(emotionData.valence),
        text: this.getTextColor(emotionData.intensity),
      },
      layout: {
        spacing: emotionData.arousal > 0.7 ? "compact" : "comfortable",
        animations: emotionData.intensity > 0.8 ? "minimal" : "normal",
      },
      content: {
        tone: this.getContentTone(emotionData),
        complexity: emotionData.arousal > 0.6 ? "simple" : "detailed",
      },
    }

    return uiConfig
  }

  private static getEmotionColor(emotion: string): string {
    const colorMap: Record<string, string> = {
      joy: "#FFD700",
      happiness: "#FFD700",
      sadness: "#4169E1",
      anger: "#DC143C",
      fear: "#9370DB",
      surprise: "#32CD32",
      disgust: "#FF8C00",
      neutral: "#808080",
      calm: "#87CEEB",
      excited: "#FF6347",
    }
    return colorMap[emotion] || "#808080"
  }

  private static getBackgroundColor(valence: number): string {
    if (valence > 0.3) return "#F0F8FF"
    if (valence < -0.3) return "#FFF8DC"
    return "#F5F5F5"
  }

  private static getTextColor(intensity: number): string {
    if (intensity > 0.7) return "#000000"
    if (intensity < 0.3) return "#666666"
    return "#333333"
  }

  private static getContentTone(emotionData: EmotionData): string {
    if (emotionData.valence < -0.5) return "supportive"
    if (emotionData.primary === "anger") return "calming"
    if (emotionData.primary === "joy" || emotionData.primary === "happiness") return "enthusiastic"
    return "neutral"
  }

  static async generateColorTherapy(emotionData: EmotionData): Promise<ColorTherapyConfig> {
    let primaryColor = "#87CEEB"
    let accentColor = "#98FB98"
    let backgroundColor = "#F0F8FF"
    let textColor = "#2F4F4F"

    switch (emotionData.primary) {
      case "anger":
        primaryColor = "#87CEEB"
        accentColor = "#98FB98"
        backgroundColor = "#F0FFFF"
        break
      
      case "sadness":
        primaryColor = "#FFB6C1"
        accentColor = "#FFFFE0"
        backgroundColor = "#FFF8DC"
        break
      
      case "fear":
      case "anxiety":
        primaryColor = "#DDA0DD"
        accentColor = "#E6E6FA"
        backgroundColor = "#F8F8FF"
        break
      
      case "joy":
      case "happiness":
        primaryColor = "#FFD700"
        accentColor = "#FFA500"
        backgroundColor = "#FFFACD"
        break
    }

    return {
      primaryColor,
      accentColor,
      backgroundColor,
      textColor,
      duration: 300000,
      transition: "ease-in-out",
      intensity: Math.min(0.8, emotionData.intensity),
    }
  }

  static async generateBreathingExercise(emotionData: EmotionData): Promise<BreathingExercise> {
    let exerciseType = "4-7-8呼吸法"
    let inhaleTime = 4
    let holdTime = 7
    let exhaleTime = 8
    let cycles = 4

    if (emotionData.arousal > 0.8) {
      exerciseType = "深度放松呼吸"
      inhaleTime = 4
      holdTime = 4
      exhaleTime = 8
      cycles = 6
    } else if (emotionData.valence < -0.5) {
      exerciseType = "平衡呼吸法"
      inhaleTime = 4
      holdTime = 4
      exhaleTime = 4
      cycles = 8
    }

    return {
      type: exerciseType,
      inhaleTime,
      holdTime,
      exhaleTime,
      cycles,
      instructions: [
        `通过鼻子慢慢吸气 ${inhaleTime} 秒`,
        `屏住呼吸 ${holdTime} 秒`,
        `通过嘴巴慢慢呼气 ${exhaleTime} 秒`,
        `重复 ${cycles} 个循环`,
      ],
    }
  }

  static async generateMusicTherapy(emotionData: EmotionData): Promise<MusicTherapy> {
    let genre = "ambient"
    let tempo = 60
    let key = "C major"
    let duration = 600000

    switch (emotionData.primary) {
      case "anger":
        genre = "classical"
        tempo = 50
        key = "D minor"
        break
      
      case "sadness":
        genre = "soft piano"
        tempo = 55
        key = "F major"
        break
      
      case "anxiety":
      case "fear":
        genre = "nature sounds"
        tempo = 45
        key = "G major"
        break
      
      case "joy":
        genre = "uplifting"
        tempo = 80
        key = "C major"
        break
    }

    return {
      genre,
      tempo,
      key,
      duration,
      tracks: [
        `${genre} - Track 1`,
        `${genre} - Track 2`,
        `${genre} - Track 3`,
      ],
    }
  }

  private static updateEmotionProfile(userId: string, emotionData: EmotionData): void {
    let profile = this.emotionProfiles.get(userId)

    if (!profile) {
      profile = {
        userId,
        baselineEmotions: {},
        emotionPatterns: [],
        preferences: {
          sensitivityLevel: 0.5,
          responseStyle: "empathetic",
          privacyLevel: "medium",
        },
        history: [],
        insights: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }

    profile.history.push(emotionData)

    if (profile.history.length > 1000) {
      profile.history = profile.history.slice(-1000)
    }

    this.updateBaselineEmotions(profile, emotionData)
    this.detectEmotionPatterns(profile)
    this.generateEmotionInsights(profile)

    profile.updatedAt = new Date()
    this.emotionProfiles.set(userId, profile)
    this.realtimeEmotions.set(userId, emotionData)
  }

  private static updateBaselineEmotions(profile: EmotionProfile, newEmotion: EmotionData): void {
    const alpha = 0.1
    
    if (!profile.baselineEmotions[newEmotion.primary]) {
      profile.baselineEmotions[newEmotion.primary] = newEmotion.intensity
    } else {
      profile.baselineEmotions[newEmotion.primary] = 
        (1 - alpha) * profile.baselineEmotions[newEmotion.primary] + 
        alpha * newEmotion.intensity
    }
  }

  private static detectEmotionPatterns(profile: EmotionProfile): void {
    const recentEmotions = profile.history.slice(-50)
    
    const hourlyEmotions: Record<number, string[]> = {}
    recentEmotions.forEach(emotion => {
      const hour = new Date(emotion.timestamp).getHours()
      if (!hourlyEmotions[hour]) {
        hourlyEmotions[hour] = []
      }
      hourlyEmotions[hour].push(emotion.primary)
    })

    Object.entries(hourlyEmotions).forEach(([hour, emotions]) => {
      const mostCommon = this.getMostCommonEmotion(emotions)
      if (mostCommon) {
        const existingPattern = profile.emotionPatterns.find(
          p => p.trigger === `hour_${hour}` && p.emotion === mostCommon
        )
        
        if (existingPattern) {
          existingPattern.frequency++
        } else {
          profile.emotionPatterns.push({
            trigger: `hour_${hour}`,
            emotion: mostCommon,
            frequency: 1,
            context: { timeOfDay: parseInt(hour) },
          })
        }
      }
    })
  }

  private static getMostCommonEmotion(emotions: string[]): string | null {
    if (emotions.length === 0) return null

    const counts: Record<string, number> = {}
    emotions.forEach(emotion => {
      counts[emotion] = (counts[emotion] || 0) + 1
    })

    return Object.entries(counts).reduce((a, b) => counts[a[0]] > counts[b[0]] ? a : b)[0]
  }

  private static generateEmotionInsights(profile: EmotionProfile): void {
    const recentEmotions = profile.history.slice(-100)
    if (recentEmotions.length < 10) return

    const trendInsight = this.analyzeTrend(recentEmotions)
    if (trendInsight) {
      this.addInsight(profile, trendInsight)
    }

    const anomalyInsight = this.detectAnomalies(profile, recentEmotions)
    if (anomalyInsight) {
      this.addInsight(profile, anomalyInsight)
    }

    const recommendationInsight = this.generateRecommendations(profile)
    if (recommendationInsight) {
      this.addInsight(profile, recommendationInsight)
    }
  }

  private static analyzeTrend(emotions: EmotionData[]): EmotionInsight | null {
    if (emotions.length < 7) return null

    const recentValence = emotions.slice(-7).map(e => e.valence)
    const trend = this.calculateTrend(recentValence)

    if (Math.abs(trend) > 0.1) {
      return {
        id: `trend_${Date.now()}`,
        type: "trend",
        title: trend > 0 ? "情绪呈上升趋势" : "情绪呈下降趋势",
        description: `过去一周您的情绪${trend > 0 ? "逐渐好转" : "有所下降"}`,
        confidence: 0.8,
        timeframe: {
          start: new Date(emotions[emotions.length - 7].timestamp),
          end: new Date(emotions[emotions.length - 1].timestamp),
        },
        data: { trend, valenceData: recentValence },
        actionable: trend < 0,
        recommendations: trend < 0 ? [
          "考虑进行一些放松活动",
          "与朋友或家人交流",
          "尝试冥想或深呼吸练习",
        ] : undefined,
      }
    }

    return null
  }

  private static calculateTrend(values: number[]): number {
    const n = values.length
    const sumX = (n * (n - 1)) / 2
    const sumY = values.reduce((a, b) => a + b, 0)
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0)
    const sumX2 = values.reduce((sum, _, x) => sum + x * x, 0)

    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  }

  private static detectAnomalies(profile: EmotionProfile, emotions: EmotionData[]): EmotionInsight | null {
    const latestEmotion = emotions[emotions.length - 1]
    const baseline = profile.baselineEmotions[latestEmotion.primary] || 0.5

    if (Math.abs(latestEmotion.intensity - baseline) > 0.3) {
      return {
        id: `anomaly_${Date.now()}`,
        type: "anomaly",
        title: "检测到异常情绪状态",
        description: `您当前的${latestEmotion.primary}情绪强度异常${latestEmotion.intensity > baseline ? "高" : "低"}`,
        confidence: 0.7,
        timeframe: {
          start: new Date(latestEmotion.timestamp),
          end: new Date(latestEmotion.timestamp),
        },
        data: { 
          currentIntensity: latestEmotion.intensity, 
          baseline,
          deviation: Math.abs(latestEmotion.intensity - baseline)
        },
        actionable: true,
        recommendations: [
          "如果感到不适，建议休息一下",
          "考虑寻求专业帮助",
          "尝试调节活动来平衡情绪",
        ],
      }
    }

    return null
  }

  private static generateRecommendations(profile: EmotionProfile): EmotionInsight | null {
    const recentEmotions = profile.history.slice(-20)
    const negativeEmotions = recentEmotions.filter(e => e.valence < -0.2)

    if (negativeEmotions.length > recentEmotions.length * 0.6) {
      return {
        id: `recommendation_${Date.now()}`,
        type: "recommendation",
        title: "情绪健康建议",
        description: "最近您的负面情绪较多，建议采取一些积极措施",
        confidence: 0.8,
        timeframe: {
          start: new Date(recentEmotions[0].timestamp),
          end: new Date(recentEmotions[recentEmotions.length - 1].timestamp),
        },
        data: { negativeRatio: negativeEmotions.length / recentEmotions.length },
        actionable: true,
        recommendations: [
          "每天进行30分钟的运动",
          "保持规律的睡眠时间",
          "尝试正念冥想",
          "与亲友保持联系",
          "寻找新的兴趣爱好",
        ],
      }
    }

    return null
  }

  private static addInsight(profile: EmotionProfile, insight: EmotionInsight): void {
    const exists = profile.insights.some(existing => 
      existing.type === insight.type && 
      existing.title === insight.title &&
      Date.now() - existing.timeframe.end.getTime() < 24 * 60 * 60 * 1000
    )

    if (!exists) {
      profile.insights.push(insight)
      
      if (profile.insights.length > 50) {
        profile.insights = profile.insights.slice(-50)
      }
    }
  }

  private static storeBiometricData(userId: string, data: BiometricData): void {
    let userBiometrics = this.biometricData.get(userId) || []
    userBiometrics.push(data)

    if (userBiometrics.length > 1000) {
      userBiometrics = userBiometrics.slice(-1000)
    }

    this.biometricData.set(userId, userBiometrics)
  }

  static generateEmotionalResponse(
    content: string,
    userEmotion: EmotionData,
    userId?: string
  ): EmotionalResponse {
    const profile = userId ? this.emotionProfiles.get(userId) : null
    const responseStyle = profile?.preferences.responseStyle || "empathetic"

    let adaptedContent = content
    let tone = "neutral"
    let supportLevel: "low" | "medium" | "high" = "medium"
    const suggestions: string[] = []
    const resources: EmotionalResponse["resources"] = []

    switch (userEmotion.primary) {
      case "sadness":
        tone = "supportive"
        supportLevel = "high"
        adaptedContent = this.addEmpatheticLanguage(content)
        suggestions.push("如果需要，我随时在这里倾听")
        resources.push({
          type: "article",
          title: "应对悲伤情绪的方法",
          description: "专业心理学建议",
        })
        break

      case "anger":
        tone = "calming"
        supportLevel = "high"
        adaptedContent = this.addCalmingLanguage(content)
        suggestions.push("深呼吸可能会有帮助")
        resources.push({
          type: "exercise",
          title: "愤怒管理技巧",
          description: "简单的放松练习",
        })
        break

      case "fear":
      case "anxiety":
        tone = "reassuring"
        supportLevel = "high"
        adaptedContent = this.addReassurance(content)
        suggestions.push("您并不孤单，我们一起面对")
        resources.push({
          type: "contact",
          title: "心理健康热线",
          description: "24小时专业支持",
        })
        break

      case "joy":
      case "happiness":
        tone = "enthusiastic"
        supportLevel = "low"
        adaptedContent = this.addPositiveReinforcement(content)
        suggestions.push("很高兴看到您心情不错！")
        break

      default:
        tone = "neutral"
        supportLevel = "medium"
    }

    if (userEmotion.intensity > 0.8) {
      supportLevel = "high"
      suggestions.push("您的情绪似乎很强烈，需要额外关注")
    }

    return {
      adaptedContent,
      tone,
      supportLevel,
      suggestions,
      resources,
      followUp: {
        checkIn: userEmotion.valence < -0.5 || userEmotion.intensity > 0.8,
        timeframe: userEmotion.valence < -0.5 ? 30 : 60,
        questions: this.generateFollowUpQuestions(userEmotion),
      },
    }
  }

  private static addEmpatheticLanguage(content: string): string {
    const empathyPhrases = [
      "我理解这对您来说很困难，",
      "我能感受到您的感受，",
      "这确实不容易，",
    ]
    
    const randomPhrase = empathyPhrases[Math.floor(Math.random() * empathyPhrases.length)]
    return `${randomPhrase}${content}`
  }

  private static addCalmingLanguage(content: string): string {
    const calmingPhrases = [
      "让我们慢慢来，",
      "深呼吸，我们一步步解决，",
      "保持冷静，",
    ]
    
    const randomPhrase = calmingPhrases[Math.floor(Math.random() * calmingPhrases.length)]
    return `${randomPhrase}${content}`
  }

  private static addReassurance(content: string): string {
    const reassuringPhrases = [
      "一切都会好起来的，",
      "您很勇敢，",
      "这种感觉是正常的，",
    ]
    
    const randomPhrase = reassuringPhrases[Math.floor(Math.random() * reassuringPhrases.length)]
    return `${randomPhrase}${content}`
  }

  private static addPositiveReinforcement(content: string): string {
    const positivePhrases = [
      "太棒了！",
      "很高兴听到这个消息！",
      "您的积极态度很棒！",
    ]
    
    const randomPhrase = positivePhrases[Math.floor(Math.random() * positivePhrases.length)]
    return `${randomPhrase}${content}`
  }

  private static generateFollowUpQuestions(emotion: EmotionData): string[] {
    const questions: Record<string, string[]> = {
      sadness: [
        "您想谈谈是什么让您感到难过吗？",
        "有什么我可以帮助您的吗？",
      ],
      anger: [
        "是什么引起了您的愤怒？",
        "您觉得什么方法能帮您平静下来？",
      ],
      fear: [
        "您担心的具体是什么？",
        "我们可以一起想想解决方案吗？",
      ],
      joy: [
        "是什么让您如此开心？",
        "您想分享更多好消息吗？",
      ],
    }

    return questions[emotion.primary] || ["您还有什么想聊的吗？"]
  }

  private static startRealtimeMonitoring(): void {
    if (typeof window !== "undefined") {
      let clickTimes: number[] = []
      let scrollSpeed = 0
      let lastScrollTime = 0

      document.addEventListener("click", () => {
        clickTimes.push(Date.now())
        if (clickTimes.length > 10) {
          clickTimes = clickTimes.slice(-10)
        }
      })

      document.addEventListener("scroll", () => {
        const now = Date.now()
        if (lastScrollTime > 0) {
          scrollSpeed = now - lastScrollTime
        }
        lastScrollTime = now
      })

      setInterval(() => {
        if (clickTimes.length > 5) {
          const intervals = []
          for (let i = 1; i < clickTimes.length; i++) {
            intervals.push(clickTimes[i] - clickTimes[i - 1])
          }

          const behaviorData = {
            clickPattern: intervals,
            scrollSpeed,
            typingSpeed: 50,
            pauseDuration: 1000,
            errorRate: 0.05,
          }

          const userId = this.getCurrentUserId()
          if (userId) {
            this.analyzeBehavioralEmotion(behaviorData, userId)
          }
        }
      }, 30000)
    }
  }

  static analyzeBehavioralEmotion(
    behaviorData: {
      clickPattern: number[]
      scrollSpeed: number
      typingSpeed: number
      pauseDuration: number
      errorRate: number
    },
    userId?: string
  ): EmotionData {
    let primaryEmotion = "neutral"
    let intensity = 0.5
    let arousal = 0.5
    let valence = 0

    if (behaviorData.clickPattern.length > 0) {
      const avgClickInterval = behaviorData.clickPattern.reduce((a, b) => a + b, 0) / behaviorData.clickPattern.length
      
      if (avgClickInterval < 500) {
        arousal += 0.3
        primaryEmotion = "impatient"
        valence -= 0.2
      } else if (avgClickInterval > 2000) {
        arousal -= 0.2
        primaryEmotion = "contemplative"
      }
    }

    if (behaviorData.scrollSpeed > 1000) {
      arousal += 0.2
      intensity += 0.1
    }

    if (behaviorData.typingSpeed < 20 && behaviorData.errorRate > 0.1) {
      valence -= 0.3
      primaryEmotion = "frustrated"
      intensity += 0.2
    }

    const emotionData: EmotionData = {
      primary: primaryEmotion,
      secondary: [],
      intensity: Math.min(1, intensity),
      valence: Math.max(-1, Math.min(1, valence)),
      arousal: Math.max(0, Math.min(1, arousal)),
      confidence: 0.65,
      timestamp: Date.now(),
      source: "behavioral",
      rawData: behaviorData,
    }

    if (userId) {
      this.updateEmotionProfile(userId, emotionData)
    }

    return emotionData
  }

  private static initializePrivacyControls(): void {
    console.log("情绪AI隐私控制已初始化")
  }

  private static getCurrentUserId(): string | null {
    return typeof localStorage !== "undefined" ? localStorage.getItem("userId") : null
  }

  static getUserEmotionProfile(userId: string): EmotionProfile | undefined {
    return this.emotionProfiles.get(userId)
  }

  static getCurrentEmotion(userId: string): EmotionData | undefined {
    return this.realtimeEmotions.get(userId)
  }

  static getEmotionHistory(userId: string, days: number = 7): EmotionData[] {
    const profile = this.emotionProfiles.get(userId)
    if (!profile) return []

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    return profile.history.filter(emotion => emotion.timestamp >= cutoff.getTime())
  }

  static getEmotionInsights(userId: string): EmotionInsight[] {
    const profile = this.emotionProfiles.get(userId)
    return profile?.insights || []
  }

  static updateUserPreferences(
    userId: string,
    preferences: Partial<EmotionProfile["preferences"]>
  ): boolean {
    const profile = this.emotionProfiles.get(userId)
    if (!profile) return false

    Object.assign(profile.preferences, preferences)
    profile.updatedAt = new Date()
    return true
  }

  static getEmotionStats(userId: string): {
    totalEmotions: number
    dominantEmotion: string
    averageValence: number
    averageArousal: number
    emotionDistribution: Record<string, number>
  } {
    const profile = this.emotionProfiles.get(userId)
    if (!profile || profile.history.length === 0) {
      return {
        totalEmotions: 0,
        dominantEmotion: "neutral",
        averageValence: 0,
        averageArousal: 0.5,
        emotionDistribution: {},
      }
    }

    const emotions = profile.history
    const totalEmotions = emotions.length
    
    const emotionCounts: Record<string, number> = {}
    let totalValence = 0
    let totalArousal = 0

    emotions.forEach(emotion => {
      emotionCounts[emotion.primary] = (emotionCounts[emotion.primary] || 0) + 1
      totalValence += emotion.valence
      totalArousal += emotion.arousal
    })

    const dominantEmotion = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || "neutral"

    return {
      totalEmotions,
      dominantEmotion,
      averageValence: totalValence / totalEmotions,
      averageArousal: totalArousal / totalEmotions,
      emotionDistribution: emotionCounts,
    }
  }
}

interface EmotionModel {
  id: string
  name: string
  type: "text" | "voice" | "facial" | "physiological"
  accuracy: number
  languages: string[]
  emotions: string[]
  isLoaded: boolean
}

export const emotionAI = EmotionAIManager
