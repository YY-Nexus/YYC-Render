import { type NextRequest, NextResponse } from "next/server"

interface StreamChatRequest {
  messages: Array<{
    role: "user" | "assistant" | "system"
    content: string
  }>
  model?: string
  temperature?: number
  max_tokens?: number
  stream: boolean
}

// 模拟流式响应生成器
async function* generateStreamResponse(messages: any[], options: any) {
  const lastMessage = messages[messages.length - 1]
  const userQuestion = lastMessage.content

  // 根据问题生成响应
  const responses = {
    greeting: "你好！我是AI助手，很高兴为您服务。有什么我可以帮助您的吗？",
    programming: `关于编程问题"${userQuestion}"，让我为您详细解答：

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

希望这个回答对您有帮助！`,
    learning: `关于学习"${userQuestion}"，我为您制定了详细的学习计划：

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
- 权威书籍和参考资料
- 在线课程和教程
- 实践项目和案例研究

## 学习建议
1. 制定明确的学习目标
2. 理论与实践相结合
3. 持续总结和反思
4. 积极交流和分享`,
    default: `关于您的问题"${userQuestion}"，我来为您详细解答：

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

## 建议和总结
基于以上分析，我的建议是：
1. 深入了解基础知识
2. 关注实际应用
3. 保持学习和更新

希望这个回答对您有帮助！`,
  }

  // 判断问题类型
  const lowerQuestion = userQuestion.toLowerCase()
  let responseType = "default"

  if (lowerQuestion.includes("你好") || lowerQuestion.includes("hello")) {
    responseType = "greeting"
  } else if (
    lowerQuestion.includes("编程") ||
    lowerQuestion.includes("代码") ||
    lowerQuestion.includes("python") ||
    lowerQuestion.includes("javascript")
  ) {
    responseType = "programming"
  } else if (lowerQuestion.includes("学习") || lowerQuestion.includes("如何")) {
    responseType = "learning"
  }

  const fullResponse = responses[responseType as keyof typeof responses]
  const words = fullResponse.split("")

  // 模拟打字效果
  let currentText = ""
  for (let i = 0; i < words.length; i++) {
    currentText += words[i]

    yield {
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion.chunk",
      created: Math.floor(Date.now() / 1000),
      model: options.model || "gpt-3.5-turbo",
      choices: [
        {
          index: 0,
          delta: {
            content: words[i],
          },
          finish_reason: null,
        },
      ],
    }

    // 控制输出速度
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 50 + 10))
  }

  // 发送结束标记
  yield {
    id: `chatcmpl-${Date.now()}`,
    object: "chat.completion.chunk",
    created: Math.floor(Date.now() / 1000),
    model: options.model || "gpt-3.5-turbo",
    choices: [
      {
        index: 0,
        delta: {},
        finish_reason: "stop",
      },
    ],
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: StreamChatRequest = await request.json()

    // 验证请求数据
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: "消息数组不能为空" }, { status: 400 })
    }

    // 创建流式响应
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = generateStreamResponse(body.messages, {
            model: body.model,
            temperature: body.temperature,
            max_tokens: body.max_tokens,
          })

          for await (const chunk of generator) {
            const data = `data: ${JSON.stringify(chunk)}\n\n`
            controller.enqueue(encoder.encode(data))
          }

          // 发送结束标记
          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
          controller.close()
        } catch (error) {
          console.error("流式响应生成错误:", error)
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Stream Chat API错误:", error)
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Stream Chat API正常运行",
    timestamp: new Date().toISOString(),
    features: ["流式响应", "实时输出", "打字效果"],
  })
}
