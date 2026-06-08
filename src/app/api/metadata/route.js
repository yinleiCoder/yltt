import { NextResponse } from 'next/server'
import { UAParser } from 'ua-parser-js'

export const dynamic = 'force-dynamic'

async function geoLookup(ip) {
  const services = [
    // ip.sb — free, HTTPS
    async () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 3000)
      const res = await fetch(`https://api.ip.sb/geoip/${ip}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: controller.signal,
      })
      if (!res.ok) throw new Error()
      const d = await res.json()
      return [d.country, d.region, d.city].filter(Boolean).join(' ')
    },
    // ipapi.co — free, HTTPS
    async () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 3000)
      const res = await fetch(`https://ipapi.co/${ip}/json/`, {
        signal: controller.signal,
      })
      if (!res.ok) throw new Error()
      const d = await res.json()
      if (d.error) throw new Error()
      return [d.country_name, d.region, d.city].filter(Boolean).join(' ')
    },
    // ip-api.com — HTTPS (was HTTP, now fixed)
    async () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 3000)
      const res = await fetch(`https://ip-api.com/json/${ip}?fields=country,regionName,city`, {
        signal: controller.signal,
      })
      if (!res.ok) throw new Error()
      const d = await res.json()
      return [d.country, d.regionName, d.city].filter(Boolean).join(' ')
    },
  ]

  for (const fn of services) {
    try { const r = await fn(); if (r) return r } catch { /* try next */ }
  }
  return ''
}

export async function GET(request) {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfIp = request.headers.get('cf-connecting-ip') // Cloudflare
  const ip = forwarded?.split(',')[0]?.trim() || realIp || cfIp || 'unknown'

  const ua = request.headers.get('user-agent') || ''
  const parser = new UAParser(ua)
  const browser = parser.getBrowser()
  const os = parser.getOS()
  const device = parser.getDevice()

  let deviceType = 'Desktop'
  if (device.type === 'mobile') deviceType = 'Mobile'
  else if (device.type === 'tablet') deviceType = 'Tablet'

  const deviceInfo = [deviceType, os.name || '', browser.name || '']
    .filter(Boolean).join(' / ') || 'Unknown'

  // Correct private IP detection: 172.16.0.0/12 only
  const isPrivate = !ip || ip === 'unknown'
    || ip.startsWith('127.') || ip.startsWith('192.168.')
    || ip.startsWith('10.') || ip === '::1'
    || /^172\.(1[6-9]|2\d|3[01])\./.test(ip)

  const location = isPrivate ? '' : await geoLookup(ip)

  return NextResponse.json({ ip, ip_location: location, device_info: deviceInfo })
}
