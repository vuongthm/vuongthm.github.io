import { loadContentPasswords } from "../content/locks.mjs"
import fs from "node:fs/promises"
import path from "node:path"
import { randomBytes } from "node:crypto"
import { syncVault } from "./package.mjs"
const root = path.resolve(import.meta.dirname, "../.."),
  directory = path.join(root, ".private-vault")
await fs.mkdir(path.join(directory, "media"), { recursive: true, mode: 0o700 })
const passwordFile = path.join(directory, "password.txt")
try {
  await fs.writeFile(passwordFile, randomBytes(32).toString("base64url") + "\n", {
    flag: "wx",
    mode: 0o600,
  })
} catch (error) {
  if (error.code !== "EEXIST") throw error
}
const library = path.join(directory, "library.json")
try {
  await fs.writeFile(
    library,
    JSON.stringify(
      {
        items: [
          {
            file: "media/example.webp",
            title: {
              vi: "Ảnh minh họa công khai · mẫu",
              en: "Public example photograph · demo",
              ja: "公開写真・デモ",
              zh: "公开照片 · 示例",
            },
          },
        ],
      },
      null,
      2,
    ) + "\n",
    { flag: "wx", mode: 0o600 },
  )
  await fs.copyFile(
    path.join(root, "public/hometown/dai-lanh-coast.webp"),
    path.join(directory, "media/example.webp"),
  )
} catch (error) {
  if (error.code !== "EEXIST") throw error
}
await syncVault(root)
const passwords = loadContentPasswords(root)
console.log(
  passwords.vault || passwords.default
    ? "[Vault] Ready. Uses passwords.json vault/default, with VAULT_PASSWORD taking precedence."
    : "[Vault] Ready. Legacy password: .private-vault/password.txt (local only; never published).",
)
console.log("[Vault] Edit .private-vault/library.json, add media there, then run pnpm vault:build.")
