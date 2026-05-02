'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'

const DataContext = createContext({})

export function DataProvider({ children }) {
  const { supabase } = useAuth()
  const [photos, setPhotos] = useState(null)
  const [videos, setVideos] = useState(null)
  const [stories, setStories] = useState(null)
  const [blessings, setBlessings] = useState(null)

  // ── Photos ──────────────────────────────────────────
  const loadPhotos = useCallback(async () => {
    const { data } = await supabase.from('photos').select('*').order('created_at', { ascending: false })
    setPhotos(data || [])
  }, [supabase])

  const addPhoto = useCallback(async (payload) => {
    const { error, data } = await supabase.from('photos').insert(payload).select().single()
    if (error) throw error
    setPhotos(prev => [data, ...(prev || [])])
    return data
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
    setBlessings(data || [])
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

  // ── Boot ────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    await Promise.all([loadPhotos(), loadVideos(), loadStories(), loadBlessings()])
  }, [loadPhotos, loadVideos, loadStories, loadBlessings])

  const loadedRef = useRef(false)
  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    loadAll()
  }, [loadAll])

  const isLoaded = photos !== null && videos !== null && stories !== null && blessings !== null

  return (
    <DataContext.Provider value={{
      photos, videos, stories, blessings, isLoaded,
      loadPhotos, loadVideos, loadStories, loadBlessings, loadAll,
      addPhoto, deletePhoto,
      addVideo, updateVideo, deleteVideo,
      addStory, updateStory, deleteStory,
      addBlessing, deleteBlessing,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) throw new Error('useData must be used within DataProvider')
  return context
}
