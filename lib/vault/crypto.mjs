import { deriveVaultKey, createSalt, randomBytes, PBKDF2_ITERATIONS } from "../crypto.mjs"
export { deriveVaultKey, createSalt, PBKDF2_ITERATIONS }
const encoder = new TextEncoder()
const magic = new Uint8Array([86, 77, 86, 49])
/** Encrypt a binary object; its identity is authenticated to prevent substitution. */
export async function sealMedia(key, bytes, identity) {
  const iv = randomBytes(12)
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: encoder.encode(`vuong-media-v1:${identity}`) },
    key,
    bytes,
  )
  const output = new Uint8Array(16 + ciphertext.byteLength)
  output.set(magic)
  output.set(iv, 4)
  output.set(new Uint8Array(ciphertext), 16)
  return output
}
/** Wrong keys, modified files and swapped identities all fail authentication. */
export async function openMedia(key, bytes, identity) {
  if (bytes.length < 32 || !magic.every((value, i) => bytes[i] === value))
    throw new Error("Invalid encrypted media")
  return crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: bytes.slice(4, 16),
      additionalData: encoder.encode(`vuong-media-v1:${identity}`),
    },
    key,
    bytes.slice(16),
  )
}
