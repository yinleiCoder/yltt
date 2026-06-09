import { NextResponse } from 'next/server'
import { createOSSClient, getFileUrl } from '@/lib/oss'

export const dynamic = 'force-dynamic'

function extractDisplayName(key) {
  const name = key.replace(/^oshare\//, '')
  const cleaned = name.replace(/_[a-f0-9]{6,12}(\.[a-z0-9]+)$/i, '$1')
  return cleaned || name
}

export async function POST(request) {
  try {
    const { query } = await request.json()
    if (!query || !query.trim()) {
      return NextResponse.json({ error: '请输入搜索关键词' }, { status: 400 })
    }

    const oss = createOSSClient()
    const result = await oss.list({ prefix: 'oshare/', 'max-keys': 500 })

    if (!result.objects || result.objects.length === 0) {
      return NextResponse.json({ files: [] })
    }

    const keywordList = query.trim().split(/\s+/).filter(Boolean).map(k => k.toLowerCase())

    const files = result.objects
      .filter(obj => {
        if (obj.name.endsWith('/')) return false
        const name = extractDisplayName(obj.name).toLowerCase()
        return keywordList.every(kw => name.includes(kw))
      })
      .map(obj => ({
        name: extractDisplayName(obj.name),
        size: obj.size,
        lastModified: obj.lastModified,
        url: getFileUrl(obj.name),
        signedUrl: oss.signatureUrl(obj.name, { expires: 3600 }),
        key: obj.name,
      }))
      .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))

    return NextResponse.json({ files })
  } catch (error) {
    return NextResponse.json({ error: '搜索失败: ' + error.message }, { status: 500 })
  }
}
