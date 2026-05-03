'use client'

import { useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Camera, BookOpen, Heart, Video, Shield, Palette } from 'lucide-react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(useGSAP, ScrollTrigger)

const features = [
  {
    icon: BookOpen,
    title: '故事记录',
    desc: '用文字和图片记录生活中的重要时刻、旅行见闻和日常感悟，支持分类管理和发布时间设定。',
  },
  {
    icon: Camera,
    title: '相册画廊',
    desc: '高清照片展示，自动提取 EXIF 信息（相机型号、拍摄参数），支持按月份分组浏览和胶片式缩略图导航。',
  },
  {
    icon: Video,
    title: '视频收藏',
    desc: '收藏和展示喜爱的视频，支持 OSS 直传和在线播放。',
  },
  {
    icon: Heart,
    title: '祝福墙',
    desc: '访客可以留下祝福卡片，附带 IP 属地信息和设备类型标识，卡片式布局清晰展示每一条心意。',
  },
  {
    icon: Shield,
    title: '权限管理',
    desc: '基于角色的访问控制，管理员可对全站内容进行增删改操作，普通用户仅可浏览和评论。',
  },
  {
    icon: Palette,
    title: '流畅体验',
    desc: 'GSAP 动画过渡、全局状态管理减少重复请求、响应式布局适配各种设备。',
  },
]

const techStack = [
  { name: 'Next.js 16', desc: 'React 全栈框架，App Router + Turbopack，服务端组件与客户端组件混合渲染。' },
  { name: 'Supabase', desc: '开源 BaaS，提供 PostgreSQL 数据库、用户认证、Row Level Security 权限控制。' },
  { name: '阿里云 OSS', desc: '对象存储服务，托管所有媒体文件（照片、视频），CDN 加速访问。' },
  { name: 'Tailwind CSS', desc: '实用优先的 CSS 框架，响应式布局、暗色模式、自定义设计令牌。' },
  { name: 'GSAP', desc: '高性能动画库，驱动页面过渡、画廊滚动、缩略图焦点动画等交互动效。' },
  { name: 'shadcn/ui', desc: '基于 Radix UI 的组件库，提供 Dialog、Card、Button 等无障碍访问组件。' },
  { name: 'DeepSeek API', desc: 'AI 大模型接口，用于文件共享空间的自然语言搜索关键词提取。' },
  { name: 'date-fns + exifr', desc: '日期格式化与照片 EXIF 元数据（相机型号、光圈、快门等）客户端解析。' },
]

export default function AboutPage() {
  const featuresRef = useRef(null)
  const techRef = useRef(null)

  // Scroll-triggered feature cards
  useGSAP(() => {
    gsap.set('.feature-card', { y: 30, opacity: 0 })
    ScrollTrigger.batch('.feature-card', {
      onEnter: (els) => gsap.to(els, { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: 'power3.out' }),
      start: 'top 90%',
      once: true,
    })
  }, { scope: featuresRef })

  // Scroll-triggered tech stack cards
  useGSAP(() => {
    gsap.set('.tech-card', { y: 30, opacity: 0 })
    ScrollTrigger.batch('.tech-card', {
      onEnter: (els) => gsap.to(els, { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: 'power3.out' }),
      start: 'top 90%',
      once: true,
    })
  }, { scope: techRef })

  // Section heading fade-in
  useGSAP(() => {
    gsap.set('.section-heading', { y: 16, opacity: 0 })
    ScrollTrigger.batch('.section-heading', {
      onEnter: (els) => gsap.to(els, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }),
      start: 'top 95%',
      once: true,
    })
  }, [])

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">关于网站</h1>
        <p className="text-sm text-muted-foreground">了解 YlTt's 2025 的功能和设计理念</p>
      </div>

      <Card className="surface-card mb-8 section-heading">
        <CardContent className="p-6 sm:p-8">
          <h2 className="text-base font-semibold text-foreground mb-3">网站简介</h2>
          <p className="text-sm text-foreground/70 leading-relaxed">
            YlTt's 2025 是一个个人生活记录与分享平台，集故事写作、照片展示、视频收藏和互动祝福于一体。
            网站采用 Next.js 16 全栈框架构建，使用阿里云 OSS 存储媒体文件，Supabase 提供数据库和用户认证服务。
            设计理念是「简洁而不简单」—— 极简的界面下藏着丰富的交互细节，如照片的 EXIF 元数据提取、
            胶卷式画廊导航、IP 属地展示等，让每一次浏览都有温度。
          </p>
        </CardContent>
      </Card>

      <h2 className="text-base font-semibold text-foreground mb-4 section-heading">功能特性</h2>

      <div ref={featuresRef} className="grid sm:grid-cols-2 gap-4 mb-8">
        {features.map((f) => (
          <Card key={f.title} className="surface-card feature-card">
            <CardContent className="p-5">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <f.icon size={18} className="text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="text-base font-semibold text-foreground mb-4 section-heading">技术栈</h2>

      <div ref={techRef} className="grid sm:grid-cols-2 gap-4 mb-8">
        {techStack.map((tech) => (
          <Card key={tech.name} className="surface-card tech-card">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-1">{tech.name}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{tech.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator className="bg-border mb-8" />

      <div className="text-center pb-8">
        <p className="text-xs text-muted-foreground/50">
          Built with Next.js · Supabase · Alibaba Cloud OSS · GSAP · Tailwind CSS
        </p>
      </div>
    </div>
  )
}
