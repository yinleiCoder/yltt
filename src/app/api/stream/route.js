import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Maximum duration for Vercel Pro: 300s
export const maxDuration = 300

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')

  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })

  try {
    const { createOSSClient } = await import('@/lib/oss')
    const oss = await createOSSClient()

    // Generate a short-lived signed URL (5 minutes)
    const signedUrl = oss.signatureUrl(key, { expires: 300 })

    // Fetch the video from OSS with range support
    const headers = {}
    const range = request.headers.get('range')
    if (range) headers['Range'] = range

    const ossResponse = await fetch(signedUrl, { headers })

    // Forward the response as a stream
    const responseHeaders = new Headers()
    responseHeaders.set('Content-Type', ossResponse.headers.get('content-type') || 'video/mp4')
    responseHeaders.set('Accept-Ranges', 'bytes')
    responseHeaders.set('Cache-Control', 'public, max-age=300, s-maxage=300')

    const contentLength = ossResponse.headers.get('content-length')
    if (contentLength) responseHeaders.set('Content-Length', contentLength)

    const contentRange = ossResponse.headers.get('content-range')
    if (contentRange) responseHeaders.set('Content-Range', contentRange)

    return new NextResponse(ossResponse.body, {
      status: range ? 206 : 200,
      headers: responseHeaders,
    })
  } catch (err) {
    console.error('Stream error:', err)
    return NextResponse.json({ error: 'Stream failed' }, { status: 500 })
  }
}
