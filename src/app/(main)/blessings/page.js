'use client'

import { useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/contexts/auth-context'
import { useData } from '@/contexts/data-context'
import { useMetadata } from '@/lib/use-metadata'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Send, Loader2, MapPin, Heart, MessageCircle } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

const FireworkCanvas = dynamic(() => import('@/components/blessings/firework-canvas'), { ssr: false })

function BlessingCard({ blessing, onDelete, isOwner, index }) {
  const initial = (blessing.author_name || '匿')[0]
  const colors = ['bg-primary', 'bg-yellow-400', 'bg-sky-400', 'bg-rose-400', 'bg-violet-400', 'bg-emerald-400', 'bg-amber-400', 'bg-fuchsia-400']

  return (
    <div className={`blessing-card bg-white border-[2.5px] border-black rounded-2xl p-4 chunky-shadow-sm flex flex-col h-full transition-[box-shadow,transform] duration-150 hover:shadow-[5px_5px_0_0_#1a1a1a] ${index % 5 === 2 ? '-rotate-1' : index % 5 === 4 ? 'rotate-1' : ''}`}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`size-9 rounded-full ${colors[index % colors.length]} border-2 border-black flex items-center justify-center shrink-0`}><span className="text-white font-black text-xs">{initial}</span></div>
        <div className="min-w-0">
          <p className="text-xs font-black truncate">{blessing.author_name || '匿名'}</p>
          {blessing.ip_location && <p className="text-[10px] text-muted-foreground/60 font-medium flex items-center gap-0.5 mt-0.5"><MapPin size={9} aria-hidden="true" />{blessing.ip_location}</p>}
        </div>
        {isOwner && <button onClick={() => onDelete(blessing.id)} className="ml-auto text-[10px] font-bold text-muted-foreground/30 hover:text-destructive transition-colors" aria-label="删除祝福">删除</button>}
      </div>
      <p className="text-sm text-foreground/85 font-medium leading-relaxed flex-1 whitespace-pre-wrap">{blessing.content}</p>
      <p className="text-[10px] text-muted-foreground/40 font-bold mt-3 pt-2 border-t-2 border-black/10">{blessing.created_at ? new Date(blessing.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</p>
    </div>
  )
}

export default function BlessingsPage() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const { blessings, isLoaded, addBlessing, deleteBlessing } = useData()
  const meta = useMetadata()
  const [content, setContent] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const pageRef = useRef(null)

  const handleSubmit = async (e) => { e.preventDefault(); if (!content.trim()) return; setSubmitting(true); try { await addBlessing({ user_id: user?.id || null, author_name: user ? (profile?.display_name || '匿名') : (authorName || '匿名'), content: content.trim(), ip_address: meta?.ip || '', ip_location: meta?.ip_location || '', device_info: meta?.device_info || '' }); setContent(''); setAuthorName(''); toast('祝福已送出', 'success') } catch { toast('发送失败', 'error') } setSubmitting(false) }
  const handleDelete = async (id) => { try { await deleteBlessing(id) } catch (e) { toast('删除失败', 'error') } }

  useGSAP(() => {
    if (!isLoaded || !blessings?.length) return
    const cards = gsap.utils.toArray('.blessing-card')
    gsap.set(cards, { opacity: 0, y: 30, scale: 0.94 })
    gsap.to(cards, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: { each: 0.06, from: 'random' }, ease: 'back.out(1.3)' })
  }, { scope: pageRef, dependencies: [isLoaded, blessings?.length] })

  return (
    <div ref={pageRef} className="max-w-5xl mx-auto px-4 sm:px-8 pb-16 relative">
      <FireworkCanvas />
      <div className="relative z-10 pt-8 pb-10 text-center">
        <span className="memphis-badge mb-4"><Heart size={13} className="inline mr-1" aria-hidden="true" />祝福墙</span>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mt-4 mb-3">祝福卡片</h1>
        <p className="text-sm text-muted-foreground font-medium max-w-sm mx-auto">为尹磊和唐涛送上一份真挚的祝福，让温暖传递</p>
      </div>

      <div className="relative z-10 mb-14 max-w-lg mx-auto">
        <Card className="bg-white border-[2.5px] border-black rounded-2xl chunky-shadow">
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!user && <div className="space-y-1.5"><Label className="text-xs font-black">你的名字</Label><Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="让大家知道你是谁" required className="bg-white border-2 border-black rounded-lg font-medium text-sm" /></div>}
              <div className="space-y-1.5"><Label className="text-xs font-black">祝福语</Label><Textarea rows={3} value={content} onChange={(e) => setContent(e.target.value)} placeholder="写下你的祝福..." className="bg-white border-2 border-black rounded-lg font-medium text-sm resize-none" required /></div>
              {meta?.ip_location && <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1"><MapPin size={10} aria-hidden="true" />{meta.ip_location} · {meta.device_info}</p>}
              <Button type="submit" disabled={submitting} className="w-full bg-primary hover:bg-primary/90 text-white font-black border-2 border-black chunky-shadow">{submitting ? <Loader2 size={15} className="animate-spin mr-2" aria-hidden="true" /> : <Send size={15} className="mr-2" aria-hidden="true" />}送出祝福</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="relative z-10">
        {!isLoaded ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 9 }).map((_, i) => <div key={i} className="bg-white border-[2.5px] border-black/20 rounded-2xl p-4 animate-pulse"><div className="flex items-center gap-3 mb-3"><div className="size-9 rounded-full bg-stone-200" /><div className="space-y-1.5 flex-1"><div className="h-3 bg-stone-200 rounded w-2/3" /><div className="h-2 bg-stone-100 rounded w-1/3" /></div></div><div className="space-y-2"><div className="h-3 bg-stone-100 rounded" /><div className="h-3 bg-stone-100 rounded w-4/5" /></div></div>)}</div>
        ) : !blessings?.length ? (
          <div className="text-center py-16"><div className="size-16 rounded-full bg-accent border-[2.5px] border-black chunky-shadow-sm flex items-center justify-center mx-auto mb-4"><MessageCircle size={28} className="text-muted-foreground" /></div><h3 className="font-black text-lg mb-2">还没有祝福</h3><p className="text-sm text-muted-foreground font-medium">来做第一个送祝福的人吧</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {blessings.map((b, i) => (
              <div key={b.id} className="h-full" style={{ breakInside: 'avoid' }}>
                <BlessingCard blessing={b} index={i} isOwner={user && (user.id === b.user_id || profile?.role === 'admin')} onDelete={handleDelete} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
