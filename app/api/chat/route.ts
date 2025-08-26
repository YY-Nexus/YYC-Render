import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

interface ChatRequest {
  messages: ChatMessage[]
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

// 模拟AI回答生成
async function generateAIResponse(
  messages: ChatMessage[],
  options: {
    model?: string
    temperature?: number
    max_tokens?: number
  } = {},
): Promise<string> {
  const lastMessage = messages[messages.length - 1]
  const userQuestion = lastMessage.content

  // 模拟思考时间
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

  // 根据问题类型生成不同的回答
  const responses = {
    greeting: [
      "您好！我是您的AI助手，很高兴为您服务。有什么我可以帮助您的吗？",
      "你好！我在这里为您提供帮助。请告诉我您需要什么信息或协助。",
      "欢迎！我是AI智能助手，随时准备回答您的问题。",
    ],
    programming: [
      `关于编程问题"${userQuestion}"，我来为您详细解答：

## 核心概念
这个问题涉及到几个重要的编程概念和最佳实践。

## 解决方案
1. **分析问题**：首先需要理解问题的本质和需求
2. **设计方案**：制定清晰的解决思路
3. **编码实现**：使用合适的技术栈实现功能
4. **测试验证**：确保代码的正确性和稳定性

## 代码示例
\`\`\`python
# 这里是相关的代码示例
def solve_problem():
    # 实现逻辑
    return "解决方案"
\`\`\`

## 最佳实践
- 保持代码简洁易读
- 添加适当的注释
- 进行充分的测试
- 考虑性能优化

希望这个回答对您有帮助！如果还有其他问题，请随时询问。`,

      `针对您的编程问题，我提供以下详细解答：

## 问题分析
${userQuestion}

这是一个很好的技术问题，让我从多个角度来分析：

## 技术要点
1. **核心原理**：理解底层工作机制
2. **实现方法**：多种解决方案对比
3. **性能考虑**：优化策略和注意事项
4. **实际应用**：在项目中的具体使用

## 详细解答
根据您的问题，我建议采用以下方法：

### 方法一：传统方案
- 优点：稳定可靠，易于理解
- 缺点：可能性能不是最优
- 适用场景：小型项目或学习阶段

### 方法二：现代方案
- 优点：性能优秀，功能强大
- 缺点：学习成本较高
- 适用场景：大型项目或生产环境

## 推荐资源
- 官方文档和教程
- 开源项目参考
- 社区最佳实践

如果您需要更具体的帮助，请提供更多细节信息。`,
    ],
    learning: [
      `关于学习"${userQuestion}"，我为您制定了一个系统的学习计划：

## 学习路径
### 第一阶段：基础入门（1-2周）
- 了解基本概念和术语
- 掌握核心原理
- 完成入门练习

### 第二阶段：深入学习（2-4周）
- 学习高级概念
- 实践复杂项目
- 理解最佳实践

### 第三阶段：实战应用（持续）
- 参与实际项目
- 解决真实问题
- 持续改进提升

## 学习资源
### 书籍推荐
- 权威教材和参考书
- 实战指南和案例集
- 最新技术趋势分析

### 在线资源
- 官方文档和教程
- 视频课程和讲座
- 社区论坛和博客

### 实践平台
- 在线编程环境
- 项目托管平台
- 竞赛和挑战

## 学习建议
1. **制定计划**：设定明确的学习目标和时间表
2. **理论实践**：理论学习与动手实践相结合
3. **持续总结**：定期回顾和总结学习成果
4. **交流分享**：与他人交流学习心得

祝您学习顺利！有任何问题都可以随时询问。`,

      `您想学习${userQuestion}，这是一个很有价值的选择！让我为您提供详细的指导：

## 为什么要学习这个？
- 市场需求大，就业前景好
- 技能实用性强，应用范围广
- 个人发展潜力巨大

## 学习准备
### 前置知识
- 需要掌握的基础知识
- 推荐的预备课程
- 必要的工具和环境

### 学习心态
- 保持耐心和恒心
- 勇于实践和试错
- 积极寻求帮助

## 详细学习计划
### 初级阶段（入门）
**时间：1-2个月**
- 学习基础概念
- 完成简单练习
- 建立知识框架

**学习内容：**
- 核心概念和原理
- 基本操作和技能
- 常用工具使用

### 中级阶段（提升）
**时间：2-4个月**
- 深入理解原理
- 完成中等项目
- 掌握进阶技能

**学习内容：**
- 高级特性和功能
- 项目实战经验
- 问题解决能力

### 高级阶段（精通）
**时间：持续学习**
- 专业领域深耕
- 复杂项目实践
- 技术创新探索

## 学习方法建议
1. **循序渐进**：从简单到复杂，逐步提升
2. **多动手练**：理论结合实践，加深理解
3. **多交流**：参与社区，与他人分享经验
4. **持续更新**：关注最新发展，保持技能更新

相信通过系统的学习，您一定能够掌握这项技能！`,
    ],
    general: [
      `关于您的问题"${userQuestion}"，我来为您详细解答：

## 问题分析
这是一个很有意思的问题，涉及到多个方面的知识和考虑。

## 详细回答
### 核心要点
1. **基本概念**：首先需要理解相关的基础概念
2. **关键因素**：影响结果的主要因素分析
3. **实际应用**：在现实中的具体应用场景

### 深入探讨
从不同角度来看这个问题：

**理论角度**：
- 相关的理论基础
- 学术研究成果
- 专家观点分析

**实践角度**：
- 实际操作方法
- 成功案例分享
- 常见问题解决

**未来发展**：
- 发展趋势预测
- 新技术影响
- 机遇与挑战

## 建议和总结
基于以上分析，我的建议是：
1. 深入了解基础知识
2. 关注实际应用
3. 保持学习和更新

希望这个回答对您有帮助！如果您需要更具体的信息，请告诉我。`,

      `您提出了一个很好的问题："${userQuestion}"

## 综合分析
这个问题确实值得深入思考，让我从多个维度为您分析：

### 背景介绍
首先，我们需要了解这个问题的背景和重要性。

### 核心内容
#### 主要方面
1. **第一个重点**：详细说明和分析
2. **第二个重点**：相关影响和考虑
3. **第三个重点**：实际应用和意义

#### 关键细节
- 重要的技术细节
- 需要注意的关键点
- 常见的误区和陷阱

### 实用指导
#### 具体步骤
1. **准备阶段**：需要做的前期准备
2. **实施阶段**：具体的操作方法
3. **完善阶段**：后续的优化改进

#### 注意事项
- 重要的安全考虑
- 性能优化建议
- 维护和更新要点

### 相关资源
为了帮助您更好地理解，我推荐以下资源：
- 权威文档和指南
- 实用工具和平台
- 学习社区和论坛

## 总结
总的来说，这个问题涉及面较广，需要综合考虑多个因素。建议您根据自己的具体情况，选择最适合的方法。

如果您有更具体的需求或疑问，欢迎继续交流！`,
    ],
  }

  // 判断问题类型
  const lowerQuestion = userQuestion.toLowerCase()
  let responseType = "general"

  if (lowerQuestion.includes("你好") || lowerQuestion.includes("hello") || lowerQuestion.includes("hi")) {
    responseType = "greeting"
  } else if (
    lowerQuestion.includes("编程") ||
    lowerQuestion.includes("代码") ||
    lowerQuestion.includes("python") ||
    lowerQuestion.includes("javascript") ||
    lowerQuestion.includes("程序") ||
    lowerQuestion.includes("开发")
  ) {
    responseType = "programming"
  } else if (lowerQuestion.includes("学习") || lowerQuestion.includes("如何") || lowerQuestion.includes("怎么")) {
    responseType = "learning"
  }

  const responseOptions = responses[responseType as keyof typeof responses]
  const selectedResponse = responseOptions[Math.floor(Math.random() * responseOptions.length)]

  return selectedResponse
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, temperature = 0.7, maxTokens = 2000 } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "消息格式不正确" }, { status: 400 })
    }

    // 验证消息格式
    for (const message of messages) {
      if (!message.role || !message.content) {
        return NextResponse.json({ error: "消息必须包含role和content字段" }, { status: 400 })
      }
    }

    const startTime = Date.now()

    // 调用AI生成回复
    const { text, usage } = await generateText({
      model: openai("gpt-4o"),
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature,
      maxTokens,
    })

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      id: `chat-${Date.now()}`,
      choices: [
        {
          message: {
            role: "assistant",
            content: text,
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: usage?.promptTokens || 0,
        completion_tokens: usage?.completionTokens || 0,
        total_tokens: usage?.totalTokens || 0,
      },
      metadata: {
        responseTime,
        model: "gpt-4o",
        timestamp: Date.now(),
      },
    })
  } catch (error) {
    console.error("聊天API错误:", error)

    return NextResponse.json(
      {
        error: "AI服务暂时不可用，请稍后重试",
        details: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "聊天API正常运行",
    timestamp: new Date().toISOString(),
  })
}
