'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Mail, Lock, User, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    if (password.length < 6) { setError('密码至少6个字符'); setLoading(false); return }
    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email, password,
      options: { data: { display_name: name } },
    })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({ id: data.user.id, display_name: name, email, role: 'user' })
      if (profileError) {
        setError('账户已创建，但个人资料保存失败，请联系管理员')
        setLoading(false)
        return
      }
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-bold tracking-tight">注册</CardTitle>
        <CardDescription className="text-muted-foreground">创建你的账户</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
          {error && <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs">{error}</div>}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs">昵称</Label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input id="name" placeholder="你的昵称" required className="pl-9 bg-background border-border" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs">邮箱</Label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input id="email" type="email" placeholder="your@email.com" required className="pl-9 bg-background border-border" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs">密码</Label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input id="password" type="password" placeholder="至少6个字符" required className="pl-9 bg-background border-border" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
            {loading ? <Loader2 size={14} className="animate-spin mr-2" /> : null}注册
          </Button>
        </form>
        <Separator className="my-5 bg-border" />
        <p className="text-center text-xs text-muted-foreground">
          已经有账户？ <Link href="/login" className="text-primary hover:underline font-medium">去登录</Link>
        </p>
      </CardContent>
    </Card>
  )
}
