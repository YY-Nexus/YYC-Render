"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, Zap, TrendingUp } from 'lucide-react'

interface OptimizationProgressProps {
  isOptimizing: boolean
  onComplete: (results: any) => void
}

export function OptimizationProgress({ isOptimizing, onComplete }: OptimizationProgressProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [stepProgress, setStepProgress] = useState(0)

  const optimizationSteps = [
    {
      name: "分析当前性能瓶颈",
      description: "识别模型性能问题和改进机会",
      duration: 2000,
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      name: "调整学习率和特征权重",
      description: "优化模型参数以提高准确性",
      duration: 3000,
      icon: <Zap className="w-4 h-4" />,
    },
    {
      name: "优化置信度阈值",
      description: "调整决策边界以减少误报",
      duration: 2500,
      icon: <Clock className="w-4 h-4" />,
    },
    {
      name: "执行模型重训练",
      description: "使用新参数重新训练预测模型",
      duration: 4000,
      icon: <CheckCircle className="w-4 h-4" />,
    },
  ]

  useEffect(() => {
    if (!isOptimizing) return

    let stepTimer: NodeJS.Timeout
    let progressTimer: NodeJS.Timeout

    const runOptimization = async () => {
      for (let i = 0; i < optimizationSteps.length; i++) {
        setCurrentStep(i)
        setStepProgress(0)

        // 模拟步骤进度
        const step = optimizationSteps[i]
        const progressInterval = step.duration / 100

        progressTimer = setInterval(() => {
          setStepProgress(prev => {
            if (prev >= 100) {
              clearInterval(progressTimer)
              return 100
            }
            return prev + 1
          })
        }, progressInterval)

        await new Promise(resolve => {
          stepTimer = setTimeout(resolve, step.duration)
        })

        clearInterval(progressTimer)
        setProgress(((i + 1) / optimizationSteps.length) * 100)
      }

      // 完成优化
      setTimeout(() => {
        onComplete({
          success: true,
          improvements: {
            accuracy: 0.08,
            precision: 0.06,
            recall: 0.07,
            f1Score: 0.065,
            latencyReduction: 15,
          },
          optimizedParameters: {
            learningRate: 0.008,
            featureWeights: {
              behavioral: 0.32,
              temporal: 0.28,
              contextual: 0.25,
              historical: 0.15,
            },
          },
        })
      }, 1000)
    }

    runOptimization()

    return () => {
      clearTimeout(stepTimer)
      clearInterval(progressTimer)
    }
  }, [isOptimizing, onComplete])

  if (!isOptimizing) return null

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-blue-600" />
          <span>AI模型自动优化进行中</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 总体进度 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>总体进度</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* 步骤列表 */}
        <div className="space-y-4">
          {optimizationSteps.map((step, index) => (
            <div
              key={index}
              className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${
                index === currentStep
                  ? "bg-blue-50 border border-blue-200"
                  : index < currentStep
                  ? "bg-green-50 border border-green-200"
                  : "bg-gray-50 border border-gray-200"
              }`}
            >
              <div className={`flex-shrink-0 mt-0.5 ${
                index === currentStep
                  ? "text-blue-600"
                  : index < currentStep
                  ? "text-green-600"
                  : "text-gray-400"
              }`}>
                {step.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-medium ${
                    index === currentStep
                      ? "text-blue-900"
                      : index < currentStep
                      ? "text-green-900"
                      : "text-gray-700"
                  }`}>
                    {step.name}
                  </h4>
                  
                  <Badge variant={
                    index === currentStep
                      ? "default"
                      : index < currentStep
                      ? "secondary"
                      : "outline"
                  }>
                    {index === currentStep
                      ? "进行中"
                      : index < currentStep
                      ? "已完成"
                      : "等待中"
                    }
                  </Badge>
                </div>
                
                <p className="text-xs text-gray-600 mt-1">
                  {step.description}
                </p>
                
                {/* 当前步骤的进度条 */}
                {index === currentStep && (
                  <div className="mt-2">
                    <Progress value={stepProgress} className="h-1" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 优化提示 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <Clock className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">优化过程说明</p>
              <p className="mt-1">
                系统正在自动分析和调整模型参数，以提高预测准确性和响应速度。
                整个过程大约需要2-3分钟，请耐心等待。
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
