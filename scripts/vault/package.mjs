import { loadContentPasswords } from "../content/locks.mjs"
import fs from "node:fs/promises"
import path from "node:path"
import { createHash, randomUUID } from "node:crypto"
import {
  sealMedia,
  deriveVaultKey,
  createSalt,
  PBKDF2_ITERATIONS,
} from "../../lib/vault/crypto.mjs"
import { createReadStream } from "node:fs"
import { mediaTypes as types, MAX_MEDIA_BYTES as MAX_BYTES } from "../../lib/vault/formats.mjs"
export async function packageVault({ sourceDir, outputDir, password, force = false }) {
  if (password.length < 12) throw new Error("Vault password must contain at least 12 characters.")
  const sourceRoot = await fs.realpath(sourceDir)
  const raw = await fs.readFile(path.join(sourceRoot, "library.json"), "utf8")
  const source = JSON.parse(raw)
  if (!Array.isArray(source.items)) throw new Error("Vault library requires an items array.")
  const fingerprint = createHash("sha256")
    .update("vault-v1:encrypted-previews")
    .update(password)
    .update(raw)
  const entries = []
  for (const item of source.items) {
    if (!item.file || path.isAbsolute(item.file))
      throw new Error("Vault files must be relative to the private source folder.")
    const file = await fs.realpath(path.resolve(sourceRoot, item.file))
    if (!file.startsWith(sourceRoot + path.sep))
      throw new Error("Vault file escapes private source folder.")
    const type = types[path.extname(file).toLowerCase()]
    if (!type) throw new Error("Unsupported private media format.")
    const stat = await fs.stat(file)
    if (!stat.isFile() || stat.size > MAX_BYTES)
      throw new Error("Private media must be a regular file up to 80 MiB.")
    fingerprint.update(item.file)
    for await (const chunk of createReadStream(file)) fingerprint.update(chunk)
    const label = item.title ?? path.basename(file)
    const title = Object.fromEntries(
      ["vi", "en", "ja", "zh"].map((locale) => [
        locale,
        typeof label === "string"
          ? label
          : (label[locale] ?? label.vi ?? label.en ?? path.basename(file)),
      ]),
    )
    entries.push({
      file,
      metadata: {
        id: randomUUID(),
        title,
        name: path.basename(file),
        type,
        kind: type.startsWith("image/") ? "image" : "video",
        bytes: stat.size,
      },
    })
  }
  const digest = fingerprint.digest("hex")
  const cacheFile = path.join(sourceRoot, ".build-state.json")
  const cache = await fs
    .readFile(cacheFile, "utf8")
    .then(JSON.parse)
    .catch(() => null)
  const existing = await fs
    .readFile(path.join(outputDir, "index.json"), "utf8")
    .then(JSON.parse)
    .catch(() => null)
  if (
    !force &&
    cache?.digest === digest &&
    existing?.configured &&
    Array.isArray(cache.files) &&
    (
      await Promise.all(
        cache.files.map((name) =>
          fs
            .stat(path.join(outputDir, name))
            .then(() => true)
            .catch(() => false),
        ),
      )
    ).every(Boolean) &&
    (await fs
      .stat(path.join(outputDir, existing.manifest))
      .then(() => true)
      .catch(() => false))
  )
    return
  const salt = createSalt(),
    key = await deriveVaultKey(password, salt)
  const stage = outputDir + ".staging"
  await fs.rm(stage, { recursive: true, force: true })
  await fs.mkdir(stage, { recursive: true })
  try {
    const sharp = (await import("sharp")).default
    for (const entry of entries) {
      const bytes = await fs.readFile(entry.file)
      await fs.writeFile(
        path.join(stage, entry.metadata.id + ".bin"),
        await sealMedia(key, bytes, entry.metadata.id),
      )
      if (entry.metadata.kind === "image") {
        const preview = await sharp(bytes)
          .rotate()
          .resize({ width: 720, height: 720, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer()
        entry.metadata.previewId = randomUUID()
        await fs.writeFile(
          path.join(stage, entry.metadata.previewId + ".bin"),
          await sealMedia(key, preview, entry.metadata.previewId),
        )
      }
    }
    const manifest = randomUUID() + ".bin"
    await fs.writeFile(
      path.join(stage, manifest),
      await sealMedia(
        key,
        new TextEncoder().encode(
          JSON.stringify({ version: 1, items: entries.map((x) => x.metadata) }),
        ),
        "manifest",
      ),
    )
    await fs.writeFile(
      path.join(stage, "index.json"),
      JSON.stringify({
        version: 1,
        configured: true,
        salt,
        iterations: PBKDF2_ITERATIONS,
        manifest,
      }) + "\n",
    )
    await fs.mkdir(outputDir, { recursive: true })
    await fs.cp(stage, outputDir, { recursive: true })
    const keep = new Set(await fs.readdir(stage))
    for (const file of await fs.readdir(outputDir))
      if (file !== "README.md" && !keep.has(file)) await fs.rm(path.join(outputDir, file))
    await fs.writeFile(cacheFile, JSON.stringify({ digest, files: [...keep] }) + "\n", {
      mode: 0o600,
    })
  } finally {
    await fs.rm(stage, { recursive: true, force: true })
  }
}
export async function syncVault(root) {
  const sourceDir = path.join(root, ".private-vault"),
    encrypted = path.join(root, "vault-encrypted"),
    output = path.join(root, "public/vault-data")
  const hasSource = await fs
    .stat(path.join(sourceDir, "library.json"))
    .then(() => true)
    .catch(() => false)
  if (hasSource) {
    const passwords = loadContentPasswords(root)
    const envVaultPassword = process.env.VAULT_PASSWORD?.trim()
    const password =
      envVaultPassword ||
      passwords.vault?.trim() ||
      passwords.default?.trim() ||
      (await fs.readFile(path.join(sourceDir, "password.txt"), "utf8")).trim()
    await packageVault({ sourceDir, outputDir: encrypted, password })
  }
  await fs.mkdir(output, { recursive: true })
  const descriptor = await fs.readFile(path.join(encrypted, "index.json"), "utf8").catch(() => null)
  if (!descriptor) {
    await fs.writeFile(
      path.join(output, "index.json"),
      JSON.stringify({ version: 1, configured: false }),
    )
    return
  }
  const keep = new Set()
  for (const name of await fs.readdir(encrypted)) {
    if (name !== "index.json" && !/^[a-f0-9-]{36}\.bin$/.test(name)) continue
    keep.add(name)
    const input = await fs.readFile(path.join(encrypted, name)),
      previous = await fs.readFile(path.join(output, name)).catch(() => null)
    if (!previous?.equals(input)) await fs.writeFile(path.join(output, name), input)
  }
  for (const name of await fs.readdir(output))
    if (!keep.has(name)) await fs.rm(path.join(output, name), { recursive: true, force: true })
}
