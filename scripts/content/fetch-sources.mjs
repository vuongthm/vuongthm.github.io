import fs from "node:fs"
import path from "node:path"
import { loadContentConfig } from "./config.mjs"
import { spawnSync } from "node:child_process"

export function fetchSources(root) {
  const config = loadContentConfig(root, { allowMissingRepositories: true })
  const sources = [
    ...config.repositories
      .filter((repo) => !repo.local)
      .map((repo) => ({
        ...repo,
        path: repo.destination,
        required: true,
      })),
    ...config.sources,
  ]
  for (const source of sources) {
    const destination = path.resolve(root, source.path)
    if (fs.existsSync(destination) || !source.repository) continue
    if (!/^[\w.-]+\/[\w.-]+$/.test(source.repository))
      throw new Error(`Invalid GitHub source: ${source.id}`)
    if (!destination.startsWith(path.dirname(root) + path.sep) || destination === root)
      throw new Error(`Source path must stay in the workspace: ${source.id}`)
    fs.mkdirSync(path.dirname(destination), { recursive: true })
    const staging = fs.mkdtempSync(path.join(path.dirname(destination), `.fetch-${source.id}-`))
    const args = ["clone", "--depth", "1"]
    if (source.ref) {
      if (!/^[\w./-]+$/.test(source.ref)) throw new Error(`Invalid source ref: ${source.id}`)
      args.push("--branch", source.ref)
    }
    args.push(`https://github.com/${source.repository}.git`, staging)
    const env = { ...process.env, GIT_TERMINAL_PROMPT: "0" }
    if (process.env.CONTENT_SOURCE_TOKEN) {
      const index = Number(env.GIT_CONFIG_COUNT ?? 0)
      env.GIT_CONFIG_COUNT = String(index + 1)
      env[`GIT_CONFIG_KEY_${index}`] = "http.https://github.com/.extraheader"
      env[`GIT_CONFIG_VALUE_${index}`] =
        `Authorization: Basic ${Buffer.from(`x-access-token:${process.env.CONTENT_SOURCE_TOKEN}`).toString("base64")}`
    }
    const result = spawnSync("git", args, { env, encoding: "utf8", timeout: 120000 })
    if (result.status !== 0) {
      fs.rmSync(staging, { recursive: true, force: true })
      if (source.required)
        throw new Error(
          `Unable to fetch required source ${source.id}. Check repository, ref, and CONTENT_SOURCE_TOKEN access.`,
        )
      console.warn(`[Content] Optional source unavailable: ${source.id}`)
    } else {
      fs.renameSync(staging, destination)
      console.log(`[Content] Fetched ${source.id}`)
    }
  }
}
