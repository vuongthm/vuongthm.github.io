import { describe, expect, it } from "vitest"
import {
  ENCRYPTION_VERSION,
  createSalt,
  createVault,
  decryptMany,
  decryptString,
  encryptMany,
  encryptString,
  isEncrypted,
  readSalt,
} from "./crypto.mjs"

/**
 * These tests pin down the security properties of the vault, not just that it
 * round-trips. Every one of them corresponds to a weakness of the old
 * crypto-js implementation that this module replaced.
 *
 * PBKDF2 runs 600,000 iterations on purpose, so each derivation costs a few
 * hundred milliseconds. The suite deliberately derives as few times as it can.
 */

const PASSWORD = "correct horse battery staple"

describe("vault cryptography", () => {
  it("never leaves plaintext in the payload", async () => {
    const payload = await encryptString(PASSWORD, "secret note body")

    expect(payload.startsWith(`${ENCRYPTION_VERSION}:`)).toBe(true)
    expect(payload).not.toContain("secret note body")
    expect(isEncrypted(payload)).toBe(true)
  })

  it("decrypts with the right password", async () => {
    const payload = await encryptString(PASSWORD, "secret note body")

    expect(await decryptString(PASSWORD, payload)).toBe("secret note body")
  })

  it("returns null — never garbage — for a wrong password", async () => {
    const payload = await encryptString(PASSWORD, "secret note body")

    // The old crypto-js call returned an empty string here, which callers
    // treated as "no content" and silently rendered a blank page.
    expect(await decryptString("wrong password", payload)).toBeNull()
  })

  it("rejects tampered ciphertext instead of decrypting it", async () => {
    const payload = await encryptString(PASSWORD, "secret note body")

    // Flip a character in the middle of the base64 body, keeping it valid base64.
    const body = payload.slice(`${ENCRYPTION_VERSION}:`.length)
    const pivot = Math.floor(body.length / 2)
    const swapped = body[pivot] === "A" ? "B" : "A"
    const tampered = `${ENCRYPTION_VERSION}:${body.slice(0, pivot)}${swapped}${body.slice(pivot + 1)}`

    expect(await decryptString(PASSWORD, tampered)).toBeNull()
  })

  it("uses a distinct salt per vault and a distinct IV per value", async () => {
    const first = createSalt()
    const second = createSalt()
    expect(first).not.toBe(second)

    const vault = await createVault(PASSWORD)
    const a = await vault.encrypt("same text")
    const b = await vault.encrypt("same text")

    // Identical plaintext must never produce identical ciphertext.
    expect(a).not.toBe(b)
    // The salt travels inside every payload so it can be read back.
    expect(readSalt(a)).toBe(vault.salt)
  })

  it("derives the key once for a batch and reverses it in one pass", async () => {
    const values = ["title", "preview", "body"]
    const payloads = await encryptMany(PASSWORD, values)

    // One salt for the whole vault is what makes batch decryption possible.
    expect(new Set(payloads.map(readSalt)).size).toBe(1)

    expect(await decryptMany(PASSWORD, payloads)).toEqual(values)
    expect(await decryptMany("wrong password", payloads)).toBeNull()
  })

  it("passes unencrypted values through untouched", async () => {
    const payloads = await encryptMany(PASSWORD, ["secret"])

    // Locked items often mix encrypted fields with plaintext ones.
    expect(await decryptMany(PASSWORD, ["public description", payloads[0]])).toEqual([
      "public description",
      "secret",
    ])
  })
})
