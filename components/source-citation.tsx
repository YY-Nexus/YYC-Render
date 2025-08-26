"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  ExternalLink,
  BookOpen,
  Globe,
  FileText,
  Video,
  Headphones,
  ImageIcon,
  Database,
  Star,
  Calendar,
  User,
  Link,
  Copy,
  Check,
} from "lucide-react"

export interface Source {
  id: string
  title: string
  url: string
  type: "article" | "book" | "website" | "video" | "podcast" | "image" | "database" | "paper"
  author?: string
  publishDate?: string
  description?: string
  reliability: number // 0-1
  relevance: number // 0-1
  accessDate: string
  doi?: string
  isbn?: string
  tags: string[]
}

interface SourceCitationProps {
  sources: Source[]
  format?: "apa" | "mla" | "chicago" | "ieee"
  showReliability?: boolean
  showRelevance?: boolean
  maxSources?: number
  onSourceClick?: (source: Source) => void
}

export default function SourceCitation({
  sources,
  format = "apa",
  showReliability = true,
  showRelevance = true,
  maxSources,
  onSourceClick,
}: SourceCitationProps) {
  const [selectedSource, setSelectedSource] = useState<Source | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<"relevance" | "reliability" | "date">("relevance")

  const displaySources = maxSources ? sources.slice(0, maxSources) : sources

  const sortedSources = [...displaySources].sort((a, b) => {
    switch (sortBy) {
      case "relevance":
        return b.relevance - a.relevance
      case "reliability":
        return b.reliability - a.reliability
      case "date":
        return new Date(b.publishDate || "").getTime() - new Date(a.publishDate || "").getTime()
      default:
        return 0
    }
  })

  const getSourceIcon = (type: Source["type"]) => {
    switch (type) {
      case "article":
        return <FileText className="w-4 h-4" />
      case "book":
        return <BookOpen className="w-4 h-4" />
      case "website":
        return <Globe className="w-4 h-4" />
      case "video":
        return <Video className="w-4 h-4" />
      case "podcast":
        return <Headphones className="w-4 h-4" />
      case "image":
        return <ImageIcon className="w-4 h-4" />
      case "database":
        return <Database className="w-4 h-4" />
      case "paper":
        return <FileText className="w-4 h-4" />
      default:
        return <Link className="w-4 h-4" />
    }
  }

  const getReliabilityColor = (reliability: number) => {
    if (reliability >= 0.8) return "text-green-600 bg-green-100"
    if (reliability >= 0.6) return "text-yellow-600 bg-yellow-100"
    return "text-red-600 bg-red-100"
  }

  const getRelevanceColor = (relevance: number) => {
    if (relevance >= 0.8) return "text-blue-600 bg-blue-100"
    if (relevance >= 0.6) return "text-purple-600 bg-purple-100"
    return "text-gray-600 bg-gray-100"
  }

  const formatCitation = (source: Source, format: string): string => {
    const author = source.author || "未知作者"
    const year = source.publishDate ? new Date(source.publishDate).getFullYear() : "未知年份"
    const title = source.title
    const url = source.url

    switch (format) {
      case "apa":
        return `${author} (${year}). ${title}. 检索自 ${url}`
      case "mla":
        return `${author}. "${title}." Web. ${new Date(source.accessDate).toLocaleDateString()}.`
      case "chicago":
        return `${author}. "${title}." 访问日期 ${new Date(source.accessDate).toLocaleDateString()}. ${url}.`
      case "ieee":
        return `${author}, "${title}," [在线]. 可用: ${url}. [访问日期: ${new Date(source.accessDate).toLocaleDateString()}].`
      default:
        return `${author}. ${title}. ${url}`
    }
  }

  const handleCopyCitation = async (source: Source) => {
    const citation = formatCitation(source, format)
    try {
      await navigator.clipboard.writeText(citation)
      setCopiedId(source.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error("复制失败:", error)
    }
  }

  const handleSourceClick = (source: Source) => {
    setSelectedSource(source)
    onSourceClick?.(source)
  }

  return (
    <div className="space-y-4">
      {/* 控制面板 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">排序方式:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="relevance">相关性</option>
            <option value="reliability">可靠性</option>
            <option value="date">发布日期</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">引用格式:</span>
          <select
            value={format}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="apa">APA</option>
            <option value="mla">MLA</option>
            <option value="chicago">Chicago</option>
            <option value="ieee">IEEE</option>
          </select>
        </div>
      </div>

      {/* 来源列表 */}
      <div className="space-y-3">
        {sortedSources.map((source, index) => (
          <Card key={source.id} className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getSourceIcon(source.type)}
                    <h3 className="font-medium text-gray-900 line-clamp-1">{source.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      {source.type}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                    {source.author && (
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>{source.author}</span>
                      </div>
                    )}
                    {source.publishDate && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(source.publishDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {source.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{source.description}</p>
                  )}

                  <div className="flex items-center space-x-3">
                    {showReliability && (
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-500">可靠性:</span>
                        <Badge variant="outline" className={`text-xs ${getReliabilityColor(source.reliability)}`}>
                          {Math.round(source.reliability * 100)}%
                        </Badge>
                      </div>
                    )}

                    {showRelevance && (
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-500">相关性:</span>
                        <Badge variant="outline" className={`text-xs ${getRelevanceColor(source.relevance)}`}>
                          {Math.round(source.relevance * 100)}%
                        </Badge>
                      </div>
                    )}

                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs text-gray-500">
                        {(((source.reliability + source.relevance) / 2) * 5).toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {source.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {source.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {source.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{source.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(source.url, "_blank")}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyCitation(source)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    {copiedId === source.id ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSourceClick(source)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2">
                          {getSourceIcon(source.type)}
                          <span>{source.title}</span>
                        </DialogTitle>
                        <DialogDescription>来源详细信息和引用格式</DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">作者:</span>
                            <p className="text-gray-600">{source.author || "未知"}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">发布日期:</span>
                            <p className="text-gray-600">
                              {source.publishDate ? new Date(source.publishDate).toLocaleDateString() : "未知"}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">访问日期:</span>
                            <p className="text-gray-600">{new Date(source.accessDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">类型:</span>
                            <p className="text-gray-600">{source.type}</p>
                          </div>
                        </div>

                        {source.description && (
                          <div>
                            <span className="font-medium text-gray-700">描述:</span>
                            <p className="text-gray-600 mt-1">{source.description}</p>
                          </div>
                        )}

                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">可靠性:</span>
                            <div className="flex items-center space-x-1">
                              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500"
                                  style={{ width: `${source.reliability * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">{Math.round(source.reliability * 100)}%</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">相关性:</span>
                            <div className="flex items-center space-x-1">
                              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500"
                                  style={{ width: `${source.relevance * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">{Math.round(source.relevance * 100)}%</span>
                            </div>
                          </div>
                        </div>

                        {source.tags.length > 0 && (
                          <div>
                            <span className="font-medium text-gray-700">标签:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {source.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <span className="font-medium text-gray-700">引用格式 ({format.toUpperCase()}):</span>
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-800 font-mono">{formatCitation(source, format)}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyCitation(source)}
                              className="mt-2"
                            >
                              {copiedId === source.id ? (
                                <>
                                  <Check className="w-4 h-4 mr-1" />
                                  已复制
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4 mr-1" />
                                  复制引用
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <Button
                            variant="outline"
                            onClick={() => window.open(source.url, "_blank")}
                            className="flex items-center space-x-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>访问原文</span>
                          </Button>

                          {source.doi && (
                            <Badge variant="outline" className="text-xs">
                              DOI: {source.doi}
                            </Badge>
                          )}

                          {source.isbn && (
                            <Badge variant="outline" className="text-xs">
                              ISBN: {source.isbn}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 统计信息 */}
      {sources.length > 0 && (
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">来源统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{sources.length}</div>
                <div className="text-gray-600">总来源数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round((sources.reduce((sum, s) => sum + s.reliability, 0) / sources.length) * 100)}%
                </div>
                <div className="text-gray-600">平均可靠性</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round((sources.reduce((sum, s) => sum + s.relevance, 0) / sources.length) * 100)}%
                </div>
                <div className="text-gray-600">平均相关性</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{new Set(sources.map((s) => s.type)).size}</div>
                <div className="text-gray-600">来源类型</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {maxSources && sources.length > maxSources && (
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            显示 {maxSources} / {sources.length} 个来源
          </p>
          <Button variant="outline" size="sm">
            查看全部来源
          </Button>
        </div>
      )}
    </div>
  )
}
