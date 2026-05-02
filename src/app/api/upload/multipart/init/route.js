import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createOSSClient, getFileUrl, ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, MAX_FILE_SIZE } from '@/lib/oss'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'

const PART_SIZE = 10 * 1024 * 1024 // 10MB per part

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

    if (!isImage && !isVideo) {
      return NextResponse.json({ error: `不支持的文件格式: ${type}` }, { status: 400 })
    }

    if (!process.env.OSS_ACCESS_KEY_ID) {
      return NextResponse.json({ error: 'OSS未配置' }, { status: 500 })
    }

    const ext = (name || 'file').split('.').pop() || (isVideo ? 'mp4' : 'jpg')
    const objectKey = `${folder || 'uploads'}/${uuidv4()}.${ext}`

    const oss = createOSSClient()
    const initResult = await oss.initMultipartUpload(objectKey, {
      mime: type,
    })

    const uploadId = initResult.uploadId
    const partCount = Math.ceil(size / PART_SIZE)
    const parts = []

    for (let partNumber = 1; partNumber <= partCount; partNumber++) {
      const signedUrl = oss.signatureUrl(objectKey, {
        method: 'PUT',
        expires: 43200, // 12h — enough for 200+ parts on slow connections
        'Content-Type': type,
        subResource: { partNumber, uploadId },
      })
      parts.push({ partNumber, signedUrl })
    }

    return NextResponse.json({
      uploadId,
      key: objectKey,
      url: getFileUrl(objectKey),
      partSize: PART_SIZE,
      parts,
    })
  } catch (error) {
    console.error('Multipart init error:', error)
    return NextResponse.json({ error: '初始化分片上传失败: ' + error.message }, { status: 500 })
  }
}
