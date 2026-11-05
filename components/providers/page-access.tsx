"use client"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { usePathname, useRouter } from "next/navigation"
import { LockKeyhole } from "lucide-react"
import { useSite } from "./site-provider"
import { PasswordDialog } from "@/components/reading/password-dialog"
import { PasswordForm } from "@/components/reading/password-form"
import { contentLockMessages } from "@/lib/i18n/content-lock"
import type { AccessRule } from "@/lib/content/access"

const normalize = (path: string) => path.replace(/\/$/, "") + "/"
type AccessSession = { password: string; vaultKey?: CryptoKey; probe?: string }
const AccessContext = createContext<{
  session?: AccessSession
  relock: () => void
}>({ relock: () => {} })
export const usePageAccess = () => useContext(AccessContext)

/** Gate navigation before it changes the URL. Credentials live in memory for this tab only. */
export function PageAccess({ rules, children }: { rules: AccessRule[]; children: ReactNode }) {
  const pathname = usePathname(),
    router = useRouter(),
    { locale, dictionary } = useSite()
  const path = normalize(pathname),
    text = contentLockMessages[locale]
  const [sessions, setSessions] = useState<Record<string, AccessSession>>({})
  const [target, setTarget] = useState<{ href: string; rule: AccessRule } | null>(null)
  const [password, setPassword] = useState("")
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null),
    origin = useRef<HTMLElement | null>(null)
  const epoch = useRef(0),
    lastActive = useRef(0)
  const rule = rules.find((item) => item.href === path)
  const session = rule && sessions[path]?.probe === rule.probe ? sessions[path] : undefined
  const ask = useCallback((href: string, rule: AccessRule) => {
    epoch.current++
    setPassword("")
    setError("")
    setBusy(false)
    setTarget({ href, rule })
  }, [])
  const relock = useCallback(() => {
    setSessions((previous) => {
      const next = { ...previous }
      delete next[path]
      return next
    })
    if (rule) ask(path, rule)
  }, [path, rule, ask])
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (rule && !session) ask(path, rule)
      else {
        epoch.current++
        setTarget(null)
        setPassword("")
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [path, rule, session, ask])
  useEffect(() => {
    const click = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return
      const link = (event.target as Element).closest<HTMLAnchorElement>("a[href]")
      if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return
      const url = new URL(link.href)
      if (url.origin !== location.origin) return
      const route = normalize(url.pathname),
        locked = rules.find((item) => item.href === route)
      if (!locked || (sessions[route] && sessions[route].probe === locked.probe)) return
      event.preventDefault()
      event.stopPropagation()
      origin.current = link
      ask(url.pathname + url.search + url.hash, locked)
    }
    document.addEventListener("click", click, true)
    return () => document.removeEventListener("click", click, true)
  }, [ask, rules, sessions])
  const invalidate = useCallback(() => {
    epoch.current++
  }, [])
  useEffect(() => {
    const touch = () => {
      lastActive.current = Date.now()
    }
    const clear = () => setSessions({})
    const hidden = () => {
      if (document.hidden)
        setSessions((previous) =>
          Object.fromEntries(
            Object.entries(previous).filter(
              ([href]) => !rules.find((item) => item.href === href && item.kind === "vault"),
            ),
          ),
        )
    }
    document.addEventListener("pointerdown", touch, { passive: true })
    document.addEventListener("keydown", touch)
    document.addEventListener("visibilitychange", hidden)
    window.addEventListener("pagehide", clear)
    const timer = setInterval(() => {
      if (Date.now() - lastActive.current > 600000) clear()
    }, 15000)
    return () => {
      invalidate()
      clearInterval(timer)
      document.removeEventListener("pointerdown", touch)
      document.removeEventListener("keydown", touch)
      document.removeEventListener("visibilitychange", hidden)
      window.removeEventListener("pagehide", clear)
    }
  }, [rules, invalidate])
  function dismiss() {
    epoch.current++
    setTarget(null)
    setPassword("")
    setError("")
    setBusy(false)
    if (rule && !session) router.replace(rule.back)
    else requestAnimationFrame(() => origin.current?.focus({ preventScroll: true }))
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!target || busy) return
    const token = ++epoch.current,
      pending = target
    setBusy(true)
    setError("")
    try {
      let vaultKey: CryptoKey | undefined
      if (pending.rule.kind === "vault") {
        const { validateDescriptor, validateCatalog } = await import("@/lib/vault/catalog")
        const response = await fetch("/vault-data/index.json", { cache: "no-store" })
        if (!response.ok) throw Error("unavailable")
        const descriptor = validateDescriptor(await response.json())
        if (!descriptor.configured) throw Error("unavailable")
        const manifest = await fetch(`/vault-data/${descriptor.manifest}`, { cache: "no-store" })
        if (!manifest.ok) throw Error("unavailable")
        const { deriveVaultKey, openMedia } = await import("@/lib/vault/crypto.mjs")
        vaultKey = await deriveVaultKey(password, descriptor.salt!)
        try {
          validateCatalog(
            JSON.parse(
              new TextDecoder().decode(
                await openMedia(vaultKey, new Uint8Array(await manifest.arrayBuffer()), "manifest"),
              ),
            ),
          )
        } catch {
          throw Error("wrong")
        }
      } else {
        const { decryptString } = await import("@/lib/crypto.mjs")
        if ((await decryptString(password, pending.rule.probe!)) !== "vuong-page-access-v1")
          throw Error("wrong")
      }
      if (token !== epoch.current) return
      lastActive.current = Date.now()
      setSessions((previous) => ({
        ...previous,
        [pending.rule.href]: { password, vaultKey, probe: pending.rule.probe },
      }))
      setTarget(null)
      setPassword("")
      if (normalize(new URL(pending.href, location.origin).pathname) !== path)
        router.push(pending.href)
    } catch (cause) {
      if (token === epoch.current) {
        setError(cause instanceof Error && cause.message === "wrong" ? text.wrong : text.failed)
        input.current?.focus()
      }
    } finally {
      if (token === epoch.current) setBusy(false)
    }
  }
  return (
    <AccessContext.Provider value={{ session, relock }}>
      {rule && !session ? (
        <main id="main-content" className="page-access-pending wrap">
          <LockKeyhole size={22} />
          <h1>{text.title}</h1>
          <p>{text.description}</p>
          <a href={rule.back}>{dictionary.previous}</a>
        </main>
      ) : (
        children
      )}
      {target && (
        <PasswordDialog label={text.title} initialFocus={input} onClose={dismiss}>
          <PasswordForm
            inputRef={input}
            password={password}
            onPasswordChange={(value) => {
              setPassword(value)
              setError("")
            }}
            onSubmit={submit}
            busy={busy}
            error={error}
            context={target.rule.title}
          />
        </PasswordDialog>
      )}
    </AccessContext.Provider>
  )
}
