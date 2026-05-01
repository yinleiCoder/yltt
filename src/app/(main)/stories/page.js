'use client'

import { useState, useRef, useMemo } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)
import { useData } from '@/contexts/data-context'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StoryViewer } from '@/components/story-viewer'
import { ArrowRight, Play } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { STORY_CATEGORIES } from '@/lib/constants'

export default function StoriesPage() {
  const { stories: allStories, isLoaded } = useData()
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const circlesRef = useRef(null)
  const listRef = useRef(null)

  const display = useMemo(
    () => (allStories || []).filter(s => s.published),
    [allStories]
  )

  useGSAP(() => {
    if (isLoaded && display.length > 0) {
      gsap.set('.story-circle', { scale: 0.8, opacity: 0 })
      gsap.to('.story-circle', { scale: 1, opacity: 1, duration: 0.4, stagger: 0.06, ease: 'back.out(1.7)' })
    }
  }, { scope: circlesRef, dependencies: [isLoaded, display.length] })

  useGSAP(() => {
    if (isLoaded && display.length > 0) {
      gsap.set('.story-card', { y: 24, opacity: 0 })
      gsap.to('.story-card', { y: 0, opacity: 1, duration: 0.4, stagger: 0.06, ease: 'power3.out' })
    }
  }, { scope: listRef, dependencies: [isLoaded, display.length] })

  const openViewer = (index) => {
    setViewerIndex(index)
    setViewerOpen(true)
  }

  const hasRealStories = display.length > 0

  return (
    <div className="max-w-3xl mx-auto">
      {/* Story Circles */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-bold text-foreground tracking-tight">故事</h2>
          {hasRealStories && (
            <span className="text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded-full">
              {display.length}
            </span>
          )}
        </div>
        <div ref={circlesRef} className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
          {display.map((s, i) => (
            <button
              key={s.id || i}
              className="story-circle flex-shrink-0 flex flex-col items-center gap-1.5 group"
              onClick={() => openViewer(i)}
            >
              <div
                className={cn(
                  'w-[72px] h-[72px] rounded-full p-[3px] transition-all duration-200',
                  'bg-gradient-to-br from-primary/70 via-primary to-primary/50',
                  'group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-primary/20',
                  'ring-2 ring-transparent group-hover:ring-primary/30',
                )}
              >
                <div className="w-full h-full rounded-full bg-card flex items-center justify-center text-3xl">
                  {s.cover_emoji || '💕'}
                </div>
              </div>
              <span className="text-[10px] text-foreground/60 group-hover:text-foreground/80 transition-colors max-w-[72px] truncate">
                {s.title}
              </span>
            </button>
          ))}
        </div>
        {!hasRealStories && isLoaded && (
          <p className="text-[10px] text-muted-foreground mt-2">
            还没有故事，去后台发布第一篇吧
          </p>
        )}
      </div>

      {/* Timeline */}
      <div ref={listRef}>
        <h3 className="text-sm font-semibold text-foreground/60 mb-4 uppercase tracking-wider">
          所有故事
        </h3>
        {display.length === 0 && isLoaded ? (
          <p className="text-sm text-muted-foreground text-center py-12">还没有故事</p>
        ) : (
          <div className="space-y-3">
            {display.map((s, i) => (
              <Card
                key={s.id}
                className="story-card surface-card hover:border-primary/15 transition-all duration-200 group cursor-pointer"
                onClick={() => openViewer(i)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                    {s.cover_emoji || '💕'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-medium text-foreground truncate">{s.title}</h4>
                      {s.category && STORY_CATEGORIES[s.category] && (
                        <Badge variant="secondary" className="text-[9px] bg-accent text-muted-foreground border-0 shrink-0">
                          {STORY_CATEGORIES[s.category]}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {s.content || ''}
                    </p>
                    {s.story_date && (
                      <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                        {format(new Date(s.story_date), 'yyyy.MM.dd')}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center gap-1">
                    <Play size={10} className="text-muted-foreground/30 group-hover:text-primary transition-colors" />
                    <Link
                      href={`/stories/${s.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[10px] text-muted-foreground/40 hover:text-primary transition-colors"
                    >
                      详情
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Story Viewer */}
      {viewerOpen && (
        <StoryViewer
          stories={display}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  )
}
