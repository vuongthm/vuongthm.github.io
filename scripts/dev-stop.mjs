import fs from "node:fs"
import path from "node:path"

/**
 * Stops a leftover development server for this project.
 *
 * Why this exists: Next.js refuses to start a second `next dev` for the same
 * directory ("Another next dev server is already running") and exits with code
 * 1. That happens whenever a previous server survived — a terminal that was
 * closed instead of interrupted, a crashed run, or a server started in the
 * background. The framework prints the PID, but you have to go and hunt it down.
 *
 * This script finds every process whose working directory is this repo and
 * whose command line mentions Next, then asks it to stop.
 */

const projectRoot = fs.realpathSync(path.resolve(import.meta.dirname, ".."))
const selfPid = process.pid

/**
 * Matches the Next.js dev server and build worker command lines without
 * matching this script (whose own source contains these words).
 */
const TARGET = /(?:^|[/\s-])(?:next-server|next\/dist\/bin\/next|next dev)(?:\s|$)/i

function readProcesses() {
  const processes = []

  let entries
  try {
    entries = fs.readdirSync("/proc")
  } catch {
    return processes
  }

  for (const entry of entries) {
    if (!/^\d+$/.test(entry)) continue

    const pid = Number(entry)
    if (pid === selfPid) continue

    let cwd
    try {
      cwd = fs.realpathSync(`/proc/${pid}/cwd`)
    } catch {
      continue // Not ours, or not permitted to inspect.
    }

    if (cwd !== projectRoot) continue

    let cmdline = ""
    try {
      cmdline = fs.readFileSync(`/proc/${pid}/cmdline`, "utf-8").replace(/\0/g, " ").trim()
    } catch {
      continue
    }

    if (!TARGET.test(cmdline)) continue

    processes.push({ pid, cmdline })
  }

  return processes
}

const targets = readProcesses()

if (targets.length === 0) {
  console.log("[dev-stop] No development server is running for this project.")
  process.exit(0)
}

for (const { pid, cmdline } of targets) {
  console.log(`[dev-stop] Stopping PID ${pid}: ${cmdline.slice(0, 80)}`)
  try {
    // SIGTERM first so Next can clean up its dev cache and release the port.
    process.kill(pid, "SIGTERM")
  } catch (error) {
    console.warn(`[dev-stop] Could not signal PID ${pid}: ${error.message}`)
  }
}

// Give the processes a moment to exit gracefully, then insist.
await new Promise((resolve) => setTimeout(resolve, 1500))

for (const { pid } of targets) {
  try {
    process.kill(pid, 0) // Still alive?
    console.warn(`[dev-stop] PID ${pid} ignored SIGTERM, sending SIGKILL`)
    process.kill(pid, "SIGKILL")
  } catch {
    /* Already gone. */
  }
}

console.log(`[dev-stop] Stopped ${targets.length} project server process(es).`)
