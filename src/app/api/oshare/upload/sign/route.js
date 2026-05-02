import { NextResponse } from 'next/server'
import { createOSSClient, getFileUrl, MAX_FILE_SIZE } from '@/lib/oss'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const { name, type, size } = await request.json()

    if (!name) {
      return NextResponse.json({ error: '缺少文件名' }, { status: 400 })
    }

    if (size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: '文件大小不能超过2GB' }, { status: 400 })
    }

    if (!process.env.OSS_ACCESS_KEY_ID) {
      return NextResponse.json({ error: 'OSS 未配置' }, { status: 500 })
    }

    const originalName = name
    const dotIdx = originalName.lastIndexOf('.')
    const baseName = dotIdx > 0 ? originalName.slice(0, dotIdx) : originalName
    const ext = dotIdx > 0 ? originalName.slice(dotIdx) : ''
    const safeName = baseName.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 150)
    const objectKey = `oshare/${safeName}_${uuidv4().slice(0, 8)}${ext}`

    const oss = createOSSClient()
    const signedUrl = oss.signatureUrl(objectKey, {
      method: 'PUT',
      expires: 3600,
      'Content-Type': type || 'application/octet-stream',
    })

    return NextResponse.json({
      signedUrl,
      key: objectKey,
      url: getFileUrl(objectKey),
      name: originalName,
      size,
    })
  } catch (error) {
    console.error('Oshare sign error:', error)
    return NextResponse.json({ error: '签名失败: ' + error.message }, { status: 500 })
  }
}
