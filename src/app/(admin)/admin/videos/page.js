'use client'

import { useState, useRef, useCallback } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)
import { useData } from '@/contexts/data-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Edit, Plus, Trash2, Loader2, Upload, Video, X, Play, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { getOssKey } from '@/lib/oss-client'
import { useUploads } from '@/contexts/upload-context'
import { MediaController, MediaControlBar, MediaPlayButton, MediaSeekBackwardButton, MediaSeekForwardButton, MediaTimeRange, MediaTimeDisplay, MediaDurationDisplay, MediaMuteButton, MediaVolumeRange, MediaCaptionsButton, MediaPlaybackRateButton, MediaPipButton, MediaFullscreenButton } from 'media-chrome/react'

export default function AdminVideosPage() {
  const { videos, isLoaded, addVideo, updateVideo, deleteVideo } = useData()
  const { addUpload } = useUploads()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editVideo, setEditVideo] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', url: '', ossKey: '' })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewVideo, setPreviewVideo] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const sectionRef = useRef(null)

  useGSAP(() => {
    gsap.set('.video-row', { y: 12, opacity: 0 }); gsap.to('.video-row', { y: 0, opacity: 1, duration: 0.3, stagger: 0.04, ease: 'power3.out' })
  }, { scope: sectionRef, dependencies: [isLoaded, videos?.length] })

  const openCreate = () => { setEditVideo(null); setForm({ title: '', description: '', url: '', ossKey: '' }); setDialogOpen(true) }
  const openEdit = (v) => { setEditVideo(v); setForm({ title: v.title || '', description: v.description || '', url: v.url || '', ossKey: v.oss_key || '' }); setDialogOpen(true) }

  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    addUpload(file, '/api/upload/sign', {
      folder: 'videos',
      onSuccess: (data) => {
        setForm((prev) => ({ ...prev, url: data.url, ossKey: data.key }))
        setPreviewUrl(data.signedUrl || data.url)
        setUploading(false)
      },
      onError: (msg) => {
        alert('上传失败: ' + msg)
        setUploading(false)
      },
    })
  }

  const removeUrl = () => setForm((prev) => ({ ...prev, url: '' }))

  const handleSave = async () => {
    if (!form.title.trim()) return; setSaving(true)
    const payload = { title: form.title, description: form.description, url: form.url, oss_key: form.ossKey }
    try {
      if (editVideo) {
        await updateVideo(editVideo.id, payload)
      } else {
        await addVideo(payload)
      }
      setSaving(false); setDialogOpen(false)
    } catch (e) {
      setSaving(false)
      alert('保存失败: ' + e.message)
    }
  }

  const openPreview = useCallback((v) => {
    setPreviewVideo(v)
    setPreviewUrl(v.url || '')
    setPreviewOpen(true)
  }, [])

  const handleDelete = async (id) => {
    if (!confirm('确认删除？')) return
    const video = videos?.find(v => v.id === id)
    if (video) {
      const key = video.oss_key || getOssKey(video.url)
      if (key) await fetch('/api/oss/delete', { method: 'POST', body: JSON.stringify({ key }), headers: { 'Content-Type': 'application/json' } })
    }
    try { await deleteVideo(id) } catch (e) { alert('删除失败: ' + e.message) }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-xl font-bold text-foreground tracking-tight mb-1">视频管理</h1><p className="text-xs text-muted-foreground">共 {videos?.length || 0} 个视频</p></div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-8 gap-1.5"><Plus size={14} />添加视频</Button>
      </div>

      <Card ref={sectionRef} className="surface-card">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {videos?.map((v) => (
              <div key={v.id} className="video-row flex items-center gap-3 p-3 hover:bg-accent/30 transition-colors">
                <div
                  className="w-24 h-14 rounded bg-accent flex items-center justify-center shrink-0 cursor-pointer relative group overflow-hidden"
                  onClick={() => openPreview(v)}
                >
                  {v.url ? (
                    <>
                      <div className="w-full h-full bg-black/40 absolute inset-0 flex items-center justify-center">
                        <Play size={16} className="text-white/80 group-hover:scale-110 transition-transform" />
                      </div>
                      <video src={v.url} className="w-full h-full object-cover" preload="metadata" />
                    </>
                  ) : (
                    <Play size={16} className="text-muted-foreground/30" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-foreground truncate">{v.title}</p>
                    {v.url && <ExternalLink size={10} className="text-muted-foreground/50 shrink-0" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">{v.description || '暂无描述'}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">{v.created_at ? format(new Date(v.created_at), 'yyyy-MM-dd HH:mm') : ''}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/50 hover:text-primary" onClick={() => openEdit(v)}><Edit size={13} /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/50 hover:text-destructive" onClick={() => handleDelete(v.id)}><Trash2 size={13} /></Button>
                </div>
              </div>
            ))}
            {videos?.length === 0 && <div className="text-center py-12 text-xs text-muted-foreground">还没有视频</div>}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-base font-semibold">{editVideo ? '编辑视频' : '添加视频'}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-3">
            <div className="space-y-1.5"><Label className="text-xs">标题</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="视频标题" className="bg-background border-border" /></div>
            <div className="space-y-1.5"><Label className="text-xs">描述</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="简短描述" className="bg-background border-border resize-none" /></div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">视频</Label>
              </div>

              {form.url ? (
                <div className="space-y-2">
                  <div className="relative rounded-lg overflow-hidden border border-border bg-black">
                    <MediaController className="w-full max-h-64">
                      <video slot="media" src={previewUrl || form.url} playsInline className="w-full" />
                      <MediaControlBar>
                        <MediaPlayButton />
                        <MediaSeekBackwardButton />
                        <MediaSeekForwardButton />
                        <MediaTimeRange />
                        <MediaTimeDisplay />
                        <MediaDurationDisplay />
                        <MediaMuteButton />
                        <MediaVolumeRange />
                        <MediaCaptionsButton />
                        <MediaPlaybackRateButton />
                      </MediaControlBar>
                    </MediaController>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." className="bg-background border-border text-xs flex-1" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={removeUrl}><X size={14} /></Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/40 transition-colors">
                    {uploading ? (
                      <div className="text-center"><Loader2 size={22} className="mx-auto text-primary animate-spin mb-1.5" /><span className="text-xs text-muted-foreground">上传中...</span></div>
                    ) : (
                      <div className="text-center"><Upload size={20} className="mx-auto text-muted-foreground mb-1.5" /><span className="text-xs text-muted-foreground">上传视频文件</span></div>
                    )}
                    <input type="file" accept="video/mp4,video/webm" className="hidden" onChange={handleVideoUpload} disabled={uploading} />
                  </label>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                    <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">或粘贴链接</span></div>
                  </div>
                  <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." className="bg-background border-border" />
                </div>
              )}
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">{saving ? <Loader2 size={14} className="animate-spin mr-2" /> : null}{editVideo ? '保存修改' : '添加视频'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl sm:max-w-3xl bg-card border-border p-1" showCloseButton={true}>
          {previewVideo && (
            <div className="flex flex-col">
              <div className="px-4 py-3">
                <DialogTitle className="text-sm font-medium">{previewVideo.title}</DialogTitle>
                {previewVideo.description && <p className="text-xs text-muted-foreground mt-0.5">{previewVideo.description}</p>}
              </div>
              <div className="bg-black rounded-b-lg overflow-hidden">
                {previewUrl ? (
                  <MediaController className="w-full max-h-[70vh]">
                    <video slot="media" src={previewUrl} autoPlay playsInline className="w-full" />
                    <MediaControlBar>
                      <MediaPlayButton />
                      <MediaSeekBackwardButton />
                      <MediaSeekForwardButton />
                      <MediaTimeRange />
                      <MediaTimeDisplay />
                      <MediaDurationDisplay />
                      <MediaMuteButton />
                      <MediaVolumeRange />
                      <MediaCaptionsButton />
                      <MediaPlaybackRateButton />
                      <MediaPipButton />
                      <MediaFullscreenButton />
                    </MediaControlBar>
                  </MediaController>
                ) : (
                  <div className="flex items-center justify-center h-48 text-muted-foreground text-xs">暂无视频</div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
