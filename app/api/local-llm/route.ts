import { type NextRequest, NextResponse } from "next/server"
import { localLLMManager } from "@/lib/local-llm"
import { LocalLLMConfigManager } from "@/lib/local-llm-config"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    switch (action) {
      case "config":
        const config = LocalLLMConfigManager.getConfig()
        return NextResponse.json({ success: true, data: config })

      case "providers":
        const providers = LocalLLMConfigManager.getEnabledProviders()
        return NextResponse.json({ success: true, data: providers })

      case "models":
        const providerId = searchParams.get("provider")
        const models = await localLLMManager.getAvailableModels(providerId || undefined)
        return NextResponse.json({ success: true, data: models })

      case "health":
        const healthResults = []
        const enabledProviders = LocalLLMConfigManager.getEnabledProviders()

        for (const provider of enabledProviders) {
          const result = await localLLMManager.testConnection(provider)
          healthResults.push({
            providerId: provider.id,
            providerName: provider.name,
            ...result,
          })
        }

        return NextResponse.json({ success: true, data: healthResults })

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid action. Supported actions: config, providers, models, health",
          },
          { status: 400 },
        )
    }
  } catch (error) {
    console.error("Local LLM API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
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
      case "update-config":
        LocalLLMConfigManager.saveConfig(body.config)
        return NextResponse.json({ success: true, message: "Configuration updated" })

      case "update-provider":
        LocalLLMConfigManager.updateProvider(body.providerId, body.updates)
        return NextResponse.json({ success: true, message: "Provider updated" })

      case "add-provider":
        LocalLLMConfigManager.addCustomProvider(body.provider)
        return NextResponse.json({ success: true, message: "Provider added" })

      case "remove-provider":
        LocalLLMConfigManager.removeProvider(body.providerId)
        return NextResponse.json({ success: true, message: "Provider removed" })

      case "refresh-models":
        await localLLMManager.refreshModels(body.providerId)
        const models = await localLLMManager.getAvailableModels(body.providerId)
        return NextResponse.json({ success: true, data: models })

      case "test-connection":
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

        const testResult = await localLLMManager.testConnection(provider)
        return NextResponse.json({ success: true, data: testResult })

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid action",
          },
          { status: 400 },
        )
    }
  } catch (error) {
    console.error("Local LLM API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}
