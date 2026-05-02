'use client'

import { useState, useRef, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { useUploads } from '@/contexts/upload-context'
import { useDownloads } from '@/contexts/download-context'
import { formatSize } from '@/lib/utils'
import { Upload, Trash2, Loader2, FolderOpen, File, Download, X, Check, AlertCircle, Play } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

let queueId = 0

export default function AdminOsharePage() {
  const [files, setFiles] = useState(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [queue, setQueue] = useState([])
  const [running, setRunning] = useState(false)
  const fileInputRef = useRef(null)
  const { addUpload } = useUploads()
  const { toast, confirm } = useToast()
  const { addDownload } = useDownloads()

  const loadFiles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/oshare/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '.' }),
      })
      const data = await res.json()
      if (data.files) setFiles(data.files)
    } catch { setFiles([]) }
    setLoading(false)
  }, [])

  const handleSelectFiles = (e) => {
    const selected = Array.from(e.target.files || [])
    if (!selected.length) return
    const newItems = selected.map((f) => ({
      id: ++queueId,
      file: f,
      status: 'pending',
    }))
    setQueue((prev) => [...prev, ...newItems])
  }

  const removeFromQueue = (id) => {
    setQueue((prev) => prev.filter((q) => q.id !== id))
  }

  const processQueue = () => {
    setRunning(true)
    const pending = queue.filter((q) => q.status === 'pending')
    if (!pending.length) { setRunning(false); return }

    let completed = 0
    const total = pending.length

    pending.forEach((item) => {
      setQueue((prev) => prev.map((q) => q.id === item.id ? { ...q, status: 'uploading' } : q))

      addUpload(item.file, '/api/oshare/upload/sign', {
        onSuccess: () => {
          setQueue((prev) => prev.map((q) => q.id === item.id ? { ...q, status: 'done' } : q))
          completed++
          if (completed >= total) {
            setRunning(false)
            loadFiles()
          }
        },
        onError: (msg) => {
          setQueue((prev) => prev.map((q) => q.id === item.id ? { ...q, status: 'error', error: msg } : q))
          completed++
          if (completed >= total) {
            setRunning(false)
            loadFiles()
          }
        },
      })
    })
  }

  const handleDelete = async (key) => {
    if (!await confirm('确认删除此文件？', '删除文件')) return
    try {
      const res = await fetch('/api/oshare/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      })
      const data = await res.json()
      if (data.error) {
        toast('删除失败: ' + data.error, 'error')
      } else {
        setFiles((prev) => (prev || []).filter((f) => f.key !== key))
      }
    } catch (err) {
      toast('删除失败: ' + err.message, 'error')
    }
  }

  const closeUpload = () => {
    setUploadOpen(false)
    setQueue([])
    setRunning(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const doneCount = queue.filter((q) => q.status === 'done').length
  const errorCount = queue.filter((q) => q.status === 'error').length
  const totalCount = queue.length
  const allDone = totalCount > 0 && doneCount + errorCount === totalCount

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight mb-1">文件共享管理</h1>
          <p className="text-xs text-muted-foreground">管理 OSS oshare/ 目录下的共享文件</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 border-border" onClick={loadFiles} disabled={loading}>
            {loading ? <Loader2 size={12} className="animate-spin" /> : <FolderOpen size={13} />}
            刷新
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setUploadOpen(true)}>
            <Upload size={13} />上传文件
          </Button>
        </div>
      </div>

      {files === null && !loading && (
        <Card className="surface-card">
          <CardContent className="p-8 text-center">
            <FolderOpen size={32} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground mb-2">点击「刷新」加载文件列表</p>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="text-center py-20">
          <Loader2 size={20} className="mx-auto text-primary animate-spin" />
        </div>
      )}

      {files !== null && files.length === 0 && (
        <Card className="surface-card">
          <CardContent className="p-8 text-center">
            <File size={32} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">暂无共享文件</p>
          </CardContent>
        </Card>
      )}

      {files !== null && files.length > 0 && (
        <div className="space-y-2">
          {files.map((f) => (
            <Card key={f.key} className="surface-card group">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center shrink-0">
                  <File size={14} className="text-muted-foreground/50" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate font-medium">{f.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {f.size != null && <span className="text-[10px] text-muted-foreground">{formatSize(f.size)}</span>}
                    {f.lastModified && (
                      <span className="text-[10px] text-muted-foreground/50">
                        {new Date(f.lastModified).toLocaleDateString('zh-CN')}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm" variant="ghost"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                  onClick={() => addDownload(f.signedUrl || f.url, f.name)}
                >
                  <Download size={14} />
                </Button>
                <Button
                  size="sm" variant="ghost"
                  className="h-8 w-8 p-0 text-muted-foreground/30 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(f.key)}
                >
                  <Trash2 size={14} />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload dialog with queue */}
      <Dialog open={uploadOpen} onOpenChange={(open) => { if (!open) closeUpload() }}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">上传共享文件</DialogTitle>
          </DialogHeader>

          <div className="mt-3 space-y-3">
            {/* File selector */}
            {!running && !allDone && (
              <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/40 transition-colors">
                <div className="text-center">
                  <Upload size={20} className="mx-auto text-muted-foreground mb-1.5" />
                  <span className="text-xs text-muted-foreground">点击选择文件（可多选，单文件最大 2GB）</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleSelectFiles}
                />
              </label>
            )}

            {/* Queue list */}
            {totalCount > 0 && (
              <div className="space-y-2">
                {/* Summary bar */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    共 {totalCount} 个文件
                    {doneCount > 0 && <span className="text-emerald-500 ml-1">· 完成 {doneCount}</span>}
                    {errorCount > 0 && <span className="text-red-500 ml-1">· 失败 {errorCount}</span>}
                  </span>
                  {allDone && totalCount > 0 && doneCount === totalCount && (
                    <span className="text-emerald-500 font-medium">全部上传成功</span>
                  )}
                  {allDone && errorCount > 0 && (
                    <span className="text-red-500 font-medium">{doneCount}/{totalCount} 成功</span>
                  )}
                </div>

                {/* Progress bar */}
                {totalCount > 0 && !allDone && (
                  <Progress value={((doneCount + errorCount) / totalCount) * 100} className="h-1" />
                )}

                {/* File items */}
                <div className="max-h-48 overflow-y-auto space-y-1.5" style={{ scrollbarWidth: 'thin' }}>
                  {queue.map((q) => (
                    <div
                      key={q.id}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs transition-colors ${
                        q.status === 'error' ? 'bg-red-500/5 border border-red-500/20' :
                        q.status === 'done' ? 'bg-emerald-500/5 border border-emerald-500/20' :
                        q.status === 'uploading' ? 'bg-primary/5 border border-primary/20' :
                        'bg-accent/40 border border-transparent'
                      }`}
                    >
                      {/* Status icon */}
                      {q.status === 'pending' && <div className="w-3 h-3 rounded-full border-2 border-muted-foreground/30 shrink-0" />}
                      {q.status === 'uploading' && <Loader2 size={12} className="text-primary animate-spin shrink-0" />}
                      {q.status === 'done' && <Check size={12} className="text-emerald-500 shrink-0" />}
                      {q.status === 'error' && <AlertCircle size={12} className="text-red-500 shrink-0" />}

                      {/* File name and status */}
                      <span className="flex-1 truncate font-medium text-foreground/80">{q.file.name}</span>
                      <span className="text-[10px] text-muted-foreground/60 shrink-0">{formatSize(q.file.size)}</span>

                      {/* Remove button (only for pending) */}
                      {q.status === 'pending' && (
                        <button onClick={() => removeFromQueue(q.id)} className="text-muted-foreground/30 hover:text-red-500 transition-colors">
                          <X size={12} />
                        </button>
                      )}

                      {/* Error message */}
                      {q.status === 'error' && q.error && (
                        <span className="text-[10px] text-red-500/70 shrink-0 max-w-[120px] truncate" title={q.error}>{q.error}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 justify-end pt-1">
              {allDone ? (
                <Button size="sm" className="h-8 text-xs" onClick={closeUpload}>
                  完成
                </Button>
              ) : (
                <>
                  {totalCount > 0 && (
                    <>
                      <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground" onClick={() => { setQueue([]); if (fileInputRef.current) fileInputRef.current.value = '' }}>
                        清空队列
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={processQueue}
                        disabled={running || queue.filter((q) => q.status === 'pending').length === 0}
                      >
                        <Play size={12} />
                        {running ? '上传中...' : `开始上传 (${queue.filter((q) => q.status === 'pending').length})`}
                      </Button>
                    </>
                  )}
                  {totalCount === 0 && (
                    <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={closeUpload}>
                      取消
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
