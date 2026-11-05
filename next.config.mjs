import path from "node:path"
import fs from "node:fs"
const parent = path.resolve(import.meta.dirname, "..")
const workspaceRoot = fs.existsSync(path.join(parent, "pnpm-workspace.yaml"))
  ? parent
  : import.meta.dirname
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  experimental: {
    cpus: 2,
    // Generated content changes often; avoid retaining an ever-growing local dev cache.
    turbopackFileSystemCacheForDev: false,
  },
  // Local test workspace shares dependencies; the deployed repository is standalone.
  turbopack: { root: workspaceRoot },
  outputFileTracingRoot: workspaceRoot,
}
export default nextConfig
