'use client'

import { useRef } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, BookOpen, Heart, Sparkles } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

function CountUp({ target }) {
  const ref = useRef(null)
  useGSAP(() => {
    const n = parseInt(target, 10)
    if (isNaN(n)) return
    const el = ref.current
    if (!el) return
    el.textContent = '0'
    const obj = { val: 0 }
    const t = gsap.to(obj, { val: n, duration: 2, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(obj.val) } })
    return () => t.kill()
  }, [target])
  return <span ref={ref}>0</span>
}

/* ── Hero ─── */
function HeroSection({ stats }) {
  const ref = useRef(null)
  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.fromTo('.hero-badge', { y: 16, opacity: 0, rotate: -5 }, { y: 0, opacity: 1, rotate: -1.5, duration: 0.5 })
      .fromTo('.hero-headline', { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, '-=0.25')
      .fromTo('.hero-sub', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, '-=0.4')
      .fromTo('.hero-cta', { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, '-=0.3')
      .fromTo('.hero-stat', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.07 }, '-=0.2')
  }, { scope: ref })

  return (
    <section ref={ref} className="relative min-h-[88dvh] flex items-center px-4 sm:px-8 lg:px-16">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-12 right-12 sm:top-20 sm:right-20 size-16 rounded-full bg-primary/20 border-2 border-black chunky-shadow-sm" />
        <div className="absolute top-32 left-8 sm:top-40 sm:left-16 size-10 rounded-full bg-yellow-300/60 border-2 border-black" />
        <div className="absolute bottom-20 right-8 sm:bottom-32 sm:right-24 size-12 rounded-full bg-sky-300/40 border-2 border-black" />
        <div className="absolute bottom-40 left-12 sm:bottom-48 sm:left-20 size-8 rounded bg-primary/30 border-2 border-black rotate-12" />
      </div>

      <div className="relative max-w-5xl mx-auto w-full">
        <div className="max-w-2xl space-y-6">
          <p className="hero-badge memphis-badge text-sm">
            <Sparkles size={13} className="inline mr-1 -mt-0.5" aria-hidden="true" />
            尹磊 & 唐涛
          </p>
          <h1 className="hero-headline text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]">
            属于我们的<br /><span className="text-primary">独家记忆</span>
          </h1>
          <p className="hero-sub text-base sm:text-lg text-muted-foreground max-w-lg leading-relaxed font-medium">
            记录从相识到相爱的每一个珍贵时刻，每一页都是我们共同书写的故事。
          </p>
          <div className="hero-cta flex flex-wrap gap-3 pt-1">
            <Link href="/stories">
              <Button size="lg" className="bg-white hover:bg-primary hover:text-white text-foreground font-black px-6 h-12 rounded-xl border-[2.5px] border-black chunky-shadow">
                <BookOpen size={18} className="mr-2" aria-hidden="true" />浏览故事<ArrowRight size={18} className="ml-2" aria-hidden="true" />
              </Button>
            </Link>
            <Link href="/blessings">
              <Button size="lg" variant="outline" className="bg-white text-foreground font-black px-6 h-12 rounded-xl border-[2.5px] border-black chunky-shadow-sm">
                <Heart size={18} className="mr-2" aria-hidden="true" />送上祝福
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 max-w-3xl pt-20">
          {[
            { label: '相识天数', value: stats.days, unit: '天' },
            { label: '故事', value: stats.stories, unit: '篇' },
            { label: '照片', value: stats.photos, unit: '张' },
            { label: '视频', value: stats.videos, unit: '个' },
            { label: '祝福', value: stats.blessings, unit: '条' },
          ].map((s, i) => (
            <div key={i} className="hero-stat bg-white border-[2.5px] border-black rounded-xl p-3 sm:p-4 chunky-shadow-sm">
              <p className="text-[10px] sm:text-xs font-black text-muted-foreground uppercase tracking-wider mb-1">{s.label}</p>
              <p className="text-xl sm:text-2xl font-black tracking-tight tabular-nums">
                <CountUp target={s.value} /><span className="text-sm font-bold text-muted-foreground ml-1">{s.unit}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Feature cards ─── */
function FeatureCards() {
  const ref = useRef(null)
  useGSAP(() => {
    gsap.fromTo('.feat-card', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: ref.current, start: 'top 82%', once: true } })
  }, { scope: ref })

  const items = [
    { emoji: '📖', title: '我们的故事', desc: '从初次相遇到每一个纪念日，每一个瞬间都值得珍藏。', href: '/stories' },
    { emoji: '📷', title: '美好相册', desc: '用镜头定格甜蜜，让回忆永不褪色。', href: '/photos' },
    { emoji: '🎬', title: '视频记忆', desc: '那些会动的画面，记录最真实的欢笑与感动。', href: '/videos' },
    { emoji: '💌', title: '温暖祝福', desc: '来自亲友的真诚祝愿，见证我们的幸福。', href: '/blessings' },
  ]

  return (
    <section ref={ref} className="py-24 sm:py-32 px-4 sm:px-8 lg:px-16">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">探索我们的世界</h2>
          <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-md">每一个角落都记录着我们生活中最珍贵的片段</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item, i) => (
            <Link key={i} href={item.href} className={`feat-card bg-white border-[2.5px] border-black rounded-2xl p-6 chunky-shadow transition-[box-shadow,transform] duration-150 hover:translate-y-[-3px] hover:shadow-[6px_6px_0_0_#1a1a1a] group ${i === 0 ? 'sm:col-span-2 lg:col-span-2' : ''}`}>
              <div className="flex items-center gap-3 mb-3"><span className="text-2xl" aria-hidden="true">{item.emoji}</span><h3 className="font-black text-lg">{item.title}</h3></div>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Story preview ─── */
function StoryPreview({ stories }) {
  const ref = useRef(null)
  useGSAP(() => {
    gsap.fromTo('.story-preview-card', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: ref.current, start: 'top 82%', once: true } })
  }, { scope: ref, dependencies: [stories] })

  if (!stories.length) {
    return <section className="py-24 px-4 sm:px-8 bg-[#f2efed]"><div className="max-w-6xl mx-auto text-center"><h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-3">最新故事</h2><p className="text-sm text-muted-foreground font-medium">还没有故事，去发布第一篇吧</p></div></section>
  }

  return (
    <section ref={ref} className="py-24 sm:py-32 px-4 sm:px-8 bg-[#f2efed]">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div><h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">最新故事</h2><p className="text-sm text-muted-foreground font-medium">每一个重要的时刻都值得铭记</p></div>
          <Link href="/stories" className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary/80 transition-colors">查看全部 <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {stories.map((s) => (
            <Link key={s.id} href={`/stories/${s.id}`} className="story-preview-card bg-white border-[2.5px] border-black rounded-2xl p-6 chunky-shadow transition-[box-shadow,transform] duration-150 hover:translate-y-[-3px] hover:shadow-[6px_6px_0_0_#1a1a1a]">
              <div className="flex items-center gap-2.5 mb-3"><span className="text-2xl" aria-hidden="true">{s.emoji}</span><p className="text-[10px] font-black text-primary uppercase tracking-widest">{s.date}</p></div>
              <h3 className="font-black text-base mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed line-clamp-3">{s.desc || '暂无内容'}</p>
            </Link>
          ))}
        </div>
        <div className="text-center mt-10 sm:hidden"><Link href="/stories" className="text-sm font-bold text-primary">查看全部故事 <ArrowRight size={14} className="inline ml-1" aria-hidden="true" /></Link></div>
      </div>
    </section>
  )
}

export function HomeClient({ stats, stories }) {
  return (<><HeroSection stats={stats} /><FeatureCards /><StoryPreview stories={stories} /></>)
}
