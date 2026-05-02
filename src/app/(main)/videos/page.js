'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Play, Video as VideoIcon, Download, Loader2 } from 'lucide-react'
import { useDownloads } from '@/contexts/download-context'
import { format } from 'date-fns'
import { MediaController, MediaControlBar, MediaPlayButton, MediaSeekBackwardButton, MediaSeekForwardButton, MediaTimeRange, MediaTimeDisplay, MediaDurationDisplay, MediaMuteButton, MediaVolumeRange, MediaCaptionsButton, MediaPlaybackRateButton, MediaPipButton, MediaFullscreenButton } from 'media-chrome/react'

const PAGE_SIZE = 12

export default function VideosPage() {
  const { supabase } = useAuth()
  const { addDownload } = useDownloads()
  const [previewVideo, setPreviewVideo] = useState(null)
  const [videos, setVideos] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const sectionRef = useRef(null)
  const sentinelRef = useRef(null)
  const pageRef = useRef(0)
  const animatedRef = useRef(new Set())

  const loadPage = useCallback(async (page) => {
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    const { data } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to)
    return data || []
  }, [supabase])

  // Initial load
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const data = await loadPage(0)
      if (cancelled) return
      setVideos(data)
      setHasMore(data.length === PAGE_SIZE)
      setLoaded(true)
      pageRef.current = 0
    })()
    return () => { cancelled = true }
  }, [loadPage])

  // Infinite scroll observer
  useEffect(() => {
    if (!loaded) return
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          const nextPage = pageRef.current + 1
          setLoadingMore(true)
          loadPage(nextPage).then((data) => {
            setVideos((prev) => [...prev, ...data])
            setHasMore(data.length === PAGE_SIZE)
            pageRef.current = nextPage
            setLoadingMore(false)
          })
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [loaded, hasMore, loadingMore, loadPage])

  // Animate newly loaded cards
  useGSAP(() => {
    const newCards = gsap.utils.toArray('.video-card:not(.animated)')
    if (newCards.length === 0) return
    gsap.set(newCards, { y: 30, opacity: 0 })
    gsap.to(newCards, { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out', onComplete: () => {
      newCards.forEach((el) => el.classList.add('animated'))
    }})
  }, { scope: sectionRef, dependencies: [videos] })

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
          <div ref={sectionRef} className="columns-1 md:columns-2 gap-4 space-y-4 *:break-inside-avoid">
            {videos.map((v) => (
              <Card
                key={v.id}
                className="video-card surface-card overflow-hidden hover:border-primary/20 transition-all duration-200 group cursor-pointer py-0 inline-block w-full"
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

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} className="h-4" />

          {loadingMore && (
            <div className="text-center py-6">
              <Loader2 size={20} className="mx-auto text-primary animate-spin" />
            </div>
          )}

          {!hasMore && videos.length > PAGE_SIZE && (
            <p className="text-center py-6 text-xs text-muted-foreground">已加载全部视频</p>
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
                <button
                  className="shrink-0 w-8 h-8 rounded-full bg-accent/50 hover:bg-primary/10 flex items-center justify-center transition-colors"
                  onClick={() => addDownload(previewVideo.url, previewVideo.title.endsWith('.mp4') ? previewVideo.title : previewVideo.title + '.mp4')}
                  title="下载视频"
                >
                  <Download size={15} className="text-muted-foreground hover:text-primary" />
                </button>
              </div>
              <div className="bg-black rounded-b-lg overflow-hidden flex justify-center">
                <MediaController className="max-w-full max-h-[80vh]">
                  <video slot="media" src={previewVideo.url} autoPlay playsInline className="max-w-full max-h-[80vh]" />
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
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
