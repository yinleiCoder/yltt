'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useDownloads } from '@/contexts/download-context'
import { useUploads } from '@/contexts/upload-context'
import { formatSize } from '@/lib/utils'
import { Download, ArrowUp, ArrowDown, X, RefreshCw, Play, Check, AlertCircle, Loader2, Activity } from 'lucide-react'

function TransferItem({ item, onCancel, onRetry, onResume, onRemove, type }) {
  return (
    <div className={`p-2.5 rounded-lg border text-xs ${
      item.status === 'error' ? 'border-red-500/20 bg-red-500/5' :
      item.status === 'done' ? 'border-emerald-500/10 bg-emerald-500/5' :
      item.status === 'paused' ? 'border-amber-500/15 bg-amber-500/5' :
      'border-border bg-accent/30'
    }`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="flex-1 truncate font-medium text-foreground/80">{item.filename}</span>
        {item.status !== 'uploading' && item.status !== 'downloading' && (
          <button onClick={() => onRemove(item.id)} className="text-muted-foreground/30 hover:text-red-500 transition-colors shrink-0">
            <X size={11} />
          </button>
        )}
      </div>

      {(item.status === 'uploading' || item.status === 'downloading' || item.status === 'paused' || item.status === 'done') && (
        <div className="mb-1.5">
          <Progress
            value={item.progress}
            className={`h-1.5 ${item.status === 'done' ? '[&>div]:bg-emerald-500' : item.status === 'paused' ? '[&>div]:bg-amber-500' : ''}`}
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className={`text-[10px] ${
          item.status === 'error' ? 'text-red-500' :
          item.status === 'done' ? 'text-emerald-500' :
          item.status === 'paused' ? 'text-amber-500' :
          'text-muted-foreground/60'
        }`}>
          {item.status === 'uploading' && <span className="flex items-center gap-1"><Loader2 size={9} className="animate-spin" />{item.progress}%</span>}
          {item.status === 'downloading' && <span className="flex items-center gap-1"><Loader2 size={9} className="animate-spin" />{item.progress}%</span>}
          {item.status === 'done' && <span className="flex items-center gap-1"><Check size={9} />已完成</span>}
          {item.status === 'paused' && <span className="flex items-center gap-1">已暂停 · {item.progress}%</span>}
          {item.status === 'error' && <span className="flex items-center gap-1"><AlertCircle size={9} />{item.error || (type === 'upload' ? '上传失败' : '下载失败')}</span>}
        </span>
        <span className="text-[10px] text-muted-foreground/40 tabular-nums">
          {item.loadedSize > 0 && formatSize(item.loadedSize)}
          {(item.totalSize > 0 || item.fileSize > 0) && <> / {formatSize(item.totalSize || item.fileSize)}</>}
        </span>
      </div>

      <div className="flex gap-1.5 mt-2">
        {(item.status === 'downloading' || item.status === 'uploading') && (
          <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 border-border px-2" onClick={() => onCancel(item.id)}>
            <X size={10} />暂停
          </Button>
        )}
        {item.status === 'paused' && type === 'download' && (
          <Button size="sm" className="h-6 text-[10px] gap-1 bg-primary hover:bg-primary/90 text-primary-foreground px-2" onClick={() => onResume(item.id)}>
            <Play size={10} />继续下载
          </Button>
        )}
        {item.status === 'error' && type === 'download' && (
          <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 border-border px-2" onClick={() => onRetry(item.id)}>
            <RefreshCw size={10} />重新下载
          </Button>
        )}
      </div>
    </div>
  )
}

export function TransferManager() {
  const { downloads, cancelDownload, retryDownload, resumeDownload, removeDownload, clearDone: clearDownloads } = useDownloads()
  const { uploads, cancelUpload, removeUpload, clearDone: clearUploads } = useUploads()
  const [tab, setTab] = useState('all')
  const [popoverOpen, setPopoverOpen] = useState(false)
  const userClosedRef = useRef(false)

  // Drag state — always start at default to avoid hydration mismatch
  const [pos, setPos] = useState({ right: 16, top: 16 })
  const posRef = useRef(pos)
  posRef.current = pos

  // Load saved position after mount (client only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('transfer-mgr-pos')
      if (saved) {
        const parsed = JSON.parse(saved)
        setPos(parsed)
        posRef.current = parsed
      }
    } catch {}
  }, [])
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, origRight: 0, origTop: 0, moved: false })

  const onTriggerPointerDown = useCallback((e) => {
    e.preventDefault()
    dragRef.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      origRight: posRef.current.right,
      origTop: posRef.current.top,
      moved: false,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const onTriggerPointerMove = useCallback((e) => {
    if (!dragRef.current.dragging) return
    const dx = dragRef.current.startX - e.clientX
    const dy = e.clientY - dragRef.current.startY
    if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return
    dragRef.current.moved = true
    const newRight = Math.max(0, Math.min(window.innerWidth - 40, dragRef.current.origRight + dx))
    const newTop = Math.max(0, Math.min(window.innerHeight - 40, dragRef.current.origTop + dy))
    setPos({ right: newRight, top: newTop })
  }, [])

  const onTriggerPointerUp = useCallback(() => {
    if (dragRef.current.dragging) {
      try { localStorage.setItem('transfer-mgr-pos', JSON.stringify(posRef.current)) } catch {}
      dragRef.current.dragging = false
    }
  }, [])

  const activeDownloads = downloads.filter((d) => d.status !== 'done')
  const activeUploads = uploads.filter((u) => u.status !== 'done')
  const doneDownloads = downloads.filter((d) => d.status === 'done')
  const doneUploads = uploads.filter((u) => u.status === 'done')
  const totalActive = activeDownloads.length + activeUploads.length
  const totalDone = doneDownloads.length + doneUploads.length

  // Auto-open when transfers start; reset flag when all done
  useEffect(() => {
    if (totalActive > 0 && !userClosedRef.current) {
      setPopoverOpen(true)
    }
    if (totalActive === 0 && totalDone === 0) {
      userClosedRef.current = false
    }
  }, [totalActive, totalDone])

  const allItems = [
    ...downloads.map((d) => ({ ...d, _type: 'download' })),
    ...uploads.map((u) => ({ ...u, _type: 'upload' })),
  ].sort((a, b) => {
    const order = { uploading: 0, downloading: 0, paused: 2, error: 3, done: 4 }
    return (order[a.status] ?? 5) - (order[b.status] ?? 5)
  })

  const filteredItems = tab === 'all' ? allItems : allItems.filter((i) => i._type === tab)

  return (
    <div
      className="fixed z-[60] select-none"
      style={{ right: pos.right, top: pos.top }}
    >
    <Popover open={popoverOpen} onOpenChange={(open) => { if (dragRef.current.moved) return; setPopoverOpen(open); if (!open) userClosedRef.current = true }}>
      <PopoverTrigger render={
        <button
          className="relative w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent transition-colors cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={onTriggerPointerDown}
          onPointerMove={onTriggerPointerMove}
          onPointerUp={onTriggerPointerUp}
        >
          <Activity size={15} className={`${totalActive > 0 ? 'text-primary animate-pulse' : 'text-muted-foreground'} pointer-events-none`} />
          {totalActive > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center px-1 pointer-events-none">
              {totalActive}
            </span>
          )}
        </button>
      } />

      <PopoverContent side="bottom" align="end" sideOffset={8} className="w-80 max-h-[65vh] flex flex-col">
        <div className="flex items-center justify-between px-1 pb-2">
          <div className="flex items-center gap-2">
            {/* Tab buttons */}
            <button
              onClick={() => setTab('all')}
              className={`text-[10px] font-medium px-2 py-0.5 rounded transition-colors ${tab === 'all' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              全部{totalActive > 0 && ` · ${totalActive}`}
            </button>
            <button
              onClick={() => setTab('upload')}
              className={`text-[10px] font-medium px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${tab === 'upload' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <ArrowUp size={10} />上传{activeUploads.length > 0 && ` · ${activeUploads.length}`}
            </button>
            <button
              onClick={() => setTab('download')}
              className={`text-[10px] font-medium px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${tab === 'download' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <ArrowDown size={10} />下载{activeDownloads.length > 0 && ` · ${activeDownloads.length}`}
            </button>
          </div>
          {totalDone > 0 && (
            <button
              onClick={() => { clearDownloads(); clearUploads() }}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              清除已完成
            </button>
          )}
        </div>

        {allItems.length === 0 ? (
          <div className="py-8 text-center">
            <Download size={24} className="mx-auto text-muted-foreground/15 mb-2" />
            <p className="text-xs text-muted-foreground">暂无传输任务</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs text-muted-foreground">当前分类无任务</p>
          </div>
        ) : (
          <div className="overflow-y-auto flex flex-col gap-2" style={{ scrollbarWidth: 'thin' }}>
            {filteredItems.map((item) => (
              <TransferItem
                key={item.id}
                item={item}
                type={item._type}
                onCancel={item._type === 'download' ? cancelDownload : cancelUpload}
                onRetry={retryDownload}
                onResume={resumeDownload}
                onRemove={item._type === 'download' ? removeDownload : removeUpload}
              />
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
    </div>
  )
}
