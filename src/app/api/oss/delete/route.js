import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/rbac'
import { createOSSClient } from '@/lib/oss'

export async function POST(request) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!isAdmin(profile?.role)) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  try {
    const { key } = await request.json()
    if (!key) return NextResponse.json({ error: '缺少 key' }, { status: 400 })

    const oss = createOSSClient()
    await oss.delete(key)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message || '删除失败' }, { status: 500 })
  }
}
