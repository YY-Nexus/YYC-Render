"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Target, CheckCircle, XCircle, Clock, BarChart3 } from 'lucide-react'

interface PredictionAccuracyTestProps {
  modelVersion: "before" | "after"
  onTestComplete: (results: any) => void
}

export function PredictionAccuracyTest({ modelVersion, onTestComplete }: PredictionAccuracyTestProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState(0)
  const [progress, setProgress] = useState(0)
  const [testResults, setTestResults] = useState<any[]>([])
  const [finalResults, setFinalResults] = useState<any>(null)

  const testScenarios = [
    {
      name: "搜索行为预测",
      description: "预测用户下一步搜索行为",
      expectedAccuracy: modelVersion === "before" ? 0.65 : 0.73,
    },
    {
      name: "UI交互预测",
      description: "预测用户界面交互模式",
      expectedAccuracy: modelVersion === "before" ? 0.71 : 0.78,
    },
    {
      name: "工作流程优化",
      description: "预测最优工作流程路径",
      expectedAccuracy: modelVersion === "before" ? 0.68 : 0.75,
    },
    {
      name: "内容偏好预测",
      description: "预测用户内容偏好",
      expectedAccuracy: modelVersion === "before" ? 0.72 : 0.80,
    },
    {
      name: "时间模式识别",
      description: "识别用户行为时间模式",
      expectedAccuracy: modelVersion === "before" ? 0.69 : 0.76,
    },
  ]

  const runTest = async () => {
    setIsRunning(true)
    setCurrentTest(0)
    setProgress(0)
    setTestResults([])
    setFinalResults(null)

    for (let i = 0; i < testScenarios.length; i++) {
      setCurrentTest(i)
      
      // 模拟测试运行
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const scenario = testScenarios[i]
      const actualAccuracy = scenario.expectedAccuracy + (Math.random() - 0.5) * 0.1
      const testResult = {
        scenario: scenario.name,
        description: scenario.description,
        expectedAccuracy: scenario.expectedAccuracy,
        actualAccuracy: Math.max(0, Math.min(1, actualAccuracy)),
        passed: actualAccuracy >= scenario.expectedAccuracy * 0.95,
        testTime: 2000 + Math.random() * 1000,
      }
      
      setTestResults(prev => [...prev, testResult])
      setProgress(((i + 1) / testScenarios.length) * 100)
    }

    // 计算最终结果
    const avgAccuracy = testResults.reduce((sum, result) => sum + result.actualAccuracy, 0) / testResults.length
    const passedTests = testResults.filter(result => result.passed).length
    const totalTests = testResults.length

    const results = {
      modelVersion,
      overallAccuracy: avgAccuracy,
      passedTests,
      totalTests,
      passRate: passedTests / totalTests,
      testResults,
      improvements: modelVersion === "after" ? {
        accuracyImprovement: 0.08,
        precisionImprovement: 0.06,
        recallImprovement: 0.07,
      } : null,
    }

    setFinalResults(results)
    setIsRunning(false)
    
    setTimeout(() => {
      onTestComplete(results)
    }, 1000)
  }

  useEffect(() => {
    // 自动开始测试
    runTest()
  }, [])

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="w-5 h-5 text-green-600" />
          <span>预测准确性测试 - {modelVersion === "before" ? "优化前" : "优化后"}模型</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 总体进度 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>测试进度</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* 测试场景列表 */}
        <div className="space-y-3">
          {testScenarios.map((scenario, index) => {
            const result = testResults[index]
            const isCurrent = index === currentTest && isRunning
            const isCompleted = result !== undefined
            
            return (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  isCurrent
                    ? "bg-blue-50 border-blue-200"
                    : isCompleted
                    ? result.passed
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`flex-shrink-0 ${
                    isCurrent
                      ? "text-blue-600"
                      : isCompleted
                      ? result.passed
                        ? "text-green-600"
                        : "text-red-600"
                      : "text-gray-400"
                  }`}>
                    {isCurrent ? (
                      <Clock className="w-4 h-4 animate-spin" />
                    ) : isCompleted ? (
                      result.passed ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )
                    ) : (
                      <Target className="w-4 h-4" />
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium">{scenario.name}</h4>
                    <p className="text-xs text-gray-600">{scenario.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {isCompleted && (
                    <>
                      <div className="text-right text-xs">
                        <div className="font-medium">
                          准确率: {(result.actualAccuracy * 100).toFixed(1)}%
                        </div>
                        <div className="text-gray-500">
                          预期: {(result.expectedAccuracy * 100).toFixed(1)}%
                        </div>
                      </div>
                      <Badge variant={result.passed ? "secondary" : "destructive"}>
                        {result.passed ? "通过" : "未通过"}
                      </Badge>
                    </>
                  )}
                  
                  {isCurrent && (
                    <Badge variant="default">测试中</Badge>
                  )}
                  
                  {!isCompleted && !isCurrent && (
                    <Badge variant="outline">等待</Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* 最终结果 */}
        {finalResults && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <BarChart3 className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-green-900 mb-2">测试结果总结</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">总体准确率</div>
                    <div className="font-bold text-green-700">
                      {(finalResults.overallAccuracy * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">通过率</div>
                    <div className="font-bold text-green-700">
                      {(finalResults.passRate * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">通过测试</div>
                    <div className="font-bold text-green-700">
                      {finalResults.passedTests}/{finalResults.totalTests}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">模型版本</div>
                    <div className="font-bold text-green-700">
                      {modelVersion === "before" ? "优化前" : "优化后"}
                    </div>
                  </div>
                </div>
                
                {finalResults.improvements && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <div className="text-xs text-green-800">
                      <strong>优化改进:</strong> 准确率提升 {(finalResults.improvements.accuracyImprovement * 100).toFixed(1)}%, 
                      精确率提升 {(finalResults.improvements.precisionImprovement * 100).toFixed(1)}%, 
                      召回率提升 {(finalResults.improvements.recallImprovement * 100).toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-center">
          <Button
            onClick={runTest}
            disabled={isRunning}
            className="min-w-32"
          >
            {isRunning ? "测试中..." : "重新测试"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
