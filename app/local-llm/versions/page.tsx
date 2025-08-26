"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { ModelVersion, ModelBranch, ModelRepository } from "@/lib/model-versioning"

export default function ModelVersionsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"repositories" | "versions" | "branches">("repositories")
  const [repositories, setRepositories] = useState<ModelRepository[]>([])
  const [versions, setVersions] = useState<ModelVersion[]>([])
  const [branches, setBranches] = useState<ModelBranch[]>([])
  const [selectedRepo, setSelectedRepo] = useState<string>("")
  const [selectedVersion1, setSelectedVersion1] = useState<string>("")
  const [selectedVersion2, setSelectedVersion2] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 模拟API调用获取仓库列表
  const fetchRepositories = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // 替换为实际API调用
      const response = await fetch("/api/model-repositories")
      if (!response.ok) {
        throw new Error("Failed to fetch repositories")
      }
      const data: ModelRepository[] = await response.json()
      setRepositories(data)
      if (data.length > 0) {
        setSelectedRepo(data[0].id)
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An unknown error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 模拟API调用获取版本列表
  const fetchVersions = async (repoId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      // 替换为实际API调用
      const response = await fetch(`/api/model-versions?repoId=${repoId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch versions")
      }
      const data: ModelVersion[] = await response.json()
      setVersions(data)
      if (data.length > 0) {
        setSelectedVersion1(data[0].id)
        if (data.length > 1) {
          setSelectedVersion2(data[1].id)
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An unknown error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 模拟API调用获取分支列表
  const fetchBranches = async (repoId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      // 替换为实际API调用
      const response = await fetch(`/api/model-branches?repoId=${repoId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch branches")
      }
      const data: ModelBranch[] = await response.json()
      setBranches(data)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An unknown error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 初始化加载仓库
  useEffect(() => {
    fetchRepositories()
  }, [])

  // 当选中仓库变化时加载对应版本和分支
  useEffect(() => {
    if (selectedRepo) {
      if (activeTab === "versions") {
        fetchVersions(selectedRepo)
      } else if (activeTab === "branches") {
        fetchBranches(selectedRepo)
      }
    }
  }, [selectedRepo, activeTab])

  // 当活跃标签变化时加载对应数据
  useEffect(() => {
    if (selectedRepo) {
      if (activeTab === "versions") {
        fetchVersions(selectedRepo)
      } else if (activeTab === "branches") {
        fetchBranches(selectedRepo)
      }
    }
  }, [activeTab])

  // 比较两个版本
  const compareVersions = () => {
    if (selectedVersion1 && selectedVersion2 && selectedVersion1 !== selectedVersion2) {
      router.push(`/models/compare?repoId=${selectedRepo}&v1=${selectedVersion1}&v2=${selectedVersion2}`)
    } else {
      setError("Please select two different versions to compare")
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Model Versioning</h1>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* 仓库选择 */}
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-bold mb-2">Select Repository:</label>
        <select
          value={selectedRepo}
          onChange={(e) => setSelectedRepo(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={isLoading || repositories.length === 0}
        >
          {isLoading ? (
            <option value="" disabled>Loading...</option>
          ) : repositories.length === 0 ? (
            <option value="" disabled>No repositories available</option>
          ) : (
            repositories.map((repo) => (
              <option key={repo.id} value={repo.id}>{repo.name}</option>
            ))
          )}
        </select>
      </div>

      {/* 标签页导航 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {["repositories", "versions", "branches"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`${
                activeTab === tab
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* 内容区域 */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div>
          {/* 仓库列表 */}
          {activeTab === "repositories" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Repositories</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {repositories.map((repo) => (
                  <div
                    key={repo.id}
                    className={`bg-white p-4 rounded-lg shadow-sm border ${
                      repo.id === selectedRepo ? "border-indigo-500" : "border-gray-200"
                    } hover:shadow-md transition duration-150 ease-in-out`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{repo.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{repo.description}</p>
                      </div>
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {repo.status}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-gray-500">
                      <span className="flex items-center">
                        <i className="fa fa-code-fork mr-1"></i> {repo.branchesCount} branches
                      </span>
                      <span className="mx-2">•</span>
                      <span className="flex items-center">
                        <i className="fa fa-tag mr-1"></i> {repo.versionsCount} versions
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 版本列表 */}
          {activeTab === "versions" && (
            <div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <h2 className="text-xl font-semibold">Versions</h2>
                <div className="mt-4 md:mt-0">
                  <button
                    onClick={compareVersions}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    disabled={!selectedVersion1 || !selectedVersion2 || selectedVersion1 === selectedVersion2}
                  >
                    <i className="fa fa-exchange mr-2"></i> Compare Selected Versions
                  </button>
                </div>
              </div>

              <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Select
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Version
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created At
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Author
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {versions.map((version) => (
                        <tr key={version.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <input
                                type="radio"
                                name="version1"
                                value={version.id}
                                checked={selectedVersion1 === version.id}
                                onChange={() => setSelectedVersion1(version.id)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <input
                                type="radio"
                                name="version2"
                                value={version.id}
                                checked={selectedVersion2 === version.id}
                                onChange={() => setSelectedVersion2(version.id)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 ml-2"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{version.versionNumber}</div>
                                <div className="text-sm text-gray-500">{version.shortHash}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{new Date(version.createdAt).toLocaleString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img className="h-6 w-6 rounded-full" src={`https://picsum.photos/200?random=${version.authorId}`} alt="Author" />
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{version.authorName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {version.status === "active" ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Active
                              </span>
                            ) : version.status === "archived" ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                Archived
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Draft
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-indigo-600 hover:text-indigo-900 mr-3">View</button>
                            <button className="text-gray-600 hover:text-gray-900">Deploy</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 分支列表 */}
          {activeTab === "branches" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Branches</h2>
              <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Branch Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Head Version
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created At
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Author
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {branches.map((branch) => (
                        <tr key={branch.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <i className="fa fa-code-fork text-gray-400 text-xl"></i>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{branch.name}</div>
                                {branch.isDefault && (
                                  <div className="text-xs text-indigo-600">Default branch</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{branch.headVersion}</div>
                            <div className="text-sm text-gray-500">{branch.headHash.substring(0, 8)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{new Date(branch.createdAt).toLocaleString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img className="h-6 w-6 rounded-full" src={`https://picsum.photos/200?random=${branch.authorId}`} alt="Author" />
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{branch.authorName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {branch.isActive ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-indigo-600 hover:text-indigo-900 mr-3">View</button>
                            <button className="text-gray-600 hover:text-gray-900 mr-3">Create Version</button>
                            <button className="text-red-600 hover:text-red-900">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
