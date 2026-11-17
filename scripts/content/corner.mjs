import fs from "node:fs"
import path from "node:path"
import { musicMoods } from "../../lib/music/moods.mjs"

export function compileFriends(source, locales, asset = (url) => url) {
  if (!source.friends) return []
  if (typeof source.friends !== "string" || path.isAbsolute(source.friends))
    throw Error(`Invalid friends manifest: ${source.id}`)
  const base = fs.realpathSync(source.path)
  const file = fs.realpathSync(path.resolve(base, source.friends))
  if (!file.startsWith(base + path.sep))
    throw Error(`Friends manifest escapes module: ${source.id}`)
  const records = JSON.parse(fs.readFileSync(file, "utf8"))
  if (!Array.isArray(records)) throw Error(`Friends manifest must be an array: ${source.id}`)
  const seen = new Set()
  return records
    .filter((friend) => friend.status !== "draft" && friend.visibility !== "private")
    .map((friend) => {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(friend.id) || seen.has(friend.id))
        throw Error(`Invalid or duplicate friend ID: ${friend.id}`)
      seen.add(friend.id)
      if (
        !["name", "alias", "initials"].every(
          (key) => typeof friend[key] === "string" && friend[key].trim(),
        ) ||
        !Array.isArray(friend.topics) ||
        !friend.topics.every((topic) => typeof topic === "string" && topic.trim()) ||
        !locales.every((locale) => typeof friend.description?.[locale] === "string")
      )
        throw Error(`Incomplete friend profile: ${friend.id}`)
      if (typeof friend.website !== "string" || !/^https?:\/\//.test(friend.website))
        throw Error(`Invalid friend website: ${friend.id}`)
      new URL(friend.website)
      return { ...friend, ...(friend.avatar ? { avatar: asset(friend.avatar, file) } : {}) }
    })
}

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
      if (!musicMoods.includes(track.mood))
        throw Error(
          `Invalid music mood: ${track.id} (${String(track.mood)}). Supported: ${musicMoods.join(", ")}`,
        )
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
