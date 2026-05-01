import { NextResponse } from 'next/server'
import { createOSSClient, getFileUrl, MAX_FILE_SIZE } from '@/lib/oss'
import { parseMultipart } from '@/lib/multipart'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(request) {
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
    const { file } = parseMultipart(buf, boundary)

    if (!file) {
      return NextResponse.json({ error: '没有文件' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: '文件大小不能超过2GB' }, { status: 400 })
    }

    if (!process.env.OSS_ACCESS_KEY_ID) {
      return NextResponse.json({ error: 'OSS 未配置' }, { status: 500 })
    }

    // Keep original filename in OSS key: oshare/{original-name}_{uuid}.{ext}
    const originalName = file.name || 'file'
    const dotIdx = originalName.lastIndexOf('.')
    const baseName = dotIdx > 0 ? originalName.slice(0, dotIdx) : originalName
    const ext = dotIdx > 0 ? originalName.slice(dotIdx) : ''
    // Sanitize: replace special chars to avoid issues, keep Chinese
    const safeName = baseName.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 150)
    const objectKey = `oshare/${safeName}_${uuidv4().slice(0, 8)}${ext}`

    const oss = createOSSClient()
    const result = await oss.put(objectKey, file.buffer, {
      mime: file.type || 'application/octet-stream',
      headers: {
        'Cache-Control': 'public, max-age=31536000',
        'x-oss-object-acl': 'public-read',
      },
    })

    return NextResponse.json({
      url: getFileUrl(result.name),
      key: result.name,
      name: originalName,
      size: file.size,
    })
  } catch (error) {
    console.error('File share upload error:', error)
    return NextResponse.json({ error: '上传失败: ' + error.message }, { status: 500 })
  }
}

