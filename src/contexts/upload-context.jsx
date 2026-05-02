'use client'

import { createContext, useContext, useState, useRef, useCallback } from 'react'

const UploadContext = createContext({})

let uid = 0
const MULTIPART_THRESHOLD = 10 * 1024 * 1024 // 10MB — larger files use chunked upload

export function UploadProvider({ children }) {
  const [uploads, setUploads] = useState([])
  const xhrRef = useRef({})         // single-PUT XHRs by id
  const mpMetaRef = useRef({})      // multipart metadata: { uploadId, key }
  const mpXhrRef = useRef({})       // current part XHR by id

  const update = useCallback((id, patch) => {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))
  }, [])

  // Single PUT via presigned URL (files <= 10MB)
  const singleUpload = useCallback((id, file, signUrl, options) => {
    ;(async () => {
      try {
        const signRes = await fetch(signUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name,
            type: file.type || 'application/octet-stream',
            size: file.size,
            folder: options.folder,
          }),
        })

        const signData = await signRes.json()
        if (signData.error) {
          update(id, { status: 'error', error: signData.error })
          options.onError?.(signData.error)
          return
        }

        const xhr = new XMLHttpRequest()
        xhrRef.current[id] = xhr

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
          if (xhr.status === 200 || xhr.status === 204) {
            update(id, { status: 'done', progress: 100, loadedSize: file.size })
            options.onSuccess?.({
              url: signData.url,
              key: signData.key,
              name: signData.name || file.name,
              size: signData.size || file.size,
              signedUrl: signData.signedUrl,
            })
          } else {
            const error = xhr.status === 403 ? '签名已过期，请重试' : `上传失败 (HTTP ${xhr.status})`
            update(id, { status: 'error', error })
            options.onError?.(error)
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

        xhr.open('PUT', signData.signedUrl)
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
        xhr.timeout = 600000
        xhr.send(file)
      } catch (err) {
        update(id, { status: 'error', error: '获取上传凭证失败' })
        options.onError?.('获取上传凭证失败: ' + err.message)
      }
    })()
  }, [update])

  // Multipart (chunked) upload for files > 10MB
  const multipartUpload = useCallback((id, file, signUrl, options) => {
    ;(async () => {
      try {
        // Step 1: Initiate multipart upload via server
        const initRes = await fetch('/api/upload/multipart/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name,
            type: file.type || 'application/octet-stream',
            size: file.size,
            folder: options.folder,
          }),
        })

        const initData = await initRes.json()
        if (initData.error) {
          update(id, { status: 'error', error: initData.error })
          options.onError?.(initData.error)
          return
        }

        const { uploadId: mpUploadId, key, url, parts, partSize } = initData
        mpMetaRef.current[id] = { uploadId: mpUploadId, key }

        update(id, { partCount: parts.length })

        let uploadedBytes = 0

        // Step 2: Upload each part sequentially via signed URLs
        for (const part of parts) {
          const start = (part.partNumber - 1) * partSize
          const end = Math.min(start + partSize, file.size)
          const chunk = file.slice(start, end)

          update(id, { currentPart: part.partNumber })

          await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            mpXhrRef.current[id] = xhr

            let partLoaded = 0

            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                partLoaded = e.loaded
                const totalLoaded = uploadedBytes + partLoaded
                update(id, {
                  progress: Math.round((totalLoaded / file.size) * 100),
                  loadedSize: totalLoaded,
                })
              }
            }

            xhr.onload = () => {
              if (xhr.status === 200 || xhr.status === 204) {
                uploadedBytes += chunk.size
                resolve()
              } else {
                reject(new Error(xhr.status === 403
                  ? '签名已过期，请重试'
                  : `分片 ${part.partNumber} 上传失败 (HTTP ${xhr.status})`))
              }
            }

            xhr.onerror = () => reject(new Error('网络错误'))
            xhr.ontimeout = () => reject(new Error('上传超时'))

            xhr.open('PUT', part.signedUrl)
            xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
            xhr.timeout = 600000
            xhr.send(chunk)
          })
        }

        delete mpXhrRef.current[id]

        // Step 3: Complete multipart upload via server
        const completeRes = await fetch('/api/upload/multipart/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uploadId: mpUploadId, key }),
        })

        const completeData = await completeRes.json()
        if (completeData.error) {
          update(id, { status: 'error', error: completeData.error })
          options.onError?.(completeData.error)
          return
        }

        delete mpMetaRef.current[id]
        update(id, { status: 'done', progress: 100, loadedSize: file.size })
        options.onSuccess?.({ url, key })
      } catch (err) {
        update(id, { status: 'error', error: err.message })
        options.onError?.(err.message)

        // Clean up incomplete multipart upload on server
        const meta = mpMetaRef.current[id]
        if (meta) {
          fetch('/api/upload/multipart/abort', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uploadId: meta.uploadId, key: meta.key }),
          }).catch(() => {})
          delete mpMetaRef.current[id]
        }
      }
    })()
  }, [update])

  // options: { folder, onSuccess(data), onError(msg) }
  // signUrl is the presigned-URL endpoint, e.g. '/api/upload/sign'
  // Files > 10MB automatically use multipart upload regardless of signUrl
  const addUpload = useCallback((file, signUrl, options = {}) => {
    const id = `${++uid}_${Date.now().toString(36)}`

    setUploads((prev) => [{
      id, filename: file.name, fileSize: file.size,
      progress: 0, loadedSize: 0, status: 'uploading', error: null,
    }, ...prev])

    if (file.size > MULTIPART_THRESHOLD) {
      multipartUpload(id, file, signUrl, options)
    } else {
      singleUpload(id, file, signUrl, options)
    }

    return id
  }, [singleUpload, multipartUpload])

  const cancelUpload = useCallback((id) => {
    xhrRef.current[id]?.abort()
    mpXhrRef.current[id]?.abort()
    delete xhrRef.current[id]
    delete mpXhrRef.current[id]

    const meta = mpMetaRef.current[id]
    if (meta) {
      fetch('/api/upload/multipart/abort', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId: meta.uploadId, key: meta.key }),
      }).catch(() => {})
      delete mpMetaRef.current[id]
    }

    update(id, { status: 'paused' })
  }, [update])

  const removeUpload = useCallback((id) => {
    xhrRef.current[id]?.abort()
    mpXhrRef.current[id]?.abort()
    delete xhrRef.current[id]
    delete mpXhrRef.current[id]

    const meta = mpMetaRef.current[id]
    if (meta) {
      fetch('/api/upload/multipart/abort', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId: meta.uploadId, key: meta.key }),
      }).catch(() => {})
      delete mpMetaRef.current[id]
    }

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
