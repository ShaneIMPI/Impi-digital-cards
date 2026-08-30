// Lets the deployed site store a GitHub access token in an encrypted form
// (as ordinary text in config.js, safe to be public), unlockable only by
// a passcode the person chooses and remembers themselves. Nothing here
// ever leaves the browser — encryption and decryption both happen
// entirely client-side using the browser's built-in Web Crypto API.
//
// The passcode itself is never stored anywhere. Only the (memorable)
// passcode holder can recover the real token from the stored ciphertext.

const PBKDF2_ITERATIONS = 250000

async function deriveKey(passcode, saltBytes) {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passcode),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

function toBase64(bytes) {
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary)
}

function fromBase64(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export async function encryptToken(token, passcode) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(passcode, salt)
  const enc = new TextEncoder()
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(token))

  // Pack salt + iv + ciphertext together into one storable base64 blob.
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength)
  combined.set(salt, 0)
  combined.set(iv, salt.length)
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length)
  return toBase64(combined)
}

export async function decryptToken(blobBase64, passcode) {
  const combined = fromBase64(blobBase64)
  const salt = combined.slice(0, 16)
  const iv = combined.slice(16, 28)
  const ciphertext = combined.slice(28)
  const key = await deriveKey(passcode, salt)

  try {
    const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
    return new TextDecoder().decode(plainBuf)
  } catch (e) {
    // AES-GCM includes an integrity check, so a wrong passcode reliably
    // fails to decrypt rather than silently producing garbage.
    throw new Error('Incorrect passcode.')
  }
}
