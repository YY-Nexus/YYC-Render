import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const mockData = {
      message: "离线测试数据",
      offline: false,
      timestamp: new Date().toISOString(),
      data: {
        searchResults: [
          {
            id: "result-1",
            title: "人工智能基础教程",
            description: "全面介绍人工智能的基本概念、发展历程和应用领域",
            url: "https://example.com/ai-tutorial",
            type: "article",
            relevance: 0.95,
            timestamp: new Date().toISOString(),
          },
          {
            id: "result-2",
            title: "机器学习算法详解",
            description: "深入解析常用机器学习算法的原理和实现方法",
            url: "https://example.com/ml-algorithms",
            type: "tutorial",
            relevance: 0.88,
            timestamp: new Date().toISOString(),
          },
          {
            id: "result-3",
            title: "深度学习实战项目",
            description: "通过实际项目学习深度学习的应用和开发技巧",
            url: "https://example.com/dl-projects",
            type: "project",
            relevance: 0.82,
            timestamp: new Date().toISOString(),
          },
        ],
        suggestions: ["自然语言处理", "计算机视觉", "强化学习", "神经网络"],
        stats: {
          totalResults: 1247,
          searchTime: 0.23,
          sources: ["学术论文", "技术博客", "官方文档", "视频教程"],
        },
      },
    }

    return NextResponse.json(mockData, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("离线测试API错误:", error)

    return NextResponse.json(
      {
        error: "服务暂时不可用",
        offline: true,
        timestamp: new Date().toISOString(),
        fallbackData: {
          message: "使用缓存数据",
          items: [
            { id: "cache-1", title: "缓存数据1", description: "这是离线缓存的数据" },
            { id: "cache-2", title: "缓存数据2", description: "这是另一条缓存数据" },
          ],
        },
      },
      {
        status: 503,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 模拟数据处理
    const processedData = {
      id: `offline-${Date.now()}`,
      query: body.query || "默认查询",
      results: body.query ? `处理查询: ${body.query}` : "默认处理结果",
      timestamp: new Date().toISOString(),
      processed: true,
    }

    return NextResponse.json({
      success: true,
      data: processedData,
      message: "离线数据处理成功",
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "离线数据处理失败",
        timestamp: new Date().toISOString(),
      },
      { status: 400 },
    )
  }
}
