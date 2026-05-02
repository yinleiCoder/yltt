'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from '@/components/ui/pagination'
import { Play, Video as VideoIcon, Download, Loader2 } from 'lucide-react'
import { useDownloads } from '@/contexts/download-context'
import { format } from 'date-fns'
import { MediaController, MediaControlBar, MediaPlayButton, MediaSeekBackwardButton, MediaSeekForwardButton, MediaTimeRange, MediaTimeDisplay, MediaDurationDisplay, MediaMuteButton, MediaVolumeRange, MediaCaptionsButton, MediaPlaybackRateButton, MediaPipButton, MediaFullscreenButton } from 'media-chrome/react'

const PAGE_SIZE = 8

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

export default function VideosPage() {
  const { supabase } = useAuth()
  const { addDownload } = useDownloads()
  const [previewVideo, setPreviewVideo] = useState(null)
  const [videos, setVideos] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageLoading, setPageLoading] = useState(false)
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // Get total count on mount
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { count } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true })
      if (!cancelled) setTotalCount(count || 0)
    })()
    return () => { cancelled = true }
  }, [supabase])

  // Load page data whenever page changes
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setPageLoading(true)
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const { data } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to)
      if (cancelled) return
      setVideos(data || [])
      setLoaded(true)
      setPageLoading(false)
    })()
    return () => { cancelled = true }
  }, [page, supabase])

  const handlePageChange = (newPage) => {
    if (newPage === page || newPage < 1 || newPage > totalPages || pageLoading) return
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">视频</h1>
        <p className="text-sm text-muted-foreground">每一个画面，都是最珍贵的回忆</p>
      </div>

      {!loaded ? (
        <div className="text-center py-20"><Loader2 size={24} className="mx-auto text-primary animate-spin" /></div>
      ) : videos.length === 0 ? (
        <div className="text-center py-20"><VideoIcon size={32} className="mx-auto text-muted-foreground/30 mb-3" /><p className="text-sm text-muted-foreground">暂无视频</p></div>
      ) : (
        <>
          <div className={`columns-1 md:columns-2 gap-4 space-y-4 *:break-inside-avoid transition-opacity duration-200 ${pageLoading ? 'opacity-50 pointer-events-none' : ''}`}>
            {videos.map((v) => (
              <Card
                key={v.id}
                className="surface-card overflow-hidden hover:border-primary/20 transition-all duration-200 group cursor-pointer py-0 inline-block w-full"
                onClick={() => v.url && setPreviewVideo(v)}
              >
                <div className="relative bg-accent">
                  {v.url ? (
                    <>
                      <video src={v.url} className="w-full h-full object-cover" preload="metadata" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center z-10">
                        <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
                          <Play size={20} className="text-primary-foreground ml-0.5" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="aspect-video flex items-center justify-center">
                      <VideoIcon size={32} className="text-muted-foreground/30 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{v.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{v.description || ''}</p>
                      {v.created_at && <p className="text-[10px] text-muted-foreground/60 mt-2">{format(new Date(v.created_at), 'yyyy年MM月dd日')}</p>}
                    </div>
                    <button
                      className="shrink-0 w-7 h-7 rounded-full bg-accent/50 hover:bg-primary/10 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                      onClick={(e) => { e.stopPropagation(); addDownload(v.url, v.title.endsWith('.mp4') ? v.title : v.title + '.mp4') }}
                      title="下载视频"
                    >
                      <Download size={13} className="text-muted-foreground hover:text-primary" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalCount > 0 && (
            <div className="flex justify-center mt-10 mb-6">
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

      <Dialog open={!!previewVideo} onOpenChange={() => setPreviewVideo(null)}>
        <DialogContent className="max-w-[min(95vw,calc(85vh*16/9))] sm:max-w-[min(90vw,calc(85vh*16/9))] bg-card border-border p-0" showCloseButton={true}>
          {previewVideo && (
            <div className="flex flex-col">
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <DialogTitle className="text-sm font-medium">{previewVideo.title}</DialogTitle>
                  {previewVideo.description && <p className="text-xs text-muted-foreground mt-0.5">{previewVideo.description}</p>}
                </div>
              </div>
              <div className="bg-black rounded-b-lg overflow-hidden flex justify-center">
                <MediaController className="max-w-full max-h-[80vh]">
                  <video slot="media" src={previewVideo.url} autoPlay playsInline className="max-w-full max-h-[80vh]" />
                  <MediaControlBar>
                    <MediaPlayButton />
                    <MediaSeekBackwardButton />
                    <MediaSeekForwardButton />
                    <MediaTimeRange />
                    <MediaDurationDisplay />
                    <MediaMuteButton />
                    <MediaVolumeRange />
                    <MediaPlaybackRateButton />
                    <MediaPipButton />
                    <MediaFullscreenButton />
                  </MediaControlBar>
                </MediaController>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
