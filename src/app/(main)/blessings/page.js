'use client'

import { useState, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)
import { useAuth } from '@/contexts/auth-context'
import { useData } from '@/contexts/data-context'
import { useMetadata } from '@/lib/use-metadata'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Send, Loader2, Trash2, MapPin, Monitor } from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/components/ui/toast'

export default function BlessingsPage() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const { blessings, isLoaded, addBlessing, deleteBlessing } = useData()
  const meta = useMetadata()
  const [content, setContent] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const sectionRef = useRef(null)

  useGSAP(() => {
    gsap.set('.blessing-item', { y: 20, opacity: 0 }); gsap.to('.blessing-item', { y: 0, opacity: 1, duration: 0.4, stagger: 0.06, ease: 'power3.out' })
  }, { scope: sectionRef, dependencies: [isLoaded, blessings?.length] })

  const handleSubmit = async (e) => {
    e.preventDefault(); if (!content.trim()) return; setSubmitting(true)
    try {
      await addBlessing({
        user_id: user?.id || null,
        author_name: user ? (profile?.display_name || '匿名') : (authorName || '匿名'),
        content: content.trim(),
        ip_address: meta?.ip || '',
        ip_location: meta?.ip_location || '',
        device_info: meta?.device_info || '',
      })
      setContent(''); setAuthorName('')
    } catch (e) { toast('发送失败: ' + e.message, 'error') }
    setSubmitting(false)
  }

  const handleDelete = async (id) => {
    try { await deleteBlessing(id) } catch (e) { toast('删除失败: ' + e.message, 'error') }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">祝福卡片</h1>
        <p className="text-sm text-muted-foreground">为尹磊和唐涛送上一份真挚的祝福</p>
      </div>

      <Card className="surface-card mb-8">
        <CardContent className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!user && (
              <div className="space-y-1.5"><Label className="text-xs">你的名字</Label><Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="让大家知道你是谁" required className="bg-background border-border" /></div>
            )}
            <div className="space-y-1.5"><Label className="text-xs">祝福语</Label><Textarea rows={3} value={content} onChange={(e) => setContent(e.target.value)} placeholder="写下你的祝福..." className="bg-background border-border resize-none" required /></div>
            {meta?.ip_location && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1"><MapPin size={10} />{meta.ip_location} · {meta.device_info}</p>
            )}
            <Button type="submit" disabled={submitting} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              {submitting ? <Loader2 size={14} className="animate-spin mr-2" /> : <Send size={14} className="mr-2" />}送出祝福
            </Button>
          </form>
        </CardContent>
      </Card>

      <div ref={sectionRef} className="grid sm:grid-cols-2 gap-3">
        {!isLoaded ? (
          <p className="col-span-2 text-center py-12 text-sm text-muted-foreground">加载中...</p>
        ) : blessings?.length === 0 ? (
          <p className="col-span-2 text-center py-16 text-sm text-muted-foreground">还没有祝福，来做第一个送祝福的人吧</p>
        ) : (
          blessings?.map((b) => (
            <Card key={b.id} className="blessing-item surface-card hover:border-primary/15 transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-7 h-7 ring-1 ring-border shrink-0">
                      <AvatarFallback className="bg-accent text-foreground text-[10px]">{b.author_name?.[0] || '匿'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-medium text-foreground">{b.author_name}</p>
                      <p className="text-[9px] text-muted-foreground">{b.created_at ? format(new Date(b.created_at), 'MM-dd HH:mm') : ''}</p>
                    </div>
                  </div>
                  {(user?.id === b.user_id || profile?.role === 'admin') && (
                    <button onClick={() => handleDelete(b.id)} className="text-muted-foreground/30 hover:text-destructive transition-colors shrink-0"><Trash2 size={12} /></button>
                  )}
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed mb-2.5">{b.content}</p>
                <div className="flex items-center gap-3 text-[9px] text-muted-foreground/60">
                  {b.ip_location && <span className="flex items-center gap-0.5"><MapPin size={9} />{b.ip_location}</span>}
                  {b.device_info && <span className="flex items-center gap-0.5"><Monitor size={9} />{b.device_info}</span>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
