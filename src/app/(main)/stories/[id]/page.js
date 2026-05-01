'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)
import { useAuth } from '@/contexts/auth-context'
import { useData } from '@/contexts/data-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ArrowLeft, Send, Loader2, MessageCircle, Trash2, MapPin, Monitor } from 'lucide-react'
import { format } from 'date-fns'
import { useMetadata } from '@/lib/use-metadata'
import { STORY_CATEGORIES } from '@/lib/constants'

export default function StoryDetailPage() {
  const { id } = useParams()
  const { user, profile, supabase } = useAuth()
  const { stories: allStories, isLoaded } = useData()
  const meta = useMetadata()
  const [comments, setComments] = useState([])
  const [commentContent, setCommentContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const pageRef = useRef(null)

  const story = allStories?.find(s => s.id === id) || null

  const loadComments = useCallback(async () => { const { data } = await supabase.from('comments').select('*, profiles(display_name, avatar_url)').eq('story_id', id).order('created_at', { ascending: true }); setComments(data || []) }, [id, supabase])

  useEffect(() => { loadComments() }, [loadComments])

  useGSAP(() => {
    gsap.set('.detail-section', { y: 16, opacity: 0 }); gsap.to('.detail-section', { y: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: 'power3.out' })
  }, { scope: pageRef, dependencies: [isLoaded] })

  if (!isLoaded) return <div className="text-center py-32 text-sm text-muted-foreground">加载中...</div>

  const handleComment = async (e) => {
    e.preventDefault(); if (!commentContent.trim() || !user) return; setSubmitting(true)
    const { error } = await supabase.from('comments').insert({
      story_id: id,
      user_id: user.id,
      content: commentContent.trim(),
      ip_address: meta?.ip || '',
      ip_location: meta?.ip_location || '',
      device_info: meta?.device_info || '',
    })
    if (!error) { setCommentContent(''); await loadComments() }
    setSubmitting(false)
  }
  if (!story) return <div className="text-center py-32"><p className="text-muted-foreground">故事不存在</p><Link href="/stories" className="text-primary text-sm mt-3 inline-block"><ArrowLeft size={12} className="inline mr-1" />返回</Link></div>

  return (
    <div ref={pageRef} className="max-w-2xl mx-auto">
      <Link href="/stories" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors mb-5"><ArrowLeft size={12} className="mr-1" />返回故事列表</Link>

      <Card className="detail-section surface-card mb-6">
        <CardContent className="p-6 sm:p-8">
          <div className="mb-5">
            {story.category && <Badge variant="secondary" className="text-[10px] bg-accent text-muted-foreground border-0 mb-2">{STORY_CATEGORIES[story.category] || story.category}</Badge>}
            <h1 className="text-xl font-bold text-foreground tracking-tight">{story.title}</h1>
            {story.story_date && <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(story.story_date), 'yyyy年MM月dd日')}</p>}
          </div>
          <Separator className="bg-border mb-5" />
          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{story.content || story.excerpt || '暂无内容'}</p>
        </CardContent>
      </Card>

      <Card className="detail-section surface-card">
        <CardContent className="p-6 sm:p-8">
          <h3 className="text-base font-semibold text-foreground mb-5 flex items-center gap-2"><MessageCircle size={16} className="text-primary" />评论 ({comments.length})</h3>

          {user ? (
            <form onSubmit={handleComment} className="mb-6 flex gap-2">
              <Avatar className="w-8 h-8 ring-1 ring-border shrink-0"><AvatarImage src={profile?.avatar_url || ''} /><AvatarFallback className="bg-accent text-foreground text-xs">{profile?.display_name?.[0] || user.email?.[0]?.toUpperCase()}</AvatarFallback></Avatar>
              <div className="flex-1 flex gap-2"><Input placeholder="写下评论..." value={commentContent} onChange={(e) => setCommentContent(e.target.value)} className="bg-background border-border text-sm" /><Button type="submit" size="icon" className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 w-9" disabled={submitting || !commentContent.trim()}>{submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}</Button></div>
            </form>
          ) : (
            <div className="mb-6 p-3 text-center rounded-lg bg-accent/50 border border-border"><p className="text-xs text-muted-foreground"><Link href="/login" className="text-primary hover:underline">登录</Link> 后即可评论</p></div>
          )}

          <div className="space-y-3">
            {comments.length === 0 ? <p className="text-center text-xs text-muted-foreground py-8">还没有评论</p> : comments.map((c) => (
              <div key={c.id} className="flex gap-2.5 group">
                <Avatar className="w-7 h-7 ring-1 ring-border shrink-0"><AvatarImage src={c.profiles?.avatar_url || ''} /><AvatarFallback className="bg-accent text-foreground text-[10px]">{c.profiles?.display_name?.[0] || '匿'}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><span className="text-xs font-medium text-foreground">{c.profiles?.display_name || '匿名'}</span><span className="text-[10px] text-muted-foreground">{c.created_at ? format(new Date(c.created_at), 'MM-dd HH:mm') : ''}</span></div>
                  <p className="text-xs text-foreground/70 mt-0.5">{c.content}</p>
                  {(c.ip_location || c.device_info) && (
                    <div className="flex items-center gap-3 mt-1 text-[9px] text-muted-foreground/50">
                      {c.ip_location && <span className="flex items-center gap-0.5"><MapPin size={8} />{c.ip_location}</span>}
                      {c.device_info && <span className="flex items-center gap-0.5"><Monitor size={8} />{c.device_info}</span>}
                    </div>
                  )}
                </div>
                {(user?.id === c.user_id || profile?.role === 'admin') && (
                  <button onClick={async () => { await supabase.from('comments').delete().eq('id', c.id); await loadComments() }} className="opacity-0 group-hover:opacity-100 text-muted-foreground/30 hover:text-destructive transition-all"><Trash2 size={10} /></button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
