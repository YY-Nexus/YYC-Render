import { LocalLLMConfigManager } from "./local-llm-config"

export interface FineTuningDataset {
  id: string
  name: string
  description: string
  format: "jsonl" | "csv" | "txt"
  size: number
  samples: number
  createdAt: number
  updatedAt: number
  filePath: string
  validation?: {
    accuracy: number
    loss: number
    perplexity: number
  }
}

export interface FineTuningJob {
  id: string
  name: string
  baseModel: string
  dataset: string
  provider: string
  status: "pending" | "running" | "completed" | "failed" | "cancelled"
  progress: number
  startedAt?: number
  completedAt?: number
  error?: string
  config: FineTuningConfig
  metrics?: FineTuningMetrics
  outputModel?: string
}

export interface FineTuningConfig {
  learningRate: number
  batchSize: number
  epochs: number
  maxLength: number
  temperature: number
  validationSplit: number
  saveSteps: number
  loggingSteps: number
  warmupSteps: number
  weightDecay: number
  gradientAccumulation: number
  useLoRA: boolean
  loraRank?: number
  loraAlpha?: number
  loraDropout?: number
}

export interface FineTuningMetrics {
  trainLoss: number[]
  validationLoss: number[]
  trainAccuracy: number[]
  validationAccuracy: number[]
  learningRate: number[]
  perplexity: number[]
  bleuScore?: number
  rougeScore?: number
}

export interface DataSample {
  input: string
  output: string
  instruction?: string
  context?: string
  category?: string
  difficulty?: number
}

export class ModelFineTuningManager {
  private static readonly DATASETS_KEY = "fine-tuning-datasets"
  private static readonly JOBS_KEY = "fine-tuning-jobs"

  // 数据集管理
  static getDatasets(): FineTuningDataset[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.DATASETS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("获取数据集失败:", error)
      return []
    }
  }

  static saveDatasets(datasets: FineTuningDataset[]): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(this.DATASETS_KEY, JSON.stringify(datasets))
    } catch (error) {
      console.error("保存数据集失败:", error)
    }
  }

  static addDataset(dataset: Omit<FineTuningDataset, "id" | "createdAt" | "updatedAt">): FineTuningDataset {
    const newDataset: FineTuningDataset = {
      ...dataset,
      id: `dataset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    const datasets = this.getDatasets()
    datasets.push(newDataset)
    this.saveDatasets(datasets)

    return newDataset
  }

  static updateDataset(id: string, updates: Partial<FineTuningDataset>): void {
    const datasets = this.getDatasets()
    const index = datasets.findIndex((d) => d.id === id)

    if (index !== -1) {
      datasets[index] = { ...datasets[index], ...updates, updatedAt: Date.now() }
      this.saveDatasets(datasets)
    }
  }

  static deleteDataset(id: string): void {
    const datasets = this.getDatasets().filter((d) => d.id !== id)
    this.saveDatasets(datasets)
  }

  static getDataset(id: string): FineTuningDataset | null {
    return this.getDatasets().find((d) => d.id === id) || null
  }

  // 微调任务管理
  static getJobs(): FineTuningJob[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.JOBS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("获取微调任务失败:", error)
      return []
    }
  }

  static saveJobs(jobs: FineTuningJob[]): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(this.JOBS_KEY, JSON.stringify(jobs))
    } catch (error) {
      console.error("保存微调任务失败:", error)
    }
  }

  static createJob(job: Omit<FineTuningJob, "id" | "status" | "progress">): FineTuningJob {
    const newJob: FineTuningJob = {
      ...job,
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: "pending",
      progress: 0,
    }

    const jobs = this.getJobs()
    jobs.push(newJob)
    this.saveJobs(jobs)

    return newJob
  }

  static updateJob(id: string, updates: Partial<FineTuningJob>): void {
    const jobs = this.getJobs()
    const index = jobs.findIndex((j) => j.id === id)

    if (index !== -1) {
      jobs[index] = { ...jobs[index], ...updates }
      this.saveJobs(jobs)
    }
  }

  static getJob(id: string): FineTuningJob | null {
    return this.getJobs().find((j) => j.id === id) || null
  }

  static cancelJob(id: string): void {
    this.updateJob(id, { status: "cancelled" })
  }

  // 数据预处理
  static async preprocessData(
    samples: DataSample[],
    config: Partial<FineTuningConfig> = {},
  ): Promise<{
    processed: any[]
    statistics: {
      totalSamples: number
      avgInputLength: number
      avgOutputLength: number
      categories: Record<string, number>
      difficulties: Record<string, number>
    }
  }> {
    const processed = samples.map((sample, index) => ({
      id: index,
      messages: [
        ...(sample.instruction ? [{ role: "system", content: sample.instruction }] : []),
        ...(sample.context
          ? [{ role: "user", content: `${sample.context}\n\n${sample.input}` }]
          : [{ role: "user", content: sample.input }]),
        { role: "assistant", content: sample.output },
      ],
      metadata: {
        category: sample.category,
        difficulty: sample.difficulty,
        inputLength: sample.input.length,
        outputLength: sample.output.length,
      },
    }))

    const statistics = {
      totalSamples: samples.length,
      avgInputLength: samples.reduce((sum, s) => sum + s.input.length, 0) / samples.length,
      avgOutputLength: samples.reduce((sum, s) => sum + s.output.length, 0) / samples.length,
      categories: samples.reduce(
        (acc, s) => {
          if (s.category) {
            acc[s.category] = (acc[s.category] || 0) + 1
          }
          return acc
        },
        {} as Record<string, number>,
      ),
      difficulties: samples.reduce(
        (acc, s) => {
          if (s.difficulty !== undefined) {
            const level = s.difficulty.toString()
            acc[level] = (acc[level] || 0) + 1
          }
          return acc
        },
        {} as Record<string, number>,
      ),
    }

    return { processed, statistics }
  }

  // 数据验证
  static validateDataset(samples: DataSample[]): {
    valid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    if (samples.length === 0) {
      errors.push("数据集不能为空")
      return { valid: false, errors, warnings }
    }

    if (samples.length < 10) {
      warnings.push("数据集样本数量较少，建议至少包含100个样本以获得更好的微调效果")
    }

    samples.forEach((sample, index) => {
      if (!sample.input || !sample.output) {
        errors.push(`样本 ${index + 1}: 输入和输出不能为空`)
      }

      if (sample.input.length < 10) {
        warnings.push(`样本 ${index + 1}: 输入文本过短，可能影响训练效果`)
      }

      if (sample.output.length < 5) {
        warnings.push(`样本 ${index + 1}: 输出文本过短，可能影响训练效果`)
      }

      if (sample.input.length > 2000) {
        warnings.push(`样本 ${index + 1}: 输入文本过长，可能需要截断`)
      }

      if (sample.output.length > 1000) {
        warnings.push(`样本 ${index + 1}: 输出文本过长，可能影响训练速度`)
      }
    })

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  // 获取默认配置
  static getDefaultConfig(): FineTuningConfig {
    return {
      learningRate: 5e-5,
      batchSize: 4,
      epochs: 3,
      maxLength: 512,
      temperature: 0.7,
      validationSplit: 0.1,
      saveSteps: 500,
      loggingSteps: 100,
      warmupSteps: 100,
      weightDecay: 0.01,
      gradientAccumulation: 1,
      useLoRA: true,
      loraRank: 16,
      loraAlpha: 32,
      loraDropout: 0.1,
    }
  }

  // 估算训练时间和资源
  static estimateTraining(
    samples: number,
    config: FineTuningConfig,
  ): {
    estimatedTime: number // 分钟
    memoryUsage: number // GB
    diskSpace: number // GB
    recommendations: string[]
  } {
    const baseTimePerSample = 0.5 // 秒
    const totalTime = (samples * config.epochs * baseTimePerSample) / 60 // 分钟

    const memoryUsage = Math.max(4, config.batchSize * 2) // GB
    const diskSpace = Math.max(1, samples * 0.001) // GB

    const recommendations: string[] = []

    if (config.batchSize > 8) {
      recommendations.push("批次大小较大，确保有足够的GPU内存")
    }

    if (config.epochs > 5) {
      recommendations.push("训练轮数较多，注意监控过拟合")
    }

    if (samples < 100) {
      recommendations.push("样本数量较少，考虑使用更小的学习率")
    }

    if (config.learningRate > 1e-4) {
      recommendations.push("学习率较高，可能导致训练不稳定")
    }

    return {
      estimatedTime: Math.ceil(totalTime),
      memoryUsage,
      diskSpace,
      recommendations,
    }
  }

  // 生成训练脚本
  static generateTrainingScript(job: FineTuningJob, dataset: FineTuningDataset): string {
    const provider = LocalLLMConfigManager.getProvider(job.provider)
    if (!provider) return ""

    switch (provider.type) {
      case "ollama":
        return this.generateOllamaScript(job, dataset)
      default:
        return this.generateGenericScript(job, dataset)
    }
  }

  private static generateOllamaScript(job: FineTuningJob, dataset: FineTuningDataset): string {
    return `#!/bin/bash
# Ollama 微调脚本
# 任务: ${job.name}
# 基础模型: ${job.baseModel}
# 数据集: ${dataset.name}

echo "开始微调任务: ${job.name}"
echo "基础模型: ${job.baseModel}"
echo "数据集: ${dataset.name}"

# 创建 Modelfile
cat > Modelfile << EOF
FROM ${job.baseModel}

# 设置参数
PARAMETER temperature ${job.config.temperature}
PARAMETER top_p 0.9
PARAMETER top_k 40

# 添加训练数据
ADAPTER ./fine_tuned_adapter

# 系统提示
SYSTEM """
你是一个经过微调的AI助手，专门针对特定任务进行了优化。
"""
EOF

# 运行微调
ollama create ${job.name} -f Modelfile

echo "微调完成！新模型名称: ${job.name}"
echo "使用方法: ollama run ${job.name}"
`
  }

  private static generateGenericScript(job: FineTuningJob, dataset: FineTuningDataset): string {
    return `#!/usr/bin/env python3
# 通用微调脚本
# 任务: ${job.name}
# 基础模型: ${job.baseModel}
# 数据集: ${dataset.name}

import json
import torch
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling
)
from datasets import Dataset
from peft import LoraConfig, get_peft_model, TaskType

def load_dataset():
    """加载训练数据"""
    with open("${dataset.filePath}", "r", encoding="utf-8") as f:
        data = [json.loads(line) for line in f]
    return Dataset.from_list(data)

def main():
    print("开始微调任务: ${job.name}")
    print("基础模型: ${job.baseModel}")
    print("数据集: ${dataset.name}")
    
    # 加载模型和分词器
    tokenizer = AutoTokenizer.from_pretrained("${job.baseModel}")
    model = AutoModelForCausalLM.from_pretrained("${job.baseModel}")
    
    # 配置 LoRA
    ${
      job.config.useLoRA
        ? `
    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=${job.config.loraRank},
        lora_alpha=${job.config.loraAlpha},
        lora_dropout=${job.config.loraDropout},
        target_modules=["q_proj", "v_proj", "k_proj", "o_proj"]
    )
    model = get_peft_model(model, lora_config)
    `
        : ""
    }
    
    # 加载数据
    dataset = load_dataset()
    
    # 训练参数
    training_args = TrainingArguments(
        output_dir="./results",
        num_train_epochs=${job.config.epochs},
        per_device_train_batch_size=${job.config.batchSize},
        learning_rate=${job.config.learningRate},
        warmup_steps=${job.config.warmupSteps},
        logging_steps=${job.config.loggingSteps},
        save_steps=${job.config.saveSteps},
        weight_decay=${job.config.weightDecay},
        gradient_accumulation_steps=${job.config.gradientAccumulation},
    )
    
    # 创建训练器
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=dataset,
        tokenizer=tokenizer,
        data_collator=DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False),
    )
    
    # 开始训练
    trainer.train()
    
    # 保存模型
    trainer.save_model("./fine_tuned_model")
    tokenizer.save_pretrained("./fine_tuned_model")
    
    print("微调完成！")

if __name__ == "__main__":
    main()
`
  }
}
