export function parseMultipart(buf, boundary) {
  const BOUNDARY = Buffer.from(`--${boundary}`)
  const DOUBLE_CRLF = Buffer.from('\r\n\r\n')
  let file = null
  let folder = ''

  let pos = buf.indexOf(BOUNDARY)
  if (pos === -1) return { file: null, folder: '' }
  pos += BOUNDARY.length

  while (pos < buf.length - 1) {
    if (buf[pos] === 0x0d && buf[pos + 1] === 0x0a) pos += 2

    const headerEnd = buf.indexOf(DOUBLE_CRLF, pos)
    if (headerEnd === -1) break

    const headerSection = buf.slice(pos, headerEnd).toString()
    pos = headerEnd + 4

    const nameMatch = headerSection.match(/name="([^"]+)"/)
    const filenameMatch = headerSection.match(/filename="([^"]+)"/)
    const contentTypeMatch = headerSection.match(/Content-Type:\s*(.+)/i)

    const name = nameMatch?.[1] || ''

    const nextBoundary = buf.indexOf(BOUNDARY, pos)
    if (nextBoundary === -1) break

    let contentEnd = nextBoundary
    if (contentEnd - 2 >= pos && buf[contentEnd - 2] === 0x0d && buf[contentEnd - 1] === 0x0a) {
      contentEnd -= 2
    }

    const content = buf.slice(pos, contentEnd)

    if (filenameMatch) {
      file = {
        name: filenameMatch[1],
        type: contentTypeMatch?.[1]?.trim() || 'application/octet-stream',
        size: content.length,
        buffer: content,
      }
    } else if (name === 'folder') {
      folder = content.toString()
    }

    pos = nextBoundary + BOUNDARY.length
    if (pos < buf.length - 1 && buf[pos] === 0x2d && buf[pos + 1] === 0x2d) break
  }

  return { file, folder }
}
