'use client'

import { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Camera, Loader2, User, MapPin } from 'lucide-react'
import { useUploads } from '@/contexts/upload-context'

export default function ProfilePage() {
  const { user, profile, refreshProfile, supabase } = useAuth()
  const { addUpload } = useUploads()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ display_name: '', bio: '', location: '' })
  const pageRef = useRef(null)

  useEffect(() => {
    if (profile) setForm({ display_name: profile.display_name || '', bio: profile.bio || '', location: profile.location || '' })
  }, [profile])

  useGSAP(() => {
    gsap.set('.profile-section', { y: 20, opacity: 0 }); gsap.to('.profile-section', { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power3.out' })
  }, { scope: pageRef })

  const handleSave = async () => {
    setLoading(true); setMessage('')
    const { error } = await supabase.from('profiles').update({
      display_name: form.display_name, bio: form.bio, location: form.location, updated_at: new Date().toISOString(),
    }).eq('id', user.id)
    setMessage(error ? '保存失败: ' + error.message : '保存成功')
    if (!error) await refreshProfile()
    setLoading(false)
  }

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setLoading(true); setMessage('')
    addUpload(file, '/api/upload/sign', {
      folder: 'avatars',
      onSuccess: async (data) => {
        await supabase.from('profiles').update({ avatar_url: data.url }).eq('id', user.id)
        await refreshProfile()
        setMessage('头像更新成功')
        setLoading(false)
      },
      onError: (msg) => {
        setMessage('上传失败: ' + msg)
        setLoading(false)
      },
    })
  }

  if (!user) return null

  return (
    <div ref={pageRef} className="max-w-xl mx-auto space-y-5">
      <Card className="profile-section surface-card">
        <CardContent className="p-6 text-center">
          <div className="relative inline-block">
            <Avatar className="w-20 h-20 ring-2 ring-border mx-auto">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-accent text-foreground text-xl font-bold">
                {profile?.display_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <label className="absolute bottom-0 right-0 p-1.5 rounded-md bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90 transition-colors">
              <Camera size={12} />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
          </div>
          <h2 className="mt-3 text-lg font-bold text-foreground">{profile?.display_name || '未设置昵称'}</h2>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          {profile?.role === 'admin' && (
            <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">管理员</span>
          )}
        </CardContent>
      </Card>

      <Card className="profile-section surface-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold">编辑资料</CardTitle>
          <CardDescription className="text-xs">完善你的个人信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {message && <div className={`p-2.5 rounded text-xs ${message.includes('失败') ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>{message}</div>}
          <div className="space-y-1.5"><Label className="text-xs"><User size={12} className="inline mr-1" />昵称</Label><Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className="bg-background border-border" /></div>
          <div className="space-y-1.5"><Label className="text-xs"><MapPin size={12} className="inline mr-1" />所在地</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="中国 · 北京" className="bg-background border-border" /></div>
          <div className="space-y-1.5"><Label className="text-xs">简介</Label><Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="写一句关于你自己的话..." className="bg-background border-border resize-none" /></div>
          <Button onClick={handleSave} disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">{loading ? <Loader2 size={14} className="animate-spin mr-2" /> : null}保存修改</Button>
        </CardContent>
      </Card>
    </div>
  )
}
