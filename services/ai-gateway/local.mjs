import http from "node:http"
import { Readable } from "node:stream"
import { handleAI } from "./worker.mjs"
const buckets = new Map()
const server = http.createServer(async (req, res) => {
  const address = req.socket.remoteAddress,
    now = Date.now(),
    bucket = buckets.get(address)
  if (req.method === "POST") {
    if (bucket && now - bucket.start < 60000 && bucket.count >= 30) {
      res.writeHead(429, { "Content-Type": "application/json", "Cache-Control": "no-store" })
      res.end('{"code":"rate"}')
      return
    }
    if (!bucket || now - bucket.start >= 60000) buckets.set(address, { start: now, count: 1 })
    else bucket.count++
  }
  try {
    const request = new Request(`http://localhost${req.url}`, {
      method: req.method,
      headers: req.headers,
      ...(!["GET", "HEAD"].includes(req.method)
        ? { body: Readable.toWeb(req), duplex: "half" }
        : {}),
    })
    const response = await handleAI(request, { ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS })
    res.writeHead(response.status, Object.fromEntries(response.headers))
    res.end(Buffer.from(await response.arrayBuffer()))
  } catch {
    res.writeHead(500, { "Content-Type": "application/json" })
    res.end('{"code":"unavailable"}')
  }
})
server.listen(Number(process.env.AI_GATEWAY_PORT ?? 3031), "127.0.0.1", () =>
  console.log("[AI] Local gateway ready (credentials are never logged)."),
)
process.on("SIGTERM", () => server.close())
process.on("SIGINT", () => server.close())
