import { type NextRequest, NextResponse } from "next/server"

interface SyncData {
  type: "search_history" | "favorites" | "settings" | "user_data"
  data: any
  timestamp: string
  deviceId: string
}

interface SyncResponse {
  success: boolean
  synced: number
  conflicts: number
  lastSync: string
  data?: any
}

// 模拟数据存储
const syncStorage = new Map<string, any>()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get("deviceId") || "default"
    const lastSync = searchParams.get("lastSync")
    const dataType = searchParams.get("type")

    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    // 获取同步数据
    const syncKey = `${deviceId}_${dataType || "all"}`
    const storedData = syncStorage.get(syncKey) || {
      searchHistory: [],
      favorites: [],
      settings: {},
      userData: {},
    }

    // 模拟增量同步
    const response: SyncResponse = {
      success: true,
      synced: Object.keys(storedData).length,
      conflicts: 0,
      lastSync: new Date().toISOString(),
      data: storedData,
    }

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("同步获取失败:", error)

    return NextResponse.json(
      {
        success: false,
        error: "同步服务暂时不可用",
        synced: 0,
        conflicts: 0,
        lastSync: new Date().toISOString(),
      },
      { status: 503 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const syncData: SyncData = await request.json()

    // 验证数据
    if (!syncData.type || !syncData.data || !syncData.deviceId) {
      return NextResponse.json(
        {
          success: false,
          error: "同步数据格式错误",
        },
        { status: 400 },
      )
    }

    // 模拟数据冲突检测
    const syncKey = `${syncData.deviceId}_${syncData.type}`
    const existingData = syncStorage.get(syncKey)
    let conflicts = 0

    if (existingData && existingData.timestamp > syncData.timestamp) {
      conflicts = 1
      // 这里可以实现冲突解决策略
    }

    // 存储同步数据
    syncStorage.set(syncKey, {
      ...syncData.data,
      timestamp: new Date().toISOString(),
      deviceId: syncData.deviceId,
    })

    const response: SyncResponse = {
      success: true,
      synced: 1,
      conflicts,
      lastSync: new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("同步上传失败:", error)

    return NextResponse.json(
      {
        success: false,
        error: "同步上传失败",
        synced: 0,
        conflicts: 0,
        lastSync: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get("deviceId") || "default"
    const action = searchParams.get("action")

    switch (action) {
      case "resolve_conflict":
        const conflictData = await request.json()
        // 实现冲突解决逻辑
        syncStorage.set(`${deviceId}_resolved`, {
          ...conflictData,
          resolved: true,
          timestamp: new Date().toISOString(),
        })

        return NextResponse.json({
          success: true,
          message: "冲突已解决",
        })

      case "force_sync":
        const forceData = await request.json()
        // 强制同步，覆盖现有数据
        Object.keys(forceData).forEach((key) => {
          syncStorage.set(`${deviceId}_${key}`, forceData[key])
        })

        return NextResponse.json({
          success: true,
          message: "强制同步完成",
        })

      default:
        return NextResponse.json(
          {
            success: false,
            error: "未知的同步操作",
          },
          { status: 400 },
        )
    }
  } catch (error) {
    console.error("同步操作失败:", error)

    return NextResponse.json(
      {
        success: false,
        error: "同步操作失败",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get("deviceId") || "default"
    const dataType = searchParams.get("type")

    if (dataType) {
      // 删除特定类型的同步数据
      syncStorage.delete(`${deviceId}_${dataType}`)
    } else {
      // 删除设备的所有同步数据
      const keysToDelete = Array.from(syncStorage.keys()).filter((key) => key.startsWith(`${deviceId}_`))

      keysToDelete.forEach((key) => syncStorage.delete(key))
    }

    return NextResponse.json({
      success: true,
      message: "同步数据已清除",
    })
  } catch (error) {
    console.error("清除同步数据失败:", error)

    return NextResponse.json(
      {
        success: false,
        error: "清除同步数据失败",
      },
      { status: 500 },
    )
  }
}
