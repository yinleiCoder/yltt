'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const { supabase, ready: authReady } = useAuth()
  const pathname = usePathname()
  const [photos, setPhotos] = useState(null)
  const [videos, setVideos] = useState(null)
  const [stories, setStories] = useState(null)
  const [blessings, setBlessings] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const loadedRef = useRef(false)

  // ── Photos ──────────────────────────────────────────
  const loadPhotos = useCallback(async () => {
    const { data } = await supabase.from('photos').select('*').order('created_at', { ascending: false })
    setPhotos(data || [])
    return data || []
  }, [supabase])

  const addPhoto = useCallback(async (payload) => {
    const { error, data } = await supabase.from('photos').insert(payload).select().single()
    if (error) throw error
    setPhotos(prev => [data, ...(prev || [])])
    return data
  }, [supabase])

  const updatePhoto = useCallback(async (id, payload) => {
    const { error } = await supabase.from('photos').update(payload).eq('id', id)
    if (error) throw error
    setPhotos(prev => (prev || []).map(p => p.id === id ? { ...p, ...payload } : p))
  }, [supabase])

  const deletePhoto = useCallback(async (id) => {
    const { error } = await supabase.from('photos').delete().eq('id', id)
    if (error) throw error
    setPhotos(prev => (prev || []).filter(p => p.id !== id))
  }, [supabase])

  // ── Videos ──────────────────────────────────────────
  const loadVideos = useCallback(async () => {
    const { data } = await supabase.from('videos').select('*').order('created_at', { ascending: false })
    setVideos(data || [])
    return data || []
  }, [supabase])

  const addVideo = useCallback(async (payload) => {
    const { error, data } = await supabase.from('videos').insert(payload).select().single()
    if (error) throw error
    setVideos(prev => [data, ...(prev || [])])
    return data
  }, [supabase])

  const updateVideo = useCallback(async (id, payload) => {
    const { error } = await supabase.from('videos').update(payload).eq('id', id)
    if (error) throw error
    setVideos(prev => (prev || []).map(v => v.id === id ? { ...v, ...payload } : v))
  }, [supabase])

  const deleteVideo = useCallback(async (id) => {
    const { error } = await supabase.from('videos').delete().eq('id', id)
    if (error) throw error
    setVideos(prev => (prev || []).filter(v => v.id !== id))
  }, [supabase])

  // ── Stories ─────────────────────────────────────────
  const loadStories = useCallback(async () => {
    const { data } = await supabase.from('stories').select('*').order('story_date', { ascending: true })
    setStories(data || [])
    return data || []
  }, [supabase])

  const addStory = useCallback(async (payload) => {
    const { error, data } = await supabase.from('stories').insert(payload).select().single()
    if (error) throw error
    setStories(prev => {
      const next = [...(prev || []), data]
      next.sort((a, b) => (a.story_date || '').localeCompare(b.story_date || ''))
      return next
    })
    return data
  }, [supabase])

  const updateStory = useCallback(async (id, payload) => {
    const { error } = await supabase.from('stories').update(payload).eq('id', id)
    if (error) throw error
    setStories(prev => {
      const next = (prev || []).map(s => s.id === id ? { ...s, ...payload } : s)
      next.sort((a, b) => (a.story_date || '').localeCompare(b.story_date || ''))
      return next
    })
  }, [supabase])

  const deleteStory = useCallback(async (id) => {
    const { error } = await supabase.from('stories').delete().eq('id', id)
    if (error) throw error
    setStories(prev => (prev || []).filter(s => s.id !== id))
  }, [supabase])

  // ── Blessings ───────────────────────────────────────
  const loadBlessings = useCallback(async () => {
    const { data } = await supabase.from('blessings').select('*').order('created_at', { ascending: false })
    if (data?.length) {
      const userIds = [...new Set(data.map(b => b.user_id).filter(Boolean))]
      if (userIds.length) {
        const { data: profiles } = await supabase.from('profiles').select('id, avatar_url, display_name').in('id', userIds)
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
        data.forEach(b => { if (b.user_id) b.author_profile = profileMap.get(b.user_id) || null })
      }
    }
    setBlessings(data || [])
    return data || []
  }, [supabase])

  const addBlessing = useCallback(async (payload) => {
    const { error, data } = await supabase.from('blessings').insert(payload).select().single()
    if (error) throw error
    setBlessings(prev => [data, ...(prev || [])])
    return data
  }, [supabase])

  const deleteBlessing = useCallback(async (id) => {
    const { error } = await supabase.from('blessings').delete().eq('id', id)
    if (error) throw error
    setBlessings(prev => (prev || []).filter(b => b.id !== id))
  }, [supabase])

  // ── Load all data ───────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([loadPhotos(), loadVideos(), loadStories(), loadBlessings()])
    } catch (err) {
      console.error('Failed to load data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [loadPhotos, loadVideos, loadStories, loadBlessings])

  /* ── Load when auth is ready or route changes ─── */
  const prevPathRef = useRef(pathname)
  useEffect(() => {
    if (!authReady) return
    if (!loadedRef.current || pathname !== prevPathRef.current) {
      loadedRef.current = true
      prevPathRef.current = pathname
      loadAll()
    }
  }, [authReady, pathname, loadAll])

  const isLoaded = photos !== null && videos !== null && stories !== null && blessings !== null

  const value = useMemo(() => ({
    photos, videos, stories, blessings, isLoaded, loading, error,
    loadPhotos, loadVideos, loadStories, loadBlessings, loadAll,
    addPhoto, updatePhoto, deletePhoto,
    addVideo, updateVideo, deleteVideo,
    addStory, updateStory, deleteStory,
    addBlessing, deleteBlessing,
  }), [
    photos, videos, stories, blessings, isLoaded, loading, error,
    loadPhotos, loadVideos, loadStories, loadBlessings, loadAll,
    addPhoto, updatePhoto, deletePhoto,
    addVideo, updateVideo, deleteVideo,
    addStory, updateStory, deleteStory,
    addBlessing, deleteBlessing,
  ])

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) throw new Error('useData must be used within DataProvider')
  return context
}
