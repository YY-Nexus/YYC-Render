"use client"

import React from "react"

import { useState } from "react"

// 权限控制系统
export interface Permission {
  id: string
  name: string
  description: string
  category: string
  level: "read" | "write" | "admin" | "system"
  dependencies?: string[]
  conditions?: PermissionCondition[]
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  inherits?: string[]
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UserPermission {
  userId: string
  permissionId: string
  grantedBy: string
  grantedAt: Date
  expiresAt?: Date
  conditions?: PermissionCondition[]
  metadata?: Record<string, any>
}

export interface PermissionCondition {
  type: "time" | "ip" | "device" | "location" | "custom"
  operator: "equals" | "not_equals" | "in" | "not_in" | "greater" | "less" | "between"
  value: any
  description: string
}

export interface PermissionCheck {
  userId: string
  permission: string
  context?: Record<string, any>
  timestamp: Date
}

export interface PermissionAudit {
  id: string
  userId: string
  action: "grant" | "revoke" | "check" | "deny"
  permission: string
  result: boolean
  reason?: string
  context?: Record<string, any>
  timestamp: Date
  performedBy?: string
}

export class PermissionSystem {
  private static permissions: Map<string, Permission> = new Map()
  private static roles: Map<string, Role> = new Map()
  private static userPermissions: Map<string, UserPermission[]> = new Map()
  private static userRoles: Map<string, string[]> = new Map()
  private static auditLog: PermissionAudit[] = []

  // 初始化默认权限和角色
  static {
    this.initializeDefaultPermissions()
    this.initializeDefaultRoles()
  }

  // 初始化默认权限
  private static initializeDefaultPermissions(): void {
    const defaultPermissions: Permission[] = [
      // 基础权限
      {
        id: "search.basic",
        name: "基础搜索",
        description: "执行基本搜索功能",
        category: "search",
        level: "read",
      },
      {
        id: "search.advanced",
        name: "高级搜索",
        description: "使用高级搜索功能和过滤器",
        category: "search",
        level: "read",
        dependencies: ["search.basic"],
      },
      {
        id: "search.ai",
        name: "AI搜索",
        description: "使用AI增强搜索功能",
        category: "search",
        level: "read",
        dependencies: ["search.advanced"],
      },

      // 内容权限
      {
        id: "content.view",
        name: "查看内容",
        description: "查看搜索结果和内容详情",
        category: "content",
        level: "read",
      },
      {
        id: "content.save",
        name: "保存内容",
        description: "保存搜索结果到收藏夹",
        category: "content",
        level: "write",
        dependencies: ["content.view"],
      },
      {
        id: "content.share",
        name: "分享内容",
        description: "分享内容到社区或外部平台",
        category: "content",
        level: "write",
        dependencies: ["content.view"],
      },
      {
        id: "content.export",
        name: "导出内容",
        description: "导出搜索结果和数据",
        category: "content",
        level: "write",
        dependencies: ["content.view"],
      },

      // 生成权限
      {
        id: "generate.basic",
        name: "基础生成",
        description: "使用基础内容生成功能",
        category: "generate",
        level: "write",
      },
      {
        id: "generate.advanced",
        name: "高级生成",
        description: "使用高级生成功能（PPT、海报等）",
        category: "generate",
        level: "write",
        dependencies: ["generate.basic"],
      },
      {
        id: "generate.unlimited",
        name: "无限生成",
        description: "无限制使用生成功能",
        category: "generate",
        level: "write",
        dependencies: ["generate.advanced"],
      },

      // 社区权限
      {
        id: "community.view",
        name: "查看社区",
        description: "浏览社区内容",
        category: "community",
        level: "read",
      },
      {
        id: "community.post",
        name: "发布内容",
        description: "在社区发布内容",
        category: "community",
        level: "write",
        dependencies: ["community.view"],
      },
      {
        id: "community.moderate",
        name: "社区管理",
        description: "管理社区内容和用户",
        category: "community",
        level: "admin",
        dependencies: ["community.post"],
      },

      // 数据权限
      {
        id: "data.view",
        name: "查看数据",
        description: "查看个人数据和统计信息",
        category: "data",
        level: "read",
      },
      {
        id: "data.export",
        name: "导出数据",
        description: "导出个人数据",
        category: "data",
        level: "write",
        dependencies: ["data.view"],
      },
      {
        id: "data.delete",
        name: "删除数据",
        description: "删除个人数据",
        category: "data",
        level: "write",
        dependencies: ["data.view"],
      },

      // 管理权限
      {
        id: "admin.users",
        name: "用户管理",
        description: "管理用户账户和权限",
        category: "admin",
        level: "admin",
      },
      {
        id: "admin.system",
        name: "系统管理",
        description: "管理系统设置和配置",
        category: "admin",
        level: "admin",
      },
      {
        id: "admin.security",
        name: "安全管理",
        description: "管理安全设置和监控",
        category: "admin",
        level: "admin",
      },

      // 系统权限
      {
        id: "system.all",
        name: "系统全权限",
        description: "系统级别的所有权限",
        category: "system",
        level: "system",
      },
    ]

    defaultPermissions.forEach((permission) => {
      this.permissions.set(permission.id, permission)
    })
  }

  // 初始化默认角色
  private static initializeDefaultRoles(): void {
    const defaultRoles: Role[] = [
      {
        id: "guest",
        name: "访客",
        description: "未登录用户的基本权限",
        permissions: ["search.basic", "content.view"],
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "user",
        name: "普通用户",
        description: "已注册用户的标准权限",
        permissions: [
          "search.basic",
          "search.advanced",
          "content.view",
          "content.save",
          "content.share",
          "generate.basic",
          "community.view",
          "community.post",
          "data.view",
          "data.export",
        ],
        inherits: ["guest"],
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "premium",
        name: "高级用户",
        description: "付费用户的增强权限",
        permissions: ["search.ai", "generate.advanced", "generate.unlimited", "content.export", "data.delete"],
        inherits: ["user"],
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "moderator",
        name: "版主",
        description: "社区管理员权限",
        permissions: ["community.moderate"],
        inherits: ["premium"],
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "admin",
        name: "管理员",
        description: "系统管理员权限",
        permissions: ["admin.users", "admin.system", "admin.security"],
        inherits: ["moderator"],
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "superadmin",
        name: "超级管理员",
        description: "最高级别的系统权限",
        permissions: ["system.all"],
        inherits: ["admin"],
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    defaultRoles.forEach((role) => {
      this.roles.set(role.id, role)
    })
  }

  // 检查用户权限
  static async checkPermission(
    userId: string,
    permissionId: string,
    context?: Record<string, any>,
  ): Promise<{ granted: boolean; reason?: string; conditions?: PermissionCondition[] }> {
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      // 获取权限定义
      const permission = this.permissions.get(permissionId)
      if (!permission) {
        this.logAudit({
          id: auditId,
          userId,
          action: "check",
          permission: permissionId,
          result: false,
          reason: "权限不存在",
          context,
        })
        return { granted: false, reason: "权限不存在" }
      }

      // 检查用户是否有直接权限
      const directPermission = await this.checkDirectPermission(userId, permissionId, context)
      if (directPermission.granted) {
        this.logAudit({
          id: auditId,
          userId,
          action: "check",
          permission: permissionId,
          result: true,
          reason: "直接权限",
          context,
        })
        return directPermission
      }

      // 检查角色权限
      const rolePermission = await this.checkRolePermission(userId, permissionId, context)
      if (rolePermission.granted) {
        this.logAudit({
          id: auditId,
          userId,
          action: "check",
          permission: permissionId,
          result: true,
          reason: "角色权限",
          context,
        })
        return rolePermission
      }

      // 检查继承权限
      const inheritedPermission = await this.checkInheritedPermission(userId, permissionId, context)
      if (inheritedPermission.granted) {
        this.logAudit({
          id: auditId,
          userId,
          action: "check",
          permission: permissionId,
          result: true,
          reason: "继承权限",
          context,
        })
        return inheritedPermission
      }

      // 权限被拒绝
      this.logAudit({
        id: auditId,
        userId,
        action: "deny",
        permission: permissionId,
        result: false,
        reason: "权限不足",
        context,
      })

      return { granted: false, reason: "权限不足" }
    } catch (error) {
      this.logAudit({
        id: auditId,
        userId,
        action: "check",
        permission: permissionId,
        result: false,
        reason: `检查失败: ${error instanceof Error ? error.message : "未知错误"}`,
        context,
      })

      return { granted: false, reason: "权限检查失败" }
    }
  }

  // 检查直接权限
  private static async checkDirectPermission(
    userId: string,
    permissionId: string,
    context?: Record<string, any>,
  ): Promise<{ granted: boolean; reason?: string; conditions?: PermissionCondition[] }> {
    const userPermissions = this.userPermissions.get(userId) || []
    const userPermission = userPermissions.find((up) => up.permissionId === permissionId)

    if (!userPermission) {
      return { granted: false, reason: "无直接权限" }
    }

    // 检查过期时间
    if (userPermission.expiresAt && new Date() > userPermission.expiresAt) {
      return { granted: false, reason: "权限已过期" }
    }

    // 检查条件
    if (userPermission.conditions) {
      const conditionResult = await this.evaluateConditions(userPermission.conditions, context)
      if (!conditionResult.satisfied) {
        return { granted: false, reason: conditionResult.reason, conditions: userPermission.conditions }
      }
    }

    return { granted: true, conditions: userPermission.conditions }
  }

  // 检查角色权限
  private static async checkRolePermission(
    userId: string,
    permissionId: string,
    context?: Record<string, any>,
  ): Promise<{ granted: boolean; reason?: string; conditions?: PermissionCondition[] }> {
    const userRoles = this.userRoles.get(userId) || []

    for (const roleId of userRoles) {
      const role = this.roles.get(roleId)
      if (!role) continue

      if (role.permissions.includes(permissionId)) {
        return { granted: true }
      }
    }

    return { granted: false, reason: "角色无此权限" }
  }

  // 检查继承权限
  private static async checkInheritedPermission(
    userId: string,
    permissionId: string,
    context?: Record<string, any>,
  ): Promise<{ granted: boolean; reason?: string; conditions?: PermissionCondition[] }> {
    const userRoles = this.userRoles.get(userId) || []

    for (const roleId of userRoles) {
      const hasInheritedPermission = await this.checkInheritedRolePermission(roleId, permissionId)
      if (hasInheritedPermission) {
        return { granted: true }
      }
    }

    return { granted: false, reason: "无继承权限" }
  }

  // 检查角色继承权限
  private static async checkInheritedRolePermission(roleId: string, permissionId: string): Promise<boolean> {
    const role = this.roles.get(roleId)
    if (!role || !role.inherits) {
      return false
    }

    for (const inheritedRoleId of role.inherits) {
      const inheritedRole = this.roles.get(inheritedRoleId)
      if (!inheritedRole) continue

      // 检查直接权限
      if (inheritedRole.permissions.includes(permissionId)) {
        return true
      }

      // 递归检查继承权限
      const hasDeepInheritedPermission = await this.checkInheritedRolePermission(inheritedRoleId, permissionId)
      if (hasDeepInheritedPermission) {
        return true
      }
    }

    return false
  }

  // 评估权限条件
  private static async evaluateConditions(
    conditions: PermissionCondition[],
    context?: Record<string, any>,
  ): Promise<{ satisfied: boolean; reason?: string }> {
    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition, context)
      if (!result.satisfied) {
        return result
      }
    }

    return { satisfied: true }
  }

  // 评估单个条件
  private static async evaluateCondition(
    condition: PermissionCondition,
    context?: Record<string, any>,
  ): Promise<{ satisfied: boolean; reason?: string }> {
    const contextValue = context?.[condition.type]

    switch (condition.type) {
      case "time":
        return this.evaluateTimeCondition(condition, contextValue)
      case "ip":
        return this.evaluateIpCondition(condition, contextValue)
      case "device":
        return this.evaluateDeviceCondition(condition, contextValue)
      case "location":
        return this.evaluateLocationCondition(condition, contextValue)
      case "custom":
        return this.evaluateCustomCondition(condition, context)
      default:
        return { satisfied: false, reason: `未知条件类型: ${condition.type}` }
    }
  }

  // 评估时间条件
  private static evaluateTimeCondition(
    condition: PermissionCondition,
    contextValue?: any,
  ): { satisfied: boolean; reason?: string } {
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()

    switch (condition.operator) {
      case "between":
        const [start, end] = condition.value
        const startMinutes = start.hour * 60 + start.minute
        const endMinutes = end.hour * 60 + end.minute
        const inRange = currentTime >= startMinutes && currentTime <= endMinutes
        return {
          satisfied: inRange,
          reason: inRange
            ? undefined
            : `当前时间不在允许范围内 (${start.hour}:${start.minute}-${end.hour}:${end.minute})`,
        }
      default:
        return { satisfied: false, reason: "不支持的时间条件操作符" }
    }
  }

  // 评估IP条件
  private static evaluateIpCondition(
    condition: PermissionCondition,
    contextValue?: any,
  ): { satisfied: boolean; reason?: string } {
    const userIp = contextValue || "unknown"

    switch (condition.operator) {
      case "in":
        const allowed = condition.value.includes(userIp)
        return {
          satisfied: allowed,
          reason: allowed ? undefined : `IP地址 ${userIp} 不在允许列表中`,
        }
      case "not_in":
        const blocked = !condition.value.includes(userIp)
        return {
          satisfied: blocked,
          reason: blocked ? undefined : `IP地址 ${userIp} 在阻止列表中`,
        }
      default:
        return { satisfied: false, reason: "不支持的IP条件操作符" }
    }
  }

  // 评估设备条件
  private static evaluateDeviceCondition(
    condition: PermissionCondition,
    contextValue?: any,
  ): { satisfied: boolean; reason?: string } {
    const deviceId = contextValue || "unknown"

    switch (condition.operator) {
      case "in":
        const allowed = condition.value.includes(deviceId)
        return {
          satisfied: allowed,
          reason: allowed ? undefined : `设备 ${deviceId} 不在允许列表中`,
        }
      default:
        return { satisfied: false, reason: "不支持的设备条件操作符" }
    }
  }

  // 评估位置条件
  private static evaluateLocationCondition(
    condition: PermissionCondition,
    contextValue?: any,
  ): { satisfied: boolean; reason?: string } {
    const location = contextValue || "unknown"

    switch (condition.operator) {
      case "in":
        const allowed = condition.value.includes(location)
        return {
          satisfied: allowed,
          reason: allowed ? undefined : `位置 ${location} 不在允许范围内`,
        }
      default:
        return { satisfied: false, reason: "不支持的位置条件操作符" }
    }
  }

  // 评估自定义条件
  private static evaluateCustomCondition(
    condition: PermissionCondition,
    context?: Record<string, any>,
  ): { satisfied: boolean; reason?: string } {
    // 这里可以实现自定义的条件逻辑
    // 例如：检查用户的订阅状态、使用配额等
    return { satisfied: true }
  }

  // 授予用户权限
  static async grantPermission(
    userId: string,
    permissionId: string,
    grantedBy: string,
    options: {
      expiresAt?: Date
      conditions?: PermissionCondition[]
      metadata?: Record<string, any>
    } = {},
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 检查权限是否存在
      const permission = this.permissions.get(permissionId)
      if (!permission) {
        return { success: false, error: "权限不存在" }
      }

      // 检查依赖权限
      if (permission.dependencies) {
        for (const depId of permission.dependencies) {
          const hasDepPermission = await this.checkPermission(userId, depId)
          if (!hasDepPermission.granted) {
            return { success: false, error: `缺少依赖权限: ${depId}` }
          }
        }
      }

      // 创建用户权限记录
      const userPermission: UserPermission = {
        userId,
        permissionId,
        grantedBy,
        grantedAt: new Date(),
        expiresAt: options.expiresAt,
        conditions: options.conditions,
        metadata: options.metadata,
      }

      // 添加到用户权限列表
      const userPermissions = this.userPermissions.get(userId) || []

      // 检查是否已存在相同权限
      const existingIndex = userPermissions.findIndex((up) => up.permissionId === permissionId)
      if (existingIndex !== -1) {
        userPermissions[existingIndex] = userPermission // 更新现有权限
      } else {
        userPermissions.push(userPermission) // 添加新权限
      }

      this.userPermissions.set(userId, userPermissions)

      // 记录审计日志
      this.logAudit({
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        action: "grant",
        permission: permissionId,
        result: true,
        performedBy: grantedBy,
        context: options.metadata,
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "授权失败" }
    }
  }

  // 撤销用户权限
  static async revokePermission(
    userId: string,
    permissionId: string,
    revokedBy: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const userPermissions = this.userPermissions.get(userId) || []
      const filteredPermissions = userPermissions.filter((up) => up.permissionId !== permissionId)

      if (filteredPermissions.length === userPermissions.length) {
        return { success: false, error: "用户没有此权限" }
      }

      this.userPermissions.set(userId, filteredPermissions)

      // 记录审计日志
      this.logAudit({
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        action: "revoke",
        permission: permissionId,
        result: true,
        performedBy: revokedBy,
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "撤销失败" }
    }
  }

  // 分配角色给用户
  static async assignRole(
    userId: string,
    roleId: string,
    assignedBy: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const role = this.roles.get(roleId)
      if (!role) {
        return { success: false, error: "角色不存在" }
      }

      const userRoles = this.userRoles.get(userId) || []
      if (userRoles.includes(roleId)) {
        return { success: false, error: "用户已有此角色" }
      }

      userRoles.push(roleId)
      this.userRoles.set(userId, userRoles)

      // 记录审计日志
      this.logAudit({
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        action: "grant",
        permission: `role:${roleId}`,
        result: true,
        performedBy: assignedBy,
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "角色分配失败" }
    }
  }

  // 移除用户角色
  static async removeRole(
    userId: string,
    roleId: string,
    removedBy: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const userRoles = this.userRoles.get(userId) || []
      const filteredRoles = userRoles.filter((r) => r !== roleId)

      if (filteredRoles.length === userRoles.length) {
        return { success: false, error: "用户没有此角色" }
      }

      this.userRoles.set(userId, filteredRoles)

      // 记录审计日志
      this.logAudit({
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        action: "revoke",
        permission: `role:${roleId}`,
        result: true,
        performedBy: removedBy,
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "角色移除失败" }
    }
  }

  // 获取用户所有权限
  static getUserPermissions(userId: string): {
    directPermissions: UserPermission[]
    rolePermissions: string[]
    inheritedPermissions: string[]
    allPermissions: string[]
  } {
    const directPermissions = this.userPermissions.get(userId) || []
    const userRoles = this.userRoles.get(userId) || []

    const rolePermissions: string[] = []
    const inheritedPermissions: string[] = []

    // 收集角色权限
    for (const roleId of userRoles) {
      const role = this.roles.get(roleId)
      if (role) {
        rolePermissions.push(...role.permissions)

        // 收集继承权限
        if (role.inherits) {
          for (const inheritedRoleId of role.inherits) {
            const inheritedRole = this.roles.get(inheritedRoleId)
            if (inheritedRole) {
              inheritedPermissions.push(...inheritedRole.permissions)
            }
          }
        }
      }
    }

    // 去重并合并所有权限
    const allPermissions = [
      ...new Set([...directPermissions.map((dp) => dp.permissionId), ...rolePermissions, ...inheritedPermissions]),
    ]

    return {
      directPermissions,
      rolePermissions: [...new Set(rolePermissions)],
      inheritedPermissions: [...new Set(inheritedPermissions)],
      allPermissions,
    }
  }

  // 创建新权限
  static createPermission(permission: Omit<Permission, "id">): {
    success: boolean
    permissionId?: string
    error?: string
  } {
    try {
      const permissionId = `custom.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`
      const newPermission: Permission = {
        id: permissionId,
        ...permission,
      }

      this.permissions.set(permissionId, newPermission)
      return { success: true, permissionId }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "权限创建失败" }
    }
  }

  // 创建新角色
  static createRole(role: Omit<Role, "id" | "createdAt" | "updatedAt">): {
    success: boolean
    roleId?: string
    error?: string
  } {
    try {
      const roleId = `custom.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`
      const newRole: Role = {
        id: roleId,
        ...role,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      this.roles.set(roleId, newRole)
      return { success: true, roleId }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "角色创建失败" }
    }
  }

  // 记录审计日志
  private static logAudit(audit: Omit<PermissionAudit, "timestamp">): void {
    const auditRecord: PermissionAudit = {
      ...audit,
      timestamp: new Date(),
    }

    this.auditLog.push(auditRecord)

    // 只保留最近10000条记录
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-10000)
    }
  }

  // 获取权限统计信息
  static getPermissionStats(): {
    totalPermissions: number
    totalRoles: number
    totalUsers: number
    activePermissions: number
    recentAudits: number
  } {
    const now = new Date()
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const activePermissions = Array.from(this.userPermissions.values())
      .flat()
      .filter((up) => !up.expiresAt || up.expiresAt > now).length

    const recentAudits = this.auditLog.filter((audit) => audit.timestamp > last24Hours).length

    return {
      totalPermissions: this.permissions.size,
      totalRoles: this.roles.size,
      totalUsers: this.userPermissions.size,
      activePermissions,
      recentAudits,
    }
  }

  // 获取审计日志
  static getAuditLog(filters?: {
    userId?: string
    permission?: string
    action?: string
    startDate?: Date
    endDate?: Date
    limit?: number
  }): PermissionAudit[] {
    let filteredAudits = [...this.auditLog]

    if (filters) {
      if (filters.userId) {
        filteredAudits = filteredAudits.filter((audit) => audit.userId === filters.userId)
      }
      if (filters.permission) {
        filteredAudits = filteredAudits.filter((audit) => audit.permission === filters.permission)
      }
      if (filters.action) {
        filteredAudits = filteredAudits.filter((audit) => audit.action === filters.action)
      }
      if (filters.startDate) {
        filteredAudits = filteredAudits.filter((audit) => audit.timestamp >= filters.startDate!)
      }
      if (filters.endDate) {
        filteredAudits = filteredAudits.filter((audit) => audit.timestamp <= filters.endDate!)
      }
    }

    // 按时间倒序排列
    filteredAudits.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    // 限制返回数量
    if (filters?.limit) {
      filteredAudits = filteredAudits.slice(0, filters.limit)
    }

    return filteredAudits
  }

  // 清理过期权限
  static cleanupExpiredPermissions(): number {
    const now = new Date()
    let cleanedCount = 0

    for (const [userId, permissions] of this.userPermissions.entries()) {
      const validPermissions = permissions.filter((up) => {
        if (up.expiresAt && up.expiresAt <= now) {
          cleanedCount++
          return false
        }
        return true
      })

      if (validPermissions.length !== permissions.length) {
        this.userPermissions.set(userId, validPermissions)
      }
    }

    return cleanedCount
  }

  // 获取所有权限定义
  static getAllPermissions(): Permission[] {
    return Array.from(this.permissions.values())
  }

  // 获取所有角色定义
  static getAllRoles(): Role[] {
    return Array.from(this.roles.values())
  }
}

// React Hook for permission system
export function usePermissions(userId: string) {
  const [permissions, setPermissions] = useState<string[]>([])
  const [roles, setRoles] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const checkPermission = async (permissionId: string, context?: Record<string, any>) => {
    const result = await PermissionSystem.checkPermission(userId, permissionId, context)
    return result.granted
  }

  const refreshPermissions = () => {
    setLoading(true)
    try {
      const userPermissions = PermissionSystem.getUserPermissions(userId)
      setPermissions(userPermissions.allPermissions)
      setRoles(PermissionSystem["userRoles"].get(userId) || [])
    } finally {
      setLoading(false)
    }
  }

  // 初始加载权限
  React.useEffect(() => {
    refreshPermissions()
  }, [userId])

  return {
    permissions,
    roles,
    loading,
    checkPermission,
    refreshPermissions,
    hasPermission: (permissionId: string) => permissions.includes(permissionId),
    hasRole: (roleId: string) => roles.includes(roleId),
  }
}

// 定期清理过期权限
if (typeof window !== "undefined") {
  setInterval(
    () => {
      const cleaned = PermissionSystem.cleanupExpiredPermissions()
      if (cleaned > 0) {
        console.log(`清理了 ${cleaned} 个过期权限`)
      }
    },
    60 * 60 * 1000,
  ) // 每小时清理一次
}
