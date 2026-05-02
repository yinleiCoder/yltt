const CDN_DOMAIN = process.env.NEXT_PUBLIC_OSS_CDN_DOMAIN || 'https://yltt.oss-cn-hangzhou.aliyuncs.com'

export function getFileUrl(objectKey) {
  if (!objectKey) return '/placeholder.svg'
  if (objectKey.startsWith('http')) return objectKey
  return `${CDN_DOMAIN}/${objectKey}`
}

export function getOssKey(urlOrKey) {
  if (!urlOrKey) return null
  if (!urlOrKey.startsWith('http')) return urlOrKey
  try {
    const u = new URL(urlOrKey)
    return u.pathname.slice(1) // remove leading /
  } catch { return null }
}

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
export const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024
