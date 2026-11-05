export interface UnlockedDocument {
  gallery?: { url: string; title: string; place: string; kind?: "image" | "video" }[]
  body: string
  assets: { url: string; type: string; data: string }[]
}
/** Legacy text ciphertext is still readable; new payloads also carry protected media. */
export function parseUnlockedDocument(text: string): UnlockedDocument {
  if (!text.startsWith('{"format":"locked-markdown-v1"')) return { body: text, assets: [] }
  const value = JSON.parse(text)
  if (
    value.format !== "locked-markdown-v1" ||
    typeof value.body !== "string" ||
    !Array.isArray(value.assets) ||
    (value.gallery !== undefined &&
      (!Array.isArray(value.gallery) ||
        value.gallery.some(
          (photo: NonNullable<UnlockedDocument["gallery"]>[number]) =>
            !photo ||
            typeof photo.url !== "string" ||
            typeof photo.title !== "string" ||
            typeof photo.place !== "string" ||
            (photo.kind !== undefined && !["image", "video"].includes(photo.kind)) ||
            !value.assets.some(
              (asset: UnlockedDocument["assets"][number]) =>
                asset.url === photo.url &&
                asset.type.startsWith(photo.kind === "video" ? "video/" : "image/"),
            ),
        ))) ||
    value.assets.some(
      (asset: UnlockedDocument["assets"][number]) =>
        !asset ||
        typeof asset.url !== "string" ||
        typeof asset.type !== "string" ||
        typeof asset.data !== "string" ||
        !/^(?:image\/(?:png|jpeg|webp|gif|avif)|application\/(?:pdf|zip)|text\/plain|video\/(?:mp4|webm))$/.test(
          asset.type,
        ),
    )
  )
    throw Error("Invalid encrypted document")
  return value
}
