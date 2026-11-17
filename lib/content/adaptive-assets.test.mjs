import { afterEach, expect, it } from "vitest"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { emitAssets } from "../../scripts/content/assets.mjs"

const folders = []
afterEach(() => {
  for (const folder of folders.splice(0)) fs.rmSync(folder, { recursive: true, force: true })
})

it("preserves SVG theme opt-in and dimensions on cold and cached content builds", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "adaptive-svg-"))
  folders.push(root)
  const adaptive = path.join(root, "adaptive.svg"),
    normal = path.join(root, "normal.svg")
  fs.writeFileSync(
    adaptive,
    '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="40" data-color-scheme="adaptive"><rect width="20" height="20"/></svg>',
  )
  fs.writeFileSync(
    normal,
    '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="30"><rect width="20" height="20"/></svg>',
  )
  const assets = new Map([
    ["/media/diagrams/adaptive.svg", adaptive],
    ["/media/diagrams/normal.svg", normal],
  ])
  for (let build = 0; build < 2; build++) {
    const dimensions = await emitAssets(root, assets, [], [])
    expect(dimensions["/media/diagrams/adaptive.svg"]).toEqual({
      width: 80,
      height: 40,
      adaptiveColorScheme: true,
    })
    expect(dimensions["/media/diagrams/normal.svg"]).toEqual({ width: 60, height: 30 })
    expect(fs.readFileSync(path.join(root, "public/media/diagrams/adaptive.svg"), "utf8")).toBe(
      fs.readFileSync(adaptive, "utf8"),
    )
  }
})
