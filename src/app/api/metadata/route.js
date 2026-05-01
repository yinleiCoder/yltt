import { NextResponse } from 'next/server'
import { UAParser } from 'ua-parser-js'

export const dynamic = 'force-dynamic'

async function geoLookup(ip) {
  const services = [
    // ip.sb — free, HTTPS, no key
    async () => {
      const res = await fetch(`https://api.ip.sb/geoip/${ip}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(3000),
      })
      if (!res.ok) throw new Error()
      const d = await res.json()
      return [d.country, d.region, d.city].filter(Boolean).join(' ')
    },
    // ipapi.co — free, HTTPS, 1000 req/day
    async () => {
      const res = await fetch(`https://ipapi.co/${ip}/json/`, {
        signal: AbortSignal.timeout(3000),
      })
      if (!res.ok) throw new Error()
      const d = await res.json()
      if (d.error) throw new Error()
      return [d.country_name, d.region, d.city].filter(Boolean).join(' ')
    },
    // ip-api.com — HTTP fallback
    async () => {
      const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,regionName,city`, {
        signal: AbortSignal.timeout(3000),
      })
      if (!res.ok) throw new Error()
      const d = await res.json()
      return [d.country, d.regionName, d.city].filter(Boolean).join(' ')
    },
  ]

  for (const fn of services) {
    try {
      const result = await fn()
      if (result) return result
    } catch { /* try next */ }
  }
  return ''
}

export async function GET(request) {
  // Extract IP
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown'

  // Parse device info
  const ua = request.headers.get('user-agent') || ''
  const parser = new UAParser(ua)
  const browser = parser.getBrowser()
  const os = parser.getOS()
  const device = parser.getDevice()

  let deviceType = 'Desktop'
  if (device.type === 'mobile') deviceType = 'Mobile'
  else if (device.type === 'tablet') deviceType = 'Tablet'

  const deviceInfo = [
    deviceType,
    os.name || '',
    browser.name || '',
  ].filter(Boolean).join(' / ') || 'Unknown'

  // Geolocation (skip private/localhost IPs)
  const isPrivate = !ip || ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip === '::1' || ip.startsWith('172.')
  const location = isPrivate ? '' : await geoLookup(ip)

  return NextResponse.json({ ip, ip_location: location, device_info: deviceInfo })
}
