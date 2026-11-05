import fs from "node:fs"
import path from "node:path"
import { spawn } from "node:child_process"
import { fetchSources } from "./content/fetch-sources.mjs"
import { loadContentConfig } from "./content/config.mjs"
import { fileURLToPath } from "node:url"
const root = path.resolve(import.meta.dirname, "..")
async function compile() {
  fetchSources(root)
  await new Promise((resolve, reject) => {
    const setup = spawn(process.execPath, [path.join(root, "scripts/content/password.mjs")], {
      cwd: root,
      stdio: "inherit",
    })
    setup.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error("Document password initialization failed")),
    )
  })
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(root, "scripts/pipeline.mjs")], {
      cwd: root,
      stdio: "inherit",
    })
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`Content compilation exited with ${code}`)),
    )
  })
}
await compile()
const config = loadContentConfig(root)
const next = fileURLToPath(import.meta.resolve("next/dist/bin/next"))
const gateway = spawn(process.execPath, [path.join(root, "services/ai-gateway/local.mjs")], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    ALLOWED_ORIGINS: `http://127.0.0.1:${process.env.PORT ?? "3001"},http://localhost:${process.env.PORT ?? "3001"}`,
  },
})
const server = spawn(
  process.execPath,
  [
    next,
    "dev",
    "--hostname",
    process.argv.includes("--network") ? "0.0.0.0" : "127.0.0.1",
    "--port",
    process.env.PORT ?? "3001",
  ],
  { cwd: root, stdio: "inherit" },
)
let timer,
  busy = false,
  queued = false
async function rebuild() {
  if (busy) {
    queued = true
    return
  }
  busy = true
  try {
    await compile()
  } catch (error) {
    console.error(`[Content] ${error.message}`)
  } finally {
    busy = false
    if (queued) {
      queued = false
      void rebuild()
    }
  }
}
const watchRoots = [
  ...config.sources.map((source) => path.resolve(root, source.path)),
  ...(config.moduleRoots ?? []).map((location) => path.resolve(root, location)),
  path.join(root, ".private-vault"),
  path.join(root, "site"),
]
const watchers = [...new Set(watchRoots)]
  .filter((dir) => fs.existsSync(dir))
  .map((dir) =>
    fs.watch(dir, { recursive: true }, (_event, filename) => {
      if (!filename || filename.split(path.sep).some((part) => part.startsWith("."))) return
      clearTimeout(timer)
      timer = setTimeout(() => void rebuild(), 350)
    }),
  )
watchers.push(
  fs.watch(root, (_event, filename) => {
    if (!["passwords.json", "content.sources.json"].includes(String(filename))) return
    clearTimeout(timer)
    timer = setTimeout(() => void rebuild(), 350)
  }),
)
let closing = false
function close() {
  if (closing) return
  closing = true
  clearTimeout(timer)
  watchers.forEach((watcher) => watcher.close())
  server.kill("SIGTERM")
  gateway.kill("SIGTERM")
}
process.on("SIGINT", close)
process.on("SIGTERM", close)
server.on("exit", (code) => {
  gateway.kill("SIGTERM")
  watchers.forEach((watcher) => watcher.close())
  process.exit(code ?? 0)
})
