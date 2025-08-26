"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  WifiOff,
  Wifi,
  Save,
  FolderSyncIcon as Sync,
  Trash2,
  Plus,
  CheckCircle,
  AlertCircle,
  Clock,
  Database,
  RefreshCw,
  Home,
  History,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface OfflineNote {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
  synced: boolean
}

interface SyncStatus {
  isOnline: boolean
  lastSync: number | null
  pendingSync: number
  syncInProgress: boolean
}

export default function OfflinePage() {
  const [notes, setNotes] = useState<OfflineNote[]>([])
  const [newNote, setNewNote] = useState({ title: "", content: "" })
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    lastSync: null,
    pendingSync: 0,
    syncInProgress: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const handleRefresh = () => {
    if (typeof window !== "undefined") {
      window.location.reload()
    }
  }

  const handleRetry = () => {
    router.back()
  }

  // 初始化离线数据
  useEffect(() => {
    loadOfflineData()
    initializeNetworkMonitoring()
  }, [])

  // 加载离线数据
  const loadOfflineData = () => {
    try {
      const savedNotes = localStorage.getItem("offline-notes")
      const savedSyncStatus = localStorage.getItem("sync-status")

      if (savedNotes) {
        setNotes(JSON.parse(savedNotes))
      }

      if (savedSyncStatus) {
        setSyncStatus(JSON.parse(savedSyncStatus))
      }
    } catch (error) {
      console.error("加载离线数据失败:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // 保存数据到本地存储
  const saveToLocalStorage = (updatedNotes: OfflineNote[], updatedSyncStatus?: SyncStatus) => {
    try {
      localStorage.setItem("offline-notes", JSON.stringify(updatedNotes))
      if (updatedSyncStatus) {
        localStorage.setItem("sync-status", JSON.stringify(updatedSyncStatus))
      }
    } catch (error) {
      console.error("保存到本地存储失败:", error)
    }
  }

  // 网络状态监控
  const initializeNetworkMonitoring = () => {
    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine
      setSyncStatus((prev) => ({ ...prev, isOnline }))

      if (isOnline) {
        // 网络恢复时自动同步
        setTimeout(() => {
          syncData()
        }, 1000)
      }
    }

    updateOnlineStatus()
    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)

    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
    }
  }

  // 创建新笔记
  const createNote = () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      alert("请填写标题和内容")
      return
    }

    const note: OfflineNote = {
      id: Date.now().toString(),
      title: newNote.title,
      content: newNote.content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      synced: false,
    }

    const updatedNotes = [...notes, note]
    setNotes(updatedNotes)

    const updatedSyncStatus = {
      ...syncStatus,
      pendingSync: syncStatus.pendingSync + 1,
    }
    setSyncStatus(updatedSyncStatus)

    saveToLocalStorage(updatedNotes, updatedSyncStatus)
    setNewNote({ title: "", content: "" })

    // 如果在线，尝试立即同步
    if (syncStatus.isOnline) {
      syncSingleNote(note)
    }
  }

  // 删除笔记
  const deleteNote = (id: string) => {
    const updatedNotes = notes.filter((note) => note.id !== id)
    setNotes(updatedNotes)

    const deletedNote = notes.find((note) => note.id === id)
    const updatedSyncStatus = { ...syncStatus }

    if (deletedNote && !deletedNote.synced) {
      updatedSyncStatus.pendingSync = Math.max(0, syncStatus.pendingSync - 1)
    }

    setSyncStatus(updatedSyncStatus)
    saveToLocalStorage(updatedNotes, updatedSyncStatus)
  }

  // 同步单个笔记
  const syncSingleNote = async (note: OfflineNote) => {
    if (!syncStatus.isOnline) return

    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: note.id,
          type: "note",
          title: note.title,
          content: note.content,
          timestamp: note.updatedAt,
        }),
      })

      if (response.ok) {
        const updatedNotes = notes.map((n) => (n.id === note.id ? { ...n, synced: true } : n))
        setNotes(updatedNotes)

        const updatedSyncStatus = {
          ...syncStatus,
          pendingSync: Math.max(0, syncStatus.pendingSync - 1),
          lastSync: Date.now(),
        }
        setSyncStatus(updatedSyncStatus)

        saveToLocalStorage(updatedNotes, updatedSyncStatus)
      }
    } catch (error) {
      console.error("同步笔记失败:", error)
    }
  }

  // 同步所有数据
  const syncData = async () => {
    if (!syncStatus.isOnline || syncStatus.syncInProgress) return

    setSyncStatus((prev) => ({ ...prev, syncInProgress: true }))

    try {
      const unsyncedNotes = notes.filter((note) => !note.synced)

      for (const note of unsyncedNotes) {
        await syncSingleNote(note)
      }

      setSyncStatus((prev) => ({
        ...prev,
        syncInProgress: false,
        lastSync: Date.now(),
      }))
    } catch (error) {
      console.error("数据同步失败:", error)
      setSyncStatus((prev) => ({ ...prev, syncInProgress: false }))
    }
  }

  // 清除所有数据
  const clearAllData = () => {
    if (confirm("确定要清除所有离线数据吗？此操作不可撤销。")) {
      setNotes([])
      setSyncStatus({
        isOnline: navigator.onLine,
        lastSync: null,
        pendingSync: 0,
        syncInProgress: false,
      })
      localStorage.removeItem("offline-notes")
      localStorage.removeItem("sync-status")
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("zh-CN")
  }

  const getStorageSize = () => {
    try {
      const notesSize = JSON.stringify(notes).length
      const statusSize = JSON.stringify(syncStatus).length
      return ((notesSize + statusSize) / 1024).toFixed(2) + " KB"
    } catch {
      return "未知"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载离线数据中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* 网络状态提示 */}
      {!syncStatus.isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 z-50">
          <WifiOff className="inline h-4 w-4 mr-2" />
          离线模式 - 数据将保存到本地，网络恢复后自动同步
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">离线功能测试</h1>
          <p className="text-gray-600">测试应用在离线状态下的数据存储和同步功能</p>
        </div>

        {/* 状态面板 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">网络状态</p>
                  <p className="text-lg font-bold">
                    {syncStatus.isOnline ? (
                      <Badge className="bg-green-100 text-green-800">
                        <Wifi className="h-3 w-3 mr-1" />
                        在线
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <WifiOff className="h-3 w-3 mr-1" />
                        离线
                      </Badge>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">待同步</p>
                  <p className="text-2xl font-bold text-orange-600">{syncStatus.pendingSync}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">总笔记</p>
                  <p className="text-2xl font-bold text-blue-600">{notes.length}</p>
                </div>
                <Database className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">存储大小</p>
                  <p className="text-lg font-bold text-purple-600">{getStorageSize()}</p>
                </div>
                <Database className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 同步控制 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sync className="h-5 w-5 mr-2" />
              数据同步
            </CardTitle>
            <CardDescription>管理离线数据的同步状态</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">
                  最后同步时间: {syncStatus.lastSync ? formatTime(syncStatus.lastSync) : "从未同步"}
                </p>
                {syncStatus.syncInProgress && (
                  <p className="text-sm text-blue-600 flex items-center mt-1">
                    <Sync className="h-3 w-3 mr-1 animate-spin" />
                    同步中...
                  </p>
                )}
              </div>
              <div className="space-x-2">
                <Button
                  onClick={syncData}
                  disabled={!syncStatus.isOnline || syncStatus.syncInProgress || syncStatus.pendingSync === 0}
                  variant="outline"
                >
                  {syncStatus.syncInProgress ? (
                    <>
                      <Sync className="h-4 w-4 mr-2 animate-spin" />
                      同步中
                    </>
                  ) : (
                    <>
                      <Sync className="h-4 w-4 mr-2" />
                      手动同步
                    </>
                  )}
                </Button>
                <Button onClick={clearAllData} variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  清除数据
                </Button>
              </div>
            </div>

            {syncStatus.pendingSync > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  有 {syncStatus.pendingSync} 条数据待同步
                  {!syncStatus.isOnline && "，网络恢复后将自动同步"}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 创建笔记 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                创建新笔记
              </CardTitle>
              <CardDescription>在离线状态下创建笔记，网络恢复后自动同步</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                <Input
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  placeholder="输入笔记标题..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
                <Textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  placeholder="输入笔记内容..."
                  rows={6}
                />
              </div>
              <Button onClick={createNote} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                保存笔记
              </Button>
            </CardContent>
          </Card>

          {/* 笔记列表 */}
          <Card>
            <CardHeader>
              <CardTitle>离线笔记列表</CardTitle>
              <CardDescription>本地存储的笔记数据</CardDescription>
            </CardHeader>
            <CardContent>
              {notes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>暂无笔记数据</p>
                  <p className="text-sm">创建第一条笔记开始测试离线功能</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {notes.map((note) => (
                    <div key={note.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 truncate flex-1">{note.title}</h4>
                        <div className="flex items-center space-x-2 ml-2">
                          {note.synced ? (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              已同步
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              待同步
                            </Badge>
                          )}
                          <Button
                            onClick={() => deleteNote(note.id)}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{note.content}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>创建: {formatTime(note.createdAt)}</span>
                        {note.updatedAt !== note.createdAt && <span>更新: {formatTime(note.updatedAt)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 离线功能说明 */}
        <Card className="mt-6">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
              <WifiOff className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl">您当前处于离线状态</CardTitle>
            <CardDescription>网络连接不可用，但您仍可以访问已缓存的内容</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-gray-600">
              <p>当网络恢复时，应用将自动同步最新数据</p>
            </div>

            <div className="space-y-2">
              <Button onClick={handleRefresh} className="w-full bg-transparent" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                重新加载
              </Button>

              <Button onClick={handleRetry} className="w-full bg-transparent" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                重试上一页
              </Button>

              <Link href="/" className="block">
                <Button className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  返回首页
                </Button>
              </Link>

              <Link href="/history" className="block">
                <Button variant="outline" className="w-full bg-transparent">
                  <History className="h-4 w-4 mr-2" />
                  查看历史记录
                </Button>
              </Link>
            </div>

            <div className="mt-6 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">离线功能</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 查看搜索历史</li>
                <li>• 访问已缓存的页面</li>
                <li>• 使用基本功能</li>
                <li>• 数据将在联网后同步</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
