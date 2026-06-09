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
import { Send, Loader2, MapPin, Heart, Sparkles } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

const FireworkCanvas = dynamic(() => import('@/components/blessings/firework-canvas'), { ssr: false })

/* ── Romantic blessing card ─── */
function BlessingCard({ blessing, onDelete, isOwner, index }) {
  const initial = (blessing.author_name || '匿')[0]
  const gradients = ['from-primary/80 to-rose-400', 'from-amber-400 to-rose-300', 'from-sky-400 to-violet-400', 'from-emerald-400 to-teal-400', 'from-rose-400 to-pink-400', 'from-violet-400 to-purple-400', 'from-primary/70 to-amber-400', 'from-fuchsia-400 to-rose-400']

  return (
    <div className={`blessing-card bg-white border border-black/5 rounded-3xl p-5 shadow-sm hover:shadow-md transition-[box-shadow,transform] duration-300 hover:-translate-y-1 flex flex-col h-full`}>
      {/* Author */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`size-10 rounded-2xl bg-linear-to-br ${gradients[index % gradients.length]} flex items-center justify-center shrink-0 shadow-sm`}>
          <span className="text-white font-bold text-xs">{initial}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{blessing.author_name || '匿名'}</p>
          {blessing.ip_location && (
            <p className="text-[11px] text-muted-foreground/50 font-medium flex items-center gap-0.5 mt-0.5"><MapPin size={9} aria-hidden="true" />{blessing.ip_location}</p>
          )}
        </div>
        {isOwner && (
          <button onClick={() => onDelete(blessing.id)} className="ml-auto text-[10px] font-medium text-muted-foreground/30 hover:text-rose-400 transition-colors" aria-label="删除祝福">删除</button>
        )}
      </div>

      {/* Content */}
      <p className="text-sm text-foreground/80 leading-relaxed flex-1 whitespace-pre-wrap">{blessing.content}</p>

      {/* Footer */}
      <p className="text-[10px] text-muted-foreground/30 font-medium mt-3 pt-3 border-t border-black/5">
        {blessing.created_at ? new Date(blessing.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
      </p>
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

  /* ── Gentle card entrance ─── */
  useGSAP(() => {
    if (!isLoaded || !blessings?.length) return
    const cards = gsap.utils.toArray('.blessing-card')
    gsap.fromTo(cards, { y: 30, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: { each: 0.08, from: 'random' }, ease: 'power2.out' })
  }, { scope: pageRef, dependencies: [isLoaded, blessings?.length] })

  return (
    <div ref={pageRef} className="max-w-5xl mx-auto px-4 sm:px-8 pb-16 relative">
      <FireworkCanvas />

      {/* Header */}
      <div className="relative z-10 pt-10 pb-12 text-center">
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary/80">
          <Sparkles size={14} className="text-primary/60" aria-hidden="true" /> 祝福墙
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mt-3 mb-4">温暖祝福</h1>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">为尹磊和唐涛送上一份真挚的祝福，让爱在此停留</p>
      </div>

      {/* Form */}
      <div className="relative z-10 mb-14 max-w-lg mx-auto">
        <Card className="bg-white border border-black/5 rounded-3xl shadow-sm">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!user && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">你的名字</Label>
                  <Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="让大家知道你是谁" required className="bg-stone-50 border border-black/10 rounded-xl font-medium text-sm focus:border-primary/30 focus:ring-2 focus:ring-primary/10" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">祝福语</Label>
                <Textarea rows={3} value={content} onChange={(e) => setContent(e.target.value)} placeholder="写下你的祝福..." className="bg-stone-50 border border-black/10 rounded-xl font-medium text-sm resize-none focus:border-primary/30 focus:ring-2 focus:ring-primary/10" required />
              </div>
              {meta?.ip_location && <p className="text-[10px] text-muted-foreground/50 font-medium flex items-center gap-1"><MapPin size={10} aria-hidden="true" />{meta.ip_location} · {meta.device_info}</p>}
              <Button type="submit" disabled={submitting} className="w-full bg-linear-to-r from-primary to-rose-400 hover:from-primary/90 hover:to-rose-500 text-white font-semibold rounded-xl h-11 shadow-md hover:shadow-lg transition-all duration-300">
                {submitting ? <Loader2 size={16} className="animate-spin mr-2" aria-hidden="true" /> : <Send size={16} className="mr-2" aria-hidden="true" />}
                送出祝福
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Blessings grid */}
      <div className="relative z-10">
        {!isLoaded ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{Array.from({ length: 9 }).map((_, i) => <div key={i} className="bg-white border border-black/5 rounded-3xl p-5 animate-pulse"><div className="flex items-center gap-3 mb-3"><div className="size-10 rounded-2xl bg-stone-200" /><div className="space-y-2 flex-1"><div className="h-4 bg-stone-100 rounded w-2/3" /><div className="h-3 bg-stone-50 rounded w-1/3" /></div></div><div className="space-y-2"><div className="h-3 bg-stone-100 rounded" /><div className="h-3 bg-stone-50 rounded w-4/5" /></div></div>)}</div>
        ) : !blessings?.length ? (
          <div className="text-center py-20">
            <div className="size-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4"><Heart size={28} className="text-rose-300" /></div>
            <h3 className="font-bold text-lg mb-2">还没有祝福</h3><p className="text-sm text-muted-foreground">来做第一个送祝福的人吧</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {blessings.map((b, i) => (
              <div key={b.id} className="h-full"><BlessingCard blessing={b} index={i} isOwner={user && (user.id === b.user_id || profile?.role === 'admin')} onDelete={handleDelete} /></div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
