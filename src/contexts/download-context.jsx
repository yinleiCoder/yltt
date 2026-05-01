'use client'

import { createContext, useContext, useState, useRef, useCallback } from 'react'

const DownloadContext = createContext({})

let uid = 0

export function DownloadProvider({ children }) {
  const [downloads, setDownloads] = useState([])
  const chunksRef = useRef({})
  const abortRef = useRef({})

  const update = useCallback((id, patch) => {
    setDownloads((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)))
  }, [])

  const doDownload = useCallback(async (id, url, filename, resumeFrom = 0) => {
    try {
      const controller = new AbortController()
      abortRef.current[id] = controller

      const headers = {}
      if (resumeFrom > 0) headers.Range = `bytes=${resumeFrom}-`

      const response = await fetch(url, { signal: controller.signal, headers })
      if (!response.ok && response.status !== 206) throw new Error(`HTTP ${response.status}`)

      // Server doesn't support Range, restart
      if (resumeFrom > 0 && response.status === 200) {
        chunksRef.current[id] = []
      }

      const rangeTotal = parseInt(response.headers.get('content-length') || '0', 10)
      const totalSize = resumeFrom > 0 && response.status === 206
        ? resumeFrom + rangeTotal
        : parseInt(response.headers.get('content-length') || '0', 10)

      if (totalSize) update(id, { totalSize })

      const reader = response.body.getReader()
      let loaded = resumeFrom

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (!chunksRef.current[id]) chunksRef.current[id] = []
        chunksRef.current[id].push(value)
        loaded += value.length
        update(id, {
          loadedSize: loaded,
          progress: totalSize ? Math.min(Math.round((loaded / totalSize) * 100), 100) : 0,
        })
      }

      // Complete — trigger browser save
      const blob = new Blob(chunksRef.current[id])
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)

      delete chunksRef.current[id]
      delete abortRef.current[id]
      update(id, { status: 'done', progress: 100 })
    } catch (err) {
      if (err.name === 'AbortError') {
        // Keep current state for resume
      } else {
        update(id, { status: 'error', error: err.message })
      }
    }
  }, [update])

  const addDownload = useCallback((url, filename) => {
    const id = `${++uid}_${Date.now().toString(36)}`
    setDownloads((prev) => [{ id, url, filename, progress: 0, loadedSize: 0, totalSize: 0, status: 'downloading', error: null }, ...prev])
    doDownload(id, url, filename, 0)
  }, [doDownload])

  const cancelDownload = useCallback((id) => {
    abortRef.current[id]?.abort()
    delete abortRef.current[id]
    update(id, { status: 'paused' })
  }, [update])

  const retryDownload = useCallback((id) => {
    const dl = downloads.find((d) => d.id === id)
    if (!dl) return
    chunksRef.current[id] = []
    update(id, { status: 'downloading', progress: 0, loadedSize: 0, error: null })
    doDownload(id, dl.url, dl.filename, 0)
  }, [downloads, update, doDownload])

  const resumeDownload = useCallback((id) => {
    const dl = downloads.find((d) => d.id === id)
    if (!dl || dl.status !== 'paused') return
    update(id, { status: 'downloading' })
    doDownload(id, dl.url, dl.filename, dl.loadedSize)
  }, [downloads, update, doDownload])

  const removeDownload = useCallback((id) => {
    abortRef.current[id]?.abort()
    delete abortRef.current[id]
    delete chunksRef.current[id]
    setDownloads((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const clearDone = useCallback(() => {
    setDownloads((prev) => prev.filter((d) => d.status !== 'done'))
  }, [])

  return (
    <DownloadContext.Provider value={{
      downloads, addDownload, cancelDownload, retryDownload, resumeDownload, removeDownload, clearDone,
    }}>
      {children}
    </DownloadContext.Provider>
  )
}

export function useDownloads() {
  const ctx = useContext(DownloadContext)
  if (!ctx) throw new Error('useDownloads must be used within DownloadProvider')
  return ctx
}
