'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
gsap.registerPlugin(useGSAP)
import { useData } from '@/contexts/data-context'
import { getFileUrl } from '@/lib/oss-client'
import { format } from 'date-fns'
import { Camera, Calendar, Loader2, Download, ChevronLeft, ChevronRight } from 'lucide-react'

import { useDownloads } from '@/contexts/download-context'

const PHOTOS_STATE_KEY = 'yltt:photos:state'

function savePhotosState(id, scrollTop) {
  try {
    sessionStorage.setItem(PHOTOS_STATE_KEY, JSON.stringify({
      id,
      scrollTop,
      timestamp: Date.now(),
    }))
  } catch { /* quota exceeded */ }
}

function loadPhotosState() {
  try {
    const raw = sessionStorage.getItem(PHOTOS_STATE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (Date.now() - data.timestamp > 10 * 60 * 1000) {
      sessionStorage.removeItem(PHOTOS_STATE_KEY)
      return null
    }
    return data
  } catch {
    return null
  }
}

export default function PhotosPage() {
  const { photos, isLoaded } = useData()
  const { addDownload } = useDownloads()
  const [selectedId, setSelectedId] = useState(null)
  const thumbRefs = useRef({})
  const thumbContainerRef = useRef(null)
  const indicatorRef = useRef(null)
  const manualRef = useRef(false)
  const scrollTweenRef = useRef(null)
  const wheelThrottleRef = useRef(0)

  const currentPhoto = photos?.find(p => p.id === selectedId) || null
  const currentIdx = currentPhoto ? photos.findIndex(p => p.id === currentPhoto.id) : -1

  const initRef = useRef(false)

  useEffect(() => {
    if (photos?.length && !initRef.current) {
      initRef.current = true
      const saved = loadPhotosState()
      if (saved && photos.some(p => p.id === saved.id)) {
        setSelectedId(saved.id)
        window.__photosSavedScrollTop = saved.scrollTop
      } else {
        setSelectedId(photos[0].id)
      }
    }
  }, [photos])

  // Initial scroll: restore saved position or align first thumbnail to indicator
  useEffect(() => {
    if (!isLoaded || !photos?.length || !thumbContainerRef.current || !selectedId) return

    if (window.__photosSavedScrollTop !== undefined && window.__photosSavedScrollTop !== null) {
      thumbContainerRef.current.scrollTop = window.__photosSavedScrollTop
      animateThumbs()
      delete window.__photosSavedScrollTop
      return
    }

    const el = thumbRefs.current[selectedId]
    const container = thumbContainerRef.current
    const indicator = indicatorRef.current
    if (!el || !indicator) return

    const indicatorRect = indicator.getBoundingClientRect()
    const indicatorCenter = indicatorRect.top + indicatorRect.height / 2
    const elCenter = el.getBoundingClientRect().top + el.getBoundingClientRect().height / 2
    const offset = elCenter - indicatorCenter
    container.scrollTop += offset
  }, [isLoaded])

  // Save scroll state before unmount (nav away)
  useEffect(() => {
    return () => {
      if (selectedId && thumbContainerRef.current) {
        savePhotosState(selectedId, thumbContainerRef.current.scrollTop)
      }
    }
  }, [selectedId])

  // Animate thumbnails based on distance from the indicator
  const animateThumbs = useCallback(() => {
    if (!indicatorRef.current) return
    const indicatorRect = indicatorRef.current.getBoundingClientRect()
    const indicatorCenter = indicatorRect.top + indicatorRect.height / 2
    const range = indicatorRect.height * 2.5

    Object.entries(thumbRefs.current).forEach(([, el]) => {
      if (!el) return
      const rect = el.getBoundingClientRect()
      const center = rect.top + rect.height / 2
      const dist = Math.abs(center - indicatorCenter)
      const t = Math.min(dist / range, 1)
      gsap.to(el, {
        scale: 1 - t * 0.1,
        filter: `brightness(${1 - t * 0.25}) saturate(${1 - t * 0.45})`,
        duration: 0.4,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    })
  }, [])

  // Scroll-driven detection (desktop thumbnail strip)
  const handleScroll = useCallback(() => {
    animateThumbs()

    if (manualRef.current || !indicatorRef.current) return

    const indicatorRect = indicatorRef.current.getBoundingClientRect()
    const indicatorCenter = indicatorRect.top + indicatorRect.height / 2
    const threshold = indicatorRect.height * 0.45

    let closestId = null
    let closestDist = Infinity

    Object.entries(thumbRefs.current).forEach(([cid, el]) => {
      if (!el) return
      const rect = el.getBoundingClientRect()
      const center = rect.top + rect.height / 2
      const dist = Math.abs(center - indicatorCenter)
      if (dist < closestDist) {
        closestDist = dist
        closestId = cid
      }
    })

    if (closestId && closestId !== selectedId && closestDist < threshold) {
      setSelectedId(closestId)
    }

    if (selectedId && thumbContainerRef.current) {
      savePhotosState(selectedId, thumbContainerRef.current.scrollTop)
    }
  }, [selectedId, animateThumbs])

  const snapToIndicator = useCallback((id) => {
    const el = thumbRefs.current[id]
    const container = thumbContainerRef.current
    const indicator = indicatorRef.current
    if (!el || !container || !indicator) return

    manualRef.current = true

    if (scrollTweenRef.current) {
      scrollTweenRef.current.kill()
    }

    const indicatorRect = indicator.getBoundingClientRect()
    const indicatorCenter = indicatorRect.top + indicatorRect.height / 2
    const elCenter = el.getBoundingClientRect().top + el.getBoundingClientRect().height / 2
    const targetScrollTop = container.scrollTop + (elCenter - indicatorCenter)

    scrollTweenRef.current = gsap.to(container, {
      scrollTop: targetScrollTop,
      duration: 0.55,
      ease: 'power3.out',
      onUpdate: animateThumbs,
      onComplete: () => {
        manualRef.current = false
        scrollTweenRef.current = null
      },
    })
  }, [animateThumbs])

  const selectPhoto = useCallback((id) => {
    setSelectedId(id)
    snapToIndicator(id)
  }, [snapToIndicator])

  const goNext = useCallback(() => {
    if (!photos?.length || currentIdx >= photos.length - 1) return
    const nextId = photos[currentIdx + 1].id
    setSelectedId(nextId)
    snapToIndicator(nextId)
  }, [photos, currentIdx, snapToIndicator])

  const goPrev = useCallback(() => {
    if (!photos?.length || currentIdx <= 0) return
    const prevId = photos[currentIdx - 1].id
    setSelectedId(prevId)
    snapToIndicator(prevId)
  }, [photos, currentIdx, snapToIndicator])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); goNext() }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); goPrev() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goNext, goPrev])

  // Throttled wheel handler for desktop
  const handleWheel = useCallback((e) => {
    const now = Date.now()
    if (now - wheelThrottleRef.current < 600) return
    wheelThrottleRef.current = now
    if (e.deltaY > 0) goNext()
    else if (e.deltaY < 0) goPrev()
  }, [goNext, goPrev])

  // Touch swipe for mobile
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [])
  const handleTouchEnd = useCallback((e) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) goNext()
      else goPrev()
    }
  }, [goNext, goPrev])

  if (!isLoaded) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={24} /></div>
  }

  if (!photos?.length) {
    return <div className="h-screen flex items-center justify-center flex-col gap-3"><Camera size={40} className="text-muted-foreground/30" /><p className="text-sm text-muted-foreground">暂无照片</p></div>
  }

  const exifParts = (p) => {
    const parts = []
    if (p.focal_length) parts.push(p.focal_length)
    if (p.aperture) parts.push(p.aperture)
    if (p.shutter_speed) parts.push(p.shutter_speed)
    if (p.iso) parts.push(`ISO${p.iso}`)
    return parts
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row">
      {/* Info area: bottom on mobile, left on desktop */}
      <div className="order-3 lg:order-1 lg:w-60 shrink-0 px-6 py-4 lg:py-0 lg:relative">
        <div className="lg:absolute lg:bottom-8 lg:left-6 lg:right-6">
          {currentPhoto && (
            <div className="space-y-3 lg:space-y-4">
              {currentPhoto.title && (
                <h2 className="text-sm lg:text-base font-semibold text-foreground leading-snug">{currentPhoto.title}</h2>
              )}
              <div className="space-y-1.5 lg:space-y-2 text-xs text-muted-foreground">
                {currentPhoto.taken_at && (
                  <p className="flex items-center gap-2">
                    <Calendar size={12} className="shrink-0 text-muted-foreground/40" />
                    <span>{format(new Date(currentPhoto.taken_at), 'yyyy-MM-dd HH:mm')}</span>
                  </p>
                )}
                {currentPhoto.camera && (
                  <p className="flex items-start gap-2">
                    <Camera size={12} className="shrink-0 text-muted-foreground/40 mt-0.5" />
                    <span>{currentPhoto.camera}{currentPhoto.lens ? ` + ${currentPhoto.lens}` : ''}</span>
                  </p>
                )}
                {currentPhoto.width && currentPhoto.height && (
                  <p className="text-[10px] text-muted-foreground/30">{currentPhoto.width} × {currentPhoto.height}</p>
                )}
              </div>
              {exifParts(currentPhoto).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {exifParts(currentPhoto).map((part, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-accent text-[10px] text-foreground/60">{part}</span>
                  ))}
                </div>
              )}
              <button
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-primary transition-colors cursor-pointer"
                onClick={() => {
                  const url = getFileUrl(currentPhoto.url)
                  const ext = url.split('.').pop()?.split('?')[0] || 'jpg'
                  const name = currentPhoto.title || 'photo'
                  const filename = name.toLowerCase().endsWith('.' + ext.toLowerCase()) ? name : `${name}.${ext}`
                  addDownload(url, filename)
                }}
              >
                <Download size={12} />下载原图
              </button>
              {photos.length > 1 && (
                <p className="text-xs text-muted-foreground/40 tabular-nums tracking-wider">{currentIdx + 1} / {photos.length}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main image area with mobile nav buttons */}
      <div
        className="order-1 lg:order-2 flex-1 flex items-center justify-center relative min-h-0"
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {currentPhoto?.url ? (
          <img
            src={getFileUrl(currentPhoto.url)}
            alt={currentPhoto.title || ''}
            className="max-h-full max-w-full lg:max-w-[calc(100%-3rem)] object-contain select-none"
            draggable={false}
          />
        ) : (
          <Camera size={48} className="text-muted-foreground/20" />
        )}

        {/* Mobile prev/next arrows */}
        {photos.length > 1 && (
          <>
            <button
              className="lg:hidden absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/60 flex items-center justify-center active:bg-background/80"
              onClick={goPrev}
            >
              <ChevronLeft size={18} className="text-foreground/70" />
            </button>
            <button
              className="lg:hidden absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/60 flex items-center justify-center active:bg-background/80"
              onClick={goNext}
            >
              <ChevronRight size={18} className="text-foreground/70" />
            </button>
          </>
        )}
      </div>

      {/* Desktop: vertical thumbnail strip */}
      <div className="hidden lg:block w-28 shrink-0 relative overflow-hidden order-3">
        <div
          ref={indicatorRef}
          className="absolute left-1 right-1 aspect-4/3 z-10 pointer-events-none rounded-lg border-2 border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.3)]"
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        />
        <div
          ref={thumbContainerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto py-[42vh]"
          style={{ scrollbarWidth: 'none' }}
        >
          {photos.map((p) => (
            <div key={p.id} className="shrink-0 px-2 pb-3" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 100px' }}>
              <button
                ref={el => { thumbRefs.current[p.id] = el }}
                onClick={() => selectPhoto(p.id)}
                className="w-full aspect-4/3 rounded-md overflow-hidden block"
              >
                {p.url ? (
                  <img src={getFileUrl(p.url)} alt="" className="w-full h-full object-cover opacity-55 transition-opacity duration-300 cursor-pointer" loading="lazy" />
                ) : (
                  <div className="w-full h-full bg-accent flex items-center justify-center"><Camera size={12} className="text-muted-foreground/30" /></div>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: horizontal thumbnail strip */}
      <div className="lg:hidden order-2 flex gap-2 overflow-x-auto px-4 py-2" style={{ scrollbarWidth: 'none' }}>
        {photos.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedId(p.id)}
            className={`shrink-0 w-14 h-10 rounded-md overflow-hidden transition-all ${p.id === selectedId ? 'ring-2 ring-emerald-400 scale-105' : 'opacity-50'}`}
            style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 56px 40px' }}
          >
            {p.url ? (
              <img src={getFileUrl(p.url)} alt="" className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full bg-accent flex items-center justify-center"><Camera size={10} className="text-muted-foreground/30" /></div>
            )}
          </button>
        ))}
      </div>


    </div>
  )
}
