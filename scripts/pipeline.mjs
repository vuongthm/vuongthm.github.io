import path from "node:path"
import { fetchSources } from "./content/fetch-sources.mjs"
fetchSources(path.resolve(import.meta.dirname, ".."))
const { buildContent } = await import("./content/build.mjs")
await buildContent(path.resolve(import.meta.dirname, ".."))

const { syncVault } = await import("./vault/package.mjs")
await syncVault(path.resolve(import.meta.dirname, ".."))
