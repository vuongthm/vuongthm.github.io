import fs from "node:fs"
import path from "node:path"
import sharp from "sharp"
import { brandViewBox, brandInk, brandGold, brandPaths, brandAccentPath } from "../lib/brand.mjs"

/** Run pnpm icons after changing the THM geometry; generated assets are committed. */
const publicDir = path.resolve(import.meta.dirname, "../public")
const mark = `<g class="thm-ink" fill="${brandInk}">${brandPaths.map((d) => `<path d="${d}"/>`).join("")}</g><path d="${brandAccentPath}" fill="${brandGold}"/>`
const adaptive =
  "<style>@media(prefers-color-scheme:dark){.thm-ink{fill:#EDF3F8}.icon-paper{fill:#171A1E}}</style>"
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" role="img" aria-label="THM">${adaptive}<rect class="icon-paper" x="2" y="2" width="156" height="156" rx="30" fill="#F8F7F3"/><svg x="4" y="57" width="152" height="41" viewBox="${brandViewBox}">${mark}</svg></svg>\n`
const logo = `<svg xmlns="http://www.w3.org/2000/svg" width="1335" height="355" viewBox="${brandViewBox}" role="img" aria-label="THM">${adaptive}${mark}</svg>\n`
fs.writeFileSync(path.join(publicDir, "icon.svg"), icon)
fs.writeFileSync(path.join(publicDir, "logo.svg"), logo)
const light = icon.replace(adaptive, "")
const dark = light.replaceAll(brandInk, "#EDF3F8").replaceAll("#F8F7F3", "#171A1E")
for (const job of [
  { file: "icon-light-32x32.png", size: 32, svg: light },
  { file: "icon-dark-32x32.png", size: 32, svg: dark },
  { file: "apple-icon.png", size: 180, svg: light },
]) {
  await sharp(Buffer.from(job.svg))
    .resize(job.size, job.size)
    .flatten({ background: job.svg === dark ? "#171A1E" : "#F8F7F3" })
    .png()
    .toFile(path.join(publicDir, job.file))
  console.log(`[Icons] ${job.file}: THM, ${job.size}×${job.size}`)
}
