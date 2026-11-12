import fs from "node:fs"
import path from "node:path"

export const isInboxPath = (relative) => relative.split(/[\\/]/).includes("inbox")

/** Working drafts are never inputs to publication, even with incomplete metadata. */
export function contentFiles(directory, { includeInbox = false } = {}) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((item) => {
    if (
      item.name.startsWith(".") ||
      item.isSymbolicLink() ||
      ["media", "assets"].includes(item.name) ||
      (!includeInbox && item.name === "inbox")
    )
      return []
    const file = path.join(directory, item.name)
    return item.isDirectory() ? contentFiles(file, { includeInbox }) : [file]
  })
}
