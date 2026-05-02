'use client'

import { useState, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)
import { useData } from '@/contexts/data-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Trash2, Loader2, Upload, Image, X } from 'lucide-react'
import { getFileUrl, getOssKey } from '@/lib/oss-client'
import exifr from 'exifr'
import { useUploads } from '@/contexts/upload-context'
import { useToast } from '@/components/ui/toast'

export default function AdminPhotosPage() {
  const { photos, isLoaded, addPhoto, deletePhoto } = useData()
  const { addUpload } = useUploads()
  const { toast, confirm } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [previewPhoto, setPreviewPhoto] = useState(null)
  const gridRef = useRef(null)

  useGSAP(() => {
    gsap.set('.photo-card', { scale: 0.96, opacity: 0 }); gsap.to('.photo-card', { scale: 1, opacity: 1, duration: 0.3, stagger: 0.04, ease: 'power3.out' })
  }, { scope: gridRef, dependencies: [isLoaded, photos?.length] })

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return; setUploading(true)

    // Extract EXIF metadata from the file
    let exif = {}
    try {
      const tags = await exifr.parse(file, {
        pick: ['Make', 'Model', 'LensModel', 'FocalLength', 'FNumber', 'ExposureTime', 'ISO', 'DateTimeOriginal', 'ImageWidth', 'ImageHeight'],
      })
      if (tags) {
        exif = {
          width: tags.ImageWidth || null,
          height: tags.ImageHeight || null,
          taken_at: tags.DateTimeOriginal || null,
          camera: [tags.Make, tags.Model].filter(Boolean).join(' ') || '',
          lens: tags.LensModel || '',
          focal_length: tags.FocalLength || '',
          aperture: tags.FNumber ? `f/${tags.FNumber}` : '',
          shutter_speed: tags.ExposureTime ? `${tags.ExposureTime}s` : '',
          iso: tags.ISO || null,
        }
      }
    } catch { /* EXIF parsing failed, upload without metadata */ }

    addUpload(file, '/api/upload/sign', {
      folder: 'photos',
      onSuccess: async (data) => {
        try {
          await addPhoto({ url: data.url, title: title || file.name, ...exif })
          setTitle(''); setDialogOpen(false); setUploading(false)
        } catch (err) {
          setUploading(false)
          toast('添加照片失败: ' + err.message, 'error')
          // Clean up orphaned OSS file
          if (data.key) {
            fetch('/api/oss/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ key: data.key }),
            }).catch(() => {})
          }
        }
      },
      onError: (msg) => { toast('上传失败: ' + msg, 'error'); setUploading(false) },
    })
  }

  const handleDelete = async (id) => {
    if (!await confirm('确认删除这张照片？', '删除照片')) return
    const photo = photos?.find(p => p.id === id)
    if (photo?.url) {
      const key = getOssKey(photo.url)
      if (key) await fetch('/api/oss/delete', { method: 'POST', body: JSON.stringify({ key }), headers: { 'Content-Type': 'application/json' } })
    }
    try { await deletePhoto(id) } catch (e) { toast('删除失败: ' + e.message, 'error') }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-xl font-bold text-foreground tracking-tight mb-1">相册管理</h1><p className="text-xs text-muted-foreground">共 {photos?.length || 0} 张照片</p></div>
        <Button onClick={() => setDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-8 gap-1.5"><Plus size={14} />上传照片</Button>
      </div>

      {!isLoaded ? (
        <div className="text-center py-20"><Loader2 size={20} className="mx-auto text-primary animate-spin" /></div>
      ) : photos?.length === 0 ? (
        <div className="text-center py-20"><Image size={32} className="mx-auto text-muted-foreground/30 mb-3" /><p className="text-xs text-muted-foreground">还没有照片</p></div>
      ) : (
        <div ref={gridRef} className="columns-2 md:columns-3 lg:columns-5 gap-3">
          {photos?.map((p) => (
            <Card key={p.id} className="photo-card surface-card overflow-hidden group cursor-pointer gap-0 py-0 mb-3 break-inside-avoid" onDoubleClick={() => setPreviewPhoto(p)}>
              <div className="relative" style={p.width && p.height ? { aspectRatio: `${p.width}/${p.height}` } : {}}>
                {p.url ? <img src={getFileUrl(p.url)} alt={p.title || ''} className="w-full h-full object-cover" style={p.width && p.height ? {} : { aspectRatio: '1/1' }} /> : <div className="aspect-square w-full bg-accent flex items-center justify-center"><Image size={20} className="text-muted-foreground/30" /></div>}
                <button
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-destructive transition-all"
                  onClick={(e) => { e.stopPropagation(); handleDelete(p.id) }}
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
              {p.title && <CardContent className="p-2.5"><p className="text-[10px] text-muted-foreground truncate">{p.title}</p></CardContent>}
            </Card>
          ))}
        </div>
      )}

      {/* Upload dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="text-base font-semibold">上传照片</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-3">
            <div className="space-y-1.5"><Label className="text-xs">照片标题（可选）</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="给照片起个名字" className="bg-background border-border" /></div>
            <label className="flex items-center justify-center w-full h-28 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/40 transition-colors">
              {uploading ? <div className="text-center"><Loader2 size={20} className="mx-auto text-primary animate-spin mb-1.5" /><span className="text-xs text-muted-foreground">上传中...</span></div> : <div className="text-center"><Upload size={20} className="mx-auto text-muted-foreground mb-1.5" /><span className="text-xs text-muted-foreground">点击选择图片</span></div>}
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog open={!!previewPhoto} onOpenChange={() => setPreviewPhoto(null)}>
        <DialogContent className="max-w-3xl bg-card border-border p-1" showCloseButton={true}>
          {previewPhoto && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-3 pt-0">
                <DialogTitle className="text-sm font-medium truncate">{previewPhoto.title || '照片预览'}</DialogTitle>
              </div>
              <img src={getFileUrl(previewPhoto.url)} alt={previewPhoto.title || ''} className="w-full max-h-[75vh] object-contain rounded-b-lg" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
