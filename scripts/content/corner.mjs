import fs from "node:fs"
import path from "node:path"

/** Only explicitly listed public media is emitted, never an entire repository. */
export function compileMusic(source, asset = (url) => url) {
  if (!source.music) return []
  if (typeof source.music !== "string" || path.isAbsolute(source.music))
    throw Error(`Invalid music manifest: ${source.id}`)
  const base = fs.realpathSync(source.path),
    file = fs.realpathSync(path.resolve(base, source.music))
  if (!file.startsWith(base + path.sep)) throw Error(`Music manifest escapes module: ${source.id}`)
  const records = JSON.parse(fs.readFileSync(file, "utf8"))
  if (!Array.isArray(records)) throw Error(`Music manifest must be an array: ${source.id}`)
  const seen = new Set()
  return records
    .filter((track) => track.status !== "draft" && track.visibility !== "private")
    .map((track) => {
      if (track.lock || track.locked || track.visibility === "encrypted")
        throw Error(`Locked audio must use the private media vault: ${track.id}`)
      if (typeof track.id !== "string" || !/^[\w-]+$/.test(track.id) || seen.has(track.id))
        throw Error(`Invalid or duplicate music track: ${track.id}`)
      seen.add(track.id)
      for (const key of ["title", "artist", "cover"])
        if (typeof track[key] !== "string" || !track[key].trim())
          throw Error(`Missing music ${key}: ${track.id}`)
      if (!["focus", "quiet", "personal"].includes(track.mood))
        throw Error(`Invalid music mood: ${track.id}`)
      if (Boolean(track.src) === Boolean(track.youtubeId))
        throw Error(`Choose one audio source: ${track.id}`)
      if (track.youtubeId && !/^[\w-]{11}$/.test(track.youtubeId))
        throw Error(`Invalid YouTube ID: ${track.id}`)
      if (track.source && !/^https?:\/\//.test(track.source))
        throw Error(`Invalid music source URL: ${track.id}`)
      if (track.lyrics && !/\.(lrc|txt)$/i.test(track.lyrics))
        throw Error(`Invalid lyric file: ${track.id}`)
      return {
        id: track.id,
        title: track.title.trim(),
        artist: track.artist.trim(),
        mood: track.mood,
        moduleId: source.id,
        cover: asset(track.cover, file),
        ...(track.src ? { src: asset(track.src, file) } : { youtubeId: track.youtubeId }),
        ...(track.lyrics ? { lyrics: asset(track.lyrics, file) } : {}),
        ...(track.performer ? { performer: String(track.performer).trim() } : {}),
        ...(track.source ? { source: track.source } : {}),
        ...(track.license ? { license: String(track.license) } : {}),
      }
    })
}
