let clearTimer = null

export async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
  } else {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
}

export function scheduleClipboardClear(delayMs = 30_000) {
  if (clearTimer) clearTimeout(clearTimer)
  if (navigator.clipboard && window.isSecureContext) {
    clearTimer = setTimeout(() => {
      navigator.clipboard.writeText('').catch(() => {})
      clearTimer = null
    }, delayMs)
  }
}
