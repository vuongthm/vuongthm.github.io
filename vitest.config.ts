import path from "node:path"
import { defineConfig } from "vitest/config"

/**
 * Unit tests cover the pure logic that is hardest to verify by clicking around:
 * the vault cryptography, the content helpers and the frontmatter parser.
 *
 * The tests run in Node, which exposes the same `globalThis.crypto.subtle` the
 * browser uses — the reason `lib/crypto.mjs` can be shared by both runtimes.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "lib/**/*.test.mjs"],
    reporters: "dot",
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname),
    },
  },
})
