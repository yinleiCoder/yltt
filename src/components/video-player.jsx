'use client'

import dynamic from 'next/dynamic'

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false })

export default function VideoPlayer({ src, poster, onEnded, onPrevious, onNext, showNav = false }) {
  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black group">
      <ReactPlayer
        src={src}
        playing
        controls
        playsInline
        poster={poster || undefined}
        onEnded={onEnded}
        width="100%"
        height="100%"
      />

      {showNav && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {onPrevious && (
            <button
              className="pointer-events-auto size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              onClick={(e) => { e.stopPropagation(); onPrevious() }}
              aria-label="上一个"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          )}
          {onNext && (
            <button
              className="pointer-events-auto size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              onClick={(e) => { e.stopPropagation(); onNext() }}
              aria-label="下一个"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
