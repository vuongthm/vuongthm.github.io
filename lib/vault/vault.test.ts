import { afterEach, describe, expect, it, vi } from "vitest"
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { createSalt, deriveVaultKey, openMedia, sealMedia } from "./crypto.mjs"
import { validateCatalog, validateDescriptor } from "./catalog"
import { packageVault, syncVault } from "../../scripts/vault/package.mjs"

const directories: string[] = []
afterEach(async () => {
  vi.unstubAllEnvs()
  await Promise.all(directories.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})
async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "vuong-private-test-"))
  directories.push(root)
  vi.stubEnv("CONTENT_PASSWORD", "")
  vi.stubEnv("CONTENT_PASSWORDS", "")
  vi.stubEnv("VAULT_PASSWORD", "")
  const sourceDir = path.join(root, "originals"),
    outputDir = path.join(root, "encrypted")
  await mkdir(sourceDir)
  return { root, sourceDir, outputDir }
}
describe("private media protection", () => {
  it("authenticates binary data, rejects wrong passwords, tampering and swapped identities", async () => {
    const salt = createSalt(),
      key = await deriveVaultKey("private-test-passphrase-long", salt),
      wrong = await deriveVaultKey("wrong-private-passphrase-long", salt)
    const bytes = new Uint8Array([0, 1, 2, 255, 128, 40]),
      sealed = await sealMedia(key, bytes, "asset-a"),
      again = await sealMedia(key, bytes, "asset-a")
    expect(sealed).not.toEqual(again)
    expect(new Uint8Array(await openMedia(key, sealed, "asset-a"))).toEqual(bytes)
    await expect(openMedia(wrong, sealed, "asset-a")).rejects.toThrow()
    await expect(openMedia(key, sealed, "asset-b")).rejects.toThrow()
    const changed = sealed.slice()
    changed[changed.length - 1] ^= 1
    await expect(openMedia(key, changed, "asset-a")).rejects.toThrow()
    await expect(openMedia(key, bytes, "asset-a")).rejects.toThrow()
  })
  it("publishes only encrypted originals, encrypted previews and encrypted metadata", async () => {
    const { sourceDir, outputDir } = await fixture()
    const password = "SYNTHETIC_VAULT_PASSWORD_very_long"
    const privateTitle = "SYNTHETIC_PRIVATE_MEDIA_TITLE"
    const original = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jS1cAAAAASUVORK5CYII=",
      "base64",
    )
    await writeFile(path.join(sourceDir, "secret.png"), original)
    await writeFile(
      path.join(sourceDir, "library.json"),
      JSON.stringify({ items: [{ file: "secret.png", title: privateTitle }] }),
    )
    await packageVault({ sourceDir, outputDir, password })
    const files = await readdir(outputDir)
    expect(files).toHaveLength(4)
    for (const file of files) {
      const data = await readFile(path.join(outputDir, file))
      expect(data.includes(Buffer.from(password))).toBe(false)
      expect(data.includes(Buffer.from(privateTitle))).toBe(false)
      expect(data.includes(Buffer.from("secret.png"))).toBe(false)
      expect(data.equals(original)).toBe(false)
    }
    const descriptor = validateDescriptor(
      JSON.parse(await readFile(path.join(outputDir, "index.json"), "utf8")),
    )
    const key = await deriveVaultKey(password, descriptor.salt!)
    const catalog = validateCatalog(
      JSON.parse(
        new TextDecoder().decode(
          await openMedia(
            key,
            new Uint8Array(await readFile(path.join(outputDir, descriptor.manifest!))),
            "manifest",
          ),
        ),
      ),
    )
    const item = catalog.items[0]
    expect(item.title.vi).toBe(privateTitle)
    expect(item.previewId).toBeTruthy()
    const decrypted = await openMedia(
      key,
      new Uint8Array(await readFile(path.join(outputDir, item.id + ".bin"))),
      item.id,
    )
    expect(Buffer.from(decrypted)).toEqual(original)
    await expect(
      openMedia(
        key,
        new Uint8Array(await readFile(path.join(outputDir, item.previewId + ".bin"))),
        item.previewId!,
      ),
    ).resolves.toBeInstanceOf(ArrayBuffer)
    const firstIndex = await readFile(path.join(outputDir, "index.json"), "utf8")
    await packageVault({ sourceDir, outputDir, password })
    expect(await readFile(path.join(outputDir, "index.json"), "utf8")).toBe(firstIndex)
    await rm(path.join(outputDir, item.id + ".bin"))
    await packageVault({ sourceDir, outputDir, password })
    expect(await readFile(path.join(outputDir, "index.json"), "utf8")).not.toBe(firstIndex)
  })
  it("refuses weak passwords and source traversal or symlink escapes", async () => {
    const { root, sourceDir, outputDir } = await fixture()
    await writeFile(path.join(root, "outside.mp4"), "private")
    await writeFile(
      path.join(sourceDir, "library.json"),
      JSON.stringify({ items: [{ file: "../outside.mp4" }] }),
    )
    await expect(packageVault({ sourceDir, outputDir, password: "short" })).rejects.toThrow(
      "12 characters",
    )
    await expect(
      packageVault({ sourceDir, outputDir, password: "long-enough-private-passphrase" }),
    ).rejects.toThrow("escapes")
    await symlink(path.join(root, "outside.mp4"), path.join(sourceDir, "link.mp4"))
    await writeFile(
      path.join(sourceDir, "library.json"),
      JSON.stringify({ items: [{ file: "link.mp4" }] }),
    )
    await expect(
      packageVault({ sourceDir, outputDir, password: "long-enough-private-passphrase" }),
    ).rejects.toThrow("escapes")
  })
  it("uses the shared content password by default and honors a dedicated vault group", async () => {
    const { root } = await fixture(),
      privateDir = path.join(root, ".private-vault")
    await mkdir(privateDir)
    await writeFile(path.join(privateDir, "library.json"), JSON.stringify({ items: [] }))
    await writeFile(path.join(privateDir, "password.txt"), "legacy-fixture-password-9271")
    const shared = "shared-fixture-password-2361",
      dedicated = "dedicated-fixture-password-4921"
    await writeFile(path.join(root, "passwords.json"), JSON.stringify({ default: shared }))
    await syncVault(root)
    async function open(password: string) {
      const directory = path.join(root, "public/vault-data"),
        descriptor = JSON.parse(await readFile(path.join(directory, "index.json"), "utf8"))
      const key = await deriveVaultKey(password, descriptor.salt)
      return openMedia(
        key,
        new Uint8Array(await readFile(path.join(directory, descriptor.manifest))),
        "manifest",
      )
    }
    expect(JSON.parse(new TextDecoder().decode(await open(shared))).items).toEqual([])
    await expect(open("legacy-fixture-password-9271")).rejects.toThrow()
    await writeFile(
      path.join(root, "passwords.json"),
      JSON.stringify({ default: shared, vault: dedicated }),
    )
    await syncVault(root)
    expect(JSON.parse(new TextDecoder().decode(await open(dedicated))).items).toEqual([])
    await expect(open(shared)).rejects.toThrow()
  })
  it("rejects downgraded crypto parameters and remote/path-injected asset identities", () => {
    expect(() =>
      validateDescriptor({
        version: 1,
        configured: true,
        salt: createSalt(),
        iterations: 1,
        manifest: "https://attacker.invalid/a",
      }),
    ).toThrow()
    expect(() =>
      validateCatalog({
        version: 1,
        items: [{ id: "../../secret", kind: "image", type: "image/png" }],
      }),
    ).toThrow()
  })
})
