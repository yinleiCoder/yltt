'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from '@/components/ui/pagination'
import { Play, Video as VideoIcon, Film } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { generatePageNumbers } from '@/lib/utils'
import { format } from 'date-fns'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { MediaController, MediaControlBar, MediaPlayButton, MediaSeekBackwardButton, MediaSeekForwardButton, MediaTimeRange, MediaTimeDisplay, MediaDurationDisplay, MediaMuteButton, MediaVolumeRange, MediaPlaybackRateButton, MediaPipButton, MediaFullscreenButton } from 'media-chrome/react'

const PAGE_SIZE = 8

export default function VideosPage() {
  const { supabase } = useAuth()
  const [previewVideo, setPreviewVideo] = useState(null)
  const [videos, setVideos] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageLoading, setPageLoading] = useState(false)
  const headerRef = useRef(null)
  const gridRef = useRef(null)
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  useGSAP(() => { if (loaded) gsap.fromTo('.video-header', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }) }, { scope: headerRef, dependencies: [loaded] })

  useGSAP(() => {
    if (!loaded || videos.length === 0) return
    gsap.utils.toArray('.video-card').forEach((card, i) => { gsap.fromTo(card, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, delay: i * 0.05, ease: 'back.out(1.3)' }) })
  }, { scope: gridRef, dependencies: [loaded, page] })

  useEffect(() => { let c = false; (async () => { try { const { count } = await supabase.from('videos').select('*', { count: 'exact', head: true }); if (!c) setTotalCount(count || 0) } catch {} })(); return () => { c = true } }, [supabase])

  useEffect(() => { let c = false; (async () => { setPageLoading(true); try { const from = (page - 1) * PAGE_SIZE; const { data } = await supabase.from('videos').select('*').order('created_at', { ascending: false }).range(from, from + PAGE_SIZE - 1); if (c) return; setVideos(data || []) } catch { if (!c) setVideos([]) } finally { if (!c) { setLoaded(true); setPageLoading(false) } } })(); return () => { c = true } }, [page, supabase])

  const handlePageChange = (np) => { if (np === page || np < 1 || np > totalPages || pageLoading) return; setPage(np); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8">
      <div ref={headerRef} className="video-header pb-10 text-center">
        <span className="memphis-badge mb-4"><Film size={13} className="inline mr-1" aria-hidden="true" />视频记忆</span>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mt-4 mb-3">我们的视频</h1>
        <p className="text-sm text-muted-foreground font-medium">每一个画面，都是最珍贵的回忆</p>
      </div>

      {!loaded ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-white border-[2.5px] border-black/20 rounded-2xl overflow-hidden"><Skeleton className="w-full aspect-video" /><div className="p-4 space-y-2"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-3 w-1/3" /></div></div>)}</div>
      ) : videos.length === 0 ? (
        <div className="text-center py-20"><div className="size-16 rounded-full bg-accent border-[2.5px] border-black chunky-shadow-sm flex items-center justify-center mx-auto mb-4"><VideoIcon size={28} className="text-muted-foreground" /></div><h3 className="font-black text-lg mb-2">暂无视频</h3><p className="text-sm text-muted-foreground font-medium">还没有视频内容</p></div>
      ) : (
        <>
          <div ref={gridRef} className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${pageLoading ? 'opacity-50 pointer-events-none' : ''}`}>
            {videos.map((v) => (
              <Card key={v.id} className="video-card bg-white border-[2.5px] border-black rounded-2xl chunky-shadow-sm overflow-hidden cursor-pointer transition-[box-shadow,transform] duration-150 hover:translate-y-[-3px] hover:shadow-[5px_5px_0_0_#1a1a1a] group py-0" onClick={() => v.url && setPreviewVideo(v)}>
                <div className="relative bg-stone-100">
                  {v.url ? (<><video src={v.url} className="w-full aspect-video object-cover" preload="metadata" /><div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center"><div className="size-12 rounded-full bg-primary/90 border-2 border-black flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-[opacity,transform] duration-200"><Play size={18} className="text-white ml-0.5" aria-hidden="true" /></div></div></>) : <div className="aspect-video flex items-center justify-center"><VideoIcon size={32} className="text-muted-foreground/30" /></div>}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2"><div className="flex-1 min-w-0"><h3 className="font-black text-sm">{v.title}</h3>{v.description && <p className="text-xs text-muted-foreground font-medium mt-1 line-clamp-2">{v.description}</p>}{v.created_at && <p className="text-[10px] text-muted-foreground/50 font-bold mt-2">{format(new Date(v.created_at), 'yyyy年MM月dd日')}</p>}</div></div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalCount > 0 && (<div className="flex justify-center mt-10 mb-6"><Pagination><PaginationContent><PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(page - 1) }} disabled={page <= 1 || pageLoading} /></PaginationItem>{generatePageNumbers(page, totalPages).map((p, i) => (<PaginationItem key={`${p}-${i}`}>{p === '...' ? <PaginationEllipsis /> : <PaginationLink href="#" isActive={p === page} onClick={(e) => { e.preventDefault(); handlePageChange(p) }} disabled={pageLoading}>{p}</PaginationLink>}</PaginationItem>))}<PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(page + 1) }} disabled={page >= totalPages || pageLoading} /></PaginationItem></PaginationContent></Pagination></div>)}
        </>
      )}

      <Dialog open={!!previewVideo} onOpenChange={() => setPreviewVideo(null)}>
        <DialogContent className="max-w-[min(95vw,calc(85vh*16/9))] bg-white border-[2.5px] border-black rounded-2xl chunky-shadow p-0" showCloseButton={true}>
          {previewVideo && (<div className="flex flex-col"><div className="px-4 py-3"><DialogTitle className="text-sm font-black">{previewVideo.title}</DialogTitle>{previewVideo.description && <p className="text-xs text-muted-foreground font-medium mt-0.5">{previewVideo.description}</p>}</div><div className="bg-black rounded-b-xl overflow-hidden flex justify-center"><MediaController className="max-w-full max-h-[80vh]"><video slot="media" src={previewVideo.url} autoPlay playsInline className="max-w-full max-h-[80vh]" /><MediaControlBar><MediaPlayButton /><MediaSeekBackwardButton /><MediaSeekForwardButton /><MediaTimeRange /><MediaDurationDisplay /><MediaMuteButton /><MediaVolumeRange /><MediaPlaybackRateButton /><MediaPipButton /><MediaFullscreenButton /></MediaControlBar></MediaController></div></div>)}
        </DialogContent>
      </Dialog>
    </div>
  )
}
