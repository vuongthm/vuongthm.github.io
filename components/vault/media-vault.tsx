"use client"
/* eslint-disable @next/next/no-img-element -- Decrypted object URLs cannot use server image optimization. */
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import { Download, ImageIcon, LockKeyhole, Play, X } from "lucide-react"
import { usePageAccess } from "@/components/providers/page-access"
import { useSite } from "@/components/providers/site-provider"
import { PasswordDialog } from "@/components/reading/password-dialog"
import { PasswordForm } from "@/components/reading/password-form"
import { Dialog } from "@/components/search/dialog"
import { vaultMessages } from "@/lib/vault/messages"
import { validateCatalog, validateDescriptor } from "@/lib/vault/catalog"
import type { VaultItem, VaultCatalog } from "@/lib/vault/types"

type Session = {
  key: CryptoKey
  controller: AbortController
  urls: Map<string, string>
  pending: Map<string, Promise<string>>
}
function ProtectedImage({
  item,
  load,
  errorText,
}: {
  item: VaultItem
  load: (item: VaultItem, original?: boolean) => Promise<string>
  errorText: string
}) {
  const [url, setUrl] = useState("")
  const [error, setError] = useState(false)
  useEffect(() => {
    let alive = true
    load(item)
      .then((value) => {
        if (alive) setUrl(value)
      })
      .catch(() => {
        if (alive) setError(true)
      })
    return () => {
      alive = false
    }
  }, [item, load])
  if (error)
    return (
      <span className="vault-file-error" role="status">
        {errorText}
      </span>
    )
  return url ? (
    <img src={url} alt="" loading="lazy" />
  ) : (
    <span className="vault-placeholder">
      <ImageIcon size={22} />
    </span>
  )
}
function MediaViewer({
  item,
  load,
  onClose,
  touch,
}: {
  item: VaultItem
  load: (item: VaultItem, original?: boolean) => Promise<string>
  onClose: () => void
  touch: () => void
}) {
  const { locale } = useSite()
  const m = vaultMessages(locale)
  const [url, setUrl] = useState("")
  const [error, setError] = useState(false)
  useEffect(() => {
    let alive = true
    load(item, true)
      .then((value) => {
        if (alive) setUrl(value)
      })
      .catch(() => {
        if (alive) setError(true)
      })
    return () => {
      alive = false
    }
  }, [item, load])
  return (
    <Dialog label={item.title[locale]} onClose={onClose} className="vault-viewer">
      <div className="vault-view-toolbar">
        <span>{item.title[locale]}</span>
        <button className="icon-button" aria-label={m.close} onClick={onClose}>
          <X size={19} />
        </button>
      </div>
      <div className="vault-view-content">
        {error ? (
          <p role="alert">{m.loadError}</p>
        ) : !url ? (
          <p role="status">{m.opening}</p>
        ) : item.kind === "video" ? (
          <video
            src={url}
            controls
            autoPlay
            playsInline
            onTimeUpdate={touch}
            onError={() => setError(true)}
          />
        ) : (
          <img src={url} alt={item.title[locale]} />
        )}
      </div>
      {url && (
        <a className="vault-download" href={url} download={item.name}>
          <Download size={14} />
          {m.download}
        </a>
      )}
    </Dialog>
  )
}
export function MediaVault() {
  const { session: pageSession, relock: relockPage } = usePageAccess()
  const { locale } = useSite()
  const m = vaultMessages(locale)
  const [gateOpen, setGateOpen] = useState(true)
  const input = useRef<HTMLInputElement>(null)
  const opener = useRef<HTMLButtonElement>(null)
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [catalog, setCatalog] = useState<VaultCatalog | null>(null)
  const [filter, setFilter] = useState<"all" | "image" | "video">("all")
  const [selected, setSelected] = useState<VaultItem | null>(null)
  const session = useRef<Session | null>(null)
  const epoch = useRef(0)
  const lastActive = useRef(0)
  const unlockController = useRef<AbortController | null>(null)
  const clear = useCallback(() => {
    epoch.current++
    unlockController.current?.abort()
    unlockController.current = null
    const previous = session.current
    session.current = null
    if (previous) {
      previous.controller.abort()
      previous.urls.forEach((url) => URL.revokeObjectURL(url))
      previous.urls.clear()
      previous.pending.clear()
    }
  }, [])
  const lock = useCallback(() => {
    if (pageSession) relockPage()
    clear()
    setCatalog(null)
    setGateOpen(true)
    setSelected(null)
    setPassword("")
    setError("")
    setBusy(false)
    setFilter("all")
    if (!document.hidden)
      requestAnimationFrame(() =>
        document.getElementById("vault-password")?.focus({ preventScroll: true }),
      )
  }, [clear, pageSession, relockPage])
  const touch = useCallback(() => {
    lastActive.current = Date.now()
  }, [])
  useEffect(() => {
    const hidden = () => {
      if (document.hidden) lock()
    }
    document.addEventListener("visibilitychange", hidden)
    window.addEventListener("pagehide", lock)
    for (const name of ["pointerdown", "keydown", "pointermove"] as const)
      document.addEventListener(name, touch, { passive: true })
    const idle = setInterval(() => {
      if (session.current && Date.now() - lastActive.current > 10 * 60 * 1000) lock()
    }, 15000)
    return () => {
      clear()
      clearInterval(idle)
      document.removeEventListener("visibilitychange", hidden)
      window.removeEventListener("pagehide", lock)
      for (const name of ["pointerdown", "keydown", "pointermove"] as const)
        document.removeEventListener(name, touch)
    }
  }, [lock, clear, touch])
  const load = useCallback(async (item: VaultItem, original = false) => {
    const current = session.current
    if (!current) throw Error("Locked")
    const assetId = !original && item.previewId ? item.previewId : item.id
    const cached = current.urls.get(assetId)
    if (cached) return cached
    const pending = current.pending.get(assetId)
    if (pending) return pending
    const promise = (async () => {
      const response = await fetch(`/vault-data/${assetId}.bin`, {
        signal: current.controller.signal,
        cache: "no-store",
      })
      if (!response.ok) throw Error("Unavailable")
      const { openMedia } = await import("@/lib/vault/crypto.mjs")
      const bytes = await openMedia(
        current.key,
        new Uint8Array(await response.arrayBuffer()),
        assetId,
      )
      if (session.current !== current) throw Error("Locked")
      const url = URL.createObjectURL(
        new Blob([bytes], { type: assetId === item.previewId ? "image/webp" : item.type }),
      )
      current.urls.set(assetId, url)
      return url
    })()
    current.pending.set(assetId, promise)
    try {
      return await promise
    } finally {
      current.pending.delete(assetId)
    }
  }, [])
  async function unlock(event?: FormEvent, secret = password) {
    event?.preventDefault()
    if (busy) return
    if (!globalThis.crypto?.subtle) {
      setError(m.secure)
      return
    }
    setBusy(true)
    setError("")
    const token = ++epoch.current
    const controller = new AbortController()
    unlockController.current = controller
    let authenticating = false
    try {
      const response = await fetch("/vault-data/index.json", {
        cache: "no-store",
        signal: controller.signal,
      })
      if (!response.ok) throw Error("Unavailable")
      const descriptor = validateDescriptor(await response.json())
      if (!descriptor.configured) {
        if (token === epoch.current) setError(m.notReady)
        return
      }
      const data = await fetch(`/vault-data/${descriptor.manifest}`, {
        cache: "no-store",
        signal: controller.signal,
      })
      if (!data.ok) throw Error("Unavailable")
      const { deriveVaultKey, openMedia } = await import("@/lib/vault/crypto.mjs")
      authenticating = true
      const key = pageSession?.vaultKey ?? (await deriveVaultKey(secret, descriptor.salt!))
      const bytes = await openMedia(key, new Uint8Array(await data.arrayBuffer()), "manifest")
      const unlocked = validateCatalog(JSON.parse(new TextDecoder().decode(bytes)))
      if (token !== epoch.current) return
      session.current = {
        key,
        controller: new AbortController(),
        urls: new Map(),
        pending: new Map(),
      }
      setCatalog(unlocked)
      setPassword("")
      touch()
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLButtonElement>(".vault-lock-button")
          ?.focus({ preventScroll: true }),
      )
    } catch {
      if (token === epoch.current) setError(authenticating ? m.wrong : m.unavailable)
    } finally {
      if (token === epoch.current) {
        setBusy(false)
        unlockController.current = null
      }
    }
  }
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (pageSession) void unlock(undefined, pageSession.password)
    })
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSession])
  function dismissGate() {
    lock()
    setGateOpen(false)
    requestAnimationFrame(() => opener.current?.focus({ preventScroll: true }))
  }
  function closeViewer() {
    const item = selected
    setSelected(null)
    if (item?.kind === "video") {
      const url = session.current?.urls.get(item.id)
      if (url) URL.revokeObjectURL(url)
      session.current?.urls.delete(item.id)
    }
  }
  const items = catalog?.items.filter((item) => filter === "all" || item.kind === filter) ?? []
  return (
    <section className="media-vault" aria-label={m.title}>
      {!catalog ? (
        <>
          <section className="content-lock-placeholder" aria-label={m.title}>
            <span className="content-lock-symbol" aria-hidden="true">
              <LockKeyhole size={20} />
            </span>
            <div>
              <p>{m.title}</p>
              <button
                type="button"
                className="text-link"
                ref={opener}
                onClick={() => setGateOpen(true)}
              >
                {m.unlock}
              </button>
            </div>
          </section>
          {gateOpen && !pageSession && (
            <PasswordDialog label={m.title} initialFocus={input} onClose={dismissGate}>
              <PasswordForm
                inputRef={input}
                password={password}
                onPasswordChange={(value) => {
                  setPassword(value)
                  setError("")
                }}
                onSubmit={unlock}
                busy={busy}
                error={error}
                context={m.title}
                note={m.hint}
              />
            </PasswordDialog>
          )}
        </>
      ) : (
        <>
          <div className="vault-library-toolbar">
            <div className="vault-filters" role="group" aria-label={m.label}>
              {(
                [
                  ["all", m.all],
                  ["image", m.photos],
                  ["video", m.videos],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                >
                  {label}
                  <small>
                    {catalog.items.filter((item) => value === "all" || item.kind === value).length}
                  </small>
                </button>
              ))}
            </div>
            <button className="vault-lock-button" onClick={lock}>
              <LockKeyhole size={14} />
              {m.lock}
            </button>
          </div>
          {items.length ? (
            <div className="vault-media-grid">
              {items.map((item) => (
                <button
                  className="vault-media-card"
                  key={item.id}
                  onClick={() => setSelected(item)}
                  aria-label={`${m.view}: ${item.title[locale]}`}
                >
                  {item.kind === "image" ? (
                    <ProtectedImage item={item} load={load} errorText={m.loadError} />
                  ) : (
                    <span className="vault-video-cover">
                      <Play size={28} strokeWidth={1.2} />
                      <small>{m.videos}</small>
                    </span>
                  )}
                  <span className="vault-media-caption">{item.title[locale]}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="vault-empty">{m.empty}</p>
          )}
          <p className="vault-session-hint">{m.hint}</p>
        </>
      )}
      {selected && (
        <MediaViewer
          key={selected.id}
          item={selected}
          load={load}
          onClose={closeViewer}
          touch={touch}
        />
      )}
    </section>
  )
}
