const PBKDF2_ITERATIONS = 600_000
const PBKDF2_HASH = 'SHA-256'
const AES_KEY_LENGTH = 256
const SALT_LENGTH = 32
const IV_LENGTH = 12
const VERIFY_TOKEN = 'yltt-vault-verified'

const ENCODER = new TextEncoder()
const DECODER = new TextDecoder()

export function generateSalt() {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(SALT_LENGTH)))
}

export function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

export function bytesToHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function deriveKey(password, saltHex) {
  const saltBytes = hexToBytes(saltHex)
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    ENCODER.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBytes, iterations: PBKDF2_ITERATIONS, hash: PBKDF2_HASH },
    keyMaterial,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encrypt(key, plaintext) {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    ENCODER.encode(plaintext),
  )
  return bytesToHex(iv) + ':' + bytesToHex(new Uint8Array(ciphertext))
}

export async function decrypt(key, encrypted) {
  const [ivHex, ctHex] = encrypted.split(':')
  const iv = hexToBytes(ivHex)
  const ciphertext = hexToBytes(ctHex)
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext,
  )
  return DECODER.decode(plaintext)
}

export async function setupVault(masterPassword) {
  const salt = generateSalt()
  const key = await deriveKey(masterPassword, salt)
  const verify = await encrypt(key, VERIFY_TOKEN)
  return { salt, verify }
}

export async function unlockVault(masterPassword, saltHex, verifyHex) {
  const key = await deriveKey(masterPassword, saltHex)
  await decrypt(key, verifyHex) // throws on mismatch
  return key
}
