'use client'

import { useRef, useMemo } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useAuth } from '@/contexts/auth-context'
import { useData } from '@/contexts/data-context'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Camera, Video, Heart, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'

gsap.registerPlugin(useGSAP)

function WelcomeBanner({ profile }) {
  const ref = useRef(null)
  useGSAP(() => { gsap.set(ref.current, { y: 20, opacity: 0 }); gsap.to(ref.current, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }) }, [])

  return (
    <Card ref={ref} className="surface-card border-primary/20 bg-[radial-gradient(ellipse_at_top_right,rgba(62,207,142,0.06),transparent_60%)]">
      <CardContent className="p-6 sm:p-8">
        <h2 className="text-xl font-bold text-foreground tracking-tight mb-1">
          你好，{profile?.display_name || '用户'}
        </h2>
        <p className="text-sm text-muted-foreground">欢迎回来，今天也是美好的一天。</p>
      </CardContent>
    </Card>
  )
}

function QuickNav({ counts }) {
  const ref = useRef(null)
  useGSAP(() => {
    gsap.set('.nav-card', { y: 24, opacity: 0 }); gsap.to('.nav-card', { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out' })
  }, { scope: ref })

  const items = [
    { href: '/stories', icon: BookOpen, label: '故事', desc: '重温我们的回忆', count: counts.stories },
    { href: '/photos', icon: Camera, label: '相册', desc: '定格甜蜜瞬间', count: counts.photos },
    { href: '/videos', icon: Video, label: '视频', desc: '回放珍贵画面', count: counts.videos },
    { href: '/blessings', icon: Heart, label: '祝福', desc: '来自朋友的温暖', count: counts.blessings },
  ]

  return (
    <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
      {items.map((item, i) => (
        <Link key={i} href={item.href}>
          <Card className="nav-card surface-card hover:border-primary/20 transition-all duration-200 group cursor-pointer h-full">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <item.icon size={20} className="text-primary" />
                <span className="text-[11px] font-semibold text-muted-foreground bg-accent/80 px-2 py-0.5 rounded-full">{item.count ?? 0}</span>
              </div>
              <h3 className="font-semibold text-sm text-foreground mb-1">{item.label}</h3>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

function RecentActivity({ stories }) {
  const ref = useRef(null)
  useGSAP(() => {
    gsap.set('.activity-item', { y: 20, opacity: 0 }); gsap.to('.activity-item', { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power3.out' })
  }, { scope: ref, dependencies: [stories] })

  if (!stories.length) return null

  return (
    <div ref={ref} className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">最近更新</h3>
        <Link href="/stories" className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1">
          查看全部 <ArrowRight size={12} />
        </Link>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {stories.map((item) => (
          <Link key={item.id} href={`/stories/${item.id}`}>
            <Card className="activity-item surface-card hover:border-primary/20 transition-all duration-200">
              <CardContent className="p-5">
                <p className="text-[10px] text-primary font-medium uppercase tracking-widest mb-2">{item.date}</p>
                <h4 className="font-semibold text-sm text-foreground mb-1">{item.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2">{item.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const { stories: allStories, photos, videos, blessings } = useData()

  const counts = useMemo(() => ({
    stories: (allStories || []).filter(s => s.published).length,
    photos: (photos || []).length,
    videos: (videos || []).length,
    blessings: (blessings || []).length,
  }), [allStories, photos, videos, blessings])

  const recentStories = useMemo(
    () => (allStories || [])
      .filter(s => s.published)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 2)
      .map(s => ({
        id: s.id,
        title: s.title,
        date: s.story_date ? format(new Date(s.story_date), 'yyyy-MM-dd') : '',
        desc: s.content?.slice(0, 80) || '',
      })),
    [allStories]
  )

  return (
    <div className="max-w-5xl mx-auto">
      <WelcomeBanner profile={profile} />
      <QuickNav counts={counts} />
      <RecentActivity stories={recentStories} />
    </div>
  )
}
