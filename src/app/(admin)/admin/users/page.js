'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Search, Shield, Trash2, User, Mail, MapPin } from 'lucide-react'

export default function AdminUsersPage() {
  const { supabase, profile } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const sectionRef = useRef(null)

  const loadUsers = useCallback(async () => { const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }); setUsers(data || []); setLoading(false) }, [supabase])
  useEffect(() => { loadUsers() }, [loadUsers])

  useGSAP(() => {
    gsap.set('.user-row', { y: 12, opacity: 0 }); gsap.to('.user-row', { y: 0, opacity: 1, duration: 0.3, stagger: 0.03, ease: 'power3.out' })
  }, { scope: sectionRef, dependencies: [loading, users.length] })

  const changeRole = async (uid, role) => { await supabase.from('profiles').update({ role }).eq('id', uid); await loadUsers() }
  const deleteUser = async (uid) => { if (!confirm('确认删除？')) return; await supabase.from('profiles').delete().eq('id', uid); await loadUsers() }

  const filtered = users.filter(u => { const q = search.toLowerCase(); return (u.display_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) })

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-xl font-bold text-foreground tracking-tight mb-1">用户管理</h1><p className="text-xs text-muted-foreground">共 {users.length} 位用户</p></div>
        <div className="relative w-56"><Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input placeholder="搜索用户..." className="pl-8 bg-background border-border text-xs h-8" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      </div>

      <Card ref={sectionRef} className="surface-card">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filtered.map((u) => (
              <div key={u.id} className="user-row flex items-center gap-3 p-3 hover:bg-accent/30 transition-colors">
                <Avatar className="w-8 h-8 ring-1 ring-border"><AvatarImage src={u.avatar_url || ''} /><AvatarFallback className="bg-accent text-foreground text-xs">{u.display_name?.[0] || u.email?.[0]?.toUpperCase() || 'U'}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground truncate">{u.display_name || '未设置'}</span>
                    <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="text-[10px]">{u.role === 'admin' ? <><Shield size={9} className="mr-0.5" />管理员</> : <><User size={9} className="mr-0.5" />用户</>}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate"><Mail size={9} className="inline mr-0.5" />{u.email}{u.location && <><MapPin size={9} className="inline ml-1.5 mr-0.5" />{u.location}</>}</p>
                </div>
                <Select value={u.role} onValueChange={(v) => changeRole(u.id, v)}><SelectTrigger className="w-20 h-7 text-[10px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="user">用户</SelectItem><SelectItem value="admin">管理员</SelectItem></SelectContent></Select>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/40 hover:text-destructive" onClick={() => deleteUser(u.id)} disabled={u.id === profile?.id}><Trash2 size={12} /></Button>
              </div>
            ))}
            {filtered.length === 0 && <div className="text-center py-12 text-xs text-muted-foreground">没有匹配的用户</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
