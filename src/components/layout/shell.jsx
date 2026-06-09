'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sidebar } from '@/components/layout/sidebar'
import { TransferManager } from '@/components/transfer-manager'
import { MusicPlayer } from '@/components/music-player'
import { Menu } from 'lucide-react'

export function Shell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <main className="flex-1 min-w-0 relative">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14 bg-white border-b-[2.5px] border-black">
          <button className="size-9 rounded-lg border-2 border-black flex items-center justify-center hover:bg-stone-50 transition-colors" onClick={() => setMobileOpen(true)} aria-label="打开菜单">
            <Menu size={18} className="text-black" />
          </button>
          <Link href="/" className="font-black text-sm">YlTt's 2025</Link>
        </div>

        <div className="min-h-dvh p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
        <TransferManager />
      </main>
      <MusicPlayer />
    </div>
  )
}
