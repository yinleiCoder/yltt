'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Mail, Lock, Loader2 } from 'lucide-react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { createClient } from '@/lib/supabase/client'

gsap.registerPlugin(useGSAP)

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  const safeRedirect = redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const cardRef = useRef(null)
  const errorRef = useRef(null)

  useGSAP(() => {
    gsap.set('.login-field', { y: 20, opacity: 0 })
    gsap.set(cardRef.current, { opacity: 0, scale: 0.95 })
    gsap.to(cardRef.current, { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' })
    gsap.to('.login-field', { y: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: 'power2.out', delay: 0.15 })
  }, [])

  useEffect(() => {
    if (error && errorRef.current) {
      gsap.fromTo(errorRef.current, { y: -8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' })
    }
  }, [error])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
    if (loginError) {
      setError(loginError.message)
      setLoading(false)
    } else {
      gsap.to(cardRef.current, { opacity: 0, scale: 0.95, y: -20, duration: 0.3, ease: 'power2.in' })
      setTimeout(() => { router.push(safeRedirect); router.refresh() }, 300)
    }
  }

  return (
    <Card ref={cardRef} className="border-border bg-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-bold tracking-tight">登录</CardTitle>
        <CardDescription className="text-muted-foreground">登录你的账户</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div ref={errorRef} className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs">{error}</div>
          )}
          <div className="space-y-2 login-field">
            <Label htmlFor="email" className="text-xs">邮箱</Label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input id="email" type="email" placeholder="your@email.com" required className="pl-9 bg-background border-border" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2 login-field">
            <Label htmlFor="password" className="text-xs">密码</Label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input id="password" type="password" placeholder="••••••••" required className="pl-9 bg-background border-border" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground login-field" disabled={loading}>
            {loading ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
            登录
          </Button>
        </form>
        <Separator className="my-5 bg-border" />
        <p className="text-center text-xs text-muted-foreground login-field">
          还没有账户？{' '}
          <Link href="/register" className="text-primary hover:underline font-medium">立即注册</Link>
        </p>
      </CardContent>
    </Card>
  )
}
