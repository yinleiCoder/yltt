'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/contexts/auth-context'
import { useData } from '@/contexts/data-context'
import { useMetadata } from '@/lib/use-metadata'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Send, Loader2, MapPin } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import FloatingAvatars from '@/components/blessings/floating-avatars'

const FireworkCanvas = dynamic(
  () => import('@/components/blessings/firework-canvas'),
  { ssr: false }
)

export default function BlessingsPage() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const { blessings, isLoaded, addBlessing, deleteBlessing } = useData()
  const meta = useMetadata()
  const [content, setContent] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
    <div className="max-w-full mx-auto relative min-h-[calc(100vh-4rem)]">
      <FireworkCanvas />

      <div className="relative z-10 flex flex-col" style={{ minHeight: 'calc(100vh - 4rem)' }}>
        {/* Header */}
        <div className="mb-6 px-4 pt-2">
          <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">祝福卡片</h1>
          <p className="text-sm text-muted-foreground">为尹磊和唐涛送上一份真挚的祝福</p>
        </div>

        {/* Danmaku scrolling cards - flex-grow fills available space */}
        <div className="flex-1 flex px-4">
          {!isLoaded ? (
            <p className="text-center w-full py-12 text-sm text-muted-foreground">加载中...</p>
          ) : blessings?.length === 0 ? (
            <p className="text-center w-full py-16 text-sm text-muted-foreground">还没有祝福，来做第一个送祝福的人吧</p>
          ) : (
            <FloatingAvatars blessings={blessings} onDelete={handleDelete} />
          )}
        </div>

        {/* Form at bottom */}
        <div className="mt-auto px-4 pb-8 pt-6">
          <div className="max-w-xl mx-auto">
            <Card className="surface-card">
              <CardContent className="p-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!user && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">你的名字</Label>
                      <Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="让大家知道你是谁" required className="bg-background border-border" />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label className="text-xs">祝福语</Label>
                    <Textarea rows={3} value={content} onChange={(e) => setContent(e.target.value)} placeholder="写下你的祝福..." className="bg-background border-border resize-none" required />
                  </div>
                  {meta?.ip_location && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1"><MapPin size={10} />{meta.ip_location} · {meta.device_info}</p>
                  )}
                  <Button type="submit" disabled={submitting} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    {submitting ? <Loader2 size={14} className="animate-spin mr-2" /> : <Send size={14} className="mr-2" />}送出祝福
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
