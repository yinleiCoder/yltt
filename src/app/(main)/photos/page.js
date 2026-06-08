'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useData } from '@/contexts/data-context'
import { getFileUrl } from '@/lib/oss-client'
import { format } from 'date-fns'
import { Camera, Calendar, Download, ChevronLeft, ChevronRight, Image } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useDownloads } from '@/contexts/download-context'

export default function PhotosPage() {
  const { photos, isLoaded } = useData()
  const { addDownload } = useDownloads()
  const [selectedId, setSelectedId] = useState(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const headerRef = useRef(null)
  const gridRef = useRef(null)

  const currentPhoto = photos?.find(p => p.id === selectedId) || null
  const currentIdx = currentPhoto && photos ? photos.findIndex(p => p.id === currentPhoto.id) : -1

  useEffect(() => { if (photos?.length && !selectedId) setSelectedId(photos[0].id) }, [photos, selectedId])

  useGSAP(() => { if (isLoaded) gsap.fromTo('.photo-header', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }) }, { scope: headerRef, dependencies: [isLoaded] })

  useGSAP(() => {
    if (!isLoaded || !photos?.length) return
    gsap.utils.toArray('.photo-grid-card').forEach((card, i) => { gsap.fromTo(card, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, delay: Math.min(i * 0.03, 0.6), ease: 'power3.out' }) })
  }, { scope: gridRef, dependencies: [isLoaded, photos?.length] })

  const goNext = useCallback(() => { if (photos?.length && currentIdx < photos.length - 1) setSelectedId(photos[currentIdx + 1].id) }, [photos, currentIdx])
  const goPrev = useCallback(() => { if (photos?.length && currentIdx > 0) setSelectedId(photos[currentIdx - 1].id) }, [photos, currentIdx])

  useEffect(() => {
    if (!viewerOpen) return
    const h = (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); goNext() } else if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev() } else if (e.key === 'Escape') setViewerOpen(false) }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [viewerOpen, goNext, goPrev])

  const exifParts = (p) => { const parts = []; if (p.focal_length) parts.push(p.focal_length); if (p.aperture) parts.push(p.aperture); if (p.shutter_speed) parts.push(p.shutter_speed); if (p.iso) parts.push(`ISO${p.iso}`); return parts }

  if (!isLoaded) return <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8"><Skeleton className="h-8 w-32 mb-8 mx-auto" /><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">{Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="aspect-4/3 rounded-2xl" />)}</div></div>

  if (!photos?.length) return <div className="max-w-6xl mx-auto px-4 sm:px-8 py-20 text-center"><div className="size-16 rounded-full bg-accent border-[2.5px] border-black chunky-shadow-sm flex items-center justify-center mx-auto mb-4"><Image size={28} className="text-muted-foreground" /></div><h2 className="font-black text-lg mb-2">暂无照片</h2><p className="text-sm text-muted-foreground font-medium">还没有照片内容</p></div>

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
      <div ref={headerRef} className="photo-header pb-10 text-center">
        <span className="memphis-badge mb-4"><Camera size={13} className="inline mr-1" aria-hidden="true" />美好相册</span>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mt-4 mb-3">我们的相册</h1>
        <p className="text-sm text-muted-foreground font-medium">{photos.length} 张照片 · 用镜头定格每一个甜蜜瞬间</p>
      </div>

      <div ref={gridRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((p) => (
          <button key={p.id} className={`photo-grid-card relative aspect-4/3 rounded-2xl overflow-hidden border-[2.5px] transition-[box-shadow,transform,border-color] duration-150 cursor-pointer group ${p.id === selectedId ? 'border-primary shadow-[4px_4px_0_0_#ff6b4a]' : 'border-black hover:border-primary/50 hover:translate-y-[-2px] hover:shadow-[4px_4px_0_0_#1a1a1a]'}`} onClick={() => { setSelectedId(p.id); setViewerOpen(true) }}>
            {p.url ? <img src={getFileUrl(p.url)} alt={p.title || ''} className="w-full h-full object-cover" loading="lazy" decoding="async" /> : <div className="w-full h-full bg-stone-100 flex items-center justify-center"><Camera size={24} className="text-muted-foreground/30" /></div>}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end p-3">{p.title && <p className="text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity truncate">{p.title}</p>}</div>
          </button>
        ))}
      </div>

      {viewerOpen && currentPhoto && (
        <div className="fixed inset-0 z-[--z-modal] bg-background/95 backdrop-blur-sm flex" onClick={() => setViewerOpen(false)}>
          <div className="flex-1 flex flex-col lg:flex-row" onClick={(e) => e.stopPropagation()}>
            <div className="flex-1 flex items-center justify-center relative min-h-0 p-4">
              {photos.length > 1 && (<>
                <button className="absolute left-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white border-2 border-black chunky-shadow-sm flex items-center justify-center hover:bg-stone-50 transition-colors z-10" onClick={goPrev} aria-label="上一张"><ChevronLeft size={20} className="text-black" /></button>
                <button className="absolute right-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white border-2 border-black chunky-shadow-sm flex items-center justify-center hover:bg-stone-50 transition-colors z-10" onClick={goNext} aria-label="下一张"><ChevronRight size={20} className="text-black" /></button>
              </>)}
              <img src={getFileUrl(currentPhoto.url)} alt={currentPhoto.title || ''} className="max-h-full max-w-full object-contain select-none rounded-xl" draggable={false} />
            </div>
            <div className="lg:w-72 shrink-0 bg-white border-l-[2.5px] border-black p-6 overflow-y-auto">
              <button className="ml-auto block text-xs font-bold text-muted-foreground hover:text-foreground mb-4" onClick={() => setViewerOpen(false)}>关闭 ✕</button>
              {currentPhoto.title && <h2 className="font-black text-lg mb-4">{currentPhoto.title}</h2>}
              <div className="space-y-3 text-sm">
                {currentPhoto.taken_at && <p className="flex items-center gap-2 text-muted-foreground font-medium"><Calendar size={14} className="shrink-0 text-muted-foreground/40" aria-hidden="true" /><span>{format(new Date(currentPhoto.taken_at), 'yyyy-MM-dd HH:mm')}</span></p>}
                {currentPhoto.camera && <p className="flex items-start gap-2 text-muted-foreground font-medium"><Camera size={14} className="shrink-0 text-muted-foreground/40 mt-0.5" aria-hidden="true" /><span>{currentPhoto.camera}{currentPhoto.lens ? ` + ${currentPhoto.lens}` : ''}</span></p>}
                {currentPhoto.width && currentPhoto.height && <p className="text-xs text-muted-foreground/40 font-bold tabular-nums">{currentPhoto.width} × {currentPhoto.height}</p>}
              </div>
              {exifParts(currentPhoto).length > 0 && <div className="flex flex-wrap gap-1.5 mt-4">{exifParts(currentPhoto).map((part, i) => <span key={i} className="px-2 py-0.5 rounded-lg bg-stone-100 border border-black/10 text-[10px] font-bold text-foreground/60">{part}</span>)}</div>}
              <Button variant="outline" className="mt-6 w-full border-2 border-black font-bold text-sm" onClick={() => { const url = getFileUrl(currentPhoto.url); const ext = url.split('.').pop()?.split('?')[0] || 'jpg'; const name = currentPhoto.title || 'photo'; const filename = name.toLowerCase().endsWith('.' + ext.toLowerCase()) ? name : `${name}.${ext}`; addDownload(url, filename) }}><Download size={14} className="mr-2" aria-hidden="true" />下载原图</Button>
              {photos.length > 1 && <p className="text-center text-xs text-muted-foreground/40 font-bold tabular-nums mt-4">{currentIdx + 1} / {photos.length}</p>}
              <div className="mt-6 grid grid-cols-4 gap-2">{photos.map((p) => (<button key={p.id} onClick={() => setSelectedId(p.id)} className={`aspect-4/3 rounded-lg overflow-hidden border-2 transition-all duration-150 ${p.id === selectedId ? 'border-primary scale-105 shadow-[2px_2px_0_0_#ff6b4a]' : 'border-black/20 opacity-60 hover:opacity-100 hover:border-black/50'}`}>{p.url ? <img src={getFileUrl(p.url)} alt="" className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full bg-stone-100 flex items-center justify-center"><Camera size={10} className="text-muted-foreground/30" /></div>}</button>))}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
