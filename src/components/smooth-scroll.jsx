'use client'

import { useEffect, useRef } from 'react'
import ReactLenis from 'lenis/dist/lenis-react.mjs'
import 'lenis/dist/lenis.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function SmoothScroll({ children }) {
  const lenisRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    const lenis = lenisRef.current?.lenis
    if (!lenis) return

    lenis.on('scroll', ScrollTrigger.update)
    rafRef.current = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(rafRef.current)
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.off('scroll', ScrollTrigger.update)
      if (rafRef.current) gsap.ticker.remove(rafRef.current)
    }
  }, [])

  return (
    <ReactLenis
      ref={lenisRef}
      root
      options={{
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        syncTouch: false,
        anchors: true,
      }}
    >
      {children}
    </ReactLenis>
  )
}
