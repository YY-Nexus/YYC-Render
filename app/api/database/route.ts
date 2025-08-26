import { type NextRequest, NextResponse } from "next/server"
import { DatabaseManager, DataAccessLayer } from "@/lib/database"
import { EnhancedErrorHandler, ErrorType, ErrorSeverity } from "@/lib/error-handler"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    switch (action) {
      case "health":
        const healthStatus = await DatabaseManager.healthCheck()
        return NextResponse.json({
          success: true,
          data: healthStatus,
        })

      case "connections":
        const connections = DatabaseManager.getAllConnections()
        return NextResponse.json({
          success: true,
          data: connections,
        })

      case "history":
        const userId = searchParams.get("userId")
        const limit = Number.parseInt(searchParams.get("limit") || "50")
        const history = await DataAccessLayer.getSearchHistory(userId || undefined, limit)
        return NextResponse.json({
          success: true,
          data: history,
        })

      case "search_history":
        const query = searchParams.get("query")
        const searchUserId = searchParams.get("userId")

        if (!query) {
          throw EnhancedErrorHandler.createError(
            ErrorType.VALIDATION,
            "搜索查询不能为空",
            { action, query },
            ErrorSeverity.LOW,
          )
        }

        const searchResults = await DataAccessLayer.searchHistory(query, searchUserId || undefined)
        return NextResponse.json({
          success: true,
          data: searchResults,
        })

      case "favorites":
        const favUserId = searchParams.get("userId")
        const favorites = await DataAccessLayer.getFavorites(favUserId || undefined)
        return NextResponse.json({
          success: true,
          data: favorites,
        })

      case "conversations":
        const convUserId = searchParams.get("userId")
        const conversations = await DataAccessLayer.getConversations(convUserId || undefined)
        return NextResponse.json({
          success: true,
          data: conversations,
        })

      default:
        throw EnhancedErrorHandler.createError(
          ErrorType.VALIDATION,
          `不支持的操作: ${action}`,
          { action },
          ErrorSeverity.LOW,
        )
    }
  } catch (error) {
    console.error("数据库API GET请求失败:", error)

    if (error && typeof error === "object" && "type" in error) {
      // 这是我们的ErrorInfo对象
      return NextResponse.json(
        {
          success: false,
          error: {
            type: (error as any).type,
            message: (error as any).userMessage,
            id: (error as any).id,
          },
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          type: ErrorType.DATABASE,
          message: "数据库操作失败",
          details: error instanceof Error ? error.message : "未知错误",
        },
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data, options } = body

    switch (action) {
      case "connect":
        const { configName } = data
        if (!configName) {
          throw EnhancedErrorHandler.createError(
            ErrorType.VALIDATION,
            "数据库配置名称不能为空",
            { action, data },
            ErrorSeverity.MEDIUM,
          )
        }

        const connection = await DatabaseManager.createConnection(configName)
        return NextResponse.json({
          success: true,
          data: connection,
          message: `成功连接到数据库: ${configName}`,
        })

      case "switch":
        const { connectionId } = data
        if (!connectionId) {
          throw EnhancedErrorHandler.createError(
            ErrorType.VALIDATION,
            "连接ID不能为空",
            { action, data },
            ErrorSeverity.MEDIUM,
          )
        }

        const switched = DatabaseManager.switchConnection(connectionId)
        if (!switched) {
          throw EnhancedErrorHandler.createError(
            ErrorType.DATABASE,
            "切换数据库连接失败",
            { connectionId },
            ErrorSeverity.MEDIUM,
          )
        }

        return NextResponse.json({
          success: true,
          data: { connectionId },
          message: "数据库连接切换成功",
        })

      case "close":
        const { connectionId: closeId } = data
        if (!closeId) {
          throw EnhancedErrorHandler.createError(
            ErrorType.VALIDATION,
            "连接ID不能为空",
            { action, data },
            ErrorSeverity.MEDIUM,
          )
        }

        await DatabaseManager.closeConnection(closeId)
        return NextResponse.json({
          success: true,
          message: "数据库连接已关闭",
        })

      case "save_history":
        const historyData = data
        if (!historyData.question || !historyData.answer) {
          throw EnhancedErrorHandler.createError(
            ErrorType.VALIDATION,
            "问题和答案不能为空",
            { action, data },
            ErrorSeverity.MEDIUM,
          )
        }

        const historyId = await DataAccessLayer.saveSearchHistory({
          question: historyData.question,
          answer: historyData.answer,
          timestamp: historyData.timestamp || Date.now(),
          category: historyData.category || "通用",
          tags: historyData.tags || [],
          userId: historyData.userId,
        })

        return NextResponse.json({
          success: true,
          data: { id: historyId },
          message: "搜索历史保存成功",
        })

      case "save_favorite":
        const favoriteData = data
        if (!favoriteData.title || !favoriteData.content) {
          throw EnhancedErrorHandler.createError(
            ErrorType.VALIDATION,
            "标题和内容不能为空",
            { action, data },
            ErrorSeverity.MEDIUM,
          )
        }

        const favoriteId = await DataAccessLayer.saveFavorite({
          title: favoriteData.title,
          content: favoriteData.content,
          type: favoriteData.type || "search",
          timestamp: favoriteData.timestamp || Date.now(),
          userId: favoriteData.userId,
          metadata: favoriteData.metadata,
        })

        return NextResponse.json({
          success: true,
          data: { id: favoriteId },
          message: "收藏保存成功",
        })

      case "delete_favorite":
        const { id: deleteId, userId: deleteUserId } = data
        if (!deleteId) {
          throw EnhancedErrorHandler.createError(
            ErrorType.VALIDATION,
            "收藏ID不能为空",
            { action, data },
            ErrorSeverity.MEDIUM,
          )
        }

        const deleted = await DataAccessLayer.deleteFavorite(deleteId, deleteUserId)
        if (!deleted) {
          throw EnhancedErrorHandler.createError(
            ErrorType.DATABASE,
            "删除收藏失败",
            { id: deleteId, userId: deleteUserId },
            ErrorSeverity.MEDIUM,
          )
        }

        return NextResponse.json({
          success: true,
          message: "收藏删除成功",
        })

      case "save_conversation":
        const conversationData = data
        if (!conversationData.title || !conversationData.messages) {
          throw EnhancedErrorHandler.createError(
            ErrorType.VALIDATION,
            "对话标题和消息不能为空",
            { action, data },
            ErrorSeverity.MEDIUM,
          )
        }

        const conversationId = await DataAccessLayer.saveConversation({
          title: conversationData.title,
          messages: conversationData.messages,
          createdAt: conversationData.createdAt || Date.now(),
          updatedAt: conversationData.updatedAt || Date.now(),
          userId: conversationData.userId,
          isShared: conversationData.isShared || false,
        })

        return NextResponse.json({
          success: true,
          data: { id: conversationId },
          message: "对话保存成功",
        })

      case "update_conversation":
        const { id: updateId, updates, userId: updateUserId } = data
        if (!updateId || !updates) {
          throw EnhancedErrorHandler.createError(
            ErrorType.VALIDATION,
            "对话ID和更新数据不能为空",
            { action, data },
            ErrorSeverity.MEDIUM,
          )
        }

        const updated = await DataAccessLayer.updateConversation(updateId, updates, updateUserId)
        if (!updated) {
          throw EnhancedErrorHandler.createError(
            ErrorType.DATABASE,
            "更新对话失败",
            { id: updateId, updates },
            ErrorSeverity.MEDIUM,
          )
        }

        return NextResponse.json({
          success: true,
          message: "对话更新成功",
        })

      case "query":
        const { sql, params } = data
        if (!sql) {
          throw EnhancedErrorHandler.createError(
            ErrorType.VALIDATION,
            "SQL查询不能为空",
            { action, data },
            ErrorSeverity.MEDIUM,
          )
        }

        const queryResult = await DatabaseManager.query(sql, params || [])
        return NextResponse.json({
          success: true,
          data: queryResult,
        })

      case "transaction":
        const { operations } = data
        if (!operations || !Array.isArray(operations)) {
          throw EnhancedErrorHandler.createError(
            ErrorType.VALIDATION,
            "事务操作列表不能为空",
            { action, data },
            ErrorSeverity.MEDIUM,
          )
        }

        const transactionResult = await DatabaseManager.transaction(async () => {
          const results = []
          for (const operation of operations) {
            const result = await DatabaseManager.query(operation.sql, operation.params || [])
            results.push(result)
          }
          return results
        })

        return NextResponse.json({
          success: true,
          data: transactionResult,
          message: "事务执行成功",
        })

      default:
        throw EnhancedErrorHandler.createError(
          ErrorType.VALIDATION,
          `不支持的操作: ${action}`,
          { action },
          ErrorSeverity.LOW,
        )
    }
  } catch (error) {
    console.error("数据库API POST请求失败:", error)

    if (error && typeof error === "object" && "type" in error) {
      // 这是我们的ErrorInfo对象
      return NextResponse.json(
        {
          success: false,
          error: {
            type: (error as any).type,
            message: (error as any).userMessage,
            id: (error as any).id,
          },
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          type: ErrorType.DATABASE,
          message: "数据库操作失败",
          details: error instanceof Error ? error.message : "未知错误",
        },
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")
    const id = searchParams.get("id")
    const userId = searchParams.get("userId")

    if (!id) {
      throw EnhancedErrorHandler.createError(
        ErrorType.VALIDATION,
        "ID参数不能为空",
        { action, id },
        ErrorSeverity.MEDIUM,
      )
    }

    switch (action) {
      case "favorite":
        const deleted = await DataAccessLayer.deleteFavorite(Number.parseInt(id), userId || undefined)
        if (!deleted) {
          throw EnhancedErrorHandler.createError(
            ErrorType.DATABASE,
            "删除收藏失败",
            { id, userId },
            ErrorSeverity.MEDIUM,
          )
        }

        return NextResponse.json({
          success: true,
          message: "收藏删除成功",
        })

      case "connection":
        await DatabaseManager.closeConnection(id)
        return NextResponse.json({
          success: true,
          message: "数据库连接已关闭",
        })

      default:
        throw EnhancedErrorHandler.createError(
          ErrorType.VALIDATION,
          `不支持的删除操作: ${action}`,
          { action },
          ErrorSeverity.LOW,
        )
    }
  } catch (error) {
    console.error("数据库API DELETE请求失败:", error)

    if (error && typeof error === "object" && "type" in error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: (error as any).type,
            message: (error as any).userMessage,
            id: (error as any).id,
          },
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          type: ErrorType.DATABASE,
          message: "数据库删除操作失败",
          details: error instanceof Error ? error.message : "未知错误",
        },
      },
      { status: 500 },
    )
  }
}
