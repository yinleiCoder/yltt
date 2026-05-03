'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useMusic } from '@/contexts/music-context'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ListMusic, X, ChevronUp, Music, Repeat, Repeat1, ListOrdered } from 'lucide-react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

const IDLE_DELAY = 4000

function formatTime(t) {
  if (!t || !isFinite(t)) return '0:00'
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function generateWaveform(seed, count = 80) {
  const bars = []
  let v = 0.3
  for (let i = 0; i < count; i++) {
    const hash = ((seed * 31 + i * 7 + 13) * 2654435761) >>> 0
    v = Math.max(0.08, Math.min(0.95, v + (hash % 100 - 48) / 180))
    bars.push(v)
  }
  return bars
}

function WaveformCanvas({ waveform, progress, color = '#3ecf8e', playedColor = '#0ea163', height = 48 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = height * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = height
    const barW = w / waveform.length
    const gap = Math.max(1, barW * 0.3)
    const barWidth = barW - gap

    ctx.clearRect(0, 0, w, h)

    waveform.forEach((v, i) => {
      const x = i * barW + gap / 2
      const barH = v * (h - 4)
      const y = (h - barH) / 2

      const radius = Math.min(barWidth / 2, 2)
      ctx.beginPath()
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + barWidth - radius, y)
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius)
      ctx.lineTo(x + barWidth, y + barH - radius)
      ctx.quadraticCurveTo(x + barWidth, y + barH, x + barWidth - radius, y + barH)
      ctx.lineTo(x + radius, y + barH)
      ctx.quadraticCurveTo(x, y + barH, x, y + barH - radius)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
      ctx.closePath()

      ctx.fillStyle = (i / waveform.length) <= progress ? playedColor : color
      ctx.fill()
    })
  }, [waveform, progress, color, playedColor, height])

  return <canvas ref={canvasRef} className="w-full cursor-pointer" style={{ height }} />
}

export function MusicPlayer() {
  const {
    playlist, currentIdx, currentTrack, playing, volume, muted,
    currentTime, duration, loaded, playMode,
    setCurrentIdx, setPlayMode, setVolume, setMuted, togglePlay, handlePrev, handleNext, seek,
  } = useMusic()
  const [expanded, setExpanded] = useState(false)
  const [showFull, setShowFull] = useState(false)
  const [idle, setIdle] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(64)
  const idleTimerRef = useRef(null)
  const pillRef = useRef(null)
  const barRef = useRef(null)
  const barInnerRef = useRef(null)
  const playlistRef = useRef(null)
  const playBtnRef = useRef(null)
  const prevIdle = useRef(true)

  const waveform = currentTrack
    ? generateWaveform(String(currentTrack.id).split('').reduce((s, c) => s + c.charCodeAt(0), 0))
    : []

  const progress = duration > 0 ? currentTime / duration : 0

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
  }, [])

  const startIdleTimer = useCallback(() => {
    clearIdleTimer()
    idleTimerRef.current = setTimeout(() => setIdle(true), IDLE_DELAY)
  }, [clearIdleTimer])

  // Track sidebar width for pill positioning
  useEffect(() => {
    const aside = document.getElementById('app-sidebar')
    if (!aside) return
    const ro = new ResizeObserver((entries) => {
      setSidebarWidth(entries[0].contentRect.width)
    })
    ro.observe(aside)
    setSidebarWidth(aside.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    return () => clearIdleTimer()
  }, [clearIdleTimer])

  // ── GSAP: idle ↔ full transition ────────────────────
  useEffect(() => {
    if (!barRef.current || !pillRef.current) return
    if (idle === prevIdle.current) return
    prevIdle.current = idle

    if (idle) {
      // Collapse to pill
      const tl = gsap.timeline()
      tl.to(barRef.current, { y: 80, opacity: 0, duration: 0.35, ease: 'power3.in' })
      tl.fromTo(pillRef.current, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.7)' }, '-=0.2')
    } else {
      // Expand to full bar
      const tl = gsap.timeline()
      tl.to(pillRef.current, { scale: 0, opacity: 0, duration: 0.25, ease: 'power2.in' })
      tl.fromTo(barRef.current, { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }, '-=0.15')
    }
  }, [idle])

  // ── GSAP: showFull bar inner height change ───────────
  useEffect(() => {
    if (!barRef.current) return
    const inner = barRef.current.querySelector('.bar-inner')
    if (!inner) return
    gsap.to(inner, {
      height: showFull ? 'auto' : undefined,
      duration: 0.3,
      ease: 'power2.inOut',
    })
  }, [showFull])

  // ── GSAP: playlist popup ─────────────────────────────
  useEffect(() => {
    if (!playlistRef.current) return
    if (expanded) {
      gsap.fromTo(playlistRef.current,
        { opacity: 0, y: 12, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: 'power2.out' }
      )
    } else {
      gsap.to(playlistRef.current, { opacity: 0, y: 8, duration: 0.2, ease: 'power2.in' })
    }
  }, [expanded])

  // ── GSAP: play button pulse on play ──────────────────
  useGSAP(() => {
    if (!playBtnRef.current) return
    gsap.fromTo(playBtnRef.current,
      { scale: 0.85 },
      { scale: 1, duration: 0.35, ease: 'back.out(2)' }
    )
  }, [playing])

  const cycleMode = useCallback(() => {
    setPlayMode(prev => prev === 'all' ? 'one' : prev === 'one' ? 'sequential' : 'all')
  }, [setPlayMode])

  if (!loaded || playlist.length === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      {/* ── Idle floating pill ──────────────────────── */}
      <div
        ref={pillRef}
        className="absolute bottom-6 pointer-events-auto"
        style={{ left: sidebarWidth + 8, opacity: idle ? 1 : 0, pointerEvents: idle ? 'auto' : 'none' }}
      >
        <button
          onClick={() => { setIdle(false); startIdleTimer() }}
          onMouseEnter={() => { setIdle(false); startIdleTimer() }}
          className="w-10 h-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform group"
          title={currentTrack?.title || ''}
        >
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/15" />
            <circle
              cx="20" cy="20" r="17" fill="none" strokeWidth="2"
              strokeLinecap="round"
              className="text-primary"
              stroke="currentColor"
              strokeDasharray={`${(progress * 106.8).toFixed(1)} 106.8`}
            />
          </svg>
          {playing
            ? <Pause size={14} className="text-foreground" />
            : <Play size={14} className="text-foreground ml-0.5" />
          }
        </button>
      </div>

      {/* ── Full player bar ──────────────────────────── */}
      <div
        ref={barRef}
        className="pointer-events-auto"
        style={{ opacity: idle ? 0 : 1, pointerEvents: idle ? 'none' : 'auto' }}
        onMouseEnter={clearIdleTimer}
        onMouseLeave={startIdleTimer}
      >
        {/* Playlist popup */}
        <div
          ref={playlistRef}
          className="absolute bottom-full left-4 mb-2 bg-card/95 backdrop-blur-md border border-border rounded-xl p-3 shadow-2xl w-64 max-h-48 overflow-y-auto"
          style={{ scrollbarWidth: 'thin', display: expanded ? 'block' : 'none' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-foreground">播放列表</span>
            <button onClick={() => setExpanded(false)} className="text-muted-foreground hover:text-foreground"><X size={12} /></button>
          </div>
          {playlist.map((track, i) => (
            <button
              key={track.id}
              onClick={() => { setCurrentIdx(i); startIdleTimer() }}
              className={`w-full text-left px-2 py-1.5 rounded-md text-xs truncate transition-colors ${
                i === currentIdx ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              {i + 1}. {track.title} {track.artist && <span className="text-muted-foreground/50">— {track.artist}</span>}
            </button>
          ))}
        </div>

        <div className="bg-card/97 backdrop-blur-xl border-t border-border shadow-2xl">
          {/* Expand toggle */}
          <div className="flex justify-center -mt-3">
            <button
              onClick={() => setShowFull(!showFull)}
              className="w-8 h-4 bg-card border border-border border-b-0 rounded-t-full flex items-start justify-center hover:bg-accent transition-colors"
            >
              <ChevronUp size={12} className={`text-muted-foreground transition-transform duration-300 ${showFull ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className="bar-inner px-3 pb-2 pt-1 overflow-hidden" style={{ height: showFull ? 'auto' : 40 }}>
            {/* Track info row */}
            <div className="flex items-center gap-3 mb-1.5">
              <span className="text-[10px] font-medium text-foreground truncate flex-1">
                <Music size={10} className="inline mr-1 text-primary/60" />
                {currentTrack?.title || '—'}
                {currentTrack?.artist && <span className="text-muted-foreground ml-1">— {currentTrack.artist}</span>}
              </span>
              <span className="text-[9px] text-muted-foreground/50 tabular-nums shrink-0">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Waveform + controls row */}
            <div className="flex items-center gap-2">
              {/* Playlist */}
              <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground/60 hover:text-foreground transition-colors shrink-0">
                <ListMusic size={14} />
              </button>

              {/* Play mode */}
              <button
                onClick={cycleMode}
                className="text-muted-foreground/60 hover:text-foreground transition-colors shrink-0"
                title={playMode === 'all' ? '列表循环' : playMode === 'one' ? '单曲循环' : '顺序播放'}
              >
                {playMode === 'all' ? <Repeat size={14} /> : playMode === 'one' ? <Repeat1 size={14} /> : <ListOrdered size={14} />}
              </button>

              {/* Prev */}
              <button onClick={handlePrev} className="text-muted-foreground/60 hover:text-foreground transition-colors shrink-0">
                <SkipBack size={14} />
              </button>

              {/* Play/Pause */}
              <button
                ref={playBtnRef}
                onClick={togglePlay}
                className="w-8 h-8 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center shrink-0 transition-colors"
              >
                {playing
                  ? <Pause size={14} className="text-primary-foreground" />
                  : <Play size={14} className="text-primary-foreground ml-0.5" />
                }
              </button>

              {/* Next */}
              <button onClick={handleNext} className="text-muted-foreground/60 hover:text-foreground transition-colors shrink-0">
                <SkipForward size={14} />
              </button>

              {/* Waveform (clickable seek bar) */}
              <div
                className="flex-1 min-w-0"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const pct = (e.clientX - rect.left) / rect.width
                  seek(Math.max(0, Math.min(1, pct)))
                }}
              >
                <WaveformCanvas
                  waveform={waveform}
                  progress={progress}
                  color="rgba(62,207,142,0.35)"
                  playedColor="#3ecf8e"
                  height={showFull ? 40 : 32}
                />
              </div>

              {/* Volume */}
              <div className="hidden sm:flex items-center gap-1 shrink-0">
                <button onClick={() => setMuted(!muted)} className="text-muted-foreground/60 hover:text-foreground transition-colors">
                  {muted || volume === 0 ? <VolumeX size={13} /> : <Volume2 size={13} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
                  onChange={(e) => { setVolume(parseFloat(e.target.value)); setMuted(false) }}
                  className="w-16 h-1 accent-primary"
                  style={{ cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
