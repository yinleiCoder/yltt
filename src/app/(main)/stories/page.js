'use client'

import { useRef, useMemo } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useData } from '@/contexts/data-context'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowRight, Sparkles, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { STORY_CATEGORIES } from '@/lib/constants'

gsap.registerPlugin(ScrollTrigger)

/* ── Single story card ─── */
function StoryCard({ story, index }) {
  const ref = useRef(null)
  const isLeft = index % 2 === 0

  useGSAP(() => {
    gsap.fromTo(ref.current,
      { y: 60, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true },
      }
    )
  }, { scope: ref })

  return (
    <div ref={ref} className={cn('flex items-center gap-4 sm:gap-8 group', isLeft ? 'flex-row' : 'flex-row-reverse')}>
      {/* Timeline dot */}
      <div className="relative flex items-center justify-center shrink-0">
        <div className="size-4 rounded-full bg-primary ring-4 ring-primary/10 z-10 transition-all duration-300 group-hover:scale-125 group-hover:ring-primary/20" />
      </div>

      {/* Card */}
      <Link href={`/stories/${story.id}`} className="flex-1 max-w-md">
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm hover:shadow-md hover:border-primary/10 transition-all duration-300 p-5 sm:p-6 group/card cursor-pointer">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="size-12 sm:size-14 rounded-xl bg-stone-50 border border-black/5 flex items-center justify-center text-2xl shrink-0 group-hover/card:scale-110 transition-transform duration-300">
              {story.cover_emoji || '💕'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-sm sm:text-base truncate">{story.title}</h3>
                {story.category && STORY_CATEGORIES[story.category] && (
                  <span className="text-[10px] font-semibold text-primary/70 bg-primary/5 px-2 py-0.5 rounded-full shrink-0">
                    {STORY_CATEGORIES[story.category]}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {story.content?.replace(/<[^>]*>/g, '').slice(0, 150) || '点击查看故事内容'}
              </p>
              {story.story_date && (
                <p className="text-[10px] text-muted-foreground/50 font-medium mt-2 flex items-center gap-1">
                  <Calendar size={10} />
                  {format(new Date(story.story_date), 'yyyy.MM.dd')}
                </p>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

/* ── Year divider ─── */
function YearDivider({ year }) {
  const ref = useRef(null)

  useGSAP(() => {
    gsap.fromTo(ref.current,
      { scaleX: 0, opacity: 0, transformOrigin: 'center' },
      {
        scaleX: 1, opacity: 1, duration: 0.6, ease: 'power3.out',
        scrollTrigger: { trigger: ref.current, start: 'top 90%', once: true },
      }
    )
  }, { scope: ref })

  return (
    <div ref={ref} className="relative flex items-center justify-center gap-4 py-8">
      <div className="h-px flex-1 bg-black/5" />
      <span className="text-sm font-black text-primary/60 tracking-widest">{year}</span>
      <div className="h-px flex-1 bg-black/5" />
    </div>
  )
}

export default function StoriesPage() {
  const { stories: allStories, isLoaded } = useData()
  const headerRef = useRef(null)
  const timelineRef = useRef(null)

  const stories = useMemo(() =>
    (allStories || []).filter(s => s.published).sort((a, b) => new Date(b.story_date || 0) - new Date(a.story_date || 0)),
    [allStories])

  /* ── Group by year for dividers ─── */
  const grouped = useMemo(() => {
    const map = {}
    for (const s of stories) {
      const y = s.story_date ? format(new Date(s.story_date), 'yyyy') : '未分类'
      if (!map[y]) map[y] = []
      map[y].push(s)
    }
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]))
  }, [stories])

  /* ── Header entrance ─── */
  useGSAP(() => {
    if (isLoaded) {
      gsap.fromTo('.timeline-header > *',
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
      )
    }
  }, { scope: headerRef, dependencies: [isLoaded] })

  /* ── Timeline line progress ─── */
  useGSAP(() => {
    if (!isLoaded || stories.length === 0) return
    gsap.fromTo('.timeline-line-fill',
      { scaleY: 0, transformOrigin: 'top center' },
      {
        scaleY: 1, transformOrigin: 'top center',
        ease: 'none',
        scrollTrigger: {
          trigger: timelineRef.current,
          start: 'top 40%',
          end: 'bottom bottom',
          scrub: 0.3,
        },
      }
    )
  }, { scope: timelineRef, dependencies: [isLoaded, stories.length] })

  /* ── Loading ─── */
  if (!isLoaded) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20">
        <Skeleton className="h-8 w-32 mx-auto mb-16 rounded" />
        <div className="space-y-12 max-w-md mx-auto">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="size-4 rounded-full shrink-0" />
              <Skeleton className="flex-1 h-28 rounded-2xl" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8">
      {/* Header */}
      <div ref={headerRef} className="timeline-header text-center pb-12 sm:pb-16">
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary/80 tracking-wide">
          <Sparkles size={14} className="text-primary/60" aria-hidden="true" /> 我们的时光
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-2 mb-3">故事</h1>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          沿着时间追溯我们的每一个珍贵时刻
        </p>
        {stories.length > 0 && (
          <p className="text-xs text-muted-foreground/40 mt-2 font-medium tabular-nums">{stories.length} 个故事</p>
        )}
      </div>

      {/* Empty */}
      {stories.length === 0 && (
        <div className="text-center py-16">
          <div className="size-16 rounded-2xl bg-stone-50 border border-black/5 flex items-center justify-center mx-auto mb-4">
            <Calendar size={28} className="text-muted-foreground/30" />
          </div>
          <h3 className="font-bold text-lg mb-2">还没有故事</h3>
          <p className="text-sm text-muted-foreground">去后台发布第一个故事吧</p>
        </div>
      )}

      {/* Timeline */}
      {stories.length > 0 && (
        <div ref={timelineRef} className="relative">
          {/* Central line */}
          <div className="absolute left-[7px] sm:left-1/2 sm:-translate-x-1/2 top-0 bottom-0 w-px bg-black/10">
            <div className="timeline-line-fill absolute inset-x-0 top-0 w-full bg-primary/30" />
          </div>

          <div className="space-y-6 sm:space-y-4">
            {grouped.map(([year, yearStories]) => (
              <div key={year}>
                <YearDivider year={year} />
                <div className="space-y-10 sm:space-y-8">
                  {yearStories.map((story, i) => (
                    <StoryCard key={story.id} story={story} index={i} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* End marker */}
          <div className="flex items-center justify-center pt-10 pb-4">
            <div className="size-8 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
              <span className="text-primary text-sm">♥</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
