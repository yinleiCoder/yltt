'use client'

import { useRef, useMemo } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useData } from '@/contexts/data-context'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Clock, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { STORY_CATEGORIES } from '@/lib/constants'

gsap.registerPlugin(ScrollTrigger)

export default function StoriesPage() {
  const { stories: allStories, isLoaded } = useData()
  const headerRef = useRef(null)
  const timelineRef = useRef(null)
  const lineFillRef = useRef(null)

  const display = useMemo(() =>
    (allStories || []).filter(s => s.published).sort((a, b) =>
      new Date(b.story_date || 0) - new Date(a.story_date || 0)
    ), [allStories])

  /* Header entrance */
  useGSAP(() => {
    if (isLoaded) gsap.fromTo('.timeline-header', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' })
  }, { scope: headerRef, dependencies: [isLoaded] })

  /* Timeline fill line */
  useGSAP(() => {
    if (!lineFillRef.current || display.length === 0) return
    ScrollTrigger.create({
      trigger: timelineRef.current, start: 'top 30%', end: 'bottom bottom',
      onUpdate: (self) => { gsap.set(lineFillRef.current, { scaleY: self.progress, transformOrigin: 'top center' }) },
    })
  }, { scope: timelineRef, dependencies: [isLoaded, display.length] })

  /* Card reveal */
  useGSAP(() => {
    if (!isLoaded || display.length === 0) return
    const cards = gsap.utils.toArray('.timeline-card')
    cards.forEach((card, i) => {
      gsap.fromTo(card, { x: i % 2 === 0 ? -40 : 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 82%', once: true } })
    })
  }, { scope: timelineRef, dependencies: [isLoaded, display.length] })

  const formatStoryDate = (dateStr) => {
    if (!dateStr) return {}
    const d = new Date(dateStr)
    return { year: format(d, 'yyyy'), monthDay: format(d, 'MM.dd') }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8">
      <div ref={headerRef} className="timeline-header pt-8 pb-16 text-center">
        <span className="memphis-badge mb-4"><Clock size={13} className="inline mr-1" aria-hidden="true" />我们的时光</span>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mt-4 mb-3">故事时间线</h1>
        <p className="text-sm text-muted-foreground font-medium max-w-md mx-auto">沿着时间追溯我们共同走过的每一个珍贵时刻</p>
        {isLoaded && display.length > 0 && <p className="text-xs text-muted-foreground/50 mt-2 font-bold tabular-nums">{display.length} 个故事</p>}
      </div>

      {!isLoaded && (
        <div className="space-y-8 pb-20 max-w-lg mx-auto">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-start' : 'justify-end')}>
              <div className="w-[85%] bg-white border-[2.5px] border-black/20 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3"><Skeleton className="size-12 rounded-full" /><div className="space-y-2 flex-1"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/2" /></div></div>
                <Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-4/5 mt-1.5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isLoaded && display.length === 0 && (
        <div className="text-center py-20">
          <div className="size-16 rounded-full bg-accent border-[2.5px] border-black chunky-shadow-sm flex items-center justify-center mx-auto mb-4"><Clock size={28} className="text-muted-foreground" aria-hidden="true" /></div>
          <h3 className="font-black text-lg mb-2">还没有故事</h3><p className="text-sm text-muted-foreground font-medium">去后台发布第一个故事，开始你的时间线吧</p>
        </div>
      )}

      {isLoaded && display.length > 0 && (
        <div ref={timelineRef} className="relative pb-24">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[3px] h-full bg-black/10 rounded-full" aria-hidden="true">
            <div ref={lineFillRef} className="absolute inset-x-0 top-0 w-full bg-primary origin-top scale-y-0 rounded-full" />
          </div>
          <div className="text-center mb-10 text-muted-foreground/40"><ChevronDown size={20} className="mx-auto animate-bounce" aria-hidden="true" /></div>

          <div className="relative space-y-16 sm:space-y-20">
            {display.map((s, i) => {
              const isLeft = i % 2 === 0
              const dateInfo = formatStoryDate(s.story_date)
              return (
                <div key={s.id} className={cn('flex', isLeft ? 'justify-start' : 'justify-end')}>
                  <div className={cn('relative w-full sm:w-[calc(50%-32px)]', isLeft ? 'sm:pr-8' : 'sm:pl-8')}>
                    <div className={cn('hidden sm:block absolute top-6 z-10', isLeft ? '-right-[9px]' : '-left-[9px]')}>
                      <div className="size-[18px] rounded-full bg-primary border-[2.5px] border-black chunky-shadow-sm" />
                    </div>
                    {dateInfo.year && <div className={cn('mb-2 text-xs font-black text-primary uppercase tracking-widest', isLeft ? 'text-left' : 'text-right')}>{dateInfo.year} · {dateInfo.monthDay}</div>}
                    <Link href={`/stories/${s.id}`} className="block">
                      <Card className="timeline-card bg-white border-[2.5px] border-black rounded-2xl chunky-shadow transition-[box-shadow,transform] duration-150 hover:translate-y-[-3px] hover:shadow-[6px_6px_0_0_#1a1a1a] group">
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className="size-11 sm:size-12 rounded-full bg-accent border-2 border-black flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform duration-200" aria-hidden="true">{s.cover_emoji || '💕'}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-black text-sm sm:text-base truncate">{s.title}</h3>
                                {s.category && STORY_CATEGORIES[s.category] && <Badge variant="secondary" className="text-[9px] bg-primary/10 text-primary border border-primary/20 font-bold shrink-0 rounded-full">{STORY_CATEGORIES[s.category]}</Badge>}
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed line-clamp-2">{s.content?.replace(/<[^>]*>/g, '').slice(0, 120) || '点击查看故事内容'}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t-2 border-black/10">
                            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">阅读详情 <ArrowRight size={11} aria-hidden="true" /></span>
                            {s.media_url && <span className="text-[10px]">{s.media_type === 'video' ? '🎬' : '📷'}</span>}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="relative flex justify-center pt-16"><div className="size-8 rounded-full bg-primary border-[2.5px] border-black chunky-shadow-sm flex items-center justify-center relative z-10"><span className="text-white text-xs font-black">♥</span></div></div>
        </div>
      )}
    </div>
  )
}
