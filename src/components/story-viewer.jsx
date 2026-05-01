'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import gsap from 'gsap'
import { X, Pause } from 'lucide-react'
import { format } from 'date-fns'
import { getFileUrl } from '@/lib/oss-client'
import { STORY_CATEGORIES, STORY_DURATION } from '@/lib/constants'

export function StoryViewer({ stories, initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [paused, setPaused] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [userScrolling, setUserScrolling] = useState(false)
  const contentRef = useRef(null)
  const scrollRef = useRef(null)
  const progressTweenRef = useRef(null)
  const scrollTweenRef = useRef(null)
  const holdTimerRef = useRef(null)
  const touchStartRef = useRef({ x: 0, y: 0 })
  const containerRef = useRef(null)
  const scrollTimeoutRef = useRef(null)
  const videoRef = useRef(null)

  // Sync play/pause via ref to avoid React remounting the video element
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (paused) v.pause()
    else v.play().catch(() => {})
  }, [paused])

  const totalStories = stories.length
  const currentStory = stories[currentIndex]
  const hasMedia = currentStory?.media_url && currentStory?.media_type
  const isVideo = currentStory?.media_type === 'video'
  const mediaUrl = currentStory?.media_url ? getFileUrl(currentStory.media_url) : null
  const isTextOnly = !hasMedia

  const goToLoop = useCallback(
    (dir) => {
      if (dir === 'next') {
        setCurrentIndex((prev) => (prev < totalStories - 1 ? prev + 1 : 0))
      } else {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalStories - 1))
      }
    },
    [totalStories],
  )

  // Pause helper: user interaction pauses, auto-resumes after delay
  const pauseForInteraction = useCallback(() => {
    setPaused(true)
    setUserScrolling(true)
    clearTimeout(scrollTimeoutRef.current)
    scrollTimeoutRef.current = setTimeout(() => {
      setPaused(false)
      setUserScrolling(false)
    }, 2000)
  }, [])

  // Animate progress bar + text scroll
  useEffect(() => {
    if (progressTweenRef.current) progressTweenRef.current.kill()
    if (scrollTweenRef.current) scrollTweenRef.current.kill()

    // Reset all progress bars
    for (let i = 0; i < totalStories; i++) {
      gsap.set(`[data-progress-bar="${i}"]`, { width: i < currentIndex ? '100%' : '0%' })
    }

    if (paused) return

    // Progress bar animation
    progressTweenRef.current = gsap.to(`[data-progress-bar="${currentIndex}"]`, {
      width: '100%',
      duration: STORY_DURATION,
      ease: 'none',
      onComplete: () => goToLoop('next'),
    })

    // Auto-scroll for text-only stories
    if (isTextOnly && scrollRef.current && !userScrolling) {
      const el = scrollRef.current
      const maxScroll = el.scrollHeight - el.clientHeight
      if (maxScroll > 0) {
        scrollTweenRef.current = gsap.to(el, {
          scrollTop: maxScroll,
          duration: STORY_DURATION,
          ease: 'none',
        })
      }
    }

    return () => {
      if (progressTweenRef.current) progressTweenRef.current.kill()
      if (scrollTweenRef.current) scrollTweenRef.current.kill()
    }
  }, [currentIndex, paused, totalStories, goToLoop, isTextOnly, userScrolling])

  // Animate content transition & reset scroll
  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' },
      )
    }
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
    setUserScrolling(false)
  }, [currentIndex])

  const handleClose = useCallback(() => {
    setExiting(true)
    if (progressTweenRef.current) progressTweenRef.current.kill()
    if (scrollTweenRef.current) scrollTweenRef.current.kill()
    gsap.to(containerRef.current, {
      opacity: 0, scale: 1.05, duration: 0.25, ease: 'power2.in',
      onComplete: onClose,
    })
  }, [onClose])

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') handleClose()
      if (e.key === 'ArrowLeft') goToLoop('prev')
      if (e.key === 'ArrowRight') goToLoop('next')
      if (e.key === ' ') { e.preventDefault(); setPaused((p) => !p) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goToLoop, handleClose])

  // Hold to pause
  const startHold = () => { holdTimerRef.current = setTimeout(() => setPaused(true), 250) }
  const endHold = () => { clearTimeout(holdTimerRef.current); setPaused(false) }

  // Wheel: detect edge navigation for text-only
  const handleWheel = useCallback((e) => {
    if (!isTextOnly || !scrollRef.current) return
    const el = scrollRef.current
    const atTop = el.scrollTop <= 0
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2

    pauseForInteraction()

    if (atBottom && e.deltaY > 0) {
      e.preventDefault()
      goToLoop('next')
    } else if (atTop && e.deltaY < 0) {
      e.preventDefault()
      goToLoop('prev')
    }
  }, [isTextOnly, goToLoop, pauseForInteraction])

  // Touch swipe for navigation (both modes)
  const handleTouchStart = useCallback((e) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    startHold()
  }, [])

  const handleTouchEnd = useCallback((e) => {
    endHold()
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y
    if (dy > 80 && Math.abs(dy) > Math.abs(dx)) { handleClose(); return }
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { goToLoop(dx < 0 ? 'next' : 'prev') }
  }, [handleClose, goToLoop])

  useEffect(() => {
    return () => {
      if (progressTweenRef.current) progressTweenRef.current.kill()
      if (scrollTweenRef.current) scrollTweenRef.current.kill()
      clearTimeout(holdTimerRef.current)
      clearTimeout(scrollTimeoutRef.current)
    }
  }, [])

  if (!currentStory) return null

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex flex-col select-none"
      style={{ opacity: exiting ? 0 : 1 }}
    >
      {/* Media background */}
      {hasMedia && (
        <div className="absolute inset-0">
          {isVideo ? (
            <video
              ref={videoRef}
              key={currentStory.id}
              src={mediaUrl}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-black/40" />
        </div>
      )}

      {/* Progress bars */}
      <div className="flex gap-1.5 px-3 pt-4 pb-2 z-10 relative">
        {stories.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/25 rounded-full overflow-hidden">
            <div data-progress-bar={i} className="h-full bg-white rounded-full" style={{ width: '0%' }} />
          </div>
        ))}
      </div>

      {/* Header — text-only: full info */}
      {isTextOnly && (
        <div className="flex items-center justify-between px-4 py-3 z-10 relative">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-lg">
              {currentStory.cover_emoji || '💕'}
            </div>
            <div>
              <p className="text-white/90 text-sm font-medium leading-tight">{currentStory.title}</p>
              <div className="flex items-center gap-2">
                {currentStory.category && STORY_CATEGORIES[currentStory.category] && (
                  <span className="text-white/40 text-[10px]">{STORY_CATEGORIES[currentStory.category]}</span>
                )}
                {currentStory.story_date && (
                  <span className="text-white/35 text-[10px]">{format(new Date(currentStory.story_date), 'yyyy.MM.dd')}</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={handleClose} className="text-white/60 hover:text-white transition-colors p-1">
            <X size={22} />
          </button>
        </div>
      )}

      {/* Header — media: close button only */}
      {hasMedia && (
        <div className="flex justify-end px-4 py-3 z-10 relative">
          <button onClick={handleClose} className="text-white/60 hover:text-white transition-colors p-1">
            <X size={22} />
          </button>
        </div>
      )}

      {/* Content area */}
      {isTextOnly ? (
        // Text-only: scrollable container with auto-scroll
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 pb-8 z-10 relative scrollbar-none"
          onWheel={handleWheel}
          onMouseDown={startHold}
          onMouseUp={endHold}
          onMouseLeave={endHold}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {paused && (
            <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-3 pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
                <Pause size={24} className="text-white" fill="white" />
              </div>
              <span className="text-white/50 text-xs">{userScrolling ? '阅读中' : '已暂停'}</span>
            </div>
          )}

          <div
            ref={contentRef}
            key={currentIndex}
            className="max-w-lg mx-auto text-center pt-8 pb-16"
          >
            <div className="text-7xl mb-6">{currentStory.cover_emoji || '💕'}</div>
            <h2 className="text-white text-2xl font-bold mb-4 leading-snug">
              {currentStory.title}
            </h2>
            {currentStory.content && (
              <p className="text-white/60 text-base leading-relaxed whitespace-pre-wrap">
                {currentStory.content}
              </p>
            )}
          </div>
        </div>
      ) : (
        // Media stories: bottom-left text, tap zones
        <div
          className="flex-1 flex items-center justify-center relative px-6 pb-8 z-10"
          onMouseDown={startHold}
          onMouseUp={endHold}
          onMouseLeave={endHold}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {paused && (
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-3 pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
                <Pause size={24} className="text-white" fill="white" />
              </div>
              <span className="text-white/50 text-xs">长按暂停</span>
            </div>
          )}

          <div
            ref={contentRef}
            key={currentIndex}
            className="absolute bottom-8 left-6 right-6 z-20 max-w-xl"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-xl shrink-0">
                {currentStory.cover_emoji || '💕'}
              </div>
              <div>
                <h2 className="text-white text-xl font-bold leading-snug drop-shadow-lg">
                  {currentStory.title}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  {currentStory.category && STORY_CATEGORIES[currentStory.category] && (
                    <span className="text-white/50 text-[11px]">{STORY_CATEGORIES[currentStory.category]}</span>
                  )}
                  {currentStory.story_date && (
                    <span className="text-white/45 text-[11px]">
                      {format(new Date(currentStory.story_date), 'yyyy年MM月dd日')}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {currentStory.content && (
              <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap drop-shadow-md">
                {currentStory.content}
              </p>
            )}
          </div>

          {/* Tap zones — use div to avoid button nesting */}
          <div className="absolute inset-0 flex z-10">
            <div className="w-1/3 h-full" onClick={() => goToLoop('prev')} role="button" aria-label="上一个" />
            <div className="w-2/3 h-full" onClick={() => goToLoop('next')} role="button" aria-label="下一个" />
          </div>
        </div>
      )}
    </div>
  )
}
