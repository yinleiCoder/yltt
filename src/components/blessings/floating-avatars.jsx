'use client'

import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Trash2, MapPin, Monitor } from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '@/contexts/auth-context'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { getFileUrl } from '@/lib/oss-client'

const AVATAR_SIZE = 44
const MIN_DIST = 56
const WOBBLES = ['animate-bubble-wobble', 'animate-bubble-wobble-b', 'animate-bubble-wobble-c']
const MAX_ATTEMPTS = 30

function hashCode(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash)
}

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

const AVATAR_COLORS = ['#3ecf8e', '#6366f1', '#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4', '#10b981', '#ef4444']
function getAvatarBg(id) {
  return AVATAR_COLORS[hashCode(String(id)) % AVATAR_COLORS.length]
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name[0].toUpperCase()
}

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

export default function FloatingAvatars({ blessings = [], onDelete }) {
  const { user, profile } = useAuth()
  const containerRef = useRef(null)
  const [expandedId, setExpandedId] = useState(null)
  const [containerSize, setContainerSize] = useState({ w: 800, h: 500 })
  const hideTimerRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const [cardPos, setCardPos] = useState(null)
  const [cardDir, setCardDir] = useState('up')

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setContainerSize({ w: rect.width, h: rect.height })
      }
    }
    measure()
    window.addEventListener('resize', measure)
    const t = setTimeout(() => setVisible(true), 400)
    return () => {
      window.removeEventListener('resize', measure)
      clearTimeout(t)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [blessings])

  // Random scatter with collision avoidance
  const positioned = useMemo(() => {
    if (!blessings.length || containerSize.w < 100) return []
    const { w, h } = containerSize
    const padding = 8
    const maxX = w - AVATAR_SIZE - padding
    const maxY = h - AVATAR_SIZE - padding

    const positions = []
    const results = []

    blessings.forEach((b) => {
      const seed = hashCode(String(b.id))
      let px, py
      let placed = false

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const tx = padding + seededRandom(seed + attempt * 97 + 1) * maxX
        const ty = padding + seededRandom(seed + attempt * 97 + 2) * maxY
        if (positions.every((p) => dist(p, { x: tx, y: ty }) >= MIN_DIST)) {
          px = tx; py = ty; placed = true; break
        }
      }
      // Fallback: grid with jitter if random fails
      if (!placed) {
        const i = results.length
        const cols = Math.floor(w / MIN_DIST)
        const row = Math.floor(i / cols)
        const col = i % cols
        px = padding + col * MIN_DIST + seededRandom(seed + 3) * 8
        py = padding + row * MIN_DIST + seededRandom(seed + 4) * 8
        px = Math.min(px, maxX)
        py = Math.min(py, maxY)
      }

      positions.push({ x: px, y: py })

      const wobbleClass = WOBBLES[Math.floor(seededRandom(seed + 5) * WOBBLES.length)]
      const delay = seededRandom(seed + 6) * 1.5
      const wobbleDur = 3 + seededRandom(seed + 7) * 4
      const wobbleDelay = seededRandom(seed + 8) * 2

      // Check if card should go down (avatar near top)
      results.push({
        ...b,
        _x: px,
        _y: py,
        _delay: delay,
        _duration: 2.5 + seededRandom(seed + 9) * 2,
        _wobbleClass: wobbleClass,
        _wobbleDur: wobbleDur,
        _wobbleDelay: wobbleDelay,
      })
    })

    return results
  }, [blessings, containerSize])

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  const startHideTimer = useCallback(() => {
    hideTimerRef.current = setTimeout(() => {
      setExpandedId(null)
      setCardPos(null)
    }, 5000)
  }, [])

  const handleEnter = useCallback((b, e) => {
    clearHideTimer()
    const containerRect = containerRef.current?.getBoundingClientRect()
    const targetRect = e.currentTarget.getBoundingClientRect()
    if (!containerRect) return

    const elCenterX = targetRect.left + targetRect.width / 2
    const elTop = targetRect.top - containerRect.top
    const viewportW = window.innerWidth

    const cardW = 256
    let left = elCenterX - cardW / 2
    if (left < 12) left = 12
    if (left + cardW > viewportW - 12) left = viewportW - cardW - 12

    const dir = elTop < containerRect.height * 0.35 ? 'down' : 'up'
    setCardDir(dir)
    setCardPos({
      left,
      top: dir === 'up' ? targetRect.top - 12 : targetRect.bottom + 12,
    })
    setExpandedId(b.id)
  }, [clearHideTimer])

  const handleLeave = useCallback(() => {
    startHideTimer()
  }, [startHideTimer])

  if (!blessings.length) return null

  const expandedItem = blessings.find(b => b.id === expandedId)

  return (
    <div ref={containerRef} className="w-full flex-1 relative" style={{ minHeight: '400px' }}>
      {positioned.map((b) => {
        const isExpanded = expandedId === b.id
        const riseDistance = containerSize.h - b._y + 180

        return (
          <div
            key={b.id}
            className="absolute"
            style={{
              left: b._x,
              top: b._y,
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              transition: `transform ${b._duration}s cubic-bezier(0.22, 0.61, 0.36, 1) ${b._delay}s, opacity 0.6s ease ${b._delay}s`,
              transform: visible ? 'translateY(0)' : `translateY(${riseDistance}px)`,
              opacity: visible ? 1 : 0,
              zIndex: isExpanded ? 50 : 10,
            }}
            onMouseEnter={(e) => handleEnter(b, e)}
            onMouseLeave={handleLeave}
          >
            <div
              className={`w-full h-full ${b._wobbleClass}`}
              style={{
                animationDuration: `${b._wobbleDur}s`,
                animationDelay: `${b._wobbleDelay}s`,
              }}
            >
              <Avatar className="w-full h-full rounded-full shadow-lg cursor-default" style={{ boxShadow: `0 0 14px ${getAvatarBg(b.id)}44` }}>
                {b.author_profile?.avatar_url ? <AvatarImage src={getFileUrl(b.author_profile.avatar_url)} alt={b.author_name || ''} /> : null}
                <AvatarFallback
                  className="text-[16px] font-bold"
                  style={{ backgroundColor: getAvatarBg(b.id), color: '#fff' }}
                >
                  {getInitials(b.author_name || b.author_profile?.display_name || '匿')}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        )
      })}

      {/* Portal card - rendered at document body level to avoid sidebar clipping */}
      {expandedItem && cardPos && (() => {
        const displayName = expandedItem.author_name || expandedItem.author_profile?.display_name || '匿名'
        return createPortal(
          <div
            className="fixed w-64 surface-card rounded-xl p-4 shadow-2xl animate-fade-in-scale pointer-events-auto"
            style={{
              left: cardPos.left,
              top: cardPos.top,
              zIndex: 9999,
              borderColor: '#3ecf8e',
              borderWidth: 1,
              transform: cardDir === 'up' ? 'translateY(-100%)' : 'none',
            }}
            onMouseEnter={clearHideTimer}
            onMouseLeave={startHideTimer}
          >
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="w-7 h-7 rounded-full shrink-0">
                {expandedItem.author_profile?.avatar_url ? <AvatarImage src={getFileUrl(expandedItem.author_profile.avatar_url)} alt={displayName} /> : null}
                <AvatarFallback
                  className="text-[10px] font-bold"
                  style={{ backgroundColor: getAvatarBg(expandedItem.id), color: '#fff' }}
                >
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                <p className="text-[10px] text-muted-foreground">
                  {expandedItem.created_at ? format(new Date(expandedItem.created_at), 'MM-dd HH:mm') : ''}
                </p>
              </div>
              {(user?.id === expandedItem.user_id || profile?.role === 'admin') && (
                <button
                  onClick={() => { onDelete(expandedItem.id); setExpandedId(null); setCardPos(null) }}
                  className="ml-auto text-muted-foreground/30 hover:text-destructive transition-colors shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            <p className="text-sm text-foreground/80 leading-relaxed mb-2.5">{expandedItem.content}</p>

            <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50 border-t border-border pt-2.5">
              {expandedItem.ip_location && <span className="flex items-center gap-0.5"><MapPin size={10} />{expandedItem.ip_location}</span>}
              {expandedItem.device_info && <span className="flex items-center gap-0.5"><Monitor size={10} />{expandedItem.device_info}</span>}
            </div>
          </div>,
          document.body
        )
      })()}
    </div>
  )
}
