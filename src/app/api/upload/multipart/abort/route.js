import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createOSSClient } from '@/lib/oss'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  try {
    const { uploadId, key } = await request.json()

    if (!uploadId || !key) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 })
    }

    const oss = createOSSClient()
    await oss.abortMultipartUpload(key, uploadId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Multipart abort error:', error)
    return NextResponse.json({ error: '取消分片上传失败: ' + error.message }, { status: 500 })
  }
}
