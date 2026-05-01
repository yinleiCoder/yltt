'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Home, Heart, Camera, Video, BookOpen,
  LogOut, User, PanelLeftClose, PanelLeft,
  Info, Code2, FolderSearch,
} from 'lucide-react'
import { cn } from '@/lib/utils'

function RabbitIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="8" cy="6" rx="2.5" ry="5" />
      <ellipse cx="16" cy="6" rx="2.5" ry="5" />
      <path d="M4 13C4 8 7 5 12 5C17 5 20 8 20 13C20 17 17 21 12 21C7 21 4 17 4 13Z" />
      <circle cx="9" cy="14" r="1" fill="currentColor" />
      <circle cx="15" cy="14" r="1" fill="currentColor" />
      <path d="M11 17.5L12 18.5L13 17.5" strokeWidth="1.5" />
      <path d="M5 14L2 13.5" />
      <path d="M5 16L2 16.5" />
      <path d="M19 14L22 13.5" />
      <path d="M19 16L22 16.5" />
    </svg>
  )
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

const adminLinks = [
  { href: '/admin', icon: RabbitIcon, label: '管理后台' },
  { href: '/admin/users', icon: User, label: '用户管理' },
  { href: '/admin/stories', icon: BookOpen, label: '故事管理' },
  { href: '/admin/photos', icon: Camera, label: '相册管理' },
  { href: '/admin/videos', icon: Video, label: '视频管理' },
  { href: '/admin/oshare', icon: FolderSearch, label: '文件共享管理' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, profile, isAdmin, signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const isActive = (href) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={cn(
        'sticky top-0 z-40 h-screen flex-shrink-0 flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300',
        'border-r border-sidebar-border',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <Link href="/" className={cn('flex items-center gap-3 p-4 hover:bg-sidebar-accent/50 transition-colors', collapsed && 'justify-center')}>
        <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#060808" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="8" cy="6" rx="2.5" ry="5" />
            <ellipse cx="16" cy="6" rx="2.5" ry="5" />
            <path d="M4 13C4 8 7 5 12 5C17 5 20 8 20 13C20 17 17 21 12 21C7 21 4 17 4 13Z" />
            <circle cx="9" cy="14" r="1" fill="#060808" />
            <circle cx="15" cy="14" r="1" fill="#060808" />
          </svg>
        </div>
        {!collapsed && (
          <span className="font-semibold text-sm tracking-tight">YlTt's 2025</span>
        )}
      </Link>

      <div className="px-3"><Separator className="bg-sidebar-border" /></div>

      {/* Nav */}
      <nav className="flex-1 min-h-0 py-2 px-2 overflow-y-auto scrollbar-none" data-lenis-prevent>
        {userLinks.map((link) =>
          collapsed ? (
            <div key={link.href} className="py-1.5 flex justify-center">
              <Tooltip delayDuration={300}>
                <TooltipTrigger render={
                  <Link
                    href={link.href}
                    className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150',
                      isActive(link.href)
                        ? 'bg-primary/10 text-primary'
                        : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                    )}
                  >
                    <link.icon size={18} />
                  </Link>
                } />
                <TooltipContent side="right">{link.label}</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div key={link.href} className="py-1">
              <Link
                href={link.href}
                className={cn(
                  'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive(link.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                <link.icon size={18} className="shrink-0" />
                <span>{link.label}</span>
              </Link>
            </div>
          )
        )}

        <div className="px-2"><Separator className="bg-sidebar-border my-3" /></div>
        <p className={cn('px-3 text-[10px] font-medium text-sidebar-foreground/30 uppercase tracking-widest', collapsed && 'hidden')}>
          探索
        </p>
        {exploreLinks.map((link) =>
          collapsed ? (
            <div key={link.href} className="py-1.5 flex justify-center">
              <Tooltip delayDuration={300}>
                <TooltipTrigger render={
                  <Link
                    href={link.href}
                    className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150',
                      isActive(link.href)
                        ? 'bg-primary/10 text-primary'
                        : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                    )}
                  >
                    <link.icon size={18} />
                  </Link>
                } />
                <TooltipContent side="right">{link.label}</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div key={link.href} className="py-1">
              <Link
                href={link.href}
                className={cn(
                  'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive(link.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                <link.icon size={18} className="shrink-0" />
                <span>{link.label}</span>
              </Link>
            </div>
          )
        )}

        {isAdmin && (
          <>
            <div className="px-2"><Separator className="bg-sidebar-border my-3" /></div>
            <p className={cn('px-3 text-[10px] font-medium text-sidebar-foreground/30 uppercase tracking-widest', collapsed && 'hidden')}>
              管理
            </p>
            {adminLinks.map((link) =>
              collapsed ? (
                <div key={link.href} className="py-1.5 flex justify-center">
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger render={
                      <Link
                        href={link.href}
                        className={cn(
                          'flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150',
                          isActive(link.href)
                            ? 'bg-primary/10 text-primary'
                            : 'text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                        )}
                      >
                        <link.icon size={18} />
                      </Link>
                    } />
                    <TooltipContent side="right">{link.label}</TooltipContent>
                  </Tooltip>
                </div>
              ) : (
                <div key={link.href} className="py-1">
                  <Link
                    href={link.href}
                    className={cn(
                      'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                      isActive(link.href)
                        ? 'bg-primary/10 text-primary'
                        : 'text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                    )}
                  >
                    <link.icon size={18} className="shrink-0" />
                    <span>{link.label}</span>
                  </Link>
                </div>
              )
            )}
          </>
        )}
      </nav>

      <div className="px-3"><Separator className="bg-sidebar-border" /></div>

      {/* User */}
      <div className="p-3">
        {user ? (
          <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
            <Link href="/profile" className="shrink-0">
              <Avatar className="w-8 h-8 ring-1 ring-sidebar-border">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-xs">
                  {profile?.display_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Link>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{profile?.display_name || '用户'}</p>
                  <p className="text-[10px] text-sidebar-foreground/40 truncate">{user.email}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-sidebar-foreground/40 hover:text-sidebar-foreground" onClick={signOut}>
                  <LogOut size={14} />
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className={cn('space-y-2 flex flex-col gap-1', collapsed && 'space-y-1')}>
            <Link href="/login">
              <Button variant="outline" size="sm" className="w-full border-sidebar-border text-sidebar-foreground/70 hover:bg-sidebar-accent text-xs h-8">
                登录
              </Button>
            </Link>
            {!collapsed && (
              <Link href="/register">
                <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-8">
                  注册
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        className="absolute -right-2 top-1/2 -translate-y-1/2 w-5 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <PanelLeft size={11} className="text-muted-foreground" /> : <PanelLeftClose size={11} className="text-muted-foreground" />}
      </button>
    </aside>
  )
}
