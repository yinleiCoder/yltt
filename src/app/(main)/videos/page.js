'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from '@/components/ui/pagination'
import { Play, Video as VideoIcon, Film, X, Calendar } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { generatePageNumbers } from '@/lib/utils'
import { getFileUrl, getOssKey } from '@/lib/oss-client'
import { useMusic } from '@/contexts/music-context'
import { format } from 'date-fns'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import VideoPlayer from '@/components/video-player'

const PAGE_SIZE = 8

/* ── Generate OSS video snapshot thumbnail ─── */
function getThumbUrl(url) {
  if (!url) return ''
  const full = getFileUrl(url)
  const sep = full.includes('?') ? '&' : '?'
  return `${full}${sep}x-oss-process=video/snapshot,t_2000,f_jpg,w_600`
}

/* ── Generate stream URL from OSS key ─── */
function getStreamUrl(url) {
  const key = getOssKey(url)
  if (!key) return getFileUrl(url)
  return `/api/stream?key=${encodeURIComponent(key)}`
}

/* ── Loading skeleton ─── */
function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-black/5">
          <Skeleton className="w-full aspect-video" />
          <div className="p-4 space-y-2"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-3 w-1/3" /></div>
        </div>
      ))}
    </div>
  )
}

export default function VideosPage() {
  const { supabase } = useAuth()
  const [selectedIdx, setSelectedIdx] = useState(-1)
  const [videos, setVideos] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageLoading, setPageLoading] = useState(false)
  const headerRef = useRef(null)
  const gridRef = useRef(null)
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const currentVideo = selectedIdx >= 0 ? videos[selectedIdx] : null
  const { playing, togglePlay } = useMusic()
  const wasPlayingRef = useRef(false)

  /* ── Pause music on enter, resume on leave ─── */
  useEffect(() => {
    if (playing) { wasPlayingRef.current = true; togglePlay() }
    // Cleanup fires on unmount — togglePlay flips state regardless of closure
    return () => { if (wasPlayingRef.current) togglePlay() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Header entrance ─── */
  useGSAP(() => { if (loaded) gsap.fromTo('.video-header', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }) }, { scope: headerRef, dependencies: [loaded] })

  /* ── Card entrance ─── */
  useGSAP(() => {
    if (!loaded || videos.length === 0) return
    gsap.utils.toArray('.video-card').forEach((card, i) => { gsap.fromTo(card, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, delay: i * 0.05, ease: 'power2.out' }) })
  }, { scope: gridRef, dependencies: [loaded, page] })

  /* ── Data loading ─── */
  useEffect(() => { let c = false; (async () => { try { const { count } = await supabase.from('videos').select('*', { count: 'exact', head: true }); if (!c) setTotalCount(count || 0) } catch {} })(); return () => { c = true } }, [supabase])

  useEffect(() => { let c = false; (async () => { setPageLoading(true); try { const from = (page - 1) * PAGE_SIZE; const { data } = await supabase.from('videos').select('*').order('created_at', { ascending: false }).range(from, from + PAGE_SIZE - 1); if (c) return; setVideos(data || []) } catch { if (!c) setVideos([]) } finally { if (!c) { setLoaded(true); setPageLoading(false) } } })(); return () => { c = true } }, [page, supabase])

  const handlePageChange = (np) => { if (np === page || np < 1 || np > totalPages || pageLoading) return; setPage(np); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  /* ── Viewer navigation ─── */
  const goNext = useCallback(() => { if (selectedIdx < videos.length - 1) setSelectedIdx(selectedIdx + 1) }, [selectedIdx, videos.length])
  const goPrev = useCallback(() => { if (selectedIdx > 0) setSelectedIdx(selectedIdx - 1) }, [selectedIdx])
  const closeViewer = useCallback(() => setSelectedIdx(-1), [])

  /* ── Keyboard ─── */
  useEffect(() => {
    if (selectedIdx < 0) return
    const h = (e) => { if (e.key === 'Escape') closeViewer(); else if (e.key === 'ArrowRight') { e.preventDefault(); goNext() } else if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev() } }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [selectedIdx, closeViewer, goNext, goPrev])

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8">
      <div ref={headerRef} className="video-header pb-10 text-center">
        <span className="memphis-badge mb-4"><Film size={13} className="inline mr-1" aria-hidden="true" />视频记忆</span>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mt-4 mb-3">我们的视频</h1>
        <p className="text-sm text-muted-foreground font-medium">每一个画面，都是最珍贵的回忆</p>
      </div>

      {!loaded ? <GridSkeleton /> : videos.length === 0 ? (
        <div className="text-center py-20">
          <div className="size-16 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4"><VideoIcon size={28} className="text-muted-foreground/30" /></div>
          <h3 className="font-bold text-lg mb-2">暂无视频</h3><p className="text-sm text-muted-foreground">还没有视频内容</p>
        </div>
      ) : (
        <>
          <div ref={gridRef} className={`grid grid-cols-1 sm:grid-cols-2 gap-5 ${pageLoading ? 'opacity-50 pointer-events-none' : ''}`}>
            {videos.map((v, i) => {
              const thumbUrl = getThumbUrl(v.url)
              return (
                <Card
                  key={v.id}
                  className="video-card bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md border border-black/5 cursor-pointer transition-[box-shadow,transform] duration-300 hover:-translate-y-1 group py-0"
                  onClick={() => setSelectedIdx(i)}
                >
                  {/* Thumbnail — OSS snapshot, not loading the video */}
                  <div className="relative bg-stone-100 aspect-video overflow-hidden">
                    {thumbUrl ? (
                      <img src={thumbUrl} alt={v.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><VideoIcon size={32} className="text-muted-foreground/30" /></div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                      <div className="size-14 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-[opacity,transform] duration-200 shadow-lg">
                        <Play size={22} className="text-primary ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                    {/* Duration overlay */}
                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">视频</span>
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm">{v.title}</h3>
                        {v.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{v.description}</p>}
                        {v.created_at && <p className="text-[10px] text-muted-foreground/40 font-medium mt-2">{format(new Date(v.created_at), 'yyyy年MM月dd日')}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {totalCount > 0 && (
            <div className="flex justify-center mt-10 mb-6">
              <Pagination><PaginationContent>
                <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(page - 1) }} disabled={page <= 1 || pageLoading} /></PaginationItem>
                {generatePageNumbers(page, totalPages).map((p, i) => (<PaginationItem key={`${p}-${i}`}>{p === '...' ? <PaginationEllipsis /> : <PaginationLink href="#" isActive={p === page} onClick={(e) => { e.preventDefault(); handlePageChange(p) }} disabled={pageLoading}>{p}</PaginationLink>}</PaginationItem>))}
                <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(page + 1) }} disabled={page >= totalPages || pageLoading} /></PaginationItem>
              </PaginationContent></Pagination>
            </div>
          )}
        </>
      )}

      {/* ── Full-screen video viewer ─── */}
      {currentVideo && (
        <div className="fixed inset-0 z-[--z-modal] bg-black flex flex-col" onClick={closeViewer}>
          {/* Top bar */}
          <div className="flex items-center gap-3 px-3 sm:px-5 py-2 sm:py-3 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button className="size-8 sm:size-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0 transition-colors" onClick={closeViewer} aria-label="关闭">
              <X size={18} className="text-white" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-bold text-sm sm:text-base line-clamp-1">{currentVideo.title}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                {currentVideo.created_at && (
                  <span className="text-white/40 text-[10px] sm:text-xs flex items-center gap-1 shrink-0"><Calendar size={10} />{format(new Date(currentVideo.created_at), 'yyyy-MM-dd')}</span>
                )}
                {currentVideo.description && <p className="text-white/40 text-[10px] sm:text-xs line-clamp-1">{currentVideo.description}</p>}
              </div>
            </div>
          </div>

          {/* Video player */}
          <div className="flex-1 flex items-center justify-center px-1 sm:px-4 min-h-0" onClick={(e) => e.stopPropagation()}>
            <div className="w-full max-w-5xl">
              <VideoPlayer
                src={getStreamUrl(currentVideo.url)}
                poster={getThumbUrl(currentVideo.url)}
                onEnded={videos.length > 1 ? goNext : undefined}
                onPrevious={videos.length > 1 ? goPrev : undefined}
                onNext={videos.length > 1 ? goNext : undefined}
                showNav={videos.length > 1}
              />
            </div>
          </div>

          {/* Thumbnail strip */}
          {videos.length > 1 && (
            <div className="shrink-0 px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none" onClick={(e) => e.stopPropagation()}>
              {videos.map((v, i) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedIdx(i)}
                  className={`shrink-0 w-14 sm:w-20 aspect-video rounded-lg overflow-hidden border-2 transition-all duration-150 ${i === selectedIdx ? 'border-primary scale-105' : 'border-white/20 opacity-50 hover:opacity-80 hover:border-white/40'}`}
                >
                  {getThumbUrl(v.url) ? <img src={getThumbUrl(v.url)} alt="" className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full bg-white/10 flex items-center justify-center"><Play size={10} className="text-white/30" /></div>}
                </button>
              ))}
              <span className="text-white/40 text-[10px] sm:text-xs font-medium tabular-nums shrink-0 ml-1">{selectedIdx + 1}/{videos.length}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
