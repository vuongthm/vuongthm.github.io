import { loadContentPasswords } from "./content/locks.mjs"
import fs from "node:fs"
import path from "node:path"
const root = path.resolve(import.meta.dirname, ".."),
  out = path.join(root, "out")
const content = JSON.parse(fs.readFileSync(path.join(root, "generated/content.json"), "utf8"))
function walk(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((item) =>
      item.isDirectory() ? walk(path.join(dir, item.name)) : [path.join(dir, item.name)],
    )
}
const files = walk(out),
  htmlFiles = files.filter((file) => file.endsWith(".html"))
if (fs.existsSync(path.join(out, ".private-vault")))
  throw new Error("Private source directory in export")
const vaultPath = path.join(out, "vault-data")
if (fs.existsSync(vaultPath)) {
  for (const name of fs.readdirSync(vaultPath)) {
    if (name === "index.json") continue
    if (!/^[a-f0-9-]{36}\.bin$/.test(name))
      throw new Error("Unexpected plaintext file in vault export")
    const data = fs.readFileSync(path.join(vaultPath, name))
    if (data.length < 32 || data.subarray(0, 4).toString() !== "VMV1")
      throw new Error("Invalid encrypted media in export")
  }
  const descriptor = JSON.parse(fs.readFileSync(path.join(vaultPath, "index.json"), "utf8"))
  if (descriptor.configured && !fs.existsSync(path.join(vaultPath, descriptor.manifest)))
    throw new Error("Encrypted vault manifest missing")
}
// Validate the compiled styles too: an HTML page can exist while its imported
// stylesheet or a font referenced inside that stylesheet is missing.
const cssFiles = files.filter((file) => file.endsWith(".css"))
if (!cssFiles.length) throw new Error("No compiled stylesheets in the export")
const stylesheetText = cssFiles.map((file) => fs.readFileSync(file, "utf8")).join("\n")
for (const selector of [
  ".footer-main",
  ".journey-detail",
  ".journey-route",
  ".subject-card",
  ".story-grid",
])
  if (!stylesheetText.includes(selector))
    throw new Error(`Missing required component styles: ${selector}`)
let styleAssets = 0
for (const file of cssFiles) {
  const css = fs.readFileSync(file, "utf8")
  for (const match of css.matchAll(/url\(\s*(["']?)([^)"']+)\1\s*\)/g)) {
    const reference = match[2].trim()
    if (/^(?:data:|https?:|\/\/|#|blob:)/i.test(reference)) continue
    const relative = path.relative(out, file).split(path.sep).join("/")
    const resolved = new URL(reference, `https://artifact.local/${relative}`)
    const target = path.join(out, decodeURIComponent(resolved.pathname))
    if (!fs.existsSync(target)) throw new Error(`Missing CSS asset ${reference} in ${relative}`)
    styleAssets++
  }
}
console.log(
  `[Artifact] ${cssFiles.length} stylesheets and ${styleAssets} CSS asset references checked.`,
)
let checked = 0
for (const entry of content.entries) {
  const target = path.join(out, entry.href, "index.html")
  if (!fs.existsSync(target)) throw new Error(`Missing published page: ${entry.href}`)
  const html = fs.readFileSync(target, "utf8")
  if (!html.includes(`<html lang="${entry.locale}"`))
    throw new Error(`Wrong server locale: ${entry.href}`)
  if ((html.match(/<h1(?:\s|>)/g) ?? []).length !== 1)
    throw new Error(`Expected one H1: ${entry.href}`)
  if (!html.includes('rel="canonical"')) throw new Error(`Missing canonical: ${entry.href}`)
  checked++
}
for (const file of files.filter((file) => /\.(html|js|json|txt|xml)$/.test(file))) {
  const text = fs.readFileSync(file, "utf8")
  if (/SYNTHETIC_PRIVATE_SENTINEL|SYNTHETIC_LOCKED_BODY/.test(text))
    throw new Error(`Private fixture leaked: ${path.relative(out, file)}`)
}
const search = JSON.parse(fs.readFileSync(path.join(root, "generated/search.json"), "utf8"))
if (search.some((entry) => entry.encrypted))
  throw new Error("Encrypted entry in public search index")
let links = 0
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8")
  for (const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)[^\"]*"/g)) {
    const url = match[1]
    if (url.startsWith("//")) continue
    const decoded = decodeURIComponent(url)
    const target = path.join(out, decoded)
    if (!fs.existsSync(target) && !fs.existsSync(path.join(target, "index.html")))
      throw new Error(`Broken exported reference ${url} in ${path.relative(out, file)}`)
    links++
  }
}
const textArtifacts = files
  .filter((file) => /\.(html|js|json|txt|xml|css)$/.test(file))
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n")
const vaultPasswordFile = path.join(root, ".private-vault/password.txt")
if (fs.existsSync(vaultPasswordFile)) {
  const password = fs.readFileSync(vaultPasswordFile, "utf8").trim()
  if (password && textArtifacts.includes(password))
    throw new Error("Private vault password leaked into export")
}
for (const password of Object.values(loadContentPasswords(root)))
  if (password && textArtifacts.includes(password))
    throw new Error("Content password leaked into export")
let saved = 0
for (const file of files.filter((file) => /\.(png|jpe?g)$/i.test(file))) {
  const url = "/" + path.relative(out, file).split(path.sep).join("/")
  if (!textArtifacts.includes(url)) {
    saved += fs.statSync(file).size
    fs.unlinkSync(file)
  }
}
console.log(
  `[Artifact] ${links} internal references resolve; removed ${(saved / 1024 / 1024).toFixed(1)} MB of unused source bitmaps from the export.`,
)
console.log(
  `[Artifact] Checked ${checked} content pages, ${htmlFiles.length} HTML files, localized headings and canonical URLs. Public search policy passed.`,
)
