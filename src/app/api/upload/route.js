import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createOSSClient, getFileUrl, ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, MAX_FILE_SIZE } from '@/lib/oss'
import { parseMultipart } from '@/lib/multipart'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(request) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  try {
    const contentType = request.headers.get('content-type') || ''

    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: '请求格式错误' }, { status: 400 })
    }

    const boundary = contentType.split('boundary=')[1]?.trim()
    if (!boundary) {
      return NextResponse.json({ error: '缺少 boundary' }, { status: 400 })
    }

    const raw = await request.arrayBuffer()
    if (!raw || raw.byteLength === 0) {
      return NextResponse.json({ error: '请求体为空' }, { status: 400 })
    }

    const buf = Buffer.from(raw)
    const { file, folder } = parseMultipart(buf, boundary)

    if (!file) {
      return NextResponse.json({ error: '没有文件' }, { status: 400 })
    }

    const finalFolder = folder || 'uploads'

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: '文件大小不能超过2GB' }, { status: 400 })
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)

    if (!isImage && !isVideo) {
      return NextResponse.json({ error: `不支持的文件格式: ${file.type}` }, { status: 400 })
    }

    if (!process.env.OSS_ACCESS_KEY_ID) {
      return NextResponse.json({ error: 'OSS未配置，请先配置阿里云OSS环境变量' }, { status: 500 })
    }

    const ext = (file.name || 'file').split('.').pop() || (isVideo ? 'mp4' : 'jpg')
    const objectKey = `${finalFolder}/${uuidv4()}.${ext}`

    const oss = createOSSClient()
    const result = await oss.put(objectKey, file.buffer, {
      mime: file.type,
      headers: {
        'Cache-Control': 'public, max-age=31536000',
        'x-oss-object-acl': 'public-read',
      },
    })

    const url = getFileUrl(result.name)
    const signedUrl = oss.signatureUrl(result.name, { expires: 86400 })

    return NextResponse.json({ url, signedUrl, key: result.name, name: file.name, size: file.size })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: '上传失败: ' + error.message }, { status: 500 })
  }
}

