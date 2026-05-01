import { NextResponse } from 'next/server'
import { createOSSClient, getFileUrl } from '@/lib/oss'

export const dynamic = 'force-dynamic'

// Extract clean display name from OSS key
// Key format: oshare/{original-name}_{uuid}.{ext}  →  original-name.ext
// Also handles legacy keys without UUID: oshare/somefile.pdf
function extractDisplayName(key) {
  const name = key.replace(/^oshare\//, '')
  // Remove UUID suffix pattern: _XXXXXXXX.xxx where X is 6-12 hex/alphanumeric chars
  // This preserves original filenames that contain underscores
  const cleaned = name.replace(/_[a-f0-9]{6,12}(\.[a-z0-9]+)$/i, '$1')
  return cleaned || name
}

export async function POST(request) {
  try {
    const { query, apiKey: userApiKey } = await request.json()

    if (!query || !query.trim()) {
      return NextResponse.json({ error: '请输入搜索关键词' }, { status: 400 })
    }

    // 1. Call DeepSeek API to extract file name keywords from natural language
    const deepseekKey = userApiKey || process.env.DEEPSEEK_API_KEY
    let keywords = query.trim()

    if (deepseekKey) {
      try {
        const dsRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepseekKey}`,
          },
          body: JSON.stringify({
            model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
            messages: [
              {
                role: 'system',
                content:
                  '你是一个文件搜索关键词提取助手。用户会用自然语言描述想找的文件。请从用户输入中提取 1-5 个文件名搜索关键词，只返回空格分隔的关键词，不要返回任何解释或其他内容。如果用户输入本身已经是关键词则直接返回。示例：输入"我想下载那个关于React入门的中文PDF教程" → 返回"React 入门 教程 PDF 中文"',
              },
              { role: 'user', content: query.trim() },
            ],
            max_tokens: 60,
            temperature: 0.1,
          }),
        })

        if (dsRes.ok) {
          const dsData = await dsRes.json()
          const aiKeywords = dsData.choices?.[0]?.message?.content?.trim()
          if (aiKeywords) {
            keywords = aiKeywords
          }
        }
      } catch {
        // AI extraction failed, use raw query
      }
    }

    // 2. List files from OSS
    if (!process.env.OSS_ACCESS_KEY_ID) {
      return NextResponse.json({ error: 'OSS 未配置' }, { status: 500 })
    }

    const oss = createOSSClient()
    const result = await oss.list({
      prefix: 'oshare/',
      'max-keys': 500,
    })

    if (!result.objects || result.objects.length === 0) {
      return NextResponse.json({ keywords, files: [], aiUsed: !!deepseekKey })
    }

    // 3. Match files against keywords — search against clean display name
    const keywordList = keywords
      .split(/\s+/)
      .filter(Boolean)
      .map((k) => k.toLowerCase())

    const files = result.objects
      .filter((obj) => {
        if (obj.name.endsWith('/')) return false
        const displayName = extractDisplayName(obj.name).toLowerCase()
        // Must match ALL keywords (more precise)
        return keywordList.every((kw) => displayName.includes(kw))
      })
      .map((obj) => ({
        name: extractDisplayName(obj.name),
        size: obj.size,
        lastModified: obj.lastModified,
        url: getFileUrl(obj.name),
        signedUrl: oss.signatureUrl(obj.name, { expires: 3600 }),
        key: obj.name,
      }))
      .sort((a, b) => {
        // Prioritize closer keyword matches
        const aMatch = keywordList.filter((k) => a.name.toLowerCase().includes(k)).length
        const bMatch = keywordList.filter((k) => b.name.toLowerCase().includes(k)).length
        if (bMatch !== aMatch) return bMatch - aMatch
        return new Date(b.lastModified) - new Date(a.lastModified)
      })

    return NextResponse.json({ keywords, files, aiUsed: !!deepseekKey })
  } catch (error) {
    console.error('File search error:', error)
    return NextResponse.json({ error: '搜索失败: ' + error.message }, { status: 500 })
  }
}
