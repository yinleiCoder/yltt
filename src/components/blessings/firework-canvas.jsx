'use client'

import { useRef, useEffect, useCallback } from 'react'

const COLORS = ['#3ecf8e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']
const GRAVITY = 0.04
const MAX_PARTICLES = 500
const MAX_ROCKETS = 5
const MIN_EXPLOSION = 40
const MAX_EXPLOSION = 80
const LAUNCH_MIN = 800
const LAUNCH_MAX = 2500

class Particle {
  constructor(x, y, color) {
    const angle = Math.random() * Math.PI * 2
    const speed = 1 + Math.random() * 4
    this.x = x
    this.y = y
    this.vx = Math.cos(angle) * speed
    this.vy = Math.sin(angle) * speed
    this.color = color
    this.alpha = 1
    this.decay = 0.01 + Math.random() * 0.02
  }

  update() {
    this.x += this.vx
    this.y += this.vy
    this.vy += GRAVITY
    this.alpha -= this.decay
  }

  draw(ctx) {
    ctx.save()
    ctx.globalAlpha = Math.max(0, this.alpha)
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  get alive() {
    return this.alpha > 0
  }
}

class Rocket {
  constructor(canvasW, canvasH) {
    this.x = 50 + Math.random() * (canvasW - 100)
    this.y = canvasH
    this.vy = -(6 + Math.random() * 4)
    this.vx = (Math.random() - 0.5) * 2
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)]
    this.trail = []
    this.exploded = false
    this.targetY = canvasH * (0.15 + Math.random() * 0.45)
  }

  update() {
    if (this.exploded) return

    this.trail.push({ x: this.x, y: this.y, alpha: 0.8 })
    if (this.trail.length > 8) this.trail.shift()

    this.x += this.vx
    this.y += this.vy
    this.vy += 0.03

    for (const t of this.trail) t.alpha -= 0.1

    if (this.vy >= 0 || this.y <= this.targetY) {
      this.exploded = true
    }
  }

  draw(ctx) {
    if (this.exploded) return

    // Trail
    for (const t of this.trail) {
      if (t.alpha <= 0) continue
      ctx.save()
      ctx.globalAlpha = t.alpha
      ctx.fillStyle = this.color
      ctx.beginPath()
      ctx.arc(t.x, t.y, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    // Rocket head
    ctx.save()
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(this.x, this.y, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  explode() {
    const count = MIN_EXPLOSION + Math.floor(Math.random() * (MAX_EXPLOSION - MIN_EXPLOSION))
    const particles = []
    for (let i = 0; i < count; i++) {
      particles.push(new Particle(this.x, this.y, this.color))
    }
    return particles
  }
}

export default function FireworkCanvas() {
  const canvasRef = useRef(null)
  const rocketsRef = useRef([])
  const particlesRef = useRef([])
  const rafRef = useRef(null)
  const lastLaunchRef = useRef(0)
  const containerRef = useRef(null)

  const resize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = w + 'px'
    canvas.style.height = h + 'px'
    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }, [])

  useEffect(() => {
    resize()
    window.addEventListener('resize', resize)

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const w = () => window.innerWidth
    const h = () => window.innerHeight

    const loop = (now) => {
      rafRef.current = requestAnimationFrame(loop)

      // Semi-transparent clear for tail effect
      ctx.fillStyle = 'rgba(6, 8, 8, 0.25)'
      ctx.fillRect(0, 0, w(), h())

      // Launch new rocket
      if (now - lastLaunchRef.current > LAUNCH_MIN + Math.random() * (LAUNCH_MAX - LAUNCH_MIN)) {
        if (rocketsRef.current.length < MAX_ROCKETS) {
          rocketsRef.current.push(new Rocket(w(), h()))
        }
        lastLaunchRef.current = now
      }

      // Update and draw rockets
      for (let i = rocketsRef.current.length - 1; i >= 0; i--) {
        const rocket = rocketsRef.current[i]
        rocket.update()
        rocket.draw(ctx)

        if (rocket.exploded) {
          const newParticles = rocket.explode()
          if (particlesRef.current.length + newParticles.length <= MAX_PARTICLES) {
            particlesRef.current.push(...newParticles)
          }
          rocketsRef.current.splice(i, 1)
        }
      }

      // Update and draw particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i]
        p.update()
        p.draw(ctx)
        if (!p.alive) {
          particlesRef.current.splice(i, 1)
        }
      }
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('resize', resize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [resize])

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-0">
      <canvas ref={canvasRef} />
    </div>
  )
}
