import path from "node:path"
import { syncVault } from "./package.mjs"
await syncVault(path.resolve(import.meta.dirname, "../.."))
console.log("[Vault] Encrypted media synchronized. No plaintext media or password was published.")
