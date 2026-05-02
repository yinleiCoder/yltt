'use client'

import { useState, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)
import { useData } from '@/contexts/data-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Plus, Edit, Trash2, Loader2, Eye, EyeOff, Upload, Image, Video, X, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import EmojiPicker from 'emoji-picker-react'
import { getFileUrl, getOssKey } from '@/lib/oss-client'
import { useUploads } from '@/contexts/upload-context'
import { useToast } from '@/components/ui/toast'
import { STORY_CATEGORY_OPTIONS } from '@/lib/constants'

const mediaTypes = [
  { value: '', label: '纯文字' },
  { value: 'image', label: '图片' },
  { value: 'video', label: '视频' },
]

export default function AdminStoriesPage() {
  const { stories, isLoaded, addStory, updateStory, deleteStory } = useData()
  const { addUpload } = useUploads()
  const { toast, confirm } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editStory, setEditStory] = useState(null)
  const [form, setForm] = useState({ title: '', content: '', story_date: '', category: 'daily', published: true, cover_emoji: '💕', media_url: '', media_type: '' })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)
  const [toggling, setToggling] = useState(null)
  const sectionRef = useRef(null)
  const pendingOssKeyRef = useRef(null)

  useGSAP(() => {
    gsap.set('.story-row', { y: 12, opacity: 0 }); gsap.to('.story-row', { y: 0, opacity: 1, duration: 0.3, stagger: 0.04, ease: 'power3.out' })
  }, { scope: sectionRef, dependencies: [isLoaded, stories?.length] })

  const openCreate = () => { setEditStory(null); setForm({ title: '', content: '', story_date: format(new Date(), 'yyyy-MM-dd'), category: 'daily', published: true, cover_emoji: '💕', media_url: '', media_type: '' }); pendingOssKeyRef.current = null; setDialogOpen(true) }
  const openEdit = (s) => { setEditStory(s); setForm({ title: s.title || '', content: s.content || '', story_date: s.story_date || '', category: s.category || 'daily', published: s.published ?? true, cover_emoji: s.cover_emoji || '💕', media_url: s.media_url || '', media_type: s.media_type || '' }); pendingOssKeyRef.current = null; setDialogOpen(true) }

  const handleMediaUpload = (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    const folder = form.media_type === 'video' ? 'stories/videos' : 'stories/images'
    addUpload(file, '/api/upload/sign', {
      folder,
      onSuccess: (data) => {
        setForm((prev) => ({ ...prev, media_url: data.url }))
        setUploading(false)
        pendingOssKeyRef.current = data.key
      },
      onError: (msg) => {
        toast('上传失败: ' + msg, 'error')
        setUploading(false)
      },
    })
  }

  const removeMedia = async () => {
    const oldUrl = editStory?.media_url || form.media_url
    if (oldUrl) {
      const key = getOssKey(oldUrl)
      if (key) await fetch('/api/oss/delete', { method: 'POST', body: JSON.stringify({ key }), headers: { 'Content-Type': 'application/json' } })
    }
    setForm((prev) => ({ ...prev, media_url: '', media_type: '' }))
  }

  const handleSave = async () => {
    if (!form.title.trim()) return; setSaving(true)
    const payload = { ...form }
    if (!payload.media_type) payload.media_url = ''
    // Delete old OSS file if media was replaced
    if (editStory?.media_url && editStory.media_url !== payload.media_url) {
      const key = getOssKey(editStory.media_url)
      if (key) await fetch('/api/oss/delete', { method: 'POST', body: JSON.stringify({ key }), headers: { 'Content-Type': 'application/json' } })
    }
    try {
      if (editStory) {
        await updateStory(editStory.id, payload)
      } else {
        await addStory(payload)
      }
      pendingOssKeyRef.current = null
      setSaving(false); setDialogOpen(false)
    } catch (e) {
      setSaving(false)
      // Clean up orphaned OSS file from this upload session
      if (pendingOssKeyRef.current) {
        fetch('/api/oss/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: pendingOssKeyRef.current }),
        }).catch(() => {})
        pendingOssKeyRef.current = null
      }
      toast('保存失败: ' + e.message, 'error')
    }
  }

  const togglePublish = async (s) => {
    setToggling(s.id)
    try {
      await updateStory(s.id, { published: !s.published })
    } catch (e) {
      toast('操作失败: ' + e.message, 'error')
    }
    setToggling(null)
  }

  const handleDelete = async (id) => {
    if (!await confirm('确认删除？', '删除故事')) return
    const story = stories?.find(s => s.id === id)
    if (story?.media_url) {
      const key = getOssKey(story.media_url)
      if (key) await fetch('/api/oss/delete', { method: 'POST', body: JSON.stringify({ key }), headers: { 'Content-Type': 'application/json' } })
    }
    try { await deleteStory(id) } catch (e) { toast('删除失败: ' + e.message, 'error') }
  }

  const selectedDate = form.story_date ? new Date(form.story_date) : undefined

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-xl font-bold text-foreground tracking-tight mb-1">故事管理</h1><p className="text-xs text-muted-foreground">共 {stories?.length || 0} 篇故事</p></div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-8 gap-1.5"><Plus size={14} />新建故事</Button>
      </div>

      <Card ref={sectionRef} className="surface-card">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {stories?.map((s) => (
              <div key={s.id} className="story-row flex items-center gap-3 p-3 hover:bg-accent/30 transition-colors">
                <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center shrink-0 text-lg">{s.cover_emoji || '💕'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-foreground truncate">{s.title}</span>
                    {!s.published && <Badge variant="outline" className="text-[10px] border-border"><EyeOff size={9} className="mr-0.5" />草稿</Badge>}
                    {s.category && <Badge variant="secondary" className="text-[10px] bg-accent text-muted-foreground border-0">{STORY_CATEGORY_OPTIONS.find(c => c.value === s.category)?.label || s.category}</Badge>}
                    {s.media_type === 'image' && <Image size={10} className="text-muted-foreground/50" />}
                    {s.media_type === 'video' && <Video size={10} className="text-muted-foreground/50" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.story_date ? format(new Date(s.story_date), 'yyyy-MM-dd') : '—'} · {s.created_at ? format(new Date(s.created_at), 'MM-dd HH:mm') : ''}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/50 hover:text-foreground" onClick={() => togglePublish(s)} disabled={toggling === s.id}>
                    {toggling === s.id ? <Loader2 size={13} className="animate-spin" /> : s.published ? <Eye size={13} /> : <EyeOff size={13} />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/50 hover:text-primary" onClick={() => openEdit(s)}><Edit size={13} /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/50 hover:text-destructive" onClick={() => handleDelete(s.id)}><Trash2 size={13} /></Button>
                </div>
              </div>
            ))}
            {stories?.length === 0 && <div className="text-center py-12 text-xs text-muted-foreground">还没有故事，点击"新建故事"开始</div>}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-base font-semibold">{editStory ? '编辑故事' : '新建故事'}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-3">
            <div className="space-y-1.5"><Label className="text-xs">标题</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="故事标题" className="bg-background border-border" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">日期</Label>
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger render={
                    <Button variant="outline" className="w-full justify-start text-left font-normal bg-background border-border h-9 text-xs">
                      <CalendarIcon size={14} className="mr-1.5 text-muted-foreground shrink-0" />
                      <span className={form.story_date ? 'text-foreground' : 'text-muted-foreground'}>
                        {form.story_date ? format(new Date(form.story_date), 'yyyy-MM-dd') : '选择日期'}
                      </span>
                    </Button>
                  } />
                  <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                    <DayPicker
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => { if (date) { setForm({ ...form, story_date: format(date, 'yyyy-MM-dd') }); setDateOpen(false) } }}
                      locale={zhCN}
                      className="p-3"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5"><Label className="text-xs">分类</Label><Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>{STORY_CATEGORY_OPTIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5">
                <Label className="text-xs">封面Emoji</Label>
                <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                  <PopoverTrigger render={
                    <Button variant="outline" className="w-full justify-center bg-background border-border h-9 text-lg">
                      {form.cover_emoji || '💕'}
                    </Button>
                  } />
                  <PopoverContent className="w-auto p-0 bg-card border-border" align="end">
                    <EmojiPicker
                      onEmojiClick={(emoji) => { setForm({ ...form, cover_emoji: emoji.emoji }); setEmojiOpen(false) }}
                      width={320}
                      height={380}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">内容</Label><Textarea rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="写下故事内容..." className="bg-background border-border resize-none" /></div>

            {/* Media section */}
            <div className="space-y-2">
              <Label className="text-xs">媒体类型</Label>
              <Select value={form.media_type} onValueChange={(v) => setForm({ ...form, media_type: v, media_url: v !== form.media_type ? '' : form.media_url })}>
                <SelectTrigger className="bg-background border-border"><SelectValue placeholder="选择媒体类型" /></SelectTrigger>
                <SelectContent>{mediaTypes.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
              </Select>

              {form.media_type && (
                <div className="space-y-2">
                  {form.media_url ? (
                    <div className="relative rounded-lg overflow-hidden border border-border">
                      {form.media_type === 'image' ? (
                        <img src={getFileUrl(form.media_url)} alt="预览" className="w-full h-32 object-cover" />
                      ) : (
                        <video src={getFileUrl(form.media_url)} className="w-full h-32 object-cover" controls />
                      )}
                      <button onClick={removeMedia} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"><X size={12} className="text-white" /></button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/40 transition-colors">
                      {uploading ? (
                        <div className="text-center"><Loader2 size={20} className="mx-auto text-primary animate-spin mb-1.5" /><span className="text-xs text-muted-foreground">上传中...</span></div>
                      ) : (
                        <div className="text-center">
                          {form.media_type === 'video' ? <Video size={20} className="mx-auto text-muted-foreground mb-1.5" /> : <Image size={20} className="mx-auto text-muted-foreground mb-1.5" />}
                          <span className="text-xs text-muted-foreground">点击上传{form.media_type === 'video' ? '视频' : '图片'}</span>
                        </div>
                      )}
                      <input type="file" accept={form.media_type === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/*'} className="hidden" onChange={handleMediaUpload} disabled={uploading} />
                    </label>
                  )}
                </div>
              )}
            </div>

            <Button onClick={handleSave} disabled={saving || uploading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">{saving ? <Loader2 size={14} className="animate-spin mr-2" /> : null}{editStory ? '保存修改' : '发布故事'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
