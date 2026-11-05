import fs from "node:fs"
import path from "node:path"
import http from "node:http"
const root = path.resolve(import.meta.dirname, "../out")
if (!fs.existsSync(root)) throw new Error("Run the production build before starting preview.")
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".txt": "text/plain; charset=utf-8",
}
const server = http.createServer((request, response) => {
  let pathname
  try {
    pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname)
  } catch {
    response.writeHead(400)
    response.end("Invalid URL")
    return
  }
  let file = path.resolve(root, "." + pathname)
  if (!file.startsWith(root + path.sep) && file !== root) {
    response.writeHead(403)
    response.end()
    return
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html")
  const found = fs.existsSync(file) && fs.statSync(file).isFile()
  if (!found) file = path.join(root, "404.html")
  response.writeHead(found ? 200 : 404, {
    "Content-Type": types[path.extname(file)] ?? "application/octet-stream",
    "Cache-Control": "no-cache",
    "X-Content-Type-Options": "nosniff",
  })
  fs.createReadStream(file).pipe(response)
})
server.listen(Number(process.env.PORT ?? 3001), "127.0.0.1", () =>
  console.log(`Preview: http://localhost:${process.env.PORT ?? 3001}/vi/`),
)
process.on("SIGINT", () => server.close())
process.on("SIGTERM", () => server.close())
