'use client'

import { useRef } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)
import { Card, CardContent } from '@/components/ui/card'
import { Users, BookOpen, Camera, Video } from 'lucide-react'

export default function AdminDashboard() {
  const ref = useRef(null)

  useGSAP(() => {
    gsap.set('.admin-card', { y: 20, opacity: 0 }); gsap.to('.admin-card', { y: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: 'power3.out' })
  }, { scope: ref })

  const panels = [
    { href: '/admin/users', icon: Users, label: '用户管理', desc: '管理所有注册用户', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { href: '/admin/stories', icon: BookOpen, label: '故事管理', desc: '创建和编辑故事', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { href: '/admin/photos', icon: Camera, label: '相册管理', desc: '管理照片内容', color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { href: '/admin/videos', icon: Video, label: '视频管理', desc: '管理视频内容', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-7">
        <h1 className="text-xl font-bold text-foreground tracking-tight mb-1">管理后台</h1>
        <p className="text-xs text-muted-foreground">管理网站内容与用户</p>
      </div>

      <div ref={ref} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {panels.map((p, i) => (
          <Link key={i} href={p.href}>
            <Card className="admin-card surface-card hover:border-primary/20 transition-all duration-200 cursor-pointer h-full">
              <CardContent className="p-5">
                <div className={`w-8 h-8 rounded-md ${p.bg} flex items-center justify-center mb-3`}><p.icon size={16} className={p.color} /></div>
                <h3 className="font-semibold text-sm text-foreground">{p.label}</h3>
                <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
