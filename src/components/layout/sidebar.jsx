'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Home, Heart, Camera, Video, BookOpen, LogOut, User, PanelLeftClose, PanelLeft, Info, Code2, FolderSearch, Music, Menu, X } from 'lucide-react'
import gsap from 'gsap'
import { cn } from '@/lib/utils'

function GirlIcon({ size = 18 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M12 12c-3 0-5 2-5 4v2h10v-2c0-2-2-4-5-4z" /><path d="M10 8c0-1 .8-1.5 1.5-1.5s1.5.5 1.5 1.5" /><path d="M8 6c-2-1-3-3-1-5" /><path d="M16 6c2-1 3-3 1-5" /></svg>)
}

const userLinks = [
  { href: '/', icon: Home, label: '首页' },
  { href: '/stories', icon: BookOpen, label: '故事' },
  { href: '/photos', icon: Camera, label: '相册' },
  { href: '/videos', icon: Video, label: '视频' },
  { href: '/blessings', icon: Heart, label: '祝福' },
]
const exploreLinks = [
  { href: '/opensource', icon: Code2, label: '开源软件' },
  { href: '/fileshare', icon: FolderSearch, label: '文件共享空间' },
  { href: '/about', icon: Info, label: '关于网站' },
]

function NavItem({ href, icon: Icon, label, collapsed, onClick }) {
  const c = cn('flex items-center rounded-lg transition-[color,background-color] duration-200 text-sm font-bold',
    collapsed ? 'justify-center size-10' : 'gap-3 w-full px-3 py-2',
    'text-black/50 hover:text-black hover:bg-stone-100')
  if (collapsed) return <div className="py-1.5 flex justify-center"><Tooltip delayDuration={300}><TooltipTrigger render={<Link href={href} className={c} aria-label={label} onClick={onClick}><Icon size={18} /></Link>} /><TooltipContent side="right">{label}</TooltipContent></Tooltip></div>
  return <div className="py-1"><Link href={href} className={c} onClick={onClick}><Icon size={18} className="shrink-0" /><span className="whitespace-nowrap">{label}</span></Link></div>
}

export function Sidebar({ mobileOpen, onMobileClose }) {
  const pathname = usePathname()
  const { user, profile, isAdmin, signOut } = useAuth()
  const pathBase = pathname === '/' ? '/' : '/' + pathname.split('/')[1]
  const autoCollapse = pathBase === '/photos' || pathBase === '/videos'
  const [collapsed, setCollapsed] = useState(autoCollapse)
  const [isMobile, setIsMobile] = useState(false)
  const sidebarRef = useRef(null)
  const tweenRef = useRef(null)
  const animatingRef = useRef(false)
  const overlayRef = useRef(null)

  /* ── Detect mobile ─── */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check(); window.addEventListener('resize', check); return () => window.removeEventListener('resize', check)
  }, [])

  const isActive = useCallback((href) => href === '/' ? pathname === '/' : pathname.startsWith(href), [pathname])

  const adminLinks = useMemo(() => !isAdmin ? [] : [
    { href: '/admin', icon: GirlIcon, label: '管理后台' }, { href: '/admin/users', icon: User, label: '用户管理' },
    { href: '/admin/stories', icon: BookOpen, label: '故事管理' }, { href: '/admin/photos', icon: Camera, label: '相册管理' },
    { href: '/admin/videos', icon: Video, label: '视频管理' }, { href: '/admin/music', icon: Music, label: '音乐管理' },
    { href: '/admin/oshare', icon: FolderSearch, label: '文件共享管理' },
  ], [isAdmin])

  /* ── GSAP width animation (desktop only) ─── */
  useEffect(() => {
    if (isMobile || !sidebarRef.current) return
    const el = sidebarRef.current
    const targetW = collapsed ? 64 : 240
    if (tweenRef.current) tweenRef.current.kill()
    animatingRef.current = true
    tweenRef.current = gsap.to(el, { width: targetW, duration: 0.35, ease: 'power3.inOut', onComplete: () => { animatingRef.current = false } })
    return () => { if (tweenRef.current) tweenRef.current.kill() }
  }, [collapsed, isMobile])

  /* ── Mobile overlay animation ─── */
  useEffect(() => {
    if (!overlayRef.current) return
    if (mobileOpen) {
      gsap.to(overlayRef.current, { x: 0, duration: 0.3, ease: 'power3.out' })
    } else {
      gsap.to(overlayRef.current, { x: '-100%', duration: 0.25, ease: 'power3.in' })
    }
  }, [mobileOpen])

  const handleToggle = useCallback(() => { if (!animatingRef.current) setCollapsed(p => !p) }, [])
  const closeMobile = () => onMobileClose?.()

  const content = (<>
    {/* Logo */}
    <Link href="/" className="flex items-center gap-3 p-4 hover:bg-stone-100 transition-colors shrink-0 overflow-hidden" aria-label="首页" onClick={closeMobile}>
      <div className="size-8 rounded-lg bg-primary flex items-center justify-center shrink-0 chunky-shadow-sm"><GirlIcon /></div>
      <span className={cn('font-black text-sm tracking-tight whitespace-nowrap transition-opacity duration-300', (!isMobile && collapsed) ? 'opacity-0' : 'opacity-100')}>YlTt's 2025</span>
    </Link>

    <div className="px-3"><Separator className="bg-black/20" /></div>

    <nav className="flex-1 min-h-0 py-2 px-2 overflow-y-auto scrollbar-none" data-lenis-prevent>
      {userLinks.map(l => <NavItem key={l.href} {...l} collapsed={!isMobile && collapsed} isActive={isActive(l.href)} onClick={closeMobile} />)}
      <NavSection label="探索" collapsed={!isMobile && collapsed} />
      {exploreLinks.map(l => <NavItem key={l.href} {...l} collapsed={!isMobile && collapsed} isActive={isActive(l.href)} onClick={closeMobile} />)}
      {adminLinks.length > 0 && (<><NavSection label="管理" collapsed={!isMobile && collapsed} />{adminLinks.map(l => <NavItem key={l.href} {...l} collapsed={!isMobile && collapsed} isActive={isActive(l.href)} onClick={closeMobile} />)}</>)}
    </nav>

    <div className="px-3"><Separator className="bg-black/20" /></div>

    <div className="p-3 shrink-0">
      {user ? (
        <div className="flex items-center gap-3 overflow-hidden">
          <Link href="/profile" className="shrink-0" aria-label="个人资料" onClick={closeMobile}><Avatar className="size-8 ring-1 ring-black/10">{profile?.avatar_url ? <AvatarImage src={profile.avatar_url} /> : null}<AvatarFallback className="bg-stone-200 text-foreground text-xs font-bold">{profile?.display_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}</AvatarFallback></Avatar></Link>
          <div className={cn('flex-1 min-w-0 flex items-center gap-1 whitespace-nowrap transition-opacity duration-300', (!isMobile && collapsed) ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100')}>
            <div className="flex-1 min-w-0"><p className="text-xs font-bold truncate">{profile?.display_name || '用户'}</p><p className="text-[10px] text-black/40 truncate">{user.email}</p></div>
            <Button variant="ghost" size="icon" className="size-7 text-black/40 hover:text-black" onClick={signOut} aria-label="退出登录"><LogOut size={14} /></Button>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden">
          <Link href="/login" onClick={closeMobile}><Button variant="outline" size="sm" className="w-full border-2 border-black text-foreground/70 hover:bg-stone-100 text-xs h-8 font-bold">登录</Button></Link>
          <div className={cn('transition-all duration-300', (!isMobile && collapsed) ? 'h-0 opacity-0 overflow-hidden' : 'h-auto opacity-100 mt-2')}><Link href="/register" onClick={closeMobile}><Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-white text-xs h-8 font-bold border-2 border-black chunky-shadow-sm">注册</Button></Link></div>
        </div>
      )}
    </div>
  </>)

  /* ── Mobile: slide-out drawer ─── */
  if (isMobile) {
    return (<>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden cursor-pointer" onClick={closeMobile} />}
      <aside ref={overlayRef} className="fixed top-0 left-0 z-50 h-dvh w-64 flex flex-col bg-white text-sidebar-foreground border-r-[2.5px] border-black lg:hidden shadow-xl" style={{ transform: 'translateX(-100%)' }}>
        {content}
      </aside>
    </>)
  }

  /* ── Desktop: fixed sidebar ─── */
  return (
    <aside ref={sidebarRef} id="app-sidebar" className="sticky top-0 z-30 h-dvh shrink-0 flex-col bg-white text-sidebar-foreground border-r-[2.5px] border-black hidden lg:flex" style={{ width: 240 }}>
      {content}
      <button className="absolute -right-2.5 top-1/2 -translate-y-1/2 size-6 rounded-full bg-white border-2 border-black chunky-shadow-sm flex items-center justify-center hover:bg-stone-50 transition-colors z-10 hidden lg:flex" onClick={handleToggle} aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}>
        {collapsed ? <PanelLeft size={11} className="text-black" /> : <PanelLeftClose size={11} className="text-black" />}
      </button>
    </aside>
  )
}

function NavSection({ label, collapsed }) {
  return (<><div className="px-2"><Separator className="bg-black/20 my-3" /></div><p className={cn('px-3 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-opacity duration-300', collapsed ? 'opacity-0' : 'opacity-100 text-black/30')}>{label}</p></>)
}
