'use client'

import { useRef, useEffect } from 'react'
import { MediaController, MediaControlBar, MediaPlayButton, MediaTimeRange, MediaTimeDisplay, MediaDurationDisplay, MediaMuteButton, MediaVolumeRange, MediaFullscreenButton, MediaSeekBackwardButton, MediaSeekForwardButton } from 'media-chrome/react'

export default function VideoPlayer({ src, poster, onEnded, onPrevious, onNext, showNav = false }) {
  const videoRef = useRef(null)
  const controllerRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src || video.src === src) return
    const wasPlaying = !video.paused
    video.src = src
    video.load()
    if (wasPlaying) video.play().catch(() => {})
  }, [src])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !onEnded) return
    video.addEventListener('ended', onEnded)
    return () => video.removeEventListener('ended', onEnded)
  }, [onEnded])

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-black group">
      <MediaController ref={controllerRef} className="w-full">
        <video
          ref={videoRef}
          slot="media"
          src={src}
          poster={poster}
          playsInline
          autoPlay
          preload="metadata"
          crossOrigin="anonymous"
          className="w-full max-h-[50vh] sm:max-h-[70vh] object-contain"
        />
        <MediaControlBar>
          <MediaPlayButton />
          <MediaSeekBackwardButton />
          <MediaSeekForwardButton />
          <MediaTimeRange />
          <MediaTimeDisplay />
          <MediaDurationDisplay />
          <MediaMuteButton />
          <MediaVolumeRange />
          <MediaFullscreenButton />
        </MediaControlBar>
      </MediaController>

      {showNav && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {onPrevious && (
            <button className="pointer-events-auto size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" onClick={(e) => { e.stopPropagation(); onPrevious() }} aria-label="上一个">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          )}
          {onNext && (
            <button className="pointer-events-auto size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" onClick={(e) => { e.stopPropagation(); onNext() }} aria-label="下一个">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
