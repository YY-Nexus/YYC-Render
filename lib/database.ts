// 数据库配置和连接管理
export interface DatabaseConfig {
  type: "local" | "aliyun" | "postgresql" | "mongodb"
  host: string
  port: number
  database: string
  username?: string
  password?: string
  ssl?: boolean
  connectionTimeout?: number
  maxConnections?: number
}

export interface DatabaseConnection {
  id: string
  config: DatabaseConfig
  status: "connected" | "disconnected" | "error"
  lastConnected?: Date
  error?: string
}

export class DatabaseManager {
  private static connections: Map<string, DatabaseConnection> = new Map()
  private static activeConnection: string | null = null

  // 预定义的数据库配置
  static readonly CONFIGS: Record<string, DatabaseConfig> = {
    local: {
      type: "local",
      host: "localhost",
      port: 5432,
      database: "ai_search_local",
      username: "postgres",
      password: "password",
      connectionTimeout: 5000,
      maxConnections: 10,
    },
    aliyun: {
      type: "aliyun",
      host: "your-aliyun-rds.mysql.rds.aliyuncs.com",
      port: 3306,
      database: "ai_search_prod",
      username: process.env.ALIYUN_DB_USER || "",
      password: process.env.ALIYUN_DB_PASSWORD || "",
      ssl: true,
      connectionTimeout: 10000,
      maxConnections: 20,
    },
    mongodb_local: {
      type: "mongodb",
      host: "localhost",
      port: 27017,
      database: "ai_search_mongo",
      connectionTimeout: 5000,
      maxConnections: 10,
    },
  }

  // 创建数据库连接
  static async createConnection(configName: string): Promise<DatabaseConnection> {
    const config = this.CONFIGS[configName]
    if (!config) {
      throw new Error(`数据库配置 ${configName} 不存在`)
    }

    const connectionId = `${configName}_${Date.now()}`
    const connection: DatabaseConnection = {
      id: connectionId,
      config,
      status: "disconnected",
    }

    try {
      // 模拟数据库连接
      await this.testConnection(config)

      connection.status = "connected"
      connection.lastConnected = new Date()

      this.connections.set(connectionId, connection)

      if (!this.activeConnection) {
        this.activeConnection = connectionId
      }

      console.log(`数据库连接成功: ${configName}`)
      return connection
    } catch (error) {
      connection.status = "error"
      connection.error = error instanceof Error ? error.message : "连接失败"

      this.connections.set(connectionId, connection)
      throw error
    }
  }

  // 测试数据库连接
  private static async testConnection(config: DatabaseConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`连接超时: ${config.host}:${config.port}`))
      }, config.connectionTimeout || 5000)

      // 模拟连接测试
      setTimeout(
        () => {
          clearTimeout(timeout)

          // 模拟连接成功/失败
          if (Math.random() > 0.1) {
            // 90% 成功率
            resolve()
          } else {
            reject(new Error("数据库连接被拒绝"))
          }
        },
        Math.random() * 1000 + 500,
      )
    })
  }

  // 获取活动连接
  static getActiveConnection(): DatabaseConnection | null {
    if (!this.activeConnection) return null
    return this.connections.get(this.activeConnection) || null
  }

  // 切换活动连接
  static switchConnection(connectionId: string): boolean {
    const connection = this.connections.get(connectionId)
    if (!connection || connection.status !== "connected") {
      return false
    }

    this.activeConnection = connectionId
    return true
  }

  // 获取所有连接
  static getAllConnections(): DatabaseConnection[] {
    return Array.from(this.connections.values())
  }

  // 关闭连接
  static async closeConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    connection.status = "disconnected"

    if (this.activeConnection === connectionId) {
      this.activeConnection = null
    }

    this.connections.delete(connectionId)
  }

  // 执行查询
  static async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const connection = this.getActiveConnection()
    if (!connection || connection.status !== "connected") {
      throw new Error("没有可用的数据库连接")
    }

    try {
      // 模拟查询执行
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 100 + 50))

      // 根据SQL类型返回模拟数据
      if (sql.toLowerCase().includes("select")) {
        return this.generateMockQueryResult(sql) as T[]
      } else {
        return [{ affectedRows: 1, insertId: Date.now() }] as T[]
      }
    } catch (error) {
      console.error("数据库查询失败:", error)
      throw new Error(`查询执行失败: ${error instanceof Error ? error.message : "未知错误"}`)
    }
  }

  // 生成模拟查询结果
  private static generateMockQueryResult(sql: string): any[] {
    const lowerSql = sql.toLowerCase()

    if (lowerSql.includes("search_history")) {
      return [
        {
          id: 1,
          question: "什么是人工智能？",
          answer: "人工智能是计算机科学的一个分支...",
          timestamp: Date.now() - 86400000,
          category: "技术",
        },
        {
          id: 2,
          question: "如何学习编程？",
          answer: "学习编程需要循序渐进...",
          timestamp: Date.now() - 172800000,
          category: "学习",
        },
      ]
    }

    if (lowerSql.includes("favorites")) {
      return [
        {
          id: 1,
          title: "收藏的问题",
          content: "这是一个重要的问题",
          type: "search",
          timestamp: Date.now(),
        },
      ]
    }

    return []
  }

  // 事务处理
  static async transaction<T>(callback: () => Promise<T>): Promise<T> {
    const connection = this.getActiveConnection()
    if (!connection || connection.status !== "connected") {
      throw new Error("没有可用的数据库连接")
    }

    try {
      // 开始事务
      console.log("开始数据库事务")

      const result = await callback()

      // 提交事务
      console.log("提交数据库事务")
      return result
    } catch (error) {
      // 回滚事务
      console.log("回滚数据库事务")
      throw error
    }
  }

  // 健康检查
  static async healthCheck(): Promise<{
    status: "healthy" | "degraded" | "unhealthy"
    connections: number
    activeConnection: string | null
    details: any[]
  }> {
    const connections = this.getAllConnections()
    const healthyConnections = connections.filter((c) => c.status === "connected")

    let status: "healthy" | "degraded" | "unhealthy" = "healthy"

    if (healthyConnections.length === 0) {
      status = "unhealthy"
    } else if (healthyConnections.length < connections.length) {
      status = "degraded"
    }

    return {
      status,
      connections: connections.length,
      activeConnection: this.activeConnection,
      details: connections.map((c) => ({
        id: c.id,
        type: c.config.type,
        host: c.config.host,
        status: c.status,
        lastConnected: c.lastConnected,
        error: c.error,
      })),
    }
  }
}

// 数据模型定义
export interface SearchHistoryModel {
  id?: number
  question: string
  answer: string
  timestamp: number
  category: string
  tags: string[]
  userId?: string
}

export interface FavoriteModel {
  id?: number
  title: string
  content: string
  type: "search" | "result" | "conversation"
  timestamp: number
  userId?: string
  metadata?: Record<string, any>
}

export interface ConversationModel {
  id?: number
  title: string
  messages: any[]
  createdAt: number
  updatedAt: number
  userId?: string
  isShared: boolean
}

// 数据访问层
export class DataAccessLayer {
  // 搜索历史相关操作
  static async saveSearchHistory(history: SearchHistoryModel): Promise<number> {
    const sql = `
      INSERT INTO search_history (question, answer, timestamp, category, tags, user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    const params = [
      history.question,
      history.answer,
      history.timestamp,
      history.category,
      JSON.stringify(history.tags),
      history.userId || null,
    ]

    const result = await DatabaseManager.query(sql, params)
    return result[0]?.insertId || Date.now()
  }

  static async getSearchHistory(userId?: string, limit = 50): Promise<SearchHistoryModel[]> {
    const sql = userId
      ? `SELECT * FROM search_history WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?`
      : `SELECT * FROM search_history ORDER BY timestamp DESC LIMIT ?`

    const params = userId ? [userId, limit] : [limit]
    const results = await DatabaseManager.query<any>(sql, params)

    return results.map((row) => ({
      id: row.id,
      question: row.question,
      answer: row.answer,
      timestamp: row.timestamp,
      category: row.category,
      tags: JSON.parse(row.tags || "[]"),
      userId: row.user_id,
    }))
  }

  static async searchHistory(query: string, userId?: string): Promise<SearchHistoryModel[]> {
    const sql = userId
      ? `SELECT * FROM search_history WHERE user_id = ? AND (question LIKE ? OR answer LIKE ?) ORDER BY timestamp DESC`
      : `SELECT * FROM search_history WHERE (question LIKE ? OR answer LIKE ?) ORDER BY timestamp DESC`

    const searchTerm = `%${query}%`
    const params = userId ? [userId, searchTerm, searchTerm] : [searchTerm, searchTerm]

    const results = await DatabaseManager.query<any>(sql, params)

    return results.map((row) => ({
      id: row.id,
      question: row.question,
      answer: row.answer,
      timestamp: row.timestamp,
      category: row.category,
      tags: JSON.parse(row.tags || "[]"),
      userId: row.user_id,
    }))
  }

  // 收藏相关操作
  static async saveFavorite(favorite: FavoriteModel): Promise<number> {
    const sql = `
      INSERT INTO favorites (title, content, type, timestamp, user_id, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    const params = [
      favorite.title,
      favorite.content,
      favorite.type,
      favorite.timestamp,
      favorite.userId || null,
      JSON.stringify(favorite.metadata || {}),
    ]

    const result = await DatabaseManager.query(sql, params)
    return result[0]?.insertId || Date.now()
  }

  static async getFavorites(userId?: string): Promise<FavoriteModel[]> {
    const sql = userId
      ? `SELECT * FROM favorites WHERE user_id = ? ORDER BY timestamp DESC`
      : `SELECT * FROM favorites ORDER BY timestamp DESC`

    const params = userId ? [userId] : []
    const results = await DatabaseManager.query<any>(sql, params)

    return results.map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      type: row.type,
      timestamp: row.timestamp,
      userId: row.user_id,
      metadata: JSON.parse(row.metadata || "{}"),
    }))
  }

  static async deleteFavorite(id: number, userId?: string): Promise<boolean> {
    const sql = userId ? `DELETE FROM favorites WHERE id = ? AND user_id = ?` : `DELETE FROM favorites WHERE id = ?`

    const params = userId ? [id, userId] : [id]
    const result = await DatabaseManager.query(sql, params)

    return result[0]?.affectedRows > 0
  }

  // 对话相关操作
  static async saveConversation(conversation: ConversationModel): Promise<number> {
    const sql = `
      INSERT INTO conversations (title, messages, created_at, updated_at, user_id, is_shared)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    const params = [
      conversation.title,
      JSON.stringify(conversation.messages),
      conversation.createdAt,
      conversation.updatedAt,
      conversation.userId || null,
      conversation.isShared,
    ]

    const result = await DatabaseManager.query(sql, params)
    return result[0]?.insertId || Date.now()
  }

  static async getConversations(userId?: string): Promise<ConversationModel[]> {
    const sql = userId
      ? `SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC`
      : `SELECT * FROM conversations ORDER BY updated_at DESC`

    const params = userId ? [userId] : []
    const results = await DatabaseManager.query<any>(sql, params)

    return results.map((row) => ({
      id: row.id,
      title: row.title,
      messages: JSON.parse(row.messages || "[]"),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      userId: row.user_id,
      isShared: row.is_shared,
    }))
  }

  static async updateConversation(id: number, updates: Partial<ConversationModel>, userId?: string): Promise<boolean> {
    const fields = []
    const params = []

    if (updates.title) {
      fields.push("title = ?")
      params.push(updates.title)
    }

    if (updates.messages) {
      fields.push("messages = ?")
      params.push(JSON.stringify(updates.messages))
    }

    if (updates.updatedAt) {
      fields.push("updated_at = ?")
      params.push(updates.updatedAt)
    }

    if (updates.isShared !== undefined) {
      fields.push("is_shared = ?")
      params.push(updates.isShared)
    }

    if (fields.length === 0) return false

    const sql = userId
      ? `UPDATE conversations SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`
      : `UPDATE conversations SET ${fields.join(", ")} WHERE id = ?`

    params.push(id)
    if (userId) params.push(userId)

    const result = await DatabaseManager.query(sql, params)
    return result[0]?.affectedRows > 0
  }
}
