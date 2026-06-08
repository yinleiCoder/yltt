@AGENTS.md

# YLTT ("我的涛妹") — Project Reference

Personal website for 尹磊 & 唐涛. Built with Next.js 16 + Supabase + AliOSS. Deployed at [yinleilei.cn](https://yinleilei.cn).

## Quick Start

```bash
npm run dev      # http://localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js 16.2.4 (Turbopack) | App Router, `force-dynamic` on API routes |
| DB + Auth | Supabase (Postgres) | RLS enabled, middleware auth guard |
| Storage | AliCloud OSS | `ali-oss` SDK, presigned URLs |
| Styling | Tailwind CSS v4 + shadcn/ui | @base-ui/react primitives, `tw-animate-css` |
| Animation | GSAP + @gsap/react + Lenis | ScrollTrigger for scroll-linked, useGSAP hook |
| Icons | lucide-react | Standardized `size={N}` props |
| Font | Inter (system fallback) | via `font-sans` CSS variable |
| Video | media-chrome/react | Web Component controls |
| Crypto | Web Crypto API | PBKDF2 + AES-256-GCM for password vault |

## Architecture

```
src/
├── app/
│   ├── layout.js            # Root: server auth → Providers → SmoothScroll
│   ├── globals.css           # Tailwind v4, shadcn, dark theme tokens
│   ├── error.tsx             # Global error boundary
│   ├── not-found.tsx         # Custom 404
│   ├── (main)/               # Public pages
│   │   ├── layout.js         # Shell wrapper
│   │   ├── loading.tsx       # Route-level loading skeleton
│   │   ├── page.js           # Server: 5 parallel Supabase queries → HomeClient
│   │   ├── home-client.jsx   # Hero + FeatureCards + StoryPreview
│   │   ├── about/            # Static info with ScrollTrigger reveals
│   │   ├── blessings/        # Floating avatars + fireworks canvas
│   │   ├── dashboard/        # User dashboard: welcome + quick nav + recent
│   │   ├── fileshare/        # AI file search (DeepSeek)
│   │   ├── opensource/       # Software gallery with image lightbox
│   │   ├── photos/           # Photo viewer with thumbnail strip + EXIF
│   │   ├── profile/          # Profile edit + avatar upload
│   │   ├── stories/          # Story list + Instagram-style circles
│   │   ├── stories/[id]/     # Story detail + comments
│   │   └── videos/           # Video gallery with media-chrome preview
│   ├── (admin)/              # Admin CRUD pages (Shell + TabNav)
│   ├── (auth)/               # Login/Register with split-panel layout
│   └── api/                  # Route handlers (OSS, upload, oshare, auth)
├── components/
│   ├── layout/               # Shell, Sidebar
│   ├── blessings/            # FireworkCanvas, FloatingAvatars
│   ├── music-player.jsx      # Fixed audio player with waveform
│   ├── smooth-scroll.jsx     # Lenis + ScrollTrigger integration
│   ├── providers.jsx         # Context provider tree (9 levels)
│   ├── story-viewer.jsx      # Instagram-like story viewer
│   └── ui/                   # shadcn/ui (base-ui primitives)
├── contexts/
│   ├── auth-context.jsx      # Supabase auth + profile
│   ├── data-context.jsx      # Central store: photos/videos/stories/blessings
│   ├── music-context.jsx     # Persistent audio player state
│   ├── download-context.jsx  # Chunked downloads with AbortController
│   ├── upload-context.jsx    # Single + multipart uploads
│   └── vault-context.jsx     # Encrypted password manager
├── hooks/                    # (empty — hooks live in contexts)
└── lib/
    ├── constants.js          # Story categories
    ├── utils.js              # cn(), formatSize(), generatePageNumbers()
    ├── crypto.js             # PBKDF2 + AES-256-GCM (Web Crypto)
    ├── copy-to-clipboard.js  # Clipboard with auto-clear
    ├── multipart.js          # Server multipart parser (Buffer)
    ├── oss-client.js         # Client OSS utils (getFileUrl, getOssKey)
    ├── oss.js                # Server ali-oss client factory
    ├── rbac.js               # Role/permission constants
    ├── use-metadata.js       # Client IP/device hook (cached)
    ├── opensource-data.js    # Static project data
    └── supabase/
        ├── client.js         # Browser client
        ├── middleware.js      # Auth guard + admin role check
        └── server.js         # Server clients (standard + admin/service_role)
```

## Design System

- **Theme**: Dark only — `:root` CSS custom properties
- **Primary**: `#3ecf8e` (green) — buttons, links, active states
- **Background**: `#060808` (near-black), cards `#141516`, border `#2a2c2e`
- **Font**: Inter (sans), JetBrains Mono (mono)
- **Radius**: `--radius: 0.5rem`
- **Z-index**: Semantic scale in CSS (`--z-dropdown: 10` through `--z-tooltip: 80`)
- **Safe area**: `--safe-area-*` tokens
- **Animation**: `prefers-reduced-motion` respected; text-balance on headings

## Context Architecture

7 contexts in `providers.jsx`. Each:
- Uses `useMemo` for value to prevent cascade re-renders
- Uses `useCallback` for stable function refs
- Depends on `AuthProvider` (which creates the supabase client)

## GSAP Patterns

- `useGSAP(() => {...}, { scope: ref })` — preferred React pattern
- `gsap.registerPlugin(ScrollTrigger)` at module level
- NEVER `gsap.registerPlugin(useGSAP)` — useGSAP is a hook, not a plugin
- ScrollTriggers with `once: true` for one-shot reveals
- `prefers-reduced-motion` checked for all motion-heavy animations

## Tailwind v4 Conventions

- `z-(--z-sidebar)` for CSS variable z-index (not `z-[var(--z-sidebar)]`)
- `shrink-0` not `flex-shrink-0` (canonical)
- `size-*` for square elements
- `h-dvh` not `h-screen` (dynamic viewport)
- `text-balance` on headings, `text-pretty` on body

## Key Patterns

### Data Flow
- Server components fetch from Supabase → pass as props
- Client components use `useData()` context for shared state
- Admin pages query Supabase directly (inconsistent with context)
- Optimistic updates: local state updated before server response

### RLS Policies
Defined in `supabase-schema.sql`. All tables have RLS enabled. Public read, admin write for content tables. Private read/write for vault (passwords).

### Upload Architecture
Two paths:
1. **Single PUT** (≤10MB): Client → presigned URL → OSS directly
2. **Multipart** (>10MB): Init → signed part URLs → upload parts → complete

## Performance Notes

### Context Stability
All providers wrap value in `useMemo`. Adding new values requires updating deps.

### Code Splitting Candidates
- `emoji-picker-react` (~150KB) — admin stories only
- `exifr` — admin photo upload only
- `media-chrome` — video pages only
- `react-day-picker` (~50KB) — admin stories only
- `FireworkCanvas` — already uses `dynamic(() => import(...), { ssr: false })`

### Database Query Optimization
- Home page: 5 parallel queries with `Promise.all` (no data waterfall)
- Middleware: DB query for admin role on every admin request (consider caching in session)
- `loadBlessings`: N+1 pattern (blessings → profiles) — could use Supabase join

## Known Issues

### Security
- `/api/oshare/*` routes lack auth (public file sharing by design)
- `/api/auth/callback` — open redirect via unvalidated `next` param
- `/api/metadata` — HTTP fallback for geolocation

### Tech Debt
- `admin/photos/page.js` — ~860 lines, needs splitting
- CRUD in data-context — duplicated across 4 entity types
- Inconsistent data fetching: context vs direct Supabase queries
- No i18n (Chinese hardcoded throughout)
- `window.__photosSavedScrollTop` global variable in photos page
- `generatePageNumbers` duplicated in multiple files (use `@/lib/utils`)
- `gsap.registerPlugin(useGSAP)` in several files (remove — it's a hook)

### Accessibility Gaps
- Icon-only buttons missing `aria-label` in some components
- `PaginationEllipsis` has conflicting `aria-hidden` + `sr-only`
- Skeletons missing `aria-hidden="true"`

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...       # Server only
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=...
OSS_ACCESS_KEY_SECRET=...
OSS_BUCKET=...
OSS_CDN_DOMAIN=https://...          # Optional
DEEPSEEK_API_KEY=...                # Fileshare AI search
```

## Skills Installed

See `~/.claude/skills/`:
- **next-best-practices**, **next-cache-components**, **next-upgrade** — Next.js optimization
- **gsap-core**, **gsap-scrolltrigger**, **gsap-react**, **gsap-performance**, **gsap-timeline**, **gsap-plugins**, **gsap-frameworks**, **gsap-utils** — GSAP animation
- **impeccable**, **design-taste-frontend**, **gpt-taste**, **redesign-existing-projects**, **baseline-ui** — Design/UI quality
