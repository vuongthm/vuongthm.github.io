import fs from "node:fs"
import sharp from "sharp"
import path from "node:path"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import { encryptString } from "../../lib/crypto.mjs"

export const LOCKED_FORMAT = "locked-markdown-v1"
const MAX_ASSET_BYTES = 12 * 1024 * 1024
const MAX_BUNDLE_BYTES = 32 * 1024 * 1024
const types = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".zip": "application/zip",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
}

export function loadContentPasswords(root) {
  /** @type {Record<string, string>} */
  const passwords = {}
  function merge(raw) {
    let value
    try {
      value = JSON.parse(raw)
    } catch {
      throw Error(
        "Invalid content password JSON. Check passwords.json / CONTENT_PASSWORDS; values are never logged.",
      )
    }
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      Object.values(value).some((password) => typeof password !== "string")
    )
      throw Error("Content passwords must be a JSON object with string values.")
    Object.assign(passwords, value)
  }
  const file = path.join(root, "passwords.json")
  if (fs.existsSync(file)) merge(fs.readFileSync(file, "utf8"))
  if (process.env.CONTENT_PASSWORDS) merge(process.env.CONTENT_PASSWORDS)
  if (process.env.CONTENT_PASSWORD) passwords.default = process.env.CONTENT_PASSWORD
  return passwords
}
export function contentLockKey(data, sourceId, id) {
  if (data.lockKey !== undefined && (typeof data.lockKey !== "string" || !data.lockKey.trim()))
    throw Error("lockKey must name a non-empty document password key.")
  const key = data.lockKey ?? `${sourceId}/${id}`
  if (key === "default")
    throw Error("A locked document requires its own password key; default is not allowed.")
  return key
}
export function contentPassword(passwords, data, sourceId, id) {
  if (Object.hasOwn(data, "password"))
    throw Error("Do not put passwords in Markdown; use CONTENT_PASSWORDS at build time.")
  const key = contentLockKey(data, sourceId, id),
    value = passwords[key]
  if (value && value.length < 8)
    throw Error("Content passwords must contain at least 8 characters.")
  if (value && value === passwords.default)
    throw Error("Each locked document needs its own password, distinct from default.")
  return value || undefined
}
function within(file, base) {
  return file.startsWith(base + path.sep)
}
function assetFile(url, source, file, root) {
  const clean = decodeURIComponent(url.split(/[?#]/, 1)[0])
  let target, base
  const prefix = `/media/${source.mediaNamespace ?? source.id}/`
  if (clean.startsWith(prefix)) {
    const relative = clean.slice(prefix.length)
    base = fs.realpathSync(source.path)
    target = path.resolve(base, relative)
    if (!fs.existsSync(target)) {
      const [category, ...rest] = relative.split("/")
      target = path.resolve(base, category, "media", ...rest)
    }
  } else if (clean.startsWith("/") && !clean.startsWith("//")) {
    base = fs.realpathSync(path.join(root, "public"))
    target = path.resolve(base, "." + clean)
    // Public profile variants may be generated later in a clean build.
    if (
      !fs.existsSync(target) &&
      target.endsWith(".webp") &&
      fs.existsSync(target.replace(/\.webp$/, ".png"))
    )
      target = target.replace(/\.webp$/, ".png")
  } else {
    base = fs.realpathSync(source.path)
    target = path.resolve(path.dirname(file), clean)
  }
  if (!within(target, base)) throw Error(`Locked media escapes its source: ${url}`)
  const physical = fs.realpathSync(target)
  if (!within(physical, base) || !fs.statSync(physical).isFile())
    throw Error(`Locked media escapes its source: ${url}`)
  return physical
}
export async function encryptMarkdown(
  body,
  password,
  source,
  file,
  root,
  extraPhotos = [],
  { gallery = false } = {},
) {
  const assets = [],
    seen = new Set()
  let total = Buffer.byteLength(body)
  function add(url, origin = file, alias = url, image = true) {
    if (seen.has(alias)) return
    if (/^(?:https?:|\/\/|data:)/i.test(url)) {
      if (image)
        throw Error("Locked images must be local files; remote/data images are not bundled.")
      return
    }
    const target = assetFile(url, source, origin, root),
      type = types[path.extname(target).toLowerCase()]
    if (!type || (image && !type.startsWith("image/")))
      throw Error(`Unsupported locked media type: ${path.extname(target)}`)
    const size = fs.statSync(target).size
    total += size
    if (size > MAX_ASSET_BYTES || total > MAX_BUNDLE_BYTES)
      throw Error(
        "Locked media exceeds the 12 MiB per file / 32 MiB per page limit. Use the private media vault for large media.",
      )
    assets.push({ url: alias, type, data: fs.readFileSync(target).toString("base64") })
    seen.add(alias)
  }
  const tree = unified().use(remarkParse).use(remarkGfm).parse(body),
    definitions = new Map()
  function walk(node, visit) {
    visit(node)
    for (const child of node.children ?? []) walk(child, visit)
  }
  walk(tree, (node) => {
    if (node.type === "definition") definitions.set(node.identifier, node.url)
  })
  walk(tree, (node) => {
    const image = ["image", "imageReference"].includes(node.type)
    const link = ["link", "linkReference"].includes(node.type)
    if (!image && !link) return
    const url = node.url ?? definitions.get(node.identifier)
    if (!url) return
    if (image) add(url)
    else if (
      !/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(url) &&
      /\.[a-z\d]+(?:[?#].*)?$/i.test(url) &&
      !/\.md(?:#.*)?$/i.test(url)
    )
      add(url, file, url, false)
  })
  for (const [index, photo] of extraPhotos.entries()) {
    const alias = `locked-photo-${index}`
    add(photo.src, photo.file ?? file, alias, !/\.(mp4|webm)$/i.test(photo.src))
    if (!gallery)
      body += `\n\n![${String(photo.alt ?? "").replace(/[\[\]\\\r\n]/g, " ")}](${alias})`
  }
  // Rasterize safe SVGs so decrypted image blobs never contain active XML content.
  for (const asset of assets)
    if (asset.type === "image/svg+xml") {
      const xml = Buffer.from(asset.data, "base64").toString("utf8")
      if (
        /<(?:script|foreignObject|style)\b|\b(?:style|on[a-z]+|xml:base)\s*=|<!DOCTYPE|<!ENTITY|<\?xml-stylesheet|@import|&#|\\/i.test(
          xml,
        ) ||
        /(?:href|src)\s*=\s*["'](?!#)/i.test(xml) ||
        [...xml.matchAll(/url\(([^)]*)\)/gi)].some(
          (match) =>
            !match[1]
              .trim()
              .replace(/^["']|["']$/g, "")
              .startsWith("#"),
        )
      )
        throw Error("Locked SVG contains active content or external references.")
      const image = await sharp(Buffer.from(xml), { limitInputPixels: 40_000_000 })
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer()
      asset.type = "image/webp"
      asset.data = image.toString("base64")
    }
  if (
    Buffer.byteLength(body) +
      assets.reduce((bytes, asset) => bytes + Buffer.byteLength(asset.data, "base64"), 0) >
    MAX_BUNDLE_BYTES
  )
    throw Error("Locked page exceeds the 32 MiB bundle limit.")
  const photos = gallery
    ? extraPhotos.map((photo, index) => ({
        url: `locked-photo-${index}`,
        title: photo.alt ?? "",
        place: photo.place ?? "",
        kind: /\.(mp4|webm)$/i.test(photo.src) ? "video" : "image",
      }))
    : undefined
  return encryptString(
    password,
    JSON.stringify({ format: LOCKED_FORMAT, body, assets, gallery: photos }),
  )
}
