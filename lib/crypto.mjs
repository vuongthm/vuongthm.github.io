/**
 * Vault cryptography — one implementation shared by the build-time encryptor
 * (Node) and the client-side decryptor (browser).
 *
 * Why a single module: the previous setup used `crypto-js` on the client and
 * `CryptoJS.AES.encrypt` inside the build script. Two code paths that must
 * agree forever is a recipe for content that can never be decrypted again.
 * Web Crypto exists in both runtimes (`globalThis.crypto.subtle`), so this
 * file is imported by `scripts/generate-content-data.mjs` AND by
 * `components/features/locked-screen.tsx`. It cannot drift.
 *
 * Cryptographic choices:
 *   - PBKDF2-HMAC-SHA256, 600_000 iterations (OWASP recommendation) — the
 *     old passphrase mode of crypto-js used MD5 with a single iteration,
 *     which made offline brute force trivial.
 *   - AES-256-GCM — authenticated encryption, so tampered ciphertext is
 *     rejected instead of silently producing garbage.
 *   - A random 16-byte salt per vault (one vault = one password) and a
 *     random 12-byte IV per value.
 *
 * Payload format: `v2:` + base64( salt[16] || iv[12] || ciphertext || tag[16] )
 * The version prefix allows a future migration without breaking old content.
 */

export const ENCRYPTION_VERSION = "v2"
export const PBKDF2_ITERATIONS = 600_000

const PREFIX = `${ENCRYPTION_VERSION}:`
const SALT_BYTES = 16
const IV_BYTES = 12

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()
const webcrypto = globalThis.crypto

if (!webcrypto?.subtle) {
  throw new Error(
    "[crypto] Web Crypto API is unavailable. Node 20+ or a secure browser context is required.",
  )
}

/**
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function bytesToBase64(bytes) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64")
  }
  // Chunked to avoid blowing the call stack on large payloads.
  let binary = ""
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

/**
 * @param {string} base64
 * @returns {Uint8Array}
 */
function base64ToBytes(base64) {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(base64, "base64"))
  }
  const binary = atob(base64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

/**
 * @param {number} length
 * @returns {Uint8Array}
 */
export function randomBytes(length) {
  const out = new Uint8Array(length)
  webcrypto.getRandomValues(out)
  return out
}

/**
 * True when the value is a ciphertext produced by this module.
 * @param {unknown} value
 * @returns {boolean}
 */
export function isEncrypted(value) {
  return typeof value === "string" && value.startsWith(PREFIX)
}

/**
 * Reads the salt embedded in a payload.
 * @param {string} payload
 * @returns {string | null} base64 salt, or null when not encrypted
 */
export function readSalt(payload) {
  if (!isEncrypted(payload)) return null
  const raw = base64ToBytes(payload.slice(PREFIX.length))
  if (raw.length < SALT_BYTES + IV_BYTES) return null
  return bytesToBase64(raw.subarray(0, SALT_BYTES))
}

/**
 * Creates a fresh base64 salt for a new vault.
 * @returns {string}
 */
export function createSalt() {
  return bytesToBase64(randomBytes(SALT_BYTES))
}

/**
 * Derives an AES-256-GCM key. The key is non-extractable, so even a
 * successful XSS cannot export it out of the page.
 *
 * @param {string} password
 * @param {string} saltBase64
 * @returns {Promise<CryptoKey>}
 */
export async function deriveVaultKey(password, saltBase64) {
  const baseKey = await webcrypto.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  )

  return webcrypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: base64ToBytes(saltBase64),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  )
}

/**
 * @param {CryptoKey} key
 * @param {string} plaintext
 * @param {string} saltBase64
 * @returns {Promise<string>}
 */
async function encryptWithKey(key, plaintext, saltBase64) {
  const iv = randomBytes(IV_BYTES)
  const ciphertext = new Uint8Array(
    await webcrypto.subtle.encrypt({ name: "AES-GCM", iv }, key, textEncoder.encode(plaintext)),
  )

  const salt = base64ToBytes(saltBase64)
  const out = new Uint8Array(salt.length + iv.length + ciphertext.length)
  out.set(salt, 0)
  out.set(iv, salt.length)
  out.set(ciphertext, salt.length + iv.length)

  return PREFIX + bytesToBase64(out)
}

/**
 * @param {CryptoKey} key
 * @param {string} payload
 * @returns {Promise<string | null>} null when the key is wrong or data was tampered with
 */
async function decryptWithKey(key, payload) {
  if (!isEncrypted(payload)) return payload

  const raw = base64ToBytes(payload.slice(PREFIX.length))
  const iv = raw.subarray(SALT_BYTES, SALT_BYTES + IV_BYTES)
  const ciphertext = raw.subarray(SALT_BYTES + IV_BYTES)

  try {
    const plaintext = await webcrypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext)
    return textDecoder.decode(plaintext)
  } catch {
    // GCM authentication failed: wrong password or modified payload.
    return null
  }
}

/**
 * Creates a reusable vault bound to one password and one salt.
 *
 * This is the preferred API for both the build script and the UI: deriving the
 * key once and reusing it makes decrypting a page with ten encrypted fields
 * cost exactly as much as decrypting one.
 *
 * @param {string} password
 * @param {string} [saltBase64] a fresh random salt by default
 * @returns {Promise<{ salt: string, encrypt: (plaintext: string) => Promise<string>, decrypt: (payload: string) => Promise<string | null> }>}
 */
export async function createVault(password, saltBase64 = createSalt()) {
  const key = await deriveVaultKey(password, saltBase64)

  return {
    salt: saltBase64,
    encrypt: (plaintext) => encryptWithKey(key, plaintext, saltBase64),
    decrypt: (payload) => decryptWithKey(key, payload),
  }
}

/**
 * Encrypts a single value under a freshly derived key.
 *
 * @param {string} password
 * @param {string} plaintext
 * @returns {Promise<string>}
 */
export async function encryptString(password, plaintext) {
  const vault = await createVault(password)
  return vault.encrypt(plaintext)
}

/**
 * Encrypts several values that belong to the same vault.
 *
 * The key is derived **once**, so encrypting ten fields costs the same as
 * encrypting one. All payloads carry the same salt, which is what lets
 * `decryptMany` reverse the operation with a single key derivation.
 *
 * @param {string} password
 * @param {string[]} values
 * @param {string} [saltBase64] reuse an existing vault salt
 * @returns {Promise<string[]>}
 */
export async function encryptMany(password, values, saltBase64 = createSalt()) {
  const vault = await createVault(password, saltBase64)
  const out = []
  for (const value of values) {
    out.push(await vault.encrypt(value))
  }
  return out
}

/**
 * Decrypts several values that share one vault.
 *
 * @param {string} password
 * @param {string[]} payloads plaintext values are passed through untouched
 * @returns {Promise<string[] | null>} null when the password is wrong
 */
export async function decryptMany(password, payloads) {
  const encrypted = payloads.filter(isEncrypted)
  if (encrypted.length === 0) return payloads

  const salt = readSalt(encrypted[0])
  if (!salt) return null

  const vault = await createVault(password, salt)

  const results = []
  for (const payload of payloads) {
    const value = await vault.decrypt(payload)
    if (value === null) return null
    results.push(value)
  }
  return results
}

/**
 * Convenience wrapper for a single value.
 * @param {string} password
 * @param {string} payload
 * @returns {Promise<string | null>}
 */
export async function decryptString(password, payload) {
  const result = await decryptMany(password, [payload])
  return result ? result[0] : null
}
