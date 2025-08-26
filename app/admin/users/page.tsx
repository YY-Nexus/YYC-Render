"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, UserPlus, Shield, Crown, Eye, Trash2, Mail, Calendar, MapPin, ArrowLeft } from "lucide-react"
import { AuthManager, type UserRole } from "@/lib/auth"

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all")
  const [currentUser, setCurrentUser] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)

  useEffect(() => {
    loadUsers()
    loadCurrentUser()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchQuery, roleFilter])

  const loadUsers = () => {
    const allUsers = AuthManager.getAllUsers()
    setUsers(allUsers)
    setIsLoading(false)
  }

  const loadCurrentUser = async () => {
    const user = await AuthManager.getCurrentUser()
    setCurrentUser(user)

    // 检查权限
    if (!user || !AuthManager.hasRole(user, "admin")) {
      router.push("/auth/login")
    }
  }

  const filterUsers = () => {
    let filtered = [...users]

    // 搜索过滤
    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.profile.displayName.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // 角色过滤
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const result = await AuthManager.updateUser(userId, { role: newRole })
      if (result.success) {
        loadUsers()
        alert(`用户角色已更新为 ${getRoleLabel(newRole)}`)
      } else {
        alert(result.error || "更新失败")
      }
    } catch (error) {
      console.error("更新用户角色失败:", error)
      alert("更新失败")
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("确定要删除这个用户吗？此操作不可撤销。")) {
      return
    }

    try {
      const result = await AuthManager.deleteUser(userId)
      if (result.success) {
        loadUsers()
        alert("用户已删除")
      } else {
        alert(result.error || "删除失败")
      }
    } catch (error) {
      console.error("删除用户失败:", error)
      alert("删除失败")
    }
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "admin":
        return <Shield className="w-4 h-4 text-red-600" />
      case "premium":
        return <Crown className="w-4 h-4 text-yellow-600" />
      case "user":
        return <Eye className="w-4 h-4 text-blue-600" />
      case "guest":
        return <Eye className="w-4 h-4 text-gray-600" />
    }
  }

  const getRoleLabel = (role: UserRole) => {
    const labels = {
      admin: "管理员",
      premium: "高级用户",
      user: "普通用户",
      guest: "访客",
    }
    return labels[role]
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "premium":
        return "bg-yellow-100 text-yellow-800"
      case "user":
        return "bg-blue-100 text-blue-800"
      case "guest":
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载用户数据中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/")} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
              <p className="text-sm text-gray-500">管理系统中的所有用户账户</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">共 {users.length} 个用户</span>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              添加用户
            </button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* 搜索和筛选 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索用户名、邮箱或显示名..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as UserRole | "all")}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">所有角色</option>
                <option value="admin">管理员</option>
                <option value="premium">高级用户</option>
                <option value="user">普通用户</option>
                <option value="guest">访客</option>
              </select>
            </div>
          </div>
        </div>

        {/* 用户列表 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用户
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    角色
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    注册时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最后登录
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.avatar ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={user.avatar || "/placeholder.svg"}
                              alt={user.profile.displayName}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                              <span className="text-white font-medium">
                                {user.profile.displayName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.profile.displayName}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                          <div className="text-xs text-gray-400">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isEmailVerified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {user.isEmailVerified ? "已验证" : "未验证"}
                        </span>
                        {user.wechatId && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            微信绑定
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(user.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLoginAt ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(user.lastLoginAt)}
                        </div>
                      ) : (
                        <span className="text-gray-400">从未登录</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setShowUserModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                          className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          disabled={user.role === "admin" && currentUser?.id === user.id}
                        >
                          <option value="admin">管理员</option>
                          <option value="premium">高级用户</option>
                          <option value="user">普通用户</option>
                          <option value="guest">访客</option>
                        </select>
                        {user.role !== "admin" && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="删除用户"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Eye className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到用户</h3>
              <p className="text-gray-500">尝试调整搜索条件或筛选器</p>
            </div>
          )}
        </div>
      </div>

      {/* 用户详情模态框 */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">用户详情</h2>
                <button onClick={() => setShowUserModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* 基本信息 */}
                <div className="flex items-center gap-4">
                  {selectedUser.avatar ? (
                    <img
                      className="h-16 w-16 rounded-full object-cover"
                      src={selectedUser.avatar || "/placeholder.svg"}
                      alt={selectedUser.profile.displayName}
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <span className="text-white text-xl font-medium">
                        {selectedUser.profile.displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{selectedUser.profile.displayName}</h3>
                    <p className="text-gray-500">@{selectedUser.username}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getRoleIcon(selectedUser.role)}
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(selectedUser.role)}`}
                      >
                        {getRoleLabel(selectedUser.role)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 联系信息 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{selectedUser.email}</span>
                      {selectedUser.isEmailVerified && <span className="text-green-600 text-xs">已验证</span>}
                    </div>
                  </div>
                  {selectedUser.profile.location && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">位置</label>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{selectedUser.profile.location}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 个人简介 */}
                {selectedUser.profile.bio && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">个人简介</label>
                    <p className="text-sm text-gray-900">{selectedUser.profile.bio}</p>
                  </div>
                )}

                {/* 账户信息 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">注册时间</label>
                    <span className="text-sm text-gray-900">{formatDate(selectedUser.createdAt)}</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">最后登录</label>
                    <span className="text-sm text-gray-900">
                      {selectedUser.lastLoginAt ? formatDate(selectedUser.lastLoginAt) : "从未登录"}
                    </span>
                  </div>
                </div>

                {/* 权限信息 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">权限详情</label>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span>创建知识图谱:</span>
                        <span
                          className={
                            selectedUser.permissions.canCreateKnowledgeGraph ? "text-green-600" : "text-red-600"
                          }
                        >
                          {selectedUser.permissions.canCreateKnowledgeGraph ? "允许" : "禁止"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>高级功能:</span>
                        <span
                          className={
                            selectedUser.permissions.canAccessPremiumFeatures ? "text-green-600" : "text-red-600"
                          }
                        >
                          {selectedUser.permissions.canAccessPremiumFeatures ? "允许" : "禁止"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>用户管理:</span>
                        <span className={selectedUser.permissions.canManageUsers ? "text-green-600" : "text-red-600"}>
                          {selectedUser.permissions.canManageUsers ? "允许" : "禁止"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>数据导出:</span>
                        <span className={selectedUser.permissions.canExportData ? "text-green-600" : "text-red-600"}>
                          {selectedUser.permissions.canExportData ? "允许" : "禁止"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>每日搜索:</span>
                        <span className="text-blue-600">
                          {selectedUser.permissions.maxSearchesPerDay === -1
                            ? "无限制"
                            : `${selectedUser.permissions.maxSearchesPerDay}次`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>存储空间:</span>
                        <span className="text-blue-600">
                          {selectedUser.permissions.maxStorageGB === -1
                            ? "无限制"
                            : `${selectedUser.permissions.maxStorageGB}GB`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 订阅信息 */}
                {selectedUser.subscription && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">订阅信息</label>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-blue-900">
                          {selectedUser.subscription.plan === "free"
                            ? "免费版"
                            : selectedUser.subscription.plan === "premium"
                              ? "高级版"
                              : "企业版"}
                        </span>
                        {selectedUser.subscription.expiresAt && (
                          <span className="text-sm text-blue-600">
                            到期: {formatDate(selectedUser.subscription.expiresAt)}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-blue-700">功能: {selectedUser.subscription.features.join(", ")}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
