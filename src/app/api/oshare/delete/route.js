import { NextResponse } from 'next/server'
import { createOSSClient } from '@/lib/oss'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const { key } = await request.json()

    if (!key || !key.startsWith('oshare/')) {
      return NextResponse.json({ error: '无效的文件路径' }, { status: 400 })
    }

    if (!process.env.OSS_ACCESS_KEY_ID) {
      return NextResponse.json({ error: 'OSS 未配置' }, { status: 500 })
    }

    const oss = createOSSClient()
    await oss.delete(key)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('File delete error:', error)
    return NextResponse.json({ error: '删除失败: ' + error.message }, { status: 500 })
  }
}
