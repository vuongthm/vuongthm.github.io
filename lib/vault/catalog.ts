import type { VaultCatalog, VaultDescriptor } from "./types"
import { mediaTypes, MAX_MEDIA_BYTES } from "./formats.mjs"
const allowedTypes = new Set<string>(Object.values(mediaTypes))
export function validateDescriptor(value: unknown): VaultDescriptor {
  const data = value as VaultDescriptor
  if (!data || data.version !== 1 || typeof data.configured !== "boolean")
    throw Error("Invalid vault descriptor")
  if (
    data.configured &&
    (data.iterations !== 600000 ||
      typeof data.salt !== "string" ||
      !/^[A-Za-z0-9+/]{22}==$/.test(data.salt) ||
      !/^[a-f0-9-]{36}\.bin$/.test(data.manifest ?? ""))
  )
    throw Error("Invalid vault parameters")
  return data
}
export function validateCatalog(value: unknown): VaultCatalog {
  const data = value as VaultCatalog
  if (!data || data.version !== 1 || !Array.isArray(data.items))
    throw Error("Invalid vault catalog")
  const identities = new Set<string>()
  for (const item of data.items) {
    if (
      !item ||
      !/^[a-f0-9-]{36}$/.test(item.id) ||
      identities.has(item.id) ||
      typeof item.name !== "string" ||
      typeof item.bytes !== "number" ||
      !Number.isSafeInteger(item.bytes) ||
      item.bytes < 0 ||
      item.bytes > MAX_MEDIA_BYTES ||
      (item.previewId !== undefined && !/^[a-f0-9-]{36}$/.test(item.previewId)) ||
      !allowedTypes.has(item.type) ||
      (item.kind !== "image" && item.kind !== "video") ||
      !item.type.startsWith(item.kind + "/") ||
      !["vi", "en", "ja", "zh"].every(
        (code) => typeof item.title?.[code as keyof typeof item.title] === "string",
      )
    )
      throw Error("Invalid vault item")
    identities.add(item.id)
  }
  return data
}
