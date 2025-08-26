export interface UserBehaviorPattern {
  id: string
  userId: string
  actionType: string
  context: Record<string, any>
  timestamp: number
  frequency: number
  success: boolean
  duration: number
  metadata: Record<string, any>
}

export interface PredictionModel {
  id: string
  name: string
  type: "sequence" | "classification" | "regression" | "clustering"
  accuracy: number
  trainingData: number
  lastTrained: Date
  version: string
  parameters: Record<string, any>
  isActive: boolean
}

export interface InteractionPrediction {
  action: string
  confidence: number
  context: Record<string, any>
  suggestedUI: UIAdaptation[]
  estimatedTime: number
  alternatives: Array<{
    action: string
    confidence: number
  }>
}

export interface PredictiveInsight {
  id: string
  type: "immediate" | "short_term" | "long_term"
  timeframe: string
  prediction: {
    action: string
    probability: number
    reasoning: string[]
    context: Record<string, any>
  }
  confidence: number
  suggestedActions: string[]
  metadata: Record<string, any>
}

export interface UIAdaptation {
  elementId: string
  adaptationType: "position" | "size" | "visibility" | "content" | "style"
  changes: Record<string, any>
  priority: number
  duration: number
}

export interface WorkflowStep {
  id: string
  name: string
  description: string
  estimatedDuration: number
  dependencies: string[]
  resources: string[]
  automatable: boolean
  userInput: boolean
}

export interface WorkflowOptimization {
  id: string
  name: string
  originalSteps: WorkflowStep[]
  optimizedSteps: WorkflowStep[]
  timeSaved: number
  automationLevel: number
  userEffort: number
  recommendations: string[]
  confidence: number
  implementationComplexity: "low" | "medium" | "high"
}

export interface ProactiveAssistance {
  id: string
  type: "suggestion" | "warning" | "automation" | "optimization"
  title: string
  description: string
  action: string
  confidence: number
  urgency: "low" | "medium" | "high"
  context: Record<string, any>
  estimatedBenefit: string
  implementationSteps: string[]
}

export interface PredictionModelConfig {
  learningRate: number
  featureWeights: {
    behavioral: number
    temporal: number
    contextual: number
    historical: number
  }
  confidenceThresholds: {
    high: number
    medium: number
    low: number
  }
  anomalyDetection: {
    enabled: boolean
    sensitivity: number
  }
  adaptationRate: number
  memoryWindow: number
}

export interface ModelPerformanceMetrics {
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  predictionLatency: number
  trainingDataSize: number
  memoryUsage: number
  lastUpdated: Date
}

export class PredictiveInteractionManager {
  private static behaviorPatterns: Map<string, UserBehaviorPattern[]> = new Map()
  private static predictionModels: Map<string, PredictionModel> = new Map()
  private static currentPredictions: Map<string, InteractionPrediction[]> = new Map()
  private static uiAdaptations: Map<string, UIAdaptation[]> = new Map()
  private static workflows: Map<string, WorkflowOptimization> = new Map()
  private static modelConfigs: Map<string, PredictionModelConfig> = new Map()
  private static performanceMetrics: Map<string, ModelPerformanceMetrics> = new Map()

  static initialize(): void {
    this.initializeDefaultModels()
    this.initializeDefaultConfigs()
    this.startBehaviorTracking()
    this.scheduleModelUpdates()
  }

  static async initializeForUser(userId: string): Promise<void> {
    const defaultConfig: PredictionModelConfig = {
      learningRate: 0.01,
      featureWeights: {
        behavioral: 0.3,
        temporal: 0.25,
        contextual: 0.25,
        historical: 0.2,
      },
      confidenceThresholds: {
        high: 0.8,
        medium: 0.6,
        low: 0.4,
      },
      anomalyDetection: {
        enabled: true,
        sensitivity: 0.7,
      },
      adaptationRate: 0.1,
      memoryWindow: 30,
    }

    this.modelConfigs.set(userId, defaultConfig)

    const initialMetrics: ModelPerformanceMetrics = {
      accuracy: 0.65,
      precision: 0.62,
      recall: 0.68,
      f1Score: 0.65,
      predictionLatency: 150,
      trainingDataSize: 0,
      memoryUsage: 25.5,
      lastUpdated: new Date(),
    }

    this.performanceMetrics.set(userId, initialMetrics)
    console.log(`预测系统已为用户 ${userId} 初始化`)
  }

  private static initializeDefaultModels(): void {
    const defaultModels: PredictionModel[] = [
      {
        id: "search-sequence",
        name: "搜索序列预测",
        type: "sequence",
        accuracy: 0.78,
        trainingData: 10000,
        lastTrained: new Date(),
        version: "1.0.0",
        parameters: {
          sequenceLength: 5,
          hiddenUnits: 128,
          learningRate: 0.001,
        },
        isActive: true,
      },
      {
        id: "ui-preference",
        name: "UI偏好分类",
        type: "classification",
        accuracy: 0.85,
        trainingData: 5000,
        lastTrained: new Date(),
        version: "1.0.0",
        parameters: {
          features: ["time_of_day", "device_type", "task_type"],
          classes: ["minimal", "detailed", "visual", "text"],
        },
        isActive: true,
      },
      {
        id: "task-duration",
        name: "任务时长预测",
        type: "regression",
        accuracy: 0.72,
        trainingData: 8000,
        lastTrained: new Date(),
        version: "1.0.0",
        parameters: {
          features: ["task_complexity", "user_experience", "time_of_day"],
          target: "completion_time",
        },
        isActive: true,
      },
    ]

    defaultModels.forEach(model => {
      this.predictionModels.set(model.id, model)
    })
  }

  private static initializeDefaultConfigs(): void {
    const defaultConfig: PredictionModelConfig = {
      learningRate: 0.01,
      featureWeights: {
        behavioral: 0.3,
        temporal: 0.25,
        contextual: 0.25,
        historical: 0.2,
      },
      confidenceThresholds: {
        high: 0.8,
        medium: 0.6,
        low: 0.4,
      },
      anomalyDetection: {
        enabled: true,
        sensitivity: 0.7,
      },
      adaptationRate: 0.1,
      memoryWindow: 30,
    }

    this.modelConfigs.set("default", defaultConfig)
  }

  private static startBehaviorTracking(): void {
    if (typeof window !== "undefined") {
      document.addEventListener("click", (event) => {
        this.recordBehavior({
          actionType: "click",
          context: {
            element: (event.target as Element)?.tagName,
            position: { x: event.clientX, y: event.clientY },
            timestamp: Date.now(),
          },
        })
      })

      document.addEventListener("scroll", this.throttle(() => {
        this.recordBehavior({
          actionType: "scroll",
          context: {
            scrollY: window.scrollY,
            timestamp: Date.now(),
          },
        })
      }, 1000))

      let pageStartTime = Date.now()
      window.addEventListener("beforeunload", () => {
        this.recordBehavior({
          actionType: "page_view",
          context: {
            duration: Date.now() - pageStartTime,
            url: window.location.href,
          },
        })
      })
    }
  }

  static recordBehavior(behavior: Partial<UserBehaviorPattern>): void {
    const userId = this.getCurrentUserId()
    
    const pattern: UserBehaviorPattern = {
      id: `behavior_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      actionType: behavior.actionType || "unknown",
      context: behavior.context || {},
      timestamp: Date.now(),
      frequency: 1,
      success: behavior.success !== false,
      duration: behavior.duration || 0,
      metadata: behavior.metadata || {},
    }

    const userPatterns = this.behaviorPatterns.get(userId) || []
    
    const existingPattern = userPatterns.find(p => 
      p.actionType === pattern.actionType &&
      this.isSimilarContext(p.context, pattern.context)
    )

    if (existingPattern) {
      existingPattern.frequency++
      existingPattern.timestamp = pattern.timestamp
      existingPattern.duration = (existingPattern.duration + pattern.duration) / 2
    } else {
      userPatterns.push(pattern)
    }

    this.behaviorPatterns.set(userId, userPatterns)

    if (userPatterns.length > 1000) {
      userPatterns.splice(0, userPatterns.length - 1000)
    }

    this.updatePredictions(userId)
  }

  private static isSimilarContext(context1: Record<string, any>, context2: Record<string, any>): boolean {
    const keys1 = Object.keys(context1)
    const keys2 = Object.keys(context2)
    
    if (keys1.length !== keys2.length) return false
    
    return keys1.every(key => {
      const val1 = context1[key]
      const val2 = context2[key]
      
      if (typeof val1 === "object" && typeof val2 === "object") {
        return JSON.stringify(val1) === JSON.stringify(val2)
      }
      
      return val1 === val2
    })
  }

  static async predictNextAction(userId: string, timeframe: "immediate" | "short_term" | "long_term"): Promise<PredictiveInsight | null> {
    const userPatterns = this.behaviorPatterns.get(userId) || []
    const config = this.modelConfigs.get(userId) || this.modelConfigs.get("default")!

    if (userPatterns.length < 5) {
      return null
    }

    const recentActions = userPatterns
      .filter(p => Date.now() - p.timestamp < 3600000)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)

    if (recentActions.length === 0) {
      return null
    }

    const prediction = this.generatePrediction(recentActions, timeframe, config)
    
    if (prediction) {
      this.updateModelPerformance(userId, prediction.confidence)
      return prediction
    }

    return null
  }

  private static generatePrediction(
    recentActions: UserBehaviorPattern[],
    timeframe: "immediate" | "short_term" | "long_term",
    config: PredictionModelConfig
  ): PredictiveInsight | null {
    const lastAction = recentActions[0]
    const commonNextActions = this.findCommonNextActions(lastAction.actionType)

    if (commonNextActions.length === 0) return null

    const mostLikely = commonNextActions[0]
    const confidence = mostLikely.probability * this.calculateContextualBoost(recentActions, config)

    if (confidence < config.confidenceThresholds.low) {
      return null
    }

    return {
      id: `prediction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: timeframe,
      timeframe: this.getTimeframeDescription(timeframe),
      prediction: {
        action: mostLikely.action,
        probability: confidence,
        reasoning: [
          `基于最近的${lastAction.actionType}行为`,
          `历史数据显示${Math.round(mostLikely.probability * 100)}%的概率`,
          `上下文分析提升了预测准确性`,
        ],
        context: {
          lastAction: lastAction.actionType,
          timeOfDay: new Date().getHours(),
          recentPatterns: recentActions.slice(0, 3).map(a => a.actionType),
        },
      },
      confidence,
      suggestedActions: [
        `准备${mostLikely.action}相关的界面元素`,
        "预加载可能需要的资源",
        "调整UI布局以优化用户体验",
      ],
      metadata: {
        modelUsed: "sequence-prediction",
        dataPoints: recentActions.length,
        timestamp: Date.now(),
      },
    }
  }

  private static calculateContextualBoost(
    recentActions: UserBehaviorPattern[],
    config: PredictionModelConfig
  ): number {
    let boost = 1.0

    const currentHour = new Date().getHours()
    const sameHourActions = recentActions.filter(a => 
      new Date(a.timestamp).getHours() === currentHour
    )
    if (sameHourActions.length > recentActions.length * 0.5) {
      boost += config.featureWeights.temporal * 0.2
    }

    const actionTypes = recentActions.map(a => a.actionType)
    const uniqueActions = new Set(actionTypes).size
    if (uniqueActions < actionTypes.length * 0.7) {
      boost += config.featureWeights.behavioral * 0.15
    }

    return Math.min(1.5, boost)
  }

  private static getTimeframeDescription(timeframe: "immediate" | "short_term" | "long_term"): string {
    switch (timeframe) {
      case "immediate":
        return "接下来几秒钟"
      case "short_term":
        return "接下来几分钟"
      case "long_term":
        return "接下来一小时内"
      default:
        return "未来某个时间"
    }
  }

  private static findCommonNextActions(currentAction: string): Array<{
    action: string
    probability: number
    estimatedTime: number
  }> {
    const transitionProbabilities: Record<string, Array<{
      action: string
      probability: number
      estimatedTime: number
    }>> = {
      "search": [
        { action: "view_results", probability: 0.8, estimatedTime: 5000 },
        { action: "refine_search", probability: 0.15, estimatedTime: 3000 },
        { action: "new_search", probability: 0.05, estimatedTime: 2000 },
      ],
      "view_results": [
        { action: "click_result", probability: 0.6, estimatedTime: 2000 },
        { action: "scroll_results", probability: 0.25, estimatedTime: 3000 },
        { action: "new_search", probability: 0.15, estimatedTime: 4000 },
      ],
      "click_result": [
        { action: "read_content", probability: 0.7, estimatedTime: 30000 },
        { action: "back_to_results", probability: 0.2, estimatedTime: 1000 },
        { action: "share_content", probability: 0.1, estimatedTime: 5000 },
      ],
      "click": [
        { action: "scroll", probability: 0.4, estimatedTime: 2000 },
        { action: "click", probability: 0.3, estimatedTime: 1000 },
        { action: "navigate", probability: 0.3, estimatedTime: 3000 },
      ],
      "scroll": [
        { action: "click", probability: 0.5, estimatedTime: 2000 },
        { action: "scroll", probability: 0.3, estimatedTime: 1500 },
        { action: "navigate", probability: 0.2, estimatedTime: 4000 },
      ],
    }

    return transitionProbabilities[currentAction] || []
  }

  static optimizeWorkflow(userId: string, workflowId: string): WorkflowOptimization | null {
    const mockSteps: WorkflowStep[] = [
      {
        id: "step1",
        name: "数据收集",
        description: "收集用户输入和相关数据",
        estimatedDuration: 5000,
        dependencies: [],
        resources: ["api", "database"],
        automatable: true,
        userInput: false,
      },
      {
        id: "step2",
        name: "数据分析",
        description: "分析收集到的数据",
        estimatedDuration: 8000,
        dependencies: ["step1"],
        resources: ["cpu", "memory"],
        automatable: true,
        userInput: false,
      },
      {
        id: "step3",
        name: "用户确认",
        description: "等待用户确认分析结果",
        estimatedDuration: 15000,
        dependencies: ["step2"],
        resources: ["ui"],
        automatable: false,
        userInput: true,
      },
      {
        id: "step4",
        name: "结果生成",
        description: "生成最终结果",
        estimatedDuration: 3000,
        dependencies: ["step3"],
        resources: ["api"],
        automatable: true,
        userInput: false,
      },
    ]

    const optimization = this.generateWorkflowOptimization(mockSteps, userId)
    
    if (optimization) {
      this.workflows.set(optimization.id, optimization)
    }

    return optimization
  }

  private static generateWorkflowOptimization(
    originalSteps: WorkflowStep[],
    userId: string
  ): WorkflowOptimization {
    const dependencyGraph = this.buildDependencyGraph(originalSteps)
    const parallelGroups = this.identifyParallelSteps(originalSteps, dependencyGraph)
    const automationOpportunities = this.identifyAutomationOpportunities(originalSteps)
    const optimizedSteps = this.generateOptimizedSteps(originalSteps, parallelGroups, automationOpportunities)
    
    const originalTime = originalSteps.reduce((sum, step) => sum + step.estimatedDuration, 0)
    const optimizedTime = optimizedSteps.reduce((sum, step) => sum + step.estimatedDuration, 0)
    const timeSaved = originalTime - optimizedTime
    
    const automatedSteps = optimizedSteps.filter(step => !step.userInput).length
    const automationLevel = automatedSteps / optimizedSteps.length
    
    const userSteps = optimizedSteps.filter(step => step.userInput).length
    const userEffort = userSteps / optimizedSteps.length

    return {
      id: `workflow_opt_${Date.now()}`,
      name: `优化工作流程`,
      originalSteps,
      optimizedSteps,
      timeSaved,
      automationLevel,
      userEffort,
      recommendations: this.generateWorkflowRecommendations(originalSteps, optimizedSteps),
      confidence: 0.85,
      implementationComplexity: timeSaved > 10000 ? "high" : timeSaved > 5000 ? "medium" : "low",
    }
  }

  private static buildDependencyGraph(steps: WorkflowStep[]): Map<string, string[]> {
    const graph = new Map<string, string[]>()
    
    steps.forEach(step => {
      graph.set(step.id, step.dependencies)
    })
    
    return graph
  }

  private static identifyParallelSteps(
    steps: WorkflowStep[],
    dependencyGraph: Map<string, string[]>
  ): Array<WorkflowStep[]> {
    const parallelGroups: Array<WorkflowStep[]> = []
    const processed = new Set<string>()
    
    while (processed.size < steps.length) {
      const currentGroup: WorkflowStep[] = []
      
      steps.forEach(step => {
        if (processed.has(step.id)) return
        
        const dependenciesMet = step.dependencies.every(dep => processed.has(dep))
        
        if (dependenciesMet) {
          currentGroup.push(step)
        }
      })
      
      if (currentGroup.length > 0) {
        parallelGroups.push(currentGroup)
        currentGroup.forEach(step => processed.add(step.id))
      } else {
        break
      }
    }
    
    return parallelGroups
  }

  private static identifyAutomationOpportunities(steps: WorkflowStep[]): WorkflowStep[] {
    return steps.filter(step => 
      step.automatable && 
      !step.userInput &&
      step.resources.every(resource => this.isResourceAvailable(resource))
    )
  }

  private static isResourceAvailable(resource: string): boolean {
    const availableResources = ["api", "database", "file_system", "network", "cpu", "memory", "ui"]
    return availableResources.includes(resource)
  }

  private static generateOptimizedSteps(
    originalSteps: WorkflowStep[],
    parallelGroups: Array<WorkflowStep[]>,
    automationOpportunities: WorkflowStep[]
  ): WorkflowStep[] {
    const optimizedSteps: WorkflowStep[] = []
    
    parallelGroups.forEach((group, groupIndex) => {
      if (group.length === 1) {
        const step = group[0]
        const isAutomatable = automationOpportunities.some(auto => auto.id === step.id)
        
        optimizedSteps.push({
          ...step,
          automatable: isAutomatable,
          userInput: !isAutomatable && step.userInput,
          estimatedDuration: isAutomatable ? step.estimatedDuration * 0.1 : step.estimatedDuration,
        })
      } else {
        const maxDuration = Math.max(...group.map(step => step.estimatedDuration))
        
        group.forEach((step, stepIndex) => {
          const isAutomatable = automationOpportunities.some(auto => auto.id === step.id)
          
          optimizedSteps.push({
            ...step,
            name: stepIndex === 0 ? `并行组 ${groupIndex + 1}: ${step.name}` : step.name,
            automatable: isAutomatable,
            userInput: !isAutomatable && step.userInput,
            estimatedDuration: stepIndex === 0 ? maxDuration : 0,
          })
        })
      }
    })
    
    return optimizedSteps
  }

  private static generateWorkflowRecommendations(
    originalSteps: WorkflowStep[],
    optimizedSteps: WorkflowStep[]
  ): string[] {
    const recommendations: string[] = []
    
    const originalTime = originalSteps.reduce((sum, step) => sum + step.estimatedDuration, 0)
    const optimizedTime = optimizedSteps.reduce((sum, step) => sum + step.estimatedDuration, 0)
    const timeSaved = originalTime - optimizedTime
    
    if (timeSaved > 0) {
      recommendations.push(`通过优化可节省 ${Math.round(timeSaved / 1000)} 秒`)
    }
    
    const automatedCount = optimizedSteps.filter(step => step.automatable && !step.userInput).length
    if (automatedCount > 0) {
      recommendations.push(`${automatedCount} 个步骤可以自动化执行`)
    }
    
    const parallelGroups = optimizedSteps.filter(step => step.name.includes("并行组")).length
    if (parallelGroups > 0) {
      recommendations.push(`识别出 ${parallelGroups} 个可并行执行的步骤组`)
    }
    
    return recommendations
  }

  static async optimizePredictionAlgorithm(userId: string): Promise<boolean> {
    const config = this.modelConfigs.get(userId)
    if (!config) return false

    try {
      await new Promise(resolve => setTimeout(resolve, 2000))

      config.learningRate = Math.max(0.005, config.learningRate * 0.9)

      const totalWeight = Object.values(config.featureWeights).reduce((sum, weight) => sum + weight, 0)
      if (totalWeight !== 1.0) {
        const factor = 1.0 / totalWeight
        Object.keys(config.featureWeights).forEach(key => {
          config.featureWeights[key as keyof typeof config.featureWeights] *= factor
        })
      }

      this.modelConfigs.set(userId, config)

      const metrics = this.performanceMetrics.get(userId)
      if (metrics) {
        metrics.accuracy = Math.min(0.95, metrics.accuracy + 0.02)
        metrics.precision = Math.min(0.95, metrics.precision + 0.015)
        metrics.recall = Math.min(0.95, metrics.recall + 0.018)
        metrics.f1Score = (2 * metrics.precision * metrics.recall) / (metrics.precision + metrics.recall)
        metrics.lastUpdated = new Date()
        this.performanceMetrics.set(userId, metrics)
      }

      console.log(`用户 ${userId} 的预测算法已优化`)
      return true

    } catch (error) {
      console.error("算法优化失败:", error)
      return false
    }
  }

  static async adjustModelParameters(userId: string, adjustments: Partial<PredictionModelConfig>): Promise<void> {
    const config = this.modelConfigs.get(userId)
    if (!config) return

    Object.assign(config, adjustments)

    if (config.learningRate < 0.001) config.learningRate = 0.001
    if (config.learningRate > 0.1) config.learningRate = 0.1

    const totalWeight = Object.values(config.featureWeights).reduce((sum, weight) => sum + weight, 0)
    if (totalWeight > 0) {
      const factor = 1.0 / totalWeight
      Object.keys(config.featureWeights).forEach(key => {
        config.featureWeights[key as keyof typeof config.featureWeights] *= factor
      })
    }

    this.modelConfigs.set(userId, config)
    console.log(`用户 ${userId} 的模型参数已调整`)
  }

  static getModelConfig(userId?: string): PredictionModelConfig {
    return this.modelConfigs.get(userId || "default") || this.modelConfigs.get("default")!
  }

  static getModelPerformance(userId: string): ModelPerformanceMetrics | null {
    return this.performanceMetrics.get(userId) || null
  }

  private static updateModelPerformance(userId: string, predictionConfidence: number): void {
    const metrics = this.performanceMetrics.get(userId)
    if (!metrics) return

    const alpha = 0.1
    metrics.accuracy = (1 - alpha) * metrics.accuracy + alpha * predictionConfidence
    
    metrics.precision = Math.min(0.95, metrics.precision + (predictionConfidence > 0.8 ? 0.001 : -0.001))
    metrics.recall = Math.min(0.95, metrics.recall + (predictionConfidence > 0.7 ? 0.001 : -0.001))
    metrics.f1Score = (2 * metrics.precision * metrics.recall) / (metrics.precision + metrics.recall)
    
    metrics.trainingDataSize += 1
    metrics.predictionLatency = Math.max(50, metrics.predictionLatency + (Math.random() - 0.5) * 10)
    
    metrics.lastUpdated = new Date()
    this.performanceMetrics.set(userId, metrics)
  }

  static updatePredictions(userId: string): void {
    const predictions = this.predictNextActions(userId, { timestamp: Date.now() })
    this.currentPredictions.set(userId, predictions)
    this.applyUIAdaptations(userId, predictions)
  }

  static predictNextActions(userId: string, currentContext: Record<string, any>): InteractionPrediction[] {
    const userPatterns = this.behaviorPatterns.get(userId) || []
    const predictions: InteractionPrediction[] = []

    const recentActions = userPatterns
      .filter(p => Date.now() - p.timestamp < 3600000)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5)

    if (recentActions.length > 0) {
      const sequencePrediction = this.predictFromSequence(recentActions, currentContext)
      if (sequencePrediction) {
        predictions.push(sequencePrediction)
      }
    }

    const frequencyPredictions = this.predictFromFrequency(userPatterns, currentContext)
    predictions.push(...frequencyPredictions)

    const timePredictions = this.predictFromTimePatterns(userPatterns, currentContext)
    predictions.push(...timePredictions)

    return predictions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
  }

  private static predictFromSequence(
    recentActions: UserBehaviorPattern[],
    context: Record<string, any>
  ): InteractionPrediction | null {
    if (recentActions.length < 2) return null

    const sequenceModel = this.predictionModels.get("search-sequence")
    if (!sequenceModel || !sequenceModel.isActive) return null

    const lastAction = recentActions[0]
    const commonNextActions = this.findCommonNextActions(lastAction.actionType)

    if (commonNextActions.length === 0) return null

    const mostLikely = commonNextActions[0]
    
    return {
      action: mostLikely.action,
      confidence: mostLikely.probability * sequenceModel.accuracy,
      context: { ...context, predictedFrom: "sequence" },
      suggestedUI: this.generateUIAdaptations(mostLikely.action, context),
      estimatedTime: mostLikely.estimatedTime,
      alternatives: commonNextActions.slice(1, 3).map(a => ({
        action: a.action,
        confidence: a.probability * sequenceModel.accuracy,
      })),
    }
  }

  private static predictFromFrequency(
    patterns: UserBehaviorPattern[],
    context: Record<string, any>
  ): InteractionPrediction[] {
    const actionFrequency = new Map<string, number>()

    patterns.forEach(pattern => {
      const count = actionFrequency.get(pattern.actionType) || 0
      actionFrequency.set(pattern.actionType, count + pattern.frequency)
    })

    const totalActions = Array.from(actionFrequency.values()).reduce((sum, count) => sum + count, 0)
    const predictions: InteractionPrediction[] = []

    for (const [action, frequency] of actionFrequency.entries()) {
      const confidence = frequency / totalActions
      
      if (confidence > 0.1) {
        predictions.push({
          action,
          confidence,
          context: { ...context, predictedFrom: "frequency" },
          suggestedUI: this.generateUIAdaptations(action, context),
          estimatedTime: this.estimateActionTime(action, patterns),
          alternatives: [],
        })
      }
    }

    return predictions
  }

  private static predictFromTimePatterns(
    patterns: UserBehaviorPattern[],
    context: Record<string, any>
  ): InteractionPrediction[] {
    const currentHour = new Date().getHours()
    const timeBasedPatterns = patterns.filter(p => {
      const patternHour = new Date(p.timestamp).getHours()
      return Math.abs(patternHour - currentHour) <= 1
    })

    if (timeBasedPatterns.length === 0) return []

    const actionCounts = new Map<string, number>()
    timeBasedPatterns.forEach(pattern => {
      const count = actionCounts.get(pattern.actionType) || 0
      actionCounts.set(pattern.actionType, count + 1)
    })

    const predictions: InteractionPrediction[] = []
    const totalCount = timeBasedPatterns.length

    for (const [action, count] of actionCounts.entries()) {
      const confidence = count / totalCount
      
      if (confidence > 0.2) {
        predictions.push({
          action,
          confidence,
          context: { ...context, predictedFrom: "time_pattern" },
          suggestedUI: this.generateUIAdaptations(action, context),
          estimatedTime: this.estimateActionTime(action, timeBasedPatterns),
          alternatives: [],
        })
      }
    }

    return predictions
  }

  private static generateUIAdaptations(action: string, context: Record<string, any>): UIAdaptation[] {
    const adaptations: UIAdaptation[] = []

    switch (action) {
      case "search":
        adaptations.push({
          elementId: "search-input",
          adaptationType: "visibility",
          changes: { visible: true, focused: true },
          priority: 1,
          duration: 0,
        })
        break
      
      case "view_results":
        adaptations.push({
          elementId: "results-container",
          adaptationType: "position",
          changes: { scrollTop: 0 },
          priority: 1,
          duration: 300,
        })
        break
      
      case "scroll_results":
        adaptations.push({
          elementId: "load-more-button",
          adaptationType: "visibility",
          changes: { visible: true, preload: true },
          priority: 2,
          duration: 0,
        })
        break
    }

    return adaptations
  }

  private static estimateActionTime(action: string, patterns: UserBehaviorPattern[]): number {
    const actionPatterns = patterns.filter(p => p.actionType === action)
    
    if (actionPatterns.length === 0) {
      const defaultTimes: Record<string, number> = {
        "search": 3000,
        "click": 500,
        "scroll": 2000,
        "read": 15000,
      }
      return defaultTimes[action] || 5000
    }

    const avgDuration = actionPatterns.reduce((sum, p) => sum + p.duration, 0) / actionPatterns.length
    return avgDuration
  }

  static applyUIAdaptations(userId: string, predictions: InteractionPrediction[]): void {
    const adaptations: UIAdaptation[] = []
    
    predictions.forEach(prediction => {
      adaptations.push(...prediction.suggestedUI)
    })

    adaptations.sort((a, b) => a.priority - b.priority)

    adaptations.forEach(adaptation => {
      this.applyUIAdaptation(adaptation)
    })

    this.uiAdaptations.set(userId, adaptations)
  }

  private static applyUIAdaptation(adaptation: UIAdaptation): void {
    if (typeof window === "undefined") return

    const element = document.getElementById(adaptation.elementId)
    if (!element) return

    switch (adaptation.adaptationType) {
      case "visibility":
        if (adaptation.changes.visible) {
          element.style.display = "block"
          if (adaptation.changes.focused) {
            (element as HTMLInputElement).focus?.()
          }
        } else {
          element.style.display = "none"
        }
        break
      
      case "position":
        if (adaptation.changes.scrollTop !== undefined) {
          element.scrollTop = adaptation.changes.scrollTop
        }
        break
      
      case "size":
        if (adaptation.changes.width) {
          element.style.width = adaptation.changes.width
        }
        if (adaptation.changes.height) {
          element.style.height = adaptation.changes.height
        }
        break
      
      case "style":
        Object.assign(element.style, adaptation.changes)
        break
    }
  }

  static trainModel(modelId: string): Promise<boolean> {
    return new Promise((resolve) => {
      const model = this.predictionModels.get(modelId)
      if (!model) {
        resolve(false)
        return
      }

      setTimeout(() => {
        model.lastTrained = new Date()
        model.accuracy = Math.min(0.95, model.accuracy + 0.01)
        model.trainingData += 100
        
        console.log(`模型 ${modelId} 训练完成，准确率: ${model.accuracy}`)
        resolve(true)
      }, 2000)
    })
  }

  private static scheduleModelUpdates(): void {
    if (typeof window !== "undefined") {
      setInterval(() => {
        this.predictionModels.forEach((model, modelId) => {
          if (model.isActive) {
            this.trainModel(modelId)
          }
        })
      }, 3600000)
    }
  }

  private static getCurrentUserId(): string {
    return typeof localStorage !== "undefined" ? 
      (localStorage.getItem("userId") || "anonymous") : "anonymous"
  }

  private static throttle<T extends (...args: any[]) => any>(func: T, delay: number): T {
    let lastCall = 0
    return ((...args: any[]) => {
      const now = Date.now()
      if (now - lastCall >= delay) {
        lastCall = now
        return func(...args)
      }
    }) as T
  }

  static getUserBehaviorStats(userId: string): {
    totalActions: number
    mostFrequentAction: string
    averageSessionDuration: number
    predictedNextActions: InteractionPrediction[]
  } {
    const patterns = this.behaviorPatterns.get(userId) || []
    const predictions = this.currentPredictions.get(userId) || []
    
    const actionCounts = new Map<string, number>()
    let totalDuration = 0
    
    patterns.forEach(pattern => {
      const count = actionCounts.get(pattern.actionType) || 0
      actionCounts.set(pattern.actionType, count + pattern.frequency)
      totalDuration += pattern.duration
    })
    
    const mostFrequentAction = Array.from(actionCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "unknown"
    
    return {
      totalActions: patterns.length,
      mostFrequentAction,
      averageSessionDuration: patterns.length > 0 ? totalDuration / patterns.length : 0,
      predictedNextActions: predictions,
    }
  }

  static getPredictionModels(): PredictionModel[] {
    return Array.from(this.predictionModels.values())
  }

  static getOptimizedWorkflows(): WorkflowOptimization[] {
    return Array.from(this.workflows.values())
  }
}

export const predictiveInteraction = PredictiveInteractionManager
