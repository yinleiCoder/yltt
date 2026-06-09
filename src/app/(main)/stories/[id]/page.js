'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import VideoPlayer from '@/components/video-player'
import { useAuth } from '@/contexts/auth-context'
import { useData } from '@/contexts/data-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Send, Loader2, MessageCircle, Trash2, MapPin, Monitor, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { useMetadata } from '@/lib/use-metadata'
import { getFileUrl, getOssKey } from '@/lib/oss-client'
import { STORY_CATEGORIES } from '@/lib/constants'

export default function StoryDetailPage() {
  const { id } = useParams()
  const { user, profile, supabase } = useAuth()
  const { stories: allStories, isLoaded } = useData()
  const meta = useMetadata()
  const [comments, setComments] = useState([])
  const [commentContent, setCommentContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [commentError, setCommentError] = useState('')
  const pageRef = useRef(null)

  const story = allStories?.find(s => s.id === id) || null

  const loadComments = useCallback(async () => {
    const { data } = await supabase.from('comments').select('*, profiles(display_name, avatar_url)').eq('story_id', id).order('created_at', { ascending: true })
    setComments(data || [])
  }, [id, supabase])

  useEffect(() => { loadComments() }, [loadComments])

  useGSAP(() => {
    gsap.fromTo('.detail-enter', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out' })
  }, { scope: pageRef, dependencies: [isLoaded, story?.id] })

  const handleComment = async (e) => {
    e.preventDefault()
    if (!commentContent.trim() || !user) return
    setSubmitting(true)
    setCommentError('')
    try {
      // Ensure fresh session before inserting
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setCommentError('登录已过期，请刷新页面后重新登录')
        setSubmitting(false)
        return
      }
      // Use session user id (guaranteed to match auth.uid() in RLS)
      const authUserId = session.user.id
      const payload = { story_id: id, user_id: authUserId, content: commentContent.trim() }
      if (meta?.ip) payload.ip_address = meta.ip
      if (meta?.ip_location) payload.ip_location = meta.ip_location
      if (meta?.device_info) payload.device_info = meta.device_info
      const { error } = await supabase.from('comments').insert(payload)
      if (error) {
        console.error('Comment insert error:', JSON.stringify(error))
        // Retry without extra fields
        const { error: retryError } = await supabase.from('comments').insert({ story_id: id, user_id: authUserId, content: commentContent.trim() })
        if (retryError) {
          console.error('Comment insert retry error:', JSON.stringify(retryError))
          setCommentError(retryError.message || '评论失败，请稍后重试')
        } else {
          setCommentContent('')
          await loadComments()
        }
      } else {
        setCommentContent('')
        await loadComments()
      }
    } catch (err) {
      console.error('Comment insert exception:', err)
      setCommentError('评论失败，请检查网络连接')
    }
    setSubmitting(false)
  }

  if (!isLoaded) {
    return <div className="max-w-2xl mx-auto px-4 py-8"><Skeleton className="h-4 w-20 mb-8" /><div className="bg-white border-[2.5px] border-black/20 rounded-2xl p-6 space-y-4"><Skeleton className="h-6 w-1/3" /><Skeleton className="h-4 w-1/4" /><Skeleton className="h-px w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></div></div>
  }

  if (!story) {
    return <div className="max-w-2xl mx-auto px-4 py-20 text-center"><div className="size-16 rounded-full bg-accent border-[2.5px] border-black chunky-shadow-sm flex items-center justify-center mx-auto mb-4"><MessageCircle size={28} className="text-muted-foreground" /></div><h2 className="font-black text-lg mb-2">故事不存在</h2><Link href="/stories" className="text-primary font-bold text-sm hover:underline">← 返回故事列表</Link></div>
  }

  const hasMedia = story.media_url && story.media_type
  const mediaUrl = hasMedia ? getFileUrl(story.media_url) : null

  return (
    <div ref={pageRef} className="max-w-2xl mx-auto px-4 sm:px-8 py-8">
      <Link href="/stories" className="detail-enter inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mb-8"><ArrowLeft size={14} aria-hidden="true" /> 返回故事列表</Link>

      <Card className="detail-enter bg-white border-[2.5px] border-black rounded-2xl chunky-shadow mb-6">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-12 rounded-full bg-accent border-2 border-black flex items-center justify-center text-2xl shrink-0" aria-hidden="true">{story.cover_emoji || '💕'}</div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">{story.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                {story.story_date && <span className="text-xs text-muted-foreground font-medium flex items-center gap-1"><Calendar size={11} aria-hidden="true" />{format(new Date(story.story_date), 'yyyy年MM月dd日')}</span>}
                {story.category && STORY_CATEGORIES[story.category] && <Badge className="text-[10px] bg-primary/10 text-primary border border-primary/20 font-bold rounded-full">{STORY_CATEGORIES[story.category]}</Badge>}
              </div>
            </div>
          </div>
          <div className="border-t-2 border-black/10 my-5" />
          {story.content ? <div className="text-sm text-foreground/85 font-medium leading-relaxed whitespace-pre-wrap">{story.content}</div> : <p className="text-sm text-muted-foreground italic">暂无内容</p>}
          {hasMedia && (
            <div className="mt-6">
              {story.media_type === 'video' ? (
                <div className="w-full aspect-video max-h-[50vh] sm:max-h-[70vh]">
                  <VideoPlayer src={`/api/stream?key=${encodeURIComponent(getOssKey(story.media_url))}`} />
                </div>
              ) : (
                <img src={mediaUrl} alt={story.title} className="w-full object-cover rounded-xl border-2 border-black" loading="lazy" />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="detail-enter bg-white border-[2.5px] border-black rounded-2xl chunky-shadow">
        <CardContent className="p-6 sm:p-8">
          <h3 className="font-black text-base mb-5 flex items-center gap-2"><MessageCircle size={17} className="text-primary" aria-hidden="true" />评论 ({comments.length})</h3>
          {user ? (
            <>
              <form onSubmit={handleComment} className="mb-6 flex gap-2.5">
                <Avatar className="size-9 ring-1 ring-black/10 shrink-0">{profile?.avatar_url ? <AvatarImage src={profile.avatar_url} /> : null}<AvatarFallback className="bg-stone-200 text-foreground text-xs font-bold">{profile?.display_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}</AvatarFallback></Avatar>
                <div className="flex-1 flex gap-2"><Input placeholder="写下评论..." value={commentContent} onChange={(e) => setCommentContent(e.target.value)} className="bg-white border-2 border-black rounded-lg font-medium text-sm" /><Button type="submit" size="icon" className="bg-primary hover:bg-primary/90 text-white border-2 border-black chunky-shadow-sm size-9 shrink-0" disabled={submitting || !commentContent.trim()}>{submitting ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Send size={14} aria-hidden="true" />}</Button></div>
              </form>
              {commentError && (
                <p className="mb-4 text-xs text-red-500 font-medium bg-red-50 border border-red-200 rounded-lg px-3 py-2">{commentError}</p>
              )}
            </>
          ) : (
            <div className="mb-6 p-3 text-center rounded-xl bg-stone-100 border-2 border-black/10"><p className="text-xs text-muted-foreground font-medium"><Link href="/login" className="text-primary font-bold hover:underline">登录</Link> 后即可评论</p></div>
          )}
          <div className="space-y-4">
            {comments.length === 0 ? <p className="text-center text-xs text-muted-foreground py-8 font-medium">还没有评论，来发表第一条吧</p> : comments.map((c) => (
              <div key={c.id} className="flex gap-2.5 group">
                <Avatar className="size-8 ring-1 ring-black/10 shrink-0">{c.profiles?.avatar_url ? <AvatarImage src={c.profiles.avatar_url} /> : null}<AvatarFallback className="bg-stone-200 text-foreground text-[10px] font-bold">{c.profiles?.display_name?.[0] || '匿'}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><span className="text-xs font-bold text-foreground">{c.profiles?.display_name || '匿名'}</span><span className="text-[10px] text-muted-foreground font-medium">{c.created_at ? format(new Date(c.created_at), 'MM-dd HH:mm') : ''}</span></div>
                  <p className="text-sm text-foreground/75 font-medium mt-0.5">{c.content}</p>
                  {(c.ip_location || c.device_info) && <div className="flex items-center gap-3 mt-1.5 text-[9px] text-muted-foreground/40 font-medium">{c.ip_location && <span className="flex items-center gap-0.5"><MapPin size={8} aria-hidden="true" />{c.ip_location}</span>}{c.device_info && <span className="flex items-center gap-0.5"><Monitor size={8} aria-hidden="true" />{c.device_info}</span>}</div>}
                </div>
                {(user?.id === c.user_id || profile?.role === 'admin') && <button onClick={async () => { await supabase.from('comments').delete().eq('id', c.id); await loadComments() }} className="opacity-0 group-hover:opacity-100 text-muted-foreground/30 hover:text-destructive transition-opacity shrink-0" aria-label="删除评论"><Trash2 size={11} /></button>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
