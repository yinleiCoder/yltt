'use client'

import { useState, useEffect, useMemo } from 'react'
import { useVault } from '@/contexts/vault-context'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { copyToClipboard, scheduleClipboardClear } from '@/lib/copy-to-clipboard'
import { PasswordGenerator } from '@/components/password-generator'
import {
  Key, Lock, Eye, EyeOff, Copy, Plus, Search, Trash2, Edit3,
  ExternalLink, Shield, Loader2, KeyRound,
} from 'lucide-react'

const CATEGORIES = ['未分类', '社交', '邮箱', '金融', '购物', '工作', '娱乐', '其他']

// ── Setup screen ───────────────────────────────────────────
function SetupScreen({ onSetup }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 8) { setError('主密码至少需要8个字符'); return }
    if (password !== confirm) { setError('两次输入的密码不一致'); return }
    setLoading(true); setError('')
    try {
      await onSetup(password)
    } catch (err) {
      setError('创建失败: ' + err.message)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto pt-16">
      <Card className="surface-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield size={18} className="text-primary" />
            首次使用 — 创建主密码
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              主密码用于加密所有密码数据。<strong className="text-foreground">请牢记此密码</strong>，丢失后数据无法恢复。
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs">主密码</Label>
              <div className="relative">
                <Input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少8个字符"
                  className="bg-background border-border pr-8"
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">确认主密码</Label>
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="再次输入主密码"
                className="bg-background border-border"
                required
              />
            </div>
            {error && <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 size={14} className="animate-spin mr-2" />}
              创建保险箱
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Unlock screen ──────────────────────────────────────────
function UnlockScreen({ onUnlock }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!password.trim()) return
    setLoading(true); setError('')
    try {
      await onUnlock(password)
    } catch {
      setError('主密码错误，请重试')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto pt-16">
      <Card className="surface-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock size={18} className="text-primary" />
            保险箱已锁定
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-muted-foreground">请输入主密码解锁保险箱。</p>
            <div className="space-y-1.5">
              <Label className="text-xs">主密码</Label>
              <div className="relative">
                <Input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入主密码"
                  className="bg-background border-border pr-8"
                  autoFocus
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            {error && <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 size={14} className="animate-spin mr-2" />}
              解锁
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Password form dialog ───────────────────────────────────
function PasswordFormDialog({ open, onOpenChange, initial, onSave }) {
  const isEditing = !!initial
  const [title, setTitle] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [category, setCategory] = useState('未分类')
  const [showPassword, setShowPassword] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (initial) {
      setTitle(initial.title || '')
      setUsername(initial.username || '')
      setPassword(initial.password || '')
      setUrl(initial.url || '')
      setNotes(initial.notes || '')
      setCategory(initial.category || '未分类')
    } else {
      setTitle(''); setUsername(''); setPassword(''); setUrl(''); setNotes('')
      setCategory('未分类')
    }
    setError('')
    setShowPassword(false)
  }, [open, initial])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !username.trim() || !password.trim()) {
      setError('标题、用户名和密码为必填项'); return
    }
    setLoading(true); setError('')
    try {
      await onSave({ title: title.trim(), username: username.trim(), password: password.trim(), url: url.trim(), notes: notes.trim(), category })
    } catch (err) {
      setError('保存失败: ' + err.message)
    }
    setLoading(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? '编辑密码' : '添加密码'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">标题 *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：微信、支付宝" className="bg-background border-border" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">用户名 *</Label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="账号/手机号/邮箱" className="bg-background border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">分类</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-background border-border h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">密码 *</Label>
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="输入密码"
                    className="bg-background border-border pr-8"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <Button type="button" variant="outline" size="icon" className="h-9 w-9 border-border shrink-0" onClick={() => setShowGenerator(true)} title="生成密码">
                  <KeyRound size={14} />
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">网址</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">备注</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="备注信息、密保问题等" className="bg-background border-border" />
            </div>
            {error && <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>取消</Button>
              <Button type="submit" size="sm" disabled={loading}>
                {loading && <Loader2 size={14} className="animate-spin mr-1.5" />}
                {isEditing ? '保存修改' : '添加'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <PasswordGenerator
        open={showGenerator}
        onOpenChange={setShowGenerator}
        onUsePassword={(pw) => { setPassword(pw); setShowGenerator(false) }}
      />
    </>
  )
}

// ── Main page ──────────────────────────────────────────────
export default function PasswordsPage() {
  const { user } = useAuth()
  const { vaultState, passwords, passwordsLoaded, lock, unlock, setup, loadPasswords, addPassword, updatePassword, deletePassword } = useVault()
  const { toast, confirm } = useToast()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [visiblePasswords, setVisiblePasswords] = useState({})
  const [categoryFilter, setCategoryFilter] = useState('全部')

  useEffect(() => {
    if (vaultState === 'unlocked' && !passwordsLoaded) {
      loadPasswords()
    }
  }, [vaultState, passwordsLoaded, loadPasswords])

  const handleAdd = () => { setEditingEntry(null); setDialogOpen(true) }
  const handleEdit = (entry) => { setEditingEntry(entry); setDialogOpen(true) }

  const handleSave = async (data) => {
    if (editingEntry) {
      await updatePassword(editingEntry.id, data)
      toast('密码已更新', 'success')
    } else {
      await addPassword(data)
      toast('密码已添加', 'success')
    }
    setDialogOpen(false)
  }

  const handleDelete = async (entry) => {
    if (!await confirm(`确定要删除「${entry.title}」吗？此操作不可撤销。`, '删除密码')) return
    try { await deletePassword(entry.id) } catch (e) { toast('删除失败: ' + e.message, 'error') }
  }

  const handleLock = () => { lock(); toast('保险箱已锁定', 'info', 2000) }

  const handleCopy = async (text, label) => {
    try {
      await copyToClipboard(text)
      scheduleClipboardClear()
      toast(`${label}已复制`, 'success', 2000)
    } catch { toast('复制失败', 'error') }
  }

  const toggleVisibility = (id) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Derive categories from data + defaults
  const categories = useMemo(() => {
    const set = new Set(CATEGORIES)
    passwords.forEach((p) => set.add(p.category))
    return ['全部', ...Array.from(set)]
  }, [passwords])

  // Filter
  const filtered = useMemo(() => {
    let result = passwords
    if (categoryFilter !== '全部') {
      result = result.filter((p) => p.category === categoryFilter)
    }
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q) ||
        p.url.toLowerCase().includes(q) ||
        p.notes.toLowerCase().includes(q),
      )
    }
    return result
  }, [passwords, categoryFilter, search])

  // ── Loading ──────────────────────────────────────────────
  if (!user) return null
  if (vaultState === 'loading') {
    return (
      <div className="max-w-sm mx-auto pt-16 text-center">
        <Loader2 className="animate-spin mx-auto text-primary" size={24} />
        <p className="text-sm text-muted-foreground mt-3">加载中...</p>
      </div>
    )
  }

  // ── Uninitialized ────────────────────────────────────────
  if (vaultState === 'uninitialized') {
    return <SetupScreen onSetup={setup} />
  }

  // ── Locked ───────────────────────────────────────────────
  if (vaultState === 'locked') {
    return <UnlockScreen onUnlock={unlock} />
  }

  // ── Unlocked ─────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight mb-1 flex items-center gap-2">
            <Key size={20} className="text-primary" />
            密码管理
          </h1>
          <p className="text-xs text-muted-foreground">共 {passwords.length} 条记录</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleLock} className="text-xs h-8 gap-1.5 border-border">
            <Lock size={12} />锁定
          </Button>
          <Button size="sm" onClick={handleAdd} className="text-xs h-8 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus size={13} />添加
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="搜索标题、用户名、网址..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-background border-border text-xs h-9"
        />
      </div>

      {/* Category filter chips */}
      {passwords.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {categories.map((cat) => (
            <Badge
              key={cat}
              variant={categoryFilter === cat ? 'default' : 'outline'}
              className="cursor-pointer text-[10px]"
              onClick={() => setCategoryFilter(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      )}

      {/* Content */}
      {!passwordsLoaded ? (
        <div className="text-center py-12">
          <Loader2 className="animate-spin mx-auto text-primary" size={20} />
          <p className="text-xs text-muted-foreground mt-2">加载密码数据...</p>
        </div>
      ) : passwords.length === 0 ? (
        <Card className="surface-card">
          <CardContent className="p-10 text-center">
            <KeyRound size={36} className="mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">暂无密码记录</p>
            <Button onClick={handleAdd} variant="outline" size="sm" className="gap-1.5">
              <Plus size={13} />添加第一条密码
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">没有匹配的结果</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <Card key={entry.id} className="surface-card group/pw">
              <CardContent className="p-4 space-y-2.5">
                {/* Top row: title + category + URL */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-medium text-foreground truncate">{entry.title}</h3>
                      <Badge variant="secondary" className="text-[10px] bg-accent text-muted-foreground border-0 shrink-0">{entry.category}</Badge>
                    </div>
                    {entry.url && (
                      <a href={entry.url} target="_blank" rel="noreferrer" className="text-[11px] text-muted-foreground hover:text-primary transition-colors truncate block">
                        <ExternalLink size={10} className="inline mr-0.5" />{entry.url}
                      </a>
                    )}
                  </div>
                </div>

                {/* Username row */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-12 shrink-0">用户名</span>
                  <code className="flex-1 font-mono text-xs bg-muted/50 px-2 py-1 rounded select-all">{entry.username}</code>
                  <Button variant="ghost" size="icon-xs" onClick={() => handleCopy(entry.username, '用户名')} className="opacity-0 group-hover/pw:opacity-100 transition-opacity h-6 w-6 text-muted-foreground hover:text-foreground">
                    <Copy size={11} />
                  </Button>
                </div>

                {/* Password row */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-12 shrink-0">密码</span>
                  <code className="flex-1 font-mono text-xs bg-muted/50 px-2 py-1 rounded select-all">
                    {visiblePasswords[entry.id] ? entry.password : '•'.repeat(Math.min(entry.password.length, 24))}
                  </code>
                  <Button variant="ghost" size="icon-xs" onClick={() => toggleVisibility(entry.id)} className="opacity-0 group-hover/pw:opacity-100 transition-opacity h-6 w-6 text-muted-foreground hover:text-foreground">
                    {visiblePasswords[entry.id] ? <EyeOff size={11} /> : <Eye size={11} />}
                  </Button>
                  <Button variant="ghost" size="icon-xs" onClick={() => handleCopy(entry.password, '密码')} className="opacity-0 group-hover/pw:opacity-100 transition-opacity h-6 w-6 text-muted-foreground hover:text-foreground">
                    <Copy size={11} />
                  </Button>
                </div>

                {/* Notes */}
                {entry.notes && (
                  <p className="text-[11px] text-muted-foreground/60 border-t border-border/30 pt-2">{entry.notes}</p>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center pt-1.5 border-t border-border/20">
                  <span className="text-[9px] text-muted-foreground/40">{entry.updated_at ? new Date(entry.updated_at).toLocaleDateString('zh-CN') : ''}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground" onClick={() => handleEdit(entry)}>
                      <Edit3 size={11} className="mr-1" />编辑
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-destructive" onClick={() => handleDelete(entry)}>
                      <Trash2 size={11} className="mr-1" />删除
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit dialog */}
      <PasswordFormDialog open={dialogOpen} onOpenChange={setDialogOpen} initial={editingEntry} onSave={handleSave} />
    </div>
  )
}
