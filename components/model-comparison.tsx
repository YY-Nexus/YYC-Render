"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus, BarChart3, Target, Zap } from 'lucide-react'

interface ModelComparisonProps {
  beforeResults?: any
  afterResults?: any
  onStartComparison?: () => void
}

export function ModelComparison({ beforeResults, afterResults, onStartComparison }: ModelComparisonProps) {
  if (!beforeResults && !afterResults) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>模型性能对比分析</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="space-y-4">
            <div className="text-gray-500">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>暂无测试数据</p>
              <p className="text-sm">请先运行准确性测试以获取对比数据</p>
            </div>
            {onStartComparison && (
              <Button onClick={onStartComparison}>
                开始性能测试
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const calculateImprovement = (before: number, after: number) => {
    if (!before || !after) return 0
    return ((after - before) / before) * 100
  }

  const getImprovementIcon = (improvement: number) => {
    if (improvement > 2) return <TrendingUp className="w-4 h-4 text-green-600" />
    if (improvement < -2) return <TrendingDown className="w-4 h-4 text-red-600" />
    return <Minus className="w-4 h-4 text-gray-600" />
  }

  const getImprovementColor = (improvement: number) => {
    if (improvement > 2) return "text-green-600"
    if (improvement < -2) return "text-red-600"
    return "text-gray-600"
  }

  const metrics = [
    {
      name: "总体准确率",
      before: beforeResults?.overallAccuracy,
      after: afterResults?.overallAccuracy,
      format: (value: number) => `${(value * 100).toFixed(1)}%`,
    },
    {
      name: "测试通过率",
      before: beforeResults?.passRate,
      after: afterResults?.passRate,
      format: (value: number) => `${(value * 100).toFixed(1)}%`,
    },
    {
      name: "通过测试数",
      before: beforeResults?.passedTests,
      after: afterResults?.passedTests,
      format: (value: number) => `${value}/${beforeResults?.totalTests || afterResults?.totalTests || 5}`,
    },
  ]

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <span>模型性能对比分析</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 总体对比 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metrics.map((metric, index) => {
            const improvement = calculateImprovement(metric.before, metric.after)
            
            return (
              <Card key={index} className="border-2">
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <h3
