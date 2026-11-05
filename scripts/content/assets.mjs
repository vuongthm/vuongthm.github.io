import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import sharp from "sharp"

export async function emitAssets(root, assets, entries, stories, imageVariants = []) {
  const cachePath = path.join(root, ".cache/assets-v2.json"),
    publicDir = path.join(root, "public"),
    active = new Set()
  let cache = {}
  try {
    cache = JSON.parse(fs.readFileSync(cachePath, "utf8"))
  } catch {
    /* First build. */
  }
  const nextCache = {},
    dimensions = {}
  for (const [url, source] of assets) {
    const raster = /\.(png|jpe?g)$/i.test(url),
      targetUrl = raster ? url.replace(/\.(png|jpe?g)$/i, ".webp") : url,
      target = path.join(publicDir, targetUrl)
    active.add(target)
    const hash = crypto
      .createHash("sha256")
      .update(fs.readFileSync(source))
      .update("webp-v2-1600-82")
      .digest("hex")
    if (cache[targetUrl] !== hash || !fs.existsSync(target)) {
      fs.mkdirSync(path.dirname(target), { recursive: true })
      if (raster)
        await sharp(source)
          .rotate()
          .resize({ width: 1600, withoutEnlargement: true })
          .webp({ quality: 82, effort: 4 })
          .toFile(target)
      else fs.copyFileSync(source, target)
    }
    nextCache[targetUrl] = hash
    if (/\.(?:png|jpe?g|webp|avif|gif|svg)$/i.test(target)) {
      const info = await sharp(target).metadata()
      dimensions[targetUrl] = { width: info.width, height: info.height }
    }
    if (targetUrl !== url) {
      for (const entry of entries)
        if (!entry.encrypted) entry.body = entry.body.replaceAll(url, targetUrl)
      for (const story of stories) if (story.cover === url) story.cover = targetUrl
    }
  }
  const media = path.join(publicDir, "media")
  function prune(dir) {
    if (!fs.existsSync(dir)) return
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, item.name)
      if (item.isDirectory()) prune(file)
      else if (!active.has(file)) fs.unlinkSync(file)
    }
  }
  prune(media)
  for (const variant of imageVariants) {
    const source = path.join(publicDir, variant.source),
      target = path.join(publicDir, variant.target),
      id = variant.target,
      width = variant.width
    const hash = crypto
      .createHash("sha256")
      .update(fs.readFileSync(source))
      .update(String(width))
      .digest("hex")
    if (cache[id] !== hash || !fs.existsSync(target))
      await sharp(source)
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(target)
    nextCache[id] = hash
  }
  fs.mkdirSync(path.dirname(cachePath), { recursive: true })
  fs.writeFileSync(cachePath, JSON.stringify(nextCache))
  return dimensions
}
