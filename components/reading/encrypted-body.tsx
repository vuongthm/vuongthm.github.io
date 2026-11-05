"use client"
import { usePageAccess } from "@/components/providers/page-access"
import { contentLockMessages as labels } from "@/lib/i18n/content-lock"
import { useCallback, useContext, useEffect, useRef, useState } from "react"
import { LockKeyhole, ShieldCheck } from "lucide-react"
import { useSite } from "@/components/providers/site-provider"
import { headingsFor } from "@/lib/content/markdown"
import { parseUnlockedDocument } from "@/lib/content/unlock"
import { Gallery } from "@/components/gallery"
import type { UnlockedDocument } from "@/lib/content/unlock"
import { Markdown } from "./markdown"
import { PasswordDialog } from "./password-dialog"
import { PasswordForm } from "./password-form"
import { UnlockContext } from "./unlock-context"

export function EncryptedBody({
  payload,
  view = "article",
}: {
  payload: string
  view?: "article" | "gallery"
}) {
  return (
    <ContentLock
      key={`${view}:${payload.length}:${payload.slice(0, 64)}`}
      payload={payload}
      view={view}
    />
  )
}
function ContentLock({ payload, view }: { payload: string; view: "article" | "gallery" }) {
  const { session: pageSession, relock: relockPage } = usePageAccess()
  const { locale } = useSite(),
    text = labels[locale],
    updateHeadings = useContext(UnlockContext)
  const [gateOpen, setGateOpen] = useState(!pageSession)
  const [password, setPassword] = useState(""),
    [document, setDocument] = useState<{
      body: string
      assets: Record<string, string>
      gallery?: UnlockedDocument["gallery"]
    } | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("")
  const input = useRef<HTMLInputElement>(null),
    opener = useRef<HTMLButtonElement>(null),
    request = useRef(0),
    ownedUrls = useRef<string[]>([]),
    alive = useRef(true),
    result = useRef<HTMLDivElement>(null)
  const revoke = useCallback(() => {
    for (const url of ownedUrls.current) URL.revokeObjectURL(url)
    ownedUrls.current = []
  }, [])
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      revoke()
    }
  }, [revoke])
  function dismiss() {
    request.current++
    setGateOpen(false)
    setPassword("")
    setBusy(false)
    setError("")
    requestAnimationFrame(() => opener.current?.focus({ preventScroll: true }))
  }
  const lock = useCallback(() => {
    if (pageSession) {
      relockPage()
      return
    }
    request.current++
    revoke()
    setDocument(null)
    setGateOpen(true)
    setPassword("")
    setBusy(false)
    setError("")
    updateHeadings?.([])
  }, [pageSession, relockPage, revoke, updateHeadings])
  useEffect(() => {
    if (!document) return
    let last = Date.now()
    const touch = () => {
      last = Date.now()
    }
    window.document.addEventListener("pointerdown", touch, { passive: true })
    window.document.addEventListener("keydown", touch)
    window.document.addEventListener("scroll", touch, { passive: true, capture: true })
    const timer = setInterval(() => {
      if (Date.now() - last > 600000) lock()
    }, 15000)
    return () => {
      clearInterval(timer)
      window.document.removeEventListener("pointerdown", touch)
      window.document.removeEventListener("keydown", touch)
      window.document.removeEventListener("scroll", touch, true)
    }
  }, [document, lock])
  async function unlock(event?: React.FormEvent, secret = password) {
    event?.preventDefault()
    if (busy) return
    const token = ++request.current
    setBusy(true)
    setError("")
    try {
      const { decryptString } = await import("@/lib/crypto.mjs")
      const plaintext = await decryptString(secret, payload)
      if (!alive.current || token !== request.current) return
      if (plaintext === null) {
        setError(text.wrong)
        requestAnimationFrame(() => input.current?.focus())
        return
      }
      const opened = parseUnlockedDocument(plaintext),
        assets: Record<string, string> = Object.create(null)
      for (const asset of opened.assets) {
        const binary = Uint8Array.from(atob(asset.data), (value) => value.charCodeAt(0)),
          url = URL.createObjectURL(new Blob([binary], { type: asset.type }))
        ownedUrls.current.push(url)
        assets[asset.url] = url
      }
      setDocument({ body: opened.body, assets, gallery: opened.gallery })
      updateHeadings?.(headingsFor(opened.body))
      requestAnimationFrame(() => result.current?.focus({ preventScroll: true }))
    } catch {
      if (alive.current && token === request.current) {
        revoke()
        setError(text.failed)
      }
    } finally {
      if (alive.current && token === request.current) {
        setPassword("")
        setBusy(false)
      }
    }
  }
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (pageSession) void unlock(undefined, pageSession.password)
    })
    return () => cancelAnimationFrame(frame)
    // A route credential is immutable for the lifetime of this document.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSession])
  if (document)
    return (
      <section className="unlocked-document" aria-label={text.unlocked}>
        <div className="content-unlocked-bar" ref={result} tabIndex={-1}>
          <span>
            <ShieldCheck size={15} />
            {text.unlocked}
          </span>
          <button type="button" onClick={lock}>
            <LockKeyhole size={13} />
            {text.relock}
          </button>
        </div>
        {view === "gallery" ? (
          <Gallery
            variant="journal"
            photos={(document.gallery ?? []).map((photo) => ({
              src: document.assets[photo.url],
              title: { vi: photo.title, en: photo.title, ja: photo.title, zh: photo.title },
              place: photo.place,
              kind: photo.kind,
            }))}
          />
        ) : (
          <Markdown body={document.body} assetUrls={document.assets} />
        )}
      </section>
    )
  if (pageSession)
    return (
      <p role="status" className="wrap">
        {error || text.busy}
      </p>
    )
  return (
    <>
      <section className="content-lock-placeholder" aria-label={text.title}>
        <span className="content-lock-symbol" aria-hidden="true">
          <LockKeyhole size={20} strokeWidth={1.6} />
        </span>
        <div>
          <p>{text.title}</p>
          <button
            ref={opener}
            type="button"
            className="text-link"
            onClick={() => setGateOpen(true)}
          >
            {text.openDialog}
          </button>
        </div>
      </section>
      {gateOpen && (
        <PasswordDialog label={text.title} initialFocus={input} onClose={dismiss}>
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
          />
        </PasswordDialog>
      )}
    </>
  )
}
