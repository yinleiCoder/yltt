'use client'

import { useRef } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

export default function AuthLayout({ children }) {
  const leftRef = useRef(null)
  const circleRef = useRef(null)

  useGSAP(() => {
    if (!leftRef.current) return
    // Left panel entrance
    gsap.fromTo('.auth-brand', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', delay: 0.2 })
    // Ambient circle drift
    if (circleRef.current) {
      gsap.to(circleRef.current, {
        x: 30, y: -20,
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })
    }
    // Right card entrance
    gsap.fromTo('.auth-form-area', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', delay: 0.35 })
  }, [])

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel */}
      <div ref={leftRef} className="hidden lg:flex lg:w-1/2 bg-card border-r border-border items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(62,207,142,0.08),transparent_50%)]" />
        <div ref={circleRef} className="absolute top-20 left-20 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative text-center z-10 auth-brand">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#060808" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M12 12c-3 0-5 2-5 4v2h10v-2c0-2-2-4-5-4z" />
              <path d="M10 8c0-1 .8-1.5 1.5-1.5s1.5.5 1.5 1.5" />
              <path d="M8 6c-2-1-3-3-1-5" />
              <path d="M16 6c2-1 3-3 1-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2 tracking-tight">YLTT</h1>
          <p className="text-sm text-muted-foreground">记录尹磊 & 唐涛的故事</p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md auth-form-area">
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#060808" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M12 12c-3 0-5 2-5 4v2h10v-2c0-2-2-4-5-4z" />
                  <path d="M10 8c0-1 .8-1.5 1.5-1.5s1.5.5 1.5 1.5" />
                  <path d="M8 6c-2-1-3-3-1-5" />
                  <path d="M16 6c2-1 3-3 1-5" />
                </svg>
              </div>
              <span className="font-semibold text-foreground">YLTT</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
