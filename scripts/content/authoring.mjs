import fs from "node:fs"
import path from "node:path"
import { frontmatter, normalizeDate } from "./schema.mjs"
import { contentFiles } from "./files.mjs"

const locales = ["vi", "en", "ja", "zh"]
export function authoringDate(value, now = new Date()) {
  return normalizeDate(
    value ??
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(now),
    "article date",
  )
}
function localizedArticles(directory) {
  return contentFiles(directory).filter(
    (file) => file.endsWith(".md") && locales.includes(path.basename(path.dirname(file))),
  )
}
export function moduleOrders(directory, folder) {
  const target = path.join(directory, folder)
  const files = fs.existsSync(target) ? localizedArticles(target) : []
  return files.map((file) => frontmatter(fs.readFileSync(file, "utf8"), file).data.order ?? 0)
}
