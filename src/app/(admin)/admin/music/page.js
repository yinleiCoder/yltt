'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Trash2, Loader2, Upload, Music, X, Edit, GripVertical } from 'lucide-react'
import { useUploads } from '@/contexts/upload-context'
import { useToast } from '@/components/ui/toast'
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { arrayMove } from '@dnd-kit/sortable'

/* ── Sortable row ─── */
function SortableItem({ track, onEdit, onDelete, onToggle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: track.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-3 p-3 bg-background ${isDragging ? 'shadow-lg ring-2 ring-primary rounded-lg' : ''}`}>
      <button {...attributes} {...listeners} className="shrink-0 cursor-grab active:cursor-grabbing touch-none" aria-label="拖动排序">
        <GripVertical size={16} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{track.sort_order}. {track.title}</p>
        {track.artist && <p className="text-[10px] text-muted-foreground truncate">{track.artist}</p>}
      </div>
      <button onClick={() => onToggle(track)} className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${track.active ? 'bg-primary/10 text-primary' : 'bg-muted-foreground/10 text-muted-foreground/40'}`}>
        {track.active ? '启用' : '禁用'}
      </button>
      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/50 hover:text-primary" onClick={() => onEdit(track)}><Edit size={13} /></Button>
      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/50 hover:text-destructive" onClick={() => onDelete(track.id)}><Trash2 size={13} /></Button>
    </div>
  )
}

export default function AdminMusicPage() {
  const { supabase } = useAuth()
  const { addUpload } = useUploads()
  const { toast, confirm } = useToast()
  const [tracks, setTracks] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTrack, setEditTrack] = useState(null)
  const [form, setForm] = useState({ title: '', artist: '', url: '', sort_order: 0, active: true })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const pendingOssKeyRef = useRef(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const loadTracks = useCallback(async () => {
    const { data } = await supabase.from('music').select('*').order('sort_order', { ascending: true })
    setTracks(data || [])
    setLoaded(true)
  }, [supabase])

  useEffect(() => { loadTracks() }, [loadTracks])

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = tracks.findIndex(t => t.id === active.id)
    const newIndex = tracks.findIndex(t => t.id === over.id)
    const newTracks = arrayMove(tracks, oldIndex, newIndex)

    // Optimistic update
    setTracks(newTracks)

    // Update sort_order in database
    const updates = newTracks.map((t, i) => ({
      id: t.id, title: t.title, artist: t.artist, url: t.url, sort_order: i + 1, active: t.active,
    }))

    try {
      await supabase.from('music').upsert(updates)
    } catch (e) {
      toast('排序保存失败', 'error')
      loadTracks() // revert
    }
  }

  const openCreate = () => {
    setEditTrack(null)
    const maxOrder = tracks.reduce((v, t) => Math.max(v, t.sort_order || 0), 0)
    setForm({ title: '', artist: '', url: '', sort_order: maxOrder + 1, active: true })
    setDialogOpen(true)
  }

  const openEdit = (t) => {
    setEditTrack(t)
    setForm({ title: t.title || '', artist: t.artist || '', url: t.url || '', sort_order: t.sort_order || 0, active: t.active ?? true })
    setDialogOpen(true)
  }

  const handleMusicUpload = (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    addUpload(file, '/api/upload/sign', {
      folder: 'music',
      onSuccess: (data) => { setForm(prev => ({ ...prev, url: data.url })); pendingOssKeyRef.current = data.key; setUploading(false) },
      onError: (msg) => { toast('上传失败: ' + msg, 'error'); setUploading(false) },
    })
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.url) return
    setSaving(true)
    const payload = { ...form, sort_order: parseInt(form.sort_order) || 0 }
    try {
      if (editTrack) {
        await supabase.from('music').update(payload).eq('id', editTrack.id)
      } else {
        await supabase.from('music').insert(payload)
      }
      pendingOssKeyRef.current = null
      setSaving(false); setDialogOpen(false)
      loadTracks()
    } catch (e) {
      setSaving(false)
      toast('保存失败: ' + e.message, 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!await confirm('确认删除这首音乐？', '删除音乐')) return
    const track = tracks.find(t => t.id === id)
    if (track?.url) {
      const key = track.url.split('.com/')[1]
      if (key) await fetch('/api/oss/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) }).catch(() => {})
    }
    try { await supabase.from('music').delete().eq('id', id); loadTracks() }
    catch (e) { toast('删除失败: ' + e.message, 'error') }
  }

  const toggleActive = async (track) => {
    await supabase.from('music').update({ active: !track.active }).eq('id', track.id)
    loadTracks()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-xl font-bold text-foreground tracking-tight mb-1">音乐管理</h1><p className="text-xs text-muted-foreground">共 {tracks.length} 首音乐，拖动排序</p></div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-8 gap-1.5"><Plus size={14} />添加音乐</Button>
      </div>

      {!loaded ? (
        <div className="text-center py-20"><Loader2 size={20} className="mx-auto text-primary animate-spin" /></div>
      ) : tracks.length === 0 ? (
        <Card className="surface-card"><CardContent className="text-center py-12 text-xs text-muted-foreground">还没有音乐，点击上方按钮添加</CardContent></Card>
      ) : (
        <Card className="surface-card">
          <CardContent className="p-0">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={tracks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="divide-y divide-border">
                  {tracks.map((t) => (
                    <SortableItem key={t.id} track={t} onEdit={openEdit} onDelete={handleDelete} onToggle={toggleActive} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader><DialogTitle className="text-base font-semibold">{editTrack ? '编辑音乐' : '添加音乐'}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-3">
            <div className="space-y-1.5"><Label className="text-xs">标题 *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="歌曲名称" className="bg-background border-border" /></div>
            <div className="space-y-1.5"><Label className="text-xs">艺术家</Label><Input value={form.artist} onChange={e => setForm({ ...form, artist: e.target.value })} placeholder="可选" className="bg-background border-border" /></div>
            <div className="space-y-2">
              <Label className="text-xs">音乐文件 *</Label>
              {form.url ? (
                <div className="flex items-center gap-2">
                  <Music size={14} className="text-primary" />
                  <span className="text-xs text-muted-foreground truncate flex-1">{form.url.split('/').pop() || '已上传'}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setForm({ ...form, url: '' })}><X size={12} /></Button>
                </div>
              ) : (
                <label className="flex items-center justify-center w-full h-20 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/40 transition-colors">
                  {uploading ? <div className="text-center"><Loader2 size={20} className="mx-auto text-primary animate-spin mb-1" /><span className="text-xs text-muted-foreground">上传中...</span></div>
                    : <div className="text-center"><Upload size={18} className="mx-auto text-muted-foreground mb-1" /><span className="text-xs text-muted-foreground">上传 MP3 文件</span></div>}
                  <input type="file" accept="audio/mpeg,audio/mp3,audio/wav" className="hidden" onChange={handleMusicUpload} disabled={uploading} />
                </label>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">排序序号</Label><Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} className="bg-background border-border" /></div>
              <div className="space-y-1.5 flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="rounded" /><span className="text-xs">启用</span></label>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving || uploading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">{saving ? <Loader2 size={14} className="animate-spin mr-2" /> : null}{editTrack ? '保存修改' : '添加音乐'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
