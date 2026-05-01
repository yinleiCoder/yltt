'use client'

import { useRef, useEffect } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, BookOpen, Camera, Heart, Video } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

function CountUp({ target }) {
  const ref = useRef(null)
  const tweenRef = useRef(null)

  useEffect(() => {
    const numVal = parseInt(target, 10)
    if (isNaN(numVal)) return
    const el = ref.current
    if (!el) return

    el.textContent = '0'
    const obj = { val: 0 }
    tweenRef.current = gsap.to(obj, {
      val: numVal,
      duration: 2,
      ease: 'power2.out',
      onUpdate: () => { el.textContent = Math.round(obj.val) },
    })

    return () => { if (tweenRef.current) tweenRef.current.kill() }
  }, [target])

  return <span ref={ref}>0</span>
}

function HeroSection({ stats }) {
  const ref = useRef(null)

  useEffect(() => {
    const items = ref.current?.querySelectorAll('.hero-item')
    if (!items?.length) return

    gsap.set(items, { y: 40, opacity: 0 })
    gsap.to(items, {
      y: 0, opacity: 1, duration: 0.9, stagger: 0.2, ease: 'power3.out',
    })
  }, [])

  return (
    <section ref={ref} className="relative min-h-[80vh] flex flex-col items-center justify-center text-center px-4 -mt-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(62,207,142,0.06),transparent_50%)]" />

      <div className="relative max-w-3xl space-y-8">
        <div className="hero-item inline-flex items-center gap-2 px-3 py-1 rounded-md bg-primary/10 border border-primary/20 text-primary text-xs font-medium tracking-wide uppercase">
          尹磊 & 唐涛
        </div>

        <h1 className="hero-item text-4xl sm:text-5xl md:text-6xl font-bold text-foreground tracking-tight leading-tight">
          Our Story,<br />
          <span className="text-primary">Forever.</span>
        </h1>

        <p className="hero-item text-base sm:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
          记录我们的每一个重要时刻，从相识到相爱，每一页都是属于我们的独家记忆。
        </p>

        <div className="hero-item flex flex-wrap gap-3 justify-center">
          <Link href="/stories">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium group rounded-lg">
              <BookOpen size={16} className="mr-2" />
              浏览故事
              <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
          <Link href="/blessings">
            <Button size="lg" variant="outline" className="border-border hover:bg-accent text-foreground font-medium rounded-lg">
              <Heart size={16} className="mr-2" />
              送上祝福
            </Button>
          </Link>
        </div>

        <div className="hero-item grid grid-cols-3 sm:grid-cols-5 gap-4 sm:gap-6 max-w-2xl mx-auto pt-12">
          {[
            { label: '相识天数', value: stats.days, unit: '天' },
            { label: '故事', value: stats.stories, unit: '篇' },
            { label: '照片', value: stats.photos, unit: '张' },
            { label: '视频', value: stats.videos, unit: '个' },
            { label: '祝福', value: stats.blessings, unit: '条' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                <CountUp target={s.value} /><span className="text-sm sm:text-base text-muted-foreground font-normal ml-0.5">{s.unit}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureCards() {
  const ref = useRef(null)

  useEffect(() => {
    const items = ref.current?.querySelectorAll('.feat-card')
    if (!items?.length) return

    gsap.set(items, { y: 30, opacity: 0 })
    const st = ScrollTrigger.create({
      trigger: ref.current,
      start: 'top 75%',
      onEnter: () => {
        gsap.to(items, { y: 0, opacity: 1, duration: 0.6, stagger: 0.15, ease: 'power3.out' })
      },
    })
    return () => st.kill()
  }, [])

  const items = [
    { icon: BookOpen, title: '故事', desc: '从初次相遇到每一个纪念日，我们的故事在这里一一展开。', href: '/stories', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { icon: Camera, title: '相册', desc: '用镜头定格每一个甜蜜瞬间，让回忆永不褪色。', href: '/photos', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { icon: Video, title: '视频', desc: '那些会动的画面，记录着最真实的欢笑与感动。', href: '/videos', color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { icon: Heart, title: '祝福', desc: '来自朋友和家人的真诚祝福，见证我们的幸福。', href: '/blessings', color: 'text-rose-400', bg: 'bg-rose-500/10' },
  ]

  return (
    <section ref={ref} className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-3">探索我们的世界</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">每一个板块都记录着我们生活中最珍贵的片段</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item, i) => (
            <Link key={i} href={item.href}>
              <Card className="feat-card surface-card hover:border-primary/30 transition-all duration-300 group h-full cursor-pointer">
                <CardContent className="p-6">
                  <div className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center mb-4`}>
                    <item.icon size={18} className={item.color} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function StoryPreview({ stories }) {
  const ref = useRef(null)

  useEffect(() => {
    const items = ref.current?.querySelectorAll('.story-preview-card')
    if (!items?.length) return

    gsap.set(items, { y: 30, opacity: 0 })
    const st = ScrollTrigger.create({
      trigger: ref.current,
      start: 'top 75%',
      onEnter: () => {
        gsap.to(items, { y: 0, opacity: 1, duration: 0.6, stagger: 0.15, ease: 'power3.out' })
      },
    })
    return () => st.kill()
  }, [stories])

  if (!stories.length) {
    return (
      <section className="py-24 px-4 bg-[#0a0c0c]">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-foreground tracking-tight mb-3">最新故事</h2>
          <p className="text-sm text-muted-foreground">还没有故事，去发布第一篇吧</p>
        </div>
      </section>
    )
  }

  return (
    <section ref={ref} className="py-24 px-4 bg-[#0a0c0c]">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-14">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">最新故事</h2>
            <p className="text-sm text-muted-foreground">每一个重要的时刻都值得铭记</p>
          </div>
          <Link href="/stories" className="hidden sm:flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium">
            查看全部 <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {stories.map((s) => (
            <Link key={s.id} href={`/stories/${s.id}`}>
              <Card className="story-preview-card surface-card hover:border-primary/20 transition-all duration-300 h-full">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{s.emoji}</span>
                    <p className="text-[10px] text-primary font-medium uppercase tracking-widest">{s.date}</p>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{s.desc || '暂无内容'}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center mt-10 sm:hidden">
          <Link href="/stories" className="text-sm text-primary font-medium">查看全部故事 <ArrowRight size={14} className="inline ml-1" /></Link>
        </div>
      </div>
    </section>
  )
}

export function HomeClient({ stats, stories }) {
  return (
    <>
      <HeroSection stats={stats} />
      <FeatureCards />
      <StoryPreview stories={stories} />
    </>
  )
}
