import { type NextRequest, NextResponse } from "next/server"
import { localLLMManager } from "@/lib/local-llm"
import { LocalLLMConfigManager } from "@/lib/local-llm-config"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get("provider")
    const refresh = searchParams.get("refresh") === "true"

    if (refresh) {
      await localLLMManager.refreshModels(providerId || undefined)
    }

    const models = await localLLMManager.getAvailableModels(providerId || undefined)

    return NextResponse.json({
      success: true,
      data: models,
      meta: {
        total: models.length,
        providers: [...new Set(models.map((m) => m.provider))],
        lastUpdated: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Models API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch models",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")
    const body = await request.json()

    switch (action) {
      case "pull":
        // 拉取新模型（主要用于 Ollama）
        const provider = LocalLLMConfigManager.getProvider(body.providerId)
        if (!provider) {
          return NextResponse.json(
            {
              success: false,
              error: "Provider not found",
            },
            { status: 404 },
          )
        }

        if (provider.type === "ollama") {
          const pullResult = await pullOllamaModel(provider, body.modelName)
          return NextResponse.json({
            success: pullResult.success,
            data: pullResult.data,
            error: pullResult.error,
          })
        } else {
          return NextResponse.json(
            {
              success: false,
              error: "Model pulling is only supported for Ollama",
            },
            { status: 400 },
          )
        }

      case "delete":
        // 删除模型
        const deleteProvider = LocalLLMConfigManager.getProvider(body.providerId)
        if (!deleteProvider) {
          return NextResponse.json(
            {
              success: false,
              error: "Provider not found",
            },
            { status: 404 },
          )
        }

        if (deleteProvider.type === "ollama") {
          const deleteResult = await deleteOllamaModel(deleteProvider, body.modelName)
          return NextResponse.json({
            success: deleteResult.success,
            data: deleteResult.data,
            error: deleteResult.error,
          })
        } else {
          return NextResponse.json(
            {
              success: false,
              error: "Model deletion is only supported for Ollama",
            },
            { status: 400 },
          )
        }

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid action. Supported actions: pull, delete",
          },
          { status: 400 },
        )
    }
  } catch (error) {
    console.error("Models API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}

async function pullOllamaModel(provider: any, modelName: string) {
  try {
    const response = await fetch(`${provider.baseUrl}/api/pull`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: modelName,
        stream: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    // 刷新模型列表
    await localLLMManager.refreshModels(provider.id)

    return {
      success: true,
      data: {
        message: `Model ${modelName} pulled successfully`,
        status: data.status,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to pull model",
    }
  }
}

async function deleteOllamaModel(provider: any, modelName: string) {
  try {
    const response = await fetch(`${provider.baseUrl}/api/delete`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: modelName,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    // 刷新模型列表
    await localLLMManager.refreshModels(provider.id)

    return {
      success: true,
      data: {
        message: `Model ${modelName} deleted successfully`,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete model",
    }
  }
}
