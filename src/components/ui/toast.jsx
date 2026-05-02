'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, CheckCircle2, AlertCircle, Info, Loader2 } from 'lucide-react'

const ToastContext = createContext({})

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [confirmState, setConfirmState] = useState(null)

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration)
    }
    return id
  }, [removeToast])

  const dismiss = useCallback((id) => {
    removeToast(id)
  }, [removeToast])

  const confirm = useCallback((message, title = '确认操作') => {
    return new Promise((resolve) => {
      setConfirmState({ message, title, resolve })
    })
  }, [])

  const closeConfirm = useCallback((result) => {
    confirmState?.resolve(result)
    setConfirmState(null)
  }, [confirmState])

  return (
    <ToastContext.Provider value={{ toast, dismiss, confirm }}>
      {children}

      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-[70] flex flex-col-reverse gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} {...t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>

      {/* Confirm dialog */}
      <Dialog open={!!confirmState} onOpenChange={() => closeConfirm(false)}>
        <DialogContent className="max-w-sm bg-card border-border" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">{confirmState?.title}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{confirmState?.message}</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => closeConfirm(false)} className="text-xs">取消</Button>
            <Button size="sm" onClick={() => closeConfirm(true)} className="text-xs bg-destructive hover:bg-destructive/90 text-destructive-foreground">确认</Button>
          </div>
        </DialogContent>
      </Dialog>
    </ToastContext.Provider>
  )
}

function ToastItem({ id, message, type, onDismiss }) {
  const icons = {
    success: <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />,
    error: <AlertCircle size={14} className="text-red-400 shrink-0" />,
    info: <Info size={14} className="text-blue-400 shrink-0" />,
    loading: <Loader2 size={14} className="text-primary animate-spin shrink-0" />,
  }

  const bg = {
    success: 'border-emerald-500/20 bg-emerald-500/5',
    error: 'border-red-500/20 bg-red-500/5',
    info: 'border-blue-500/20 bg-blue-500/5',
    loading: 'border-primary/20 bg-primary/5',
  }

  return (
    <div
      className={`pointer-events-auto flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-200 min-w-[280px] max-w-[380px] ${bg[type] || bg.info}`}
    >
      <span className="mt-0.5">{icons[type] || icons.info}</span>
      <p className="text-xs text-foreground/80 flex-1 leading-relaxed">{message}</p>
      <button onClick={onDismiss} className="shrink-0 text-muted-foreground/30 hover:text-foreground transition-colors -mr-0.5">
        <X size={13} />
      </button>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
