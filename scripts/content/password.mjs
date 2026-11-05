import fs from "node:fs"
import path from "node:path"
import { randomBytes } from "node:crypto"
import { loadContentConfig } from "./config.mjs"
import { frontmatter, hasLock } from "./schema.mjs"
import { contentLockKey, loadContentPasswords } from "./locks.mjs"
const root = path.resolve(import.meta.dirname, "../.."),
  file = path.join(root, "passwords.json")
if (process.env.CI && !(process.env.CONTENT_PASSWORDS || process.env.CONTENT_PASSWORD))
  throw Error("Initialize per-document passwords locally; CI requires CONTENT_PASSWORDS.")
const values = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {},
  known = loadContentPasswords(root)
const config = loadContentConfig(root, { allowMissingRepositories: true }),
  keys = new Set(["vault"])
function walk(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((item) =>
      item.name.startsWith(".") || ["media", "assets"].includes(item.name) || item.isSymbolicLink()
        ? []
        : item.isDirectory()
          ? walk(path.join(dir, item.name))
          : [path.join(dir, item.name)],
    )
}
for (const source of config.sources) {
  const files = walk(source.path).filter((file) => file.endsWith(".md"))
  for (const file of files) {
    const raw = fs.readFileSync(file, "utf8")
    if (!raw.startsWith("---")) continue
    const { data } = frontmatter(raw, file)
    if (data.status === "draft" || data.visibility === "private") continue
    const relative = path.relative(source.path, file).split(path.sep),
      name = path.basename(file, ".md")
    if (source.adapter === "stories") {
      if (hasLock(data)) keys.add(contentLockKey(data, source.id, `${relative[0]}/${name}`))
    } else if (hasLock(data)) {
      const parent = path.basename(path.dirname(file)),
        id =
          data.id ??
          data.slug ??
          (["index", "readme"].includes(name.toLowerCase())
            ? config.locales.includes(parent)
              ? path.basename(path.dirname(path.dirname(file)))
              : parent
            : name)
      keys.add(contentLockKey(data, source.id, id))
    }
  }
}
if (config.site.photoJournal) {
  const { data } = frontmatter(
    fs.readFileSync(path.resolve(root, config.site.photoJournal), "utf8"),
  )
  if (hasLock(data)) keys.add(contentLockKey(data, "site", "my-album"))
}
let added = 0
for (const key of keys)
  if (!known[key]) {
    values[key] = randomBytes(24).toString("base64url")
    added++
  }
const serialized = JSON.stringify(values, null, 2) + "\n"
if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== serialized)
  fs.writeFileSync(file, serialized, { mode: 0o600 })
if ((fs.statSync(file).mode & 0o777) !== 0o600) fs.chmodSync(file, 0o600)
console.log(
  `[Content] ${added} missing document/vault credentials created in private passwords.json; existing values preserved. Passwords are never printed.`,
)
