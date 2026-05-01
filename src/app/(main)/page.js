import { createServerSupabase } from '@/lib/supabase/server'
import { HomeClient } from '@/app/(main)/home-client'

export const dynamic = 'force-dynamic'

const TOGETHER_SINCE = new Date('2025-04-19')

export default async function HomePage() {
  const supabase = await createServerSupabase()

  const [
    { count: storyCount },
    { count: photoCount },
    { count: videoCount },
    { count: blessingCount },
    { data: stories },
  ] = await Promise.all([
    supabase.from('stories').select('*', { count: 'exact', head: true }).eq('published', true),
    supabase.from('photos').select('*', { count: 'exact', head: true }),
    supabase.from('videos').select('*', { count: 'exact', head: true }),
    supabase.from('blessings').select('*', { count: 'exact', head: true }),
    supabase.from('stories').select('*').eq('published', true).order('story_date', { ascending: true }).limit(3),
  ])

  const today = new Date()
  const daysTogether = Math.max(1, Math.ceil((today - TOGETHER_SINCE) / (1000 * 60 * 60 * 24)))

  const stats = {
    days: String(daysTogether),
    stories: String(storyCount || 0),
    photos: String(photoCount || 0),
    videos: String(videoCount || 0),
    blessings: String(blessingCount || 0),
  }

  const latestStories = (stories || []).map((s) => ({
    id: s.id,
    title: s.title,
    date: s.story_date ? new Date(s.story_date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' }) : '',
    desc: s.content?.slice(0, 80) || '',
    emoji: s.cover_emoji || '💕',
    category: s.category,
  }))

  return <HomeClient stats={stats} stories={latestStories} />
}

