import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createOSSClient, getFileUrl, ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, ALLOWED_AUDIO_TYPES, MAX_FILE_SIZE } from '@/lib/oss'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  try {
    const { name, type, size, folder } = await request.json()

    if (!name || !type) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 })
    }

    if (size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: '文件大小不能超过2GB' }, { status: 400 })
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(type)
    const isVideo = ALLOWED_VIDEO_TYPES.includes(type)
    const isAudio = ALLOWED_AUDIO_TYPES.includes(type)

    if (!isImage && !isVideo && !isAudio) {
      return NextResponse.json({ error: `不支持的文件格式: ${type}` }, { status: 400 })
    }

    if (!process.env.OSS_ACCESS_KEY_ID) {
      return NextResponse.json({ error: 'OSS未配置' }, { status: 500 })
    }

    const ext = (name || 'file').split('.').pop() || (isVideo ? 'mp4' : isAudio ? 'mp3' : 'jpg')
    const objectKey = `${folder || 'uploads'}/${uuidv4()}.${ext}`

    const oss = createOSSClient()
    const signedUrl = oss.signatureUrl(objectKey, {
      method: 'PUT',
      expires: 3600,
      'Content-Type': type,
    })

    return NextResponse.json({
      signedUrl,
      key: objectKey,
      url: getFileUrl(objectKey),
    })
  } catch (error) {
    console.error('Sign error:', error)
    return NextResponse.json({ error: '签名失败: ' + error.message }, { status: 500 })
  }
}
