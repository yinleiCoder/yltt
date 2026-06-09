@AGENTS.md

# YLTT ("我的涛妹") — Project Reference

Personal website for 尹磊 & 唐涛. Built with Next.js 16 + Supabase + AliOSS.

## Quick Start

```bash
npm run dev      # http://localhost:3000
npm run build    # Production build
```

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js 16.2.4 (Turbopack) | App Router |
| DB + Auth | Supabase (Postgres) | RLS enabled, middleware auth guard |
| Storage | AliCloud OSS | Transfer acceleration enabled (`oss-accelerate.aliyuncs.com`) |
| Styling | Tailwind CSS v4 + shadcn/ui | @base-ui/react primitives |
| Animation | GSAP + @gsap/react + Lenis | ScrollTrigger, useGSAP hook |
| Icons | lucide-react | Standardized `size={N}` props |
| Font | Geist (system fallback) | via `font-sans` CSS variable |
| Video | media-chrome/react | Web Component controls |
| PDF | @embedpdf/react-pdf-viewer | PDF preview in fileshare |
| Drag | @dnd-kit/core + @dnd-kit/sortable | Music playlist reordering |

## Architecture

```
src/
├── app/
│   ├── layout.js            # Root: server auth → Providers → SmoothScroll
│   ├── globals.css           # Tailwind v4 + warm Neo-Brutalist theme
│   ├── error.jsx             # Global error boundary
│   ├── not-found.jsx         # Custom 404 (chunky style)
│   ├── (main)/
│   │   ├── layout.js         # Shell wrapper (sidebar + mobile hamburger)
│   │   ├── loading.jsx       # Route-level loading skeleton
│   │   ├── page.js           # Server: 5 parallel Supabase queries → HomeClient
│   │   ├── home-client.jsx   # Hero + FeatureCards + StoryPreview
│   │   ├── about/            # Static info with ScrollTrigger
│   │   ├── blessings/        # Blessing wall (grid cards + fireworks canvas)
│   │   ├── dashboard/        # User dashboard with quick nav
│   │   ├── fileshare/        # Keyword file search + PDF preview
│   │   ├── opensource/       # Software gallery
│   │   ├── photos/           # Photo grid + fullscreen viewer + lazy load
│   │   ├── profile/          # Profile editing
│   │   ├── stories/          # Rose garden story display
│   │   ├── stories/[id]/     # Story detail + comments + media
│   │   └── videos/           # Video gallery + fullscreen viewer
│   ├── (admin)/
│   │   └── admin/
│   │       ├── photos/       # Photo CRUD with thumbnail optimization
│   │       ├── videos/       # Video CRUD with snapshot thumbnails
│   │       ├── stories/      # Story editor
│   │       ├── users/        # User management with refresh
│   │       ├── music/        # Music playlist with drag-and-drop (dnd-kit)
│   │       └── oshare/       # File share management
│   ├── (auth)/               # Login/Register with girl logo
│   └── api/
│       ├── metadata/route.js # IP geolocation (Cloudflare + Vercel compatible)
│       ├── stream/route.js   # Video stream proxy (OSS signed URLs)
│       └── ...               # Upload, OSS delete, oshare search
├── components/
│   ├── layout/               # Shell (mobile hamburger), Sidebar (GSAP collapse)
│   ├── blessings/            # FireworkCanvas
│   ├── video-player.jsx      # media-chrome video player
│   ├── pdf-viewer.jsx        # @embedpdf/react-pdf-viewer wrapper
│   ├── music-player.jsx      # Fixed audio player
│   ├── smooth-scroll.jsx     # Lenis + ScrollTrigger
│   ├── providers.jsx         # 8 contexts (vault removed)
│   ├── story-viewer.jsx      # Instagram-style viewer (legacy)
│   └── ui/                   # shadcn/ui
├── contexts/
│   ├── auth-context.jsx      # useMemo value, useCallback signOut, maybeSingle
│   ├── data-context.jsx      # Route-change auto reload, useMemo value
│   ├── music-context.jsx     # playingRef for stable togglePlay
│   ├── download-context.jsx  # Chunked downloads
│   └── upload-context.jsx    # Single + multipart uploads
└── lib/
    ├── constants.js          # Story categories
    ├── utils.js              # cn(), formatSize(), generatePageNumbers()
    ├── multipart.js          # Server multipart parser
    ├── oss-client.js         # Client OSS (getFileUrl, getOssKey, getThumbUrl)
    ├── oss.js                # Server ali-oss (accelerate endpoint)
    ├── rbac.js               # Role/permission constants
    ├── use-metadata.js       # Client IP/device hook
    └── supabase/
        ├── client.js         # Browser client
        ├── middleware.js      # Auth guard (public: fileshare, stories, about)
        └── server.js         # Server clients
```

## Design System

- **Theme**: Warm Neo-Brutalist
- **Primary**: `#ff6b4a` (coral) — buttons, links, active states
- **Background**: `#f8f6f6` (warm cream), cards `#ffffff` (white)
- **Border**: `#1a1a1a` `border-[2.5px]` (thick black)
- **Shadow**: Chunky — `4px 4px 0 0 #1a1a1a`
- **Font**: Geist (sans), JetBrains Mono (mono)
- **Radius**: `--radius: 0.5rem`
- **Z-index**: `--z-dropdown: 10` through `--z-tooltip: 80`
- **Logo**: Girl face SVG (replaced rabbit)

### Key Utility Classes

- `.chunky-shadow` / `.chunky-shadow-sm` / `.chunky-shadow-lg` — hard black shadows
- `.surface-card` — white bg + thick black border + chunky shadow
- `.memphis-badge` — tilted badge (`-rotate-1.5deg`)
- `h-dvh` not `h-screen` for viewport height
- `text-balance` on headings, `text-pretty` on body

## GSAP Patterns

- `useGSAP(() => {...}, { scope: ref })` — preferred React pattern
- `gsap.registerPlugin(ScrollTrigger)` at module level
- **NEVER** `gsap.registerPlugin(useGSAP)` — useGSAP is a hook, not a plugin
- ScrollTriggers with `once: true` for one-shot reveals
- `prefers-reduced-motion` respected globally

## Data Context

- Loads on auth ready + route change (`usePathname()`)
- `useMemo` wraps context value to prevent cascade re-renders
- Route change auto-reload: `pathname !== prevPathRef.current → loadAll()`
- `loadAll()` can be called repeatedly (no loadingRef lock)

## Key Patterns

### OSS Image Optimization
- Admin photo grid: `getThumbUrl(url, 300)` — resize to 300px
- Admin video grid: `getThumbUrl(url, 300)` — video snapshot thumbnail
- Public photo grid: 400px thumbnails + 120px viewer thumbnails
- Full resolution only used for download and preview dialogs

### Transfer Acceleration
- Client: `NEXT_PUBLIC_OSS_CDN_DOMAIN = https://yltt2025.oss-accelerate.aliyuncs.com`
- Server: `endpoint: 'https://oss-accelerate.aliyuncs.com'`

### Video Streaming
- `/api/stream?key=xxx` — proxies video through signed OSS URLs (5min expiry)
- VideoPlayer uses `media-chrome/react` with `autoPlay`

### IP Geolocation (metadata route)
- Cloudflare: reads `cf-connecting-ip` header
- Correct 172.16-31.x private IP detection (regex)
- HTTPS-only geolocation services with AbortController timeout

## Known Issues

### Security
- `/api/oshare/*` routes lack auth (public file sharing by design)
- `/api/auth/callback` — validate `next` redirect param

### Tech Debt
- `admin/photos/page.js` — large file, candidate for splitting
- CRUD patterns in data-context duplicated across 4 entity types
- No i18n (Chinese hardcoded throughout)
- `window.__photosSavedScrollTop` removed (photos page rewritten)

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OSS_REGION=oss-cn-chengdu
OSS_ACCESS_KEY_ID=...
OSS_ACCESS_KEY_SECRET=...
OSS_BUCKET=yltt2025
OSS_ENDPOINT=https://oss-cn-chengdu.aliyuncs.com
NEXT_PUBLIC_OSS_CDN_DOMAIN=https://yltt2025.oss-accelerate.aliyuncs.com
```

## Skills Installed

See `~/.claude/skills/`:
- **next-best-practices**, **next-cache-components**, **next-upgrade** — Next.js
- **gsap-core**, **gsap-scrolltrigger**, **gsap-react**, **gsap-performance**, **gsap-timeline**, **gsap-plugins**, **gsap-frameworks**, **gsap-utils** — GSAP
- **impeccable**, **design-taste-frontend**, **gpt-taste**, **redesign-existing-projects**, **baseline-ui** — Design
