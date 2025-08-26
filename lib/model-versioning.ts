export interface ModelVersion {
  id: string
  modelId: string
  version: string
  name: string
  description: string
  baseModel?: string
  parentVersion?: string
  createdAt: number
  createdBy: string
  size: number
  checksum: string
  tags: string[]
  metadata: {
    trainingData?: string
    fineTuningJob?: string
    performance?: ModelPerformance
    changelog?: string[]
    deprecated?: boolean
    deprecationReason?: string
  }
  status: "active" | "deprecated" | "archived"
  downloadUrl?: string
  localPath?: string
}

export interface ModelPerformance {
  accuracy?: number
  perplexity?: number
  bleuScore?: number
  rougeScore?: number
  inferenceSpeed?: number // tokens/second
  memoryUsage?: number // MB
  benchmarks?: Record<string, number>
}

export interface ModelBranch {
  id: string
  name: string
  description: string
  modelId: string
  headVersion: string
  versions: string[]
  createdAt: number
  isDefault: boolean
  protected: boolean
}

export interface ModelRepository {
  id: string
  name: string
  description: string
  owner: string
  visibility: "public" | "private"
  defaultBranch: string
  branches: ModelBranch[]
  tags: Record<string, string> // tag -> version
  createdAt: number
  updatedAt: number
  stars: number
  downloads: number
}

export class ModelVersionManager {
  private static readonly VERSIONS_KEY = "model-versions"
  private static readonly BRANCHES_KEY = "model-branches"
  private static readonly REPOSITORIES_KEY = "model-repositories"

  // 版本管理
  static getVersions(modelId?: string): ModelVersion[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.VERSIONS_KEY)
      const versions = stored ? JSON.parse(stored) : []
      return modelId ? versions.filter((v: ModelVersion) => v.modelId === modelId) : versions
    } catch (error) {
      console.error("获取模型版本失败:", error)
      return []
    }
  }

  static saveVersions(versions: ModelVersion[]): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(this.VERSIONS_KEY, JSON.stringify(versions))
    } catch (error) {
      console.error("保存模型版本失败:", error)
    }
  }

  static createVersion(version: Omit<ModelVersion, "id" | "createdAt">): ModelVersion {
    const newVersion: ModelVersion = {
      ...version,
      id: `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
    }

    const versions = this.getVersions()
    versions.push(newVersion)
    this.saveVersions(versions)

    return newVersion
  }

  static updateVersion(id: string, updates: Partial<ModelVersion>): void {
    const versions = this.getVersions()
    const index = versions.findIndex((v) => v.id === id)

    if (index !== -1) {
      versions[index] = { ...versions[index], ...updates }
      this.saveVersions(versions)
    }
  }

  static deleteVersion(id: string): void {
    const versions = this.getVersions().filter((v) => v.id !== id)
    this.saveVersions(versions)
  }

  static getVersion(id: string): ModelVersion | null {
    return this.getVersions().find((v) => v.id === id) || null
  }

  static getLatestVersion(modelId: string): ModelVersion | null {
    const versions = this.getVersions(modelId)
      .filter((v) => v.status === "active")
      .sort((a, b) => b.createdAt - a.createdAt)

    return versions[0] || null
  }

  // 分支管理
  static getBranches(modelId?: string): ModelBranch[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.BRANCHES_KEY)
      const branches = stored ? JSON.parse(stored) : []
      return modelId ? branches.filter((b: ModelBranch) => b.modelId === modelId) : branches
    } catch (error) {
      console.error("获取模型分支失败:", error)
      return []
    }
  }

  static saveBranches(branches: ModelBranch[]): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(this.BRANCHES_KEY, JSON.stringify(branches))
    } catch (error) {
      console.error("保存模型分支失败:", error)
    }
  }

  static createBranch(branch: Omit<ModelBranch, "id" | "createdAt">): ModelBranch {
    const newBranch: ModelBranch = {
      ...branch,
      id: `branch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
    }

    const branches = this.getBranches()
    branches.push(newBranch)
    this.saveBranches(branches)

    return newBranch
  }

  static updateBranch(id: string, updates: Partial<ModelBranch>): void {
    const branches = this.getBranches()
    const index = branches.findIndex((b) => b.id === id)

    if (index !== -1) {
      branches[index] = { ...branches[index], ...updates }
      this.saveBranches(branches)
    }
  }

  static deleteBranch(id: string): void {
    const branches = this.getBranches().filter((b) => b.id !== id)
    this.saveBranches(branches)
  }

  static getBranch(id: string): ModelBranch | null {
    return this.getBranches().find((b) => b.id === id) || null
  }

  static getDefaultBranch(modelId: string): ModelBranch | null {
    return this.getBranches(modelId).find((b) => b.isDefault) || null
  }

  // 仓库管理
  static getRepositories(): ModelRepository[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.REPOSITORIES_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("获取模型仓库失败:", error)
      return []
    }
  }

  static saveRepositories(repositories: ModelRepository[]): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(this.REPOSITORIES_KEY, JSON.stringify(repositories))
    } catch (error) {
      console.error("保存模型仓库失败:", error)
    }
  }

  static createRepository(repo: Omit<ModelRepository, "id" | "createdAt" | "updatedAt">): ModelRepository {
    const newRepo: ModelRepository = {
      ...repo,
      id: `repo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    const repositories = this.getRepositories()
    repositories.push(newRepo)
    this.saveRepositories(repositories)

    // 创建默认分支
    this.createBranch({
      name: "main",
      description: "主分支",
      modelId: newRepo.id,
      headVersion: "",
      versions: [],
      isDefault: true,
      protected: true,
    })

    return newRepo
  }

  static updateRepository(id: string, updates: Partial<ModelRepository>): void {
    const repositories = this.getRepositories()
    const index = repositories.findIndex((r) => r.id === id)

    if (index !== -1) {
      repositories[index] = { ...repositories[index], ...updates, updatedAt: Date.now() }
      this.saveRepositories(repositories)
    }
  }

  static getRepository(id: string): ModelRepository | null {
    return this.getRepositories().find((r) => r.id === id) || null
  }

  // 版本比较
  static compareVersions(
    version1Id: string,
    version2Id: string,
  ): {
    differences: {
      field: string
      value1: any
      value2: any
      type: "added" | "removed" | "modified"
    }[]
    summary: {
      sizeChange: number
      performanceChange: Record<string, number>
      majorChanges: string[]
    }
  } {
    const v1 = this.getVersion(version1Id)
    const v2 = this.getVersion(version2Id)

    if (!v1 || !v2) {
      return { differences: [], summary: { sizeChange: 0, performanceChange: {}, majorChanges: [] } }
    }

    const differences: any[] = []
    const majorChanges: string[] = []

    // 比较基本信息
    if (v1.name !== v2.name) {
      differences.push({ field: "name", value1: v1.name, value2: v2.name, type: "modified" })
    }

    if (v1.description !== v2.description) {
      differences.push({ field: "description", value1: v1.description, value2: v2.description, type: "modified" })
    }

    if (v1.baseModel !== v2.baseModel) {
      differences.push({ field: "baseModel", value1: v1.baseModel, value2: v2.baseModel, type: "modified" })
      majorChanges.push("基础模型发生变化")
    }

    // 比较大小
    const sizeChange = v2.size - v1.size
    if (sizeChange !== 0) {
      differences.push({ field: "size", value1: v1.size, value2: v2.size, type: "modified" })
    }

    // 比较性能
    const performanceChange: Record<string, number> = {}
    if (v1.metadata.performance && v2.metadata.performance) {
      const p1 = v1.metadata.performance
      const p2 = v2.metadata.performance

      if (p1.accuracy && p2.accuracy) {
        performanceChange.accuracy = p2.accuracy - p1.accuracy
      }

      if (p1.perplexity && p2.perplexity) {
        performanceChange.perplexity = p2.perplexity - p1.perplexity
      }

      if (p1.inferenceSpeed && p2.inferenceSpeed) {
        performanceChange.inferenceSpeed = p2.inferenceSpeed - p1.inferenceSpeed
      }
    }

    // 比较标签
    const addedTags = v2.tags.filter((tag) => !v1.tags.includes(tag))
    const removedTags = v1.tags.filter((tag) => !v2.tags.includes(tag))

    addedTags.forEach((tag) => {
      differences.push({ field: "tags", value1: null, value2: tag, type: "added" })
    })

    removedTags.forEach((tag) => {
      differences.push({ field: "tags", value1: tag, value2: null, type: "removed" })
    })

    return {
      differences,
      summary: {
        sizeChange,
        performanceChange,
        majorChanges,
      },
    }
  }

  // 版本回滚
  static rollbackToVersion(
    modelId: string,
    versionId: string,
    branchId?: string,
  ): {
    success: boolean
    message: string
    newVersion?: ModelVersion
  } {
    const targetVersion = this.getVersion(versionId)
    if (!targetVersion) {
      return { success: false, message: "目标版本不存在" }
    }

    if (targetVersion.status !== "active") {
      return { success: false, message: "无法回滚到非活跃版本" }
    }

    try {
      // 创建新版本作为回滚版本
      const rollbackVersion = this.createVersion({
        modelId: targetVersion.modelId,
        version: `rollback-${Date.now()}`,
        name: `回滚到 ${targetVersion.version}`,
        description: `回滚到版本 ${targetVersion.version}: ${targetVersion.description}`,
        baseModel: targetVersion.baseModel,
        parentVersion: targetVersion.id,
        createdBy: "system",
        size: targetVersion.size,
        checksum: targetVersion.checksum,
        tags: [...targetVersion.tags, "rollback"],
        metadata: {
          ...targetVersion.metadata,
          changelog: [`回滚到版本 ${targetVersion.version}`],
        },
        status: "active",
        downloadUrl: targetVersion.downloadUrl,
        localPath: targetVersion.localPath,
      })

      // 更新分支头部版本
      if (branchId) {
        const branch = this.getBranch(branchId)
        if (branch) {
          this.updateBranch(branchId, {
            headVersion: rollbackVersion.id,
            versions: [...branch.versions, rollbackVersion.id],
          })
        }
      }

      return {
        success: true,
        message: "回滚成功",
        newVersion: rollbackVersion,
      }
    } catch (error) {
      return {
        success: false,
        message: `回滚失败: ${error instanceof Error ? error.message : "未知错误"}`,
      }
    }
  }

  // 版本合并
  static mergeVersions(
    sourceVersionId: string,
    targetVersionId: string,
  ): {
    success: boolean
    message: string
    mergedVersion?: ModelVersion
  } {
    const sourceVersion = this.getVersion(sourceVersionId)
    const targetVersion = this.getVersion(targetVersionId)

    if (!sourceVersion || !targetVersion) {
      return { success: false, message: "源版本或目标版本不存在" }
    }

    if (sourceVersion.modelId !== targetVersion.modelId) {
      return { success: false, message: "无法合并不同模型的版本" }
    }

    try {
      // 创建合并版本
      const mergedVersion = this.createVersion({
        modelId: sourceVersion.modelId,
        version: `merge-${Date.now()}`,
        name: `合并 ${sourceVersion.version} 和 ${targetVersion.version}`,
        description: `合并版本 ${sourceVersion.version} 和 ${targetVersion.version}`,
        baseModel: targetVersion.baseModel,
        parentVersion: targetVersion.id,
        createdBy: "system",
        size: Math.max(sourceVersion.size, targetVersion.size),
        checksum: `merged-${Date.now()}`,
        tags: [...new Set([...sourceVersion.tags, ...targetVersion.tags, "merged"])],
        metadata: {
          changelog: [
            `合并版本 ${sourceVersion.version} 和 ${targetVersion.version}`,
            ...(sourceVersion.metadata.changelog || []),
            ...(targetVersion.metadata.changelog || []),
          ],
          performance: targetVersion.metadata.performance, // 使用目标版本的性能数据
        },
        status: "active",
      })

      return {
        success: true,
        message: "合并成功",
        mergedVersion,
      }
    } catch (error) {
      return {
        success: false,
        message: `合并失败: ${error instanceof Error ? error.message : "未知错误"}`,
      }
    }
  }

  // 版本标签管理
  static addTag(repositoryId: string, tagName: string, versionId: string): void {
    const repo = this.getRepository(repositoryId)
    if (repo) {
      const updatedTags = { ...repo.tags, [tagName]: versionId }
      this.updateRepository(repositoryId, { tags: updatedTags })
    }
  }

  static removeTag(repositoryId: string, tagName: string): void {
    const repo = this.getRepository(repositoryId)
    if (repo) {
      const updatedTags = { ...repo.tags }
      delete updatedTags[tagName]
      this.updateRepository(repositoryId, { tags: updatedTags })
    }
  }

  static getVersionByTag(repositoryId: string, tagName: string): ModelVersion | null {
    const repo = this.getRepository(repositoryId)
    if (repo && repo.tags[tagName]) {
      return this.getVersion(repo.tags[tagName])
    }
    return null
  }

  // 版本统计
  static getVersionStats(modelId: string): {
    totalVersions: number
    activeVersions: number
    deprecatedVersions: number
    archivedVersions: number
    totalSize: number
    averageSize: number
    latestVersion: ModelVersion | null
    oldestVersion: ModelVersion | null
    versionsByMonth: Record<string, number>
  } {
    const versions = this.getVersions(modelId)

    const stats = {
      totalVersions: versions.length,
      activeVersions: versions.filter((v) => v.status === "active").length,
      deprecatedVersions: versions.filter((v) => v.status === "deprecated").length,
      archivedVersions: versions.filter((v) => v.status === "archived").length,
      totalSize: versions.reduce((sum, v) => sum + v.size, 0),
      averageSize: versions.length > 0 ? versions.reduce((sum, v) => sum + v.size, 0) / versions.length : 0,
      latestVersion: versions.sort((a, b) => b.createdAt - a.createdAt)[0] || null,
      oldestVersion: versions.sort((a, b) => a.createdAt - b.createdAt)[0] || null,
      versionsByMonth: {} as Record<string, number>,
    }

    // 按月统计版本数量
    versions.forEach((version) => {
      const date = new Date(version.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      stats.versionsByMonth[monthKey] = (stats.versionsByMonth[monthKey] || 0) + 1
    })

    return stats
  }
}
