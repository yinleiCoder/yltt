import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createOSSClient, getFileUrl } from '@/lib/oss'

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

    // List all uploaded parts to get their ETags
    const listResult = await oss.listParts(key, uploadId)
    const partList = listResult.parts || []
    const parts = partList.map((p) => ({
      number: p.PartNumber,
      etag: p.ETag,
    }))

    if (parts.length === 0) {
      return NextResponse.json({ error: '没有已上传的分片' }, { status: 400 })
    }

    const result = await oss.completeMultipartUpload(key, uploadId, parts)

    return NextResponse.json({
      url: getFileUrl(key),
      key,
      etag: result.etag,
    })
  } catch (error) {
    console.error('Multipart complete error:', error)
    return NextResponse.json({ error: '完成分片上传失败: ' + error.message }, { status: 500 })
  }
}
