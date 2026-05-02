'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { copyToClipboard, scheduleClipboardClear } from '@/lib/copy-to-clipboard'
import { useToast } from '@/components/ui/toast'
import { Copy, RefreshCw, Eye, EyeOff } from 'lucide-react'

const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const LOWER = 'abcdefghijkmnopqrstuvwxyz'
const DIGITS = '23456789'
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?'

function generatePw(length, useUpper, useLower, useDigits, useSymbols) {
  let pool = ''
  if (useUpper) pool += UPPER
  if (useLower) pool += LOWER
  if (useDigits) pool += DIGITS
  if (useSymbols) pool += SYMBOLS
  if (!pool) pool = LOWER + DIGITS

  const array = new Uint8Array(length * 2)
  crypto.getRandomValues(array)
  let result = ''
  for (let i = 0; i < length; i++) {
    result += pool[array[i] % pool.length]
  }

  const checks = []
  if (useUpper) checks.push((ch) => UPPER.includes(ch))
  if (useLower) checks.push((ch) => LOWER.includes(ch))
  if (useDigits) checks.push((ch) => DIGITS.includes(ch))
  if (useSymbols) checks.push((ch) => SYMBOLS.includes(ch))

  for (const check of checks) {
    if (![...result].some(check)) {
      return generatePw(length, useUpper, useLower, useDigits, useSymbols)
    }
  }
  return result
}

function LengthSlider({ value, onChange }) {
  const pct = ((value - 8) / (64 - 8)) * 100
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs">长度</Label>
        <span className="text-xs font-mono font-medium text-foreground">{value}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={8}
          max={64}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-primary"
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${pct}%, hsl(var(--muted)) ${pct}%, hsl(var(--muted)) 100%)`,
          }}
        />
      </div>
    </div>
  )
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between py-1 cursor-pointer">
      <span className="text-xs text-foreground/80">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors',
          checked ? 'bg-primary' : 'bg-muted-foreground/20',
        )}
      >
        <span
          className={cn(
            'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0',
          )}
        />
      </button>
    </label>
  )
}

export function PasswordGenerator({ open, onOpenChange, onUsePassword }) {
  const { toast } = useToast()
  const [length, setLength] = useState(20)
  const [useUpper, setUseUpper] = useState(true)
  const [useLower, setUseLower] = useState(true)
  const [useDigits, setUseDigits] = useState(true)
  const [useSymbols, setUseSymbols] = useState(true)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const regenerate = useCallback(() => {
    setPassword(generatePw(length, useUpper, useLower, useDigits, useSymbols))
  }, [length, useUpper, useLower, useDigits, useSymbols])

  useEffect(() => {
    if (open) regenerate()
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopy = async () => {
    try {
      await copyToClipboard(password)
      scheduleClipboardClear()
      toast('密码已复制到剪贴板', 'success', 2000)
    } catch {
      toast('复制失败', 'error')
    }
  }

  const handleUse = () => {
    onUsePassword?.(password)
    onOpenChange(false)
  }

  const noSets = !useUpper && !useLower && !useDigits && !useSymbols

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>密码生成器</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <LengthSlider value={length} onChange={setLength} />

          <div className="space-y-0.5">
            <ToggleRow label="大写字母 (A-Z)" checked={useUpper} onChange={setUseUpper} />
            <ToggleRow label="小写字母 (a-z)" checked={useLower} onChange={setUseLower} />
            <ToggleRow label="数字 (0-9)" checked={useDigits} onChange={setUseDigits} />
            <ToggleRow label="特殊符号 (!@#$...)" checked={useSymbols} onChange={setUseSymbols} />
          </div>

          <div className="relative">
            <div className="flex items-center gap-1.5 p-2.5 rounded-lg bg-muted/50 border border-border">
              <code className="flex-1 font-mono text-xs break-all select-all text-foreground/90">
                {showPassword ? password : '•'.repeat(Math.min(password.length, 32))}
              </code>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setShowPassword(!showPassword)}
                className="shrink-0 h-6 w-6 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={handleCopy}
                className="shrink-0 h-6 w-6 text-muted-foreground hover:text-foreground"
              >
                <Copy size={12} />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={regenerate}
                className="shrink-0 h-6 w-6 text-muted-foreground hover:text-foreground"
              >
                <RefreshCw size={12} />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button size="sm" onClick={handleUse} disabled={noSets}>
            使用此密码
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
