import fs from "node:fs"
import path from "node:path"

export function learningFiles(source) {
  const files =
    source.learningPaths === undefined
      ? []
      : Array.isArray(source.learningPaths)
        ? source.learningPaths
        : [source.learningPaths]
  const seen = new Set()
  for (const file of files) {
    if (typeof file === "string" && (path.isAbsolute(file) || file.split(/[\\/]/).includes("..")))
      throw Error(`Learning paths escape module: ${source.id}`)
    if (
      typeof file !== "string" ||
      path.isAbsolute(file) ||
      file.split(/[\\/]/).some((part) => !part || part === "." || part === "..") ||
      seen.has(file)
    )
      throw Error(`Invalid learningPaths file: ${source.id}`)
    seen.add(file)
  }
  return files
}

/** A group owns one path object; old repositories may retain arrays of paths. */
export function readLearningDefinitions(source) {
  const base = fs.realpathSync(source.path)
  return learningFiles(source).flatMap((relative) => {
    const file = fs.realpathSync(path.resolve(base, relative))
    if (!file.startsWith(base + path.sep)) throw Error(`Learning paths escape module: ${source.id}`)
    const data = JSON.parse(fs.readFileSync(file, "utf8"))
    const records = Array.isArray(data) ? data : [data]
    if (records.some((record) => !record || typeof record !== "object" || Array.isArray(record)))
      throw Error(`Learning paths must be an object or array: ${source.id}`)
    return records.map((record) => ({ ...record }))
  })
}
