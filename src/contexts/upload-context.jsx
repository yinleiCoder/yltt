'use client'

import { createContext, useContext, useState, useRef, useCallback } from 'react'

const UploadContext = createContext({})

let uid = 0

export function UploadProvider({ children }) {
  const [uploads, setUploads] = useState([])
  const xhrRef = useRef({})

  const update = useCallback((id, patch) => {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))
  }, [])

  // options: { folder, onSuccess(data), onError(msg) }
  const addUpload = useCallback((file, url, options = {}) => {
    const id = `${++uid}_${Date.now().toString(36)}`

    setUploads((prev) => [{
      id, filename: file.name, fileSize: file.size,
      progress: 0, loadedSize: 0, status: 'uploading', error: null,
    }, ...prev])

    const xhr = new XMLHttpRequest()
    xhrRef.current[id] = xhr

    const fd = new FormData()
    fd.append('file', file)
    if (options.folder) fd.append('folder', options.folder)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        update(id, {
          progress: Math.round((e.loaded / e.total) * 100),
          loadedSize: e.loaded,
        })
      }
    }

    xhr.onload = () => {
      delete xhrRef.current[id]
      try {
        const data = JSON.parse(xhr.responseText)
        if (data.error) {
          update(id, { status: 'error', error: data.error })
          options.onError?.(data.error)
        } else {
          update(id, { status: 'done', progress: 100 })
          options.onSuccess?.(data)
        }
      } catch {
        update(id, { status: 'error', error: '解析响应失败' })
      }
    }

    xhr.onerror = () => {
      delete xhrRef.current[id]
      update(id, { status: 'error', error: '网络错误' })
      options.onError?.('网络错误')
    }

    xhr.ontimeout = () => {
      delete xhrRef.current[id]
      update(id, { status: 'error', error: '上传超时' })
      options.onError?.('上传超时')
    }

    xhr.open('POST', url)
    xhr.send(fd)
    return id
  }, [update])

  const cancelUpload = useCallback((id) => {
    xhrRef.current[id]?.abort()
    delete xhrRef.current[id]
    update(id, { status: 'paused' })
  }, [update])

  const removeUpload = useCallback((id) => {
    xhrRef.current[id]?.abort()
    delete xhrRef.current[id]
    setUploads((prev) => prev.filter((u) => u.id !== id))
  }, [])

  const clearDone = useCallback(() => {
    setUploads((prev) => prev.filter((u) => u.status !== 'done'))
  }, [])

  return (
    <UploadContext.Provider value={{ uploads, addUpload, cancelUpload, removeUpload, clearDone }}>
      {children}
    </UploadContext.Provider>
  )
}

export function useUploads() {
  const ctx = useContext(UploadContext)
  if (!ctx) throw new Error('useUploads must be used within UploadProvider')
  return ctx
}
