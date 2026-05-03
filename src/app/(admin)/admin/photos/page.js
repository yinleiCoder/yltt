'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)
import { useAuth } from '@/contexts/auth-context'
import { useData } from '@/contexts/data-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from '@/components/ui/pagination'
import { Plus, Trash2, Loader2, Upload, Image, X, Check, AlertCircle, Play } from 'lucide-react'
import { getFileUrl, getOssKey } from '@/lib/oss-client'
import { formatSize } from '@/lib/utils'
import exifr from 'exifr'
import { useUploads } from '@/contexts/upload-context'
import { useToast } from '@/components/ui/toast'

const PAGE_SIZE = 20

function generatePageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = [1]
  if (current > 3) pages.push('...')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i)
  }
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
}

let queueId = 0

export default function AdminPhotosPage() {
  const { supabase } = useAuth()
  const { addPhoto, deletePhoto } = useData()
  const { addUpload } = useUploads()
  const { toast, confirm } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [queue, setQueue] = useState([])
  const [running, setRunning] = useState(false)
  const [previewPhoto, setPreviewPhoto] = useState(null)
  const fileInputRef = useRef(null)
  const gridRef = useRef(null)

  // Pagination state
  const [photos, setPhotos] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageLoading, setPageLoading] = useState(false)
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const loadPhotos = useCallback(async (pageNum) => {
    setPageLoading(true)
    try {
      const from = (pageNum - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const { data } = await supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to)
      setPhotos(data || [])
    } catch {
      setPhotos([])
    } finally {
      setLoaded(true)
      setPageLoading(false)
    }
  }, [supabase])

  // Get total count on mount
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { count } = await supabase
          .from('photos')
          .select('*', { count: 'exact', head: true })
        if (!cancelled) setTotalCount(count || 0)
      } catch { /* fail silently */ }
    })()
    return () => { cancelled = true }
  }, [supabase])

  // Load page data
  useEffect(() => {
    loadPhotos(page)
  }, [page, loadPhotos])

  const handlePageChange = (newPage) => {
    if (newPage === page || newPage < 1 || newPage > totalPages || pageLoading) return
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const refreshCurrentPage = async (pageNum) => {
    const { count } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
    setTotalCount(count || 0)
    await loadPhotos(pageNum)
  }

  useGSAP(() => {
    gsap.set('.photo-card', { scale: 0.96, opacity: 0 }); gsap.to('.photo-card', { scale: 1, opacity: 1, duration: 0.3, stagger: 0.04, ease: 'power3.out' })
  }, { scope: gridRef, dependencies: [loaded, photos?.length] })

  const handleSelectFiles = (e) => {
    const selected = Array.from(e.target.files || [])
    if (!selected.length) return
    const newItems = selected.map((f) => ({
      id: ++queueId,
      file: f,
      title: f.name.replace(/\.[^.]+$/, ''),
      status: 'pending',
    }))
    setQueue((prev) => [...prev, ...newItems])
    // Reset file input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const updateQueueItem = (id, patch) => {
    setQueue((prev) => prev.map((q) => q.id === id ? { ...q, ...patch } : q))
  }

  const removeFromQueue = (id) => {
    setQueue((prev) => prev.filter((q) => q.id !== id))
  }

  const setQueueTitle = (id, title) => {
    updateQueueItem(id, { title })
  }

  const processQueue = async () => {
    const pending = queue.filter((q) => q.status === 'pending')
    if (!pending.length) return
    setRunning(true)

    let completed = 0
    const total = pending.length

    for (const item of pending) {
      updateQueueItem(item.id, { status: 'extracting' })

      // Extract EXIF metadata
      let exif = {}
      try {
        const tags = await exifr.parse(item.file, {
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
      } catch { /* continue without EXIF */ }

      updateQueueItem(item.id, { status: 'uploading' })

      await new Promise((resolve) => {
        addUpload(item.file, '/api/upload/sign', {
          folder: 'photos',
          onSuccess: async (data) => {
            try {
              await addPhoto({ url: data.url, title: item.title || item.file.name, ...exif })
              updateQueueItem(item.id, { status: 'done' })
            } catch (err) {
              updateQueueItem(item.id, { status: 'error', error: '添加失败: ' + err.message })
              // Clean up orphaned OSS file
              if (data.key) {
                fetch('/api/oss/delete', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ key: data.key }),
                }).catch(() => {})
              }
            }
            completed++
            if (completed >= total) {
              setRunning(false)
              // Refresh the current page to show newly uploaded photos
              refreshCurrentPage(1)
            }
            resolve()
          },
          onError: (msg) => {
            updateQueueItem(item.id, { status: 'error', error: msg })
            completed++
            if (completed >= total) {
              setRunning(false)
              refreshCurrentPage(1)
            }
            resolve()
          },
        })
      })
    }
  }

  const closeUpload = () => {
    setDialogOpen(false)
    setQueue([])
    setRunning(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const doneCount = queue.filter((q) => q.status === 'done').length
  const errorCount = queue.filter((q) => q.status === 'error').length
  const totalCountQ = queue.length
  const allDone = totalCountQ > 0 && doneCount + errorCount === totalCountQ

  const handleDelete = async (id) => {
    if (!await confirm('确认删除这张照片？', '删除照片')) return
    const photo = photos?.find(p => p.id === id)
    if (photo?.url) {
      const key = getOssKey(photo.url)
      if (key) await fetch('/api/oss/delete', { method: 'POST', body: JSON.stringify({ key }), headers: { 'Content-Type': 'application/json' } })
    }
    try {
      await deletePhoto(id)
      // Refresh current page + total count
      const { count } = await supabase
        .from('photos')
        .select('*', { count: 'exact', head: true })
      setTotalCount(count || 0)
      const newTotalPages = Math.max(1, Math.ceil((count || 1) / PAGE_SIZE))
      const effectivePage = page > newTotalPages ? newTotalPages : page
      if (effectivePage !== page) setPage(effectivePage)
      else loadPhotos(effectivePage)
    } catch (e) { toast('删除失败: ' + e.message, 'error') }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-xl font-bold text-foreground tracking-tight mb-1">相册管理</h1><p className="text-xs text-muted-foreground">共 {totalCount} 张照片</p></div>
        <Button onClick={() => setDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-8 gap-1.5"><Plus size={14} />上传照片</Button>
      </div>

      {!loaded ? (
        <div className="text-center py-20"><Loader2 size={20} className="mx-auto text-primary animate-spin" /></div>
      ) : photos?.length === 0 ? (
        <div className="text-center py-20"><Image size={32} className="mx-auto text-muted-foreground/30 mb-3" /><p className="text-xs text-muted-foreground">还没有照片</p></div>
      ) : (
        <>
          <div ref={gridRef} className={`columns-2 md:columns-3 lg:columns-5 gap-3 transition-opacity duration-200 ${pageLoading ? 'opacity-50 pointer-events-none' : ''}`}>
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

          {totalCount > 0 && (
            <div className="flex justify-center mt-8 mb-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => { e.preventDefault(); handlePageChange(page - 1); }}
                      disabled={page <= 1 || pageLoading}
                    />
                  </PaginationItem>
                  {generatePageNumbers(page, totalPages).map((p, i) => (
                    <PaginationItem key={`${p}-${i}`}>
                      {p === '...' ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          href="#"
                          isActive={p === page}
                          onClick={(e) => { e.preventDefault(); handlePageChange(p); }}
                          disabled={pageLoading}
                        >
                          {p}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => { e.preventDefault(); handlePageChange(page + 1); }}
                      disabled={page >= totalPages || pageLoading}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}

      {/* Upload dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeUpload() }}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">上传照片</DialogTitle>
          </DialogHeader>

          <div className="mt-3 space-y-3">
            {/* File selector */}
            {!running && !allDone && (
              <label className="flex items-center justify-center w-full h-28 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/40 transition-colors">
                <div className="text-center">
                  <Upload size={22} className="mx-auto text-muted-foreground mb-1.5" />
                  <span className="text-xs text-muted-foreground">点击选择图片（可多选）</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleSelectFiles}
                />
              </label>
            )}

            {/* Queue list */}
            {totalCountQ > 0 && (
              <div className="space-y-2">
                {/* Summary bar */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    共 {totalCountQ} 张照片
                    {doneCount > 0 && <span className="text-emerald-500 ml-1">· 完成 {doneCount}</span>}
                    {errorCount > 0 && <span className="text-red-500 ml-1">· 失败 {errorCount}</span>}
                  </span>
                  {allDone && totalCountQ > 0 && doneCount === totalCountQ && (
                    <span className="text-emerald-500 font-medium">全部上传成功</span>
                  )}
                  {allDone && errorCount > 0 && (
                    <span className="text-red-500 font-medium">{doneCount}/{totalCountQ} 成功</span>
                  )}
                </div>

                {/* Progress bar */}
                {totalCountQ > 0 && !allDone && (
                  <Progress value={((doneCount + errorCount) / totalCountQ) * 100} className="h-1" />
                )}

                {/* Queue items */}
                <div className="max-h-64 overflow-y-auto space-y-1.5" style={{ scrollbarWidth: 'thin' }}>
                  {queue.map((q) => (
                    <div
                      key={q.id}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs transition-colors ${
                        q.status === 'error' ? 'bg-red-500/5 border border-red-500/20' :
                        q.status === 'done' ? 'bg-emerald-500/5 border border-emerald-500/20' :
                        q.status === 'uploading' || q.status === 'extracting' ? 'bg-primary/5 border border-primary/20' :
                        'bg-accent/40 border border-transparent'
                      }`}
                    >
                      {/* Status icon */}
                      {q.status === 'pending' && <div className="w-3 h-3 rounded-full border-2 border-muted-foreground/30 shrink-0" />}
                      {(q.status === 'uploading' || q.status === 'extracting') && <Loader2 size={12} className="text-primary animate-spin shrink-0" />}
                      {q.status === 'done' && <Check size={12} className="text-emerald-500 shrink-0" />}
                      {q.status === 'error' && <AlertCircle size={12} className="text-red-500 shrink-0" />}

                      {/* File info */}
                      <div className="flex-1 min-w-0">
                        <Input
                          value={q.title}
                          onChange={(e) => setQueueTitle(q.id, e.target.value)}
                          placeholder="照片标题"
                          className="h-6 text-xs px-1.5 py-0 bg-transparent border-0 border-b border-transparent hover:border-border focus:border-border focus:bg-background rounded-none"
                          disabled={q.status !== 'pending'}
                        />
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
                          <span className="truncate">{q.file.name}</span>
                          <span className="shrink-0">{formatSize(q.file.size)}</span>
                        </div>
                      </div>

                      {/* Status text */}
                      {q.status === 'extracting' && <span className="text-[10px] text-muted-foreground shrink-0">读取EXIF...</span>}
                      {q.status === 'uploading' && <span className="text-[10px] text-muted-foreground shrink-0">上传中...</span>}

                      {/* Error message */}
                      {q.status === 'error' && q.error && (
                        <span className="text-[10px] text-red-500/70 shrink-0 max-w-[140px] truncate" title={q.error}>{q.error}</span>
                      )}

                      {/* Remove button (only for pending) */}
                      {q.status === 'pending' && (
                        <button onClick={() => removeFromQueue(q.id)} className="text-muted-foreground/30 hover:text-red-500 transition-colors">
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 justify-end pt-1">
              {allDone ? (
                <Button size="sm" className="h-8 text-xs" onClick={closeUpload}>
                  完成
                </Button>
              ) : (
                <>
                  {totalCountQ > 0 && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs text-muted-foreground"
                        onClick={() => { setQueue([]); if (fileInputRef.current) fileInputRef.current.value = '' }}
                      >
                        清空队列
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={processQueue}
                        disabled={running || queue.filter((q) => q.status === 'pending').length === 0}
                      >
                        <Play size={12} />
                        {running ? '上传中...' : `开始上传 (${queue.filter((q) => q.status === 'pending').length})`}
                      </Button>
                    </>
                  )}
                  {totalCountQ === 0 && (
                    <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={closeUpload}>
                      取消
                    </Button>
                  )}
                </>
              )}
            </div>
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
