import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createOSSClient } from '@/lib/oss'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  let key = searchParams.get('key')

  if (!key) {
    const url = searchParams.get('url')
    if (url) {
      try {
        const u = new URL(url)
        key = u.pathname.slice(1) // strip leading /
      } catch {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
      }
    }
  }

  if (!key) {
    return NextResponse.json({ error: '缺少 key 或 url 参数' }, { status: 400 })
  }

  try {
    const oss = createOSSClient()
    // Generate signed URL valid for 1 hour
    const signedUrl = oss.signatureUrl(key, { expires: 3600 })
    return NextResponse.json({ url: signedUrl })
  } catch (error) {
    return NextResponse.json({ error: '签名生成失败: ' + error.message }, { status: 500 })
  }
}
