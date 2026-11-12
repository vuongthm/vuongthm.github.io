import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { pathToFileURL } from "node:url"

export function notificationBranch(repository) {
  if (!/^vuongthm\/[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(repository ?? ""))
    throw new Error("Only configured owner content repositories can notify this website")
  return `content-updates/${repository.split("/")[1]}`
}

export function createNotificationCommit(git, main, previous, message) {
  const tree = git("rev-parse", `${main}^{tree}`)
  // Main must be an ancestor so comparing this branch never proposes old code.
  // Retaining the previous notification as a parent permits a normal fast-forward push.
  return git(
    "commit-tree",
    tree,
    "-p",
    main,
    ...(previous && previous !== main ? ["-p", previous] : []),
    "-m",
    message,
  )
}

export async function notifyWebsite(env = process.env) {
  const branch = notificationBranch(env.GITHUB_REPOSITORY)
  if (!/^[a-f0-9]{40}$/.test(env.GITHUB_SHA ?? "")) throw new Error("Invalid source commit")
  if (!env.WEBSITE_NOTIFY_KEY) throw new Error("Missing WEBSITE_NOTIFY_KEY secret")
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "website-notify-"))
  try {
    fs.chmodSync(directory, 0o700)
    const response = await fetch("https://api.github.com/meta", {
      headers: { "User-Agent": "vuongthm-content-notification" },
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) throw new Error("Unable to verify GitHub SSH host keys")
    const { ssh_keys: hostKeys } = await response.json()
    if (!Array.isArray(hostKeys) || !hostKeys.length)
      throw new Error("GitHub SSH host keys unavailable")
    fs.writeFileSync(path.join(directory, "key"), env.WEBSITE_NOTIFY_KEY.trim() + "\n", {
      mode: 0o600,
    })
    fs.writeFileSync(
      path.join(directory, "hosts"),
      hostKeys.map((key) => `github.com ${key}`).join("\n") + "\n",
    )
    const quote = (value) => `'${value.replaceAll("'", "'\\''")}'`
    const gitEnv = {
      ...env,
      GIT_TERMINAL_PROMPT: "0",
      GIT_SSH_COMMAND: `ssh -i ${quote(path.join(directory, "key"))} -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=${quote(path.join(directory, "hosts"))}`,
      GIT_AUTHOR_NAME: "Content update",
      GIT_AUTHOR_EMAIL: "281654066+vuongthm@users.noreply.github.com",
      GIT_COMMITTER_NAME: "Content update",
      GIT_COMMITTER_EMAIL: "281654066+vuongthm@users.noreply.github.com",
    }
    const git = (...args) => {
      const result = spawnSync("git", args, {
        cwd: directory,
        env: gitEnv,
        encoding: "utf8",
        timeout: 120000,
      })
      if (result.status !== 0) throw new Error(`Content notification failed: git ${args[0]}`)
      return result.stdout.trim()
    }
    git("init", "--quiet")
    git("remote", "add", "origin", "git@github.com:vuongthm/vuongthm.github.io.git")
    git("fetch", "--quiet", "--depth=1", "origin", "main")
    const main = git("rev-parse", "FETCH_HEAD")
    const previous = git("ls-remote", "--heads", "origin", `refs/heads/${branch}`)
    let previousCommit
    if (previous) {
      git("fetch", "--quiet", "--depth=1", "origin", branch)
      previousCommit = git("rev-parse", "FETCH_HEAD")
    }
    // Append an empty notification commit; website main is never modified.
    const commit = createNotificationCommit(
      git,
      main,
      previousCommit,
      `Content update: ${env.GITHUB_REPOSITORY}@${env.GITHUB_SHA}`,
    )
    git("push", "--quiet", "origin", `${commit}:refs/heads/${branch}`)
    console.log(`Website notified for ${env.GITHUB_REPOSITORY}`)
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await notifyWebsite()
