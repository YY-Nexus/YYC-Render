"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  ThumbsUp,
  Eye,
  Clock,
  ImageIcon,
  Link,
  Flag,
} from "lucide-react"
import type { SharedContent, Comment } from "@/lib/collaboration"

export default function ContentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const contentId = params.id as string

  const [content, setContent] = useState<SharedContent | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [loading, setLoading] = useState(true)

  // 模拟内容数据
  const mockContent: SharedContent = {
    id: contentId,
    authorId: "user-123",
    authorName: "张学霸",
    authorAvatar: "/diverse-user-avatars.png",
    title: "高效学习方法分享：如何在30天内掌握新技能",
    content: `# 高效学习方法分享

经过一年的实践和总结，我想分享一些真正有效的学习方法，希望能帮助到正在学习路上的朋友们。

## 核心原则

### 1. 主动学习胜过被动接受
不要只是看书或听课，要主动思考、提问、实践。每学完一个概念，立即问自己：
- 这个概念的核心是什么？
- 它与我已知的知识有什么联系？
- 我能用自己的话解释给别人听吗？

### 2. 间隔重复是记忆之王
使用间隔重复系统（SRS）来复习：
- 第1天学习
- 第2天复习
- 第4天复习
- 第7天复习
- 第15天复习
- 第30天复习

### 3. 实践出真知
理论学习后立即实践：
- 编程：写代码
- 语言：对话练习
- 设计：做项目
- 写作：发文章

## 具体方法

### 费曼学习法
1. 选择一个概念
2. 用简单的语言解释给别人（或假想的对象）
3. 发现不清楚的地方，回去重新学习
4. 简化和类比，直到能让小学生都听懂

### 番茄工作法 + 学习
- 25分钟专注学习
- 5分钟休息
- 每4个番茄后休息15-30分钟
- 记录每个番茄的学习内容和效果

### 思维导图整理
每学完一个章节，画思维导图：
- 中心主题
- 主要分支
- 细节补充
- 关联线条

## 我的30天学习计划模板

**第1-7天：基础建立**
- 了解整体框架
- 掌握核心概念
- 建立知识地图

**第8-21天：深入实践**
- 大量练习
- 项目实战
- 错误总结

**第22-30天：巩固提升**
- 系统复习
- 查漏补缺
- 输出分享

希望这些方法对大家有帮助！有问题欢迎在评论区讨论。`,
    type: "experience",
    tags: ["学习方法", "效率提升", "技能学习", "经验分享"],
    createdAt: Date.now() - 86400000 * 3, // 3天前
    updatedAt: Date.now() - 86400000 * 1, // 1天前
    likes: 156,
    views: 1240,
    comments: 23,
    bookmarks: 89,
    isPublic: true,
  }

  const mockComments: Comment[] = [
    {
      id: "comment-1",
      contentId: contentId,
      authorId: "user-456",
      authorName: "小明同学",
      authorAvatar: "/student-avatar.png",
      content: "太实用了！特别是费曼学习法，我试了一下发现自己很多概念其实没有真正理解。",
      createdAt: Date.now() - 86400000 * 2,
      likes: 12,
      replies: [
        {
          id: "reply-1",
          commentId: "comment-1",
          authorId: "user-123",
          authorName: "张学霸",
          authorAvatar: "/diverse-user-avatars.png",
          content: "是的，费曼学习法最大的价值就是帮我们发现知识盲点。坚持用这个方法，学习效果会有质的提升！",
          createdAt: Date.now() - 86400000 * 1,
          likes: 8,
        },
      ],
    },
    {
      id: "comment-2",
      contentId: contentId,
      authorId: "user-789",
      authorName: "学习达人",
      authorAvatar: "/teacher-avatar.png",
      content: "间隔重复确实很有效！我用Anki已经两年了，记忆效果比传统方法好太多。推荐大家试试。",
      createdAt: Date.now() - 86400000 * 1,
      likes: 18,
      replies: [],
    },
    {
      id: "comment-3",
      contentId: contentId,
      authorId: "user-101",
      authorName: "编程新手",
      authorAvatar: "/programmer-avatar.png",
      content: "30天学习计划很棒！我正在学React，按照这个模板制定了学习计划，希望能坚持下去。",
      createdAt: Date.now() - 3600000 * 6, // 6小时前
      likes: 5,
      replies: [],
    },
  ]

  const handleLike = () => {
    setIsLiked(!isLiked)
    if (content) {
      setContent({
        ...content,
        likes: isLiked ? content.likes - 1 : content.likes + 1,
      })
    }
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    if (content) {
      setContent({
        ...content,
        bookmarks: isBookmarked ? content.bookmarks - 1 : content.bookmarks + 1,
      })
    }
  }

  const handleCommentSubmit = () => {
    if (!newComment.trim()) return

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      contentId: contentId,
      authorId: "current-user",
      authorName: "当前用户",
      authorAvatar: "/placeholder-f263t.png",
      content: newComment,
      createdAt: Date.now(),
      likes: 0,
      replies: [],
    }

    setComments([comment, ...comments])
    setNewComment("")

    if (content) {
      setContent({
        ...content,
        comments: content.comments + 1,
      })
    }
  }

  const handleReplySubmit = (commentId: string) => {
    if (!replyText.trim()) return

    const reply = {
      id: `reply-${Date.now()}`,
      commentId: commentId,
      authorId: "current-user",
      authorName: "当前用户",
      authorAvatar: "/placeholder-f263t.png",
      content: replyText,
      createdAt: Date.now(),
      likes: 0,
    }

    setComments(
      comments.map((comment) =>
        comment.id === commentId ? { ...comment, replies: [...comment.replies, reply] } : comment,
      ),
    )

    setReplyText("")
    setShowReplyForm(null)
  }

  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (days > 0) return `${days}天前`
    if (hours > 0) return `${hours}小时前`
    if (minutes > 0) return `${minutes}分钟前`
    return "刚刚"
  }

  useEffect(() => {
    // 模拟加载数据
    setTimeout(() => {
      setContent(mockContent)
      setComments(mockComments)
      setLoading(false)
    }, 500)
  }, [contentId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">内容不存在</p>
          <button onClick={() => router.back()} className="text-blue-600 hover:underline">
            返回上一页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-medium text-gray-900">内容详情</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 内容主体 */}
        <article className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {/* 作者信息 */}
          <div className="flex items-center gap-3 mb-4">
            <img
              src={content.authorAvatar || "/placeholder.svg"}
              alt={content.authorName}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{content.authorName}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatTime(content.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {content.views} 浏览
                </span>
              </div>
            </div>
          </div>

          {/* 标题 */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{content.title}</h1>

          {/* 标签 */}
          <div className="flex flex-wrap gap-2 mb-6">
            {content.tags.map((tag, index) => (
              <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {tag}
              </span>
            ))}
          </div>

          {/* 内容 */}
          <div className="prose max-w-none mb-6">
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">{content.content}</div>
          </div>

          {/* 互动按钮 */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-6">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isLiked ? "bg-red-100 text-red-600" : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                <span>{content.likes}</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-600">
                <MessageCircle className="w-5 h-5" />
                <span>{content.comments}</span>
              </button>
              <button
                onClick={handleBookmark}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isBookmarked ? "bg-yellow-100 text-yellow-600" : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                <Bookmark className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`} />
                <span>{content.bookmarks}</span>
              </button>
            </div>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-600">
              <Flag className="w-4 h-4" />
              <span>举报</span>
            </button>
          </div>
        </article>

        {/* 评论区 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">评论 ({content.comments})</h2>

          {/* 发表评论 */}
          <div className="mb-6">
            <div className="flex gap-3">
              <img src="/placeholder-f263t.png" alt="当前用户" className="w-10 h-10 rounded-full object-cover" />
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="写下你的想法..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-blue-500"
                  rows={3}
                />
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                      <ImageIcon className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                      <Link className="w-5 h-5" />
                    </button>
                  </div>
                  <button
                    onClick={handleCommentSubmit}
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    发表评论
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 评论列表 */}
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="border-b border-gray-100 pb-6">
                <div className="flex gap-3">
                  <img
                    src={comment.authorAvatar || "/placeholder.svg"}
                    alt={comment.authorName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">{comment.authorName}</span>
                      <span className="text-sm text-gray-500">{formatTime(comment.createdAt)}</span>
                    </div>
                    <p className="text-gray-800 mb-3">{comment.content}</p>
                    <div className="flex items-center gap-4">
                      <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600">
                        <ThumbsUp className="w-4 h-4" />
                        <span>{comment.likes}</span>
                      </button>
                      <button
                        onClick={() => setShowReplyForm(comment.id)}
                        className="text-sm text-gray-500 hover:text-blue-600"
                      >
                        回复
                      </button>
                    </div>

                    {/* 回复表单 */}
                    {showReplyForm === comment.id && (
                      <div className="mt-4 ml-4">
                        <div className="flex gap-3">
                          <img
                            src="/placeholder-f263t.png"
                            alt="当前用户"
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder={`回复 ${comment.authorName}...`}
                              className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-blue-500"
                              rows={2}
                            />
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => handleReplySubmit(comment.id)}
                                disabled={!replyText.trim()}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                              >
                                回复
                              </button>
                              <button
                                onClick={() => setShowReplyForm(null)}
                                className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-sm"
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 回复列表 */}
                    {comment.replies.length > 0 && (
                      <div className="mt-4 ml-4 space-y-3">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-3">
                            <img
                              src={reply.authorAvatar || "/placeholder.svg"}
                              alt={reply.authorName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900 text-sm">{reply.authorName}</span>
                                <span className="text-xs text-gray-500">{formatTime(reply.createdAt)}</span>
                              </div>
                              <p className="text-gray-800 text-sm">{reply.content}</p>
                              <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 mt-2">
                                <ThumbsUp className="w-3 h-3" />
                                <span>{reply.likes}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
