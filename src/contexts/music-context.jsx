'use client'

import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'

const MusicContext = createContext(null)

export function MusicProvider({ children }) {
  const { supabase, ready } = useAuth()
  const [playlist, setPlaylist] = useState([])
  const [currentIdx, setCurrentIdx] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const [muted, setMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [playMode, setPlayMode] = useState('all') // 'all' | 'one' | 'sequential'
  const audioRef = useRef(null)
  const userInteractedRef = useRef(false)

  // Load playlist once auth is ready
  useEffect(() => {
    if (!ready) return
    ;(async () => {
      try {
        const { data } = await supabase
          .from('music')
          .select('*')
          .eq('active', true)
          .order('sort_order', { ascending: true })
        if (data?.length) {
          setPlaylist(data)
          setCurrentIdx(0)
        }
      } catch {}
      setLoaded(true)
    })()
  }, [supabase, ready])

  const currentTrack = playlist[currentIdx]

  // Manage the persistent audio element
  useEffect(() => {
    if (!currentTrack?.url) return

    // Create audio element if needed, or reuse existing
    if (!audioRef.current) {
      audioRef.current = new Audio()
    }
    const audio = audioRef.current

    // Set up source
    if (audio.src !== currentTrack.url) {
      const wasPlaying = !audio.paused
      audio.src = currentTrack.url
      audio.load()
      if (wasPlaying || userInteractedRef.current) {
        audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
      }
    }

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onLoadedMetadata = () => setDuration(audio.duration)
    const onEnded = () => {
      setPlaying(false)
      if (playMode === 'one') {
        // Replay: seek to start and play again
        if (audioRef.current) {
          audioRef.current.currentTime = 0
          audioRef.current.play().then(() => setPlaying(true)).catch(() => {})
        }
        return
      }
      if (playMode === 'sequential') {
        setCurrentIdx(prev => prev >= playlist.length - 1 ? prev : prev + 1)
        return
      }
      // 'all': loop to start
      setCurrentIdx(prev => prev >= playlist.length - 1 ? 0 : prev + 1)
    }
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
    }
  }, [currentIdx, currentTrack?.url, playlist.length, playMode])

  // Sync volume to audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume
    }
  }, [volume, muted])

  // Try autoplay after first user click anywhere
  useEffect(() => {
    const onInteraction = () => {
      userInteractedRef.current = true
      if (audioRef.current && audioRef.current.paused && currentTrack) {
        audioRef.current.play().then(() => setPlaying(true)).catch(() => {})
      }
    }
    window.addEventListener('click', onInteraction, { once: true })
    return () => window.removeEventListener('click', onInteraction)
  }, [currentTrack])

  // Keep audio playing when navigating — never destroy it on unmount
  // Audio cleanup is handled by the browser when the page is closed

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {})
      userInteractedRef.current = true
    }
  }, [playing])

  const handlePrev = useCallback(() => {
    if (playlist.length === 0) return
    setCurrentIdx(prev => prev <= 0 ? playlist.length - 1 : prev - 1)
  }, [playlist.length])

  const handleNext = useCallback(() => {
    if (playlist.length === 0) return
    setCurrentIdx(prev => prev >= playlist.length - 1 ? 0 : prev + 1)
  }, [playlist.length])

  const seek = useCallback((pct) => {
    if (audioRef.current && duration > 0) {
      const newTime = pct * duration
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }, [duration])

  return (
    <MusicContext.Provider value={{
      playlist, currentIdx, currentTrack, playing, volume, muted, currentTime, duration, loaded, playMode,
      setCurrentIdx, setPlayMode, setVolume, setMuted, togglePlay, handlePrev, handleNext, seek,
    }}>
      {children}
    </MusicContext.Provider>
  )
}

export function useMusic() {
  const ctx = useContext(MusicContext)
  if (!ctx) throw new Error('useMusic must be used within MusicProvider')
  return ctx
}
