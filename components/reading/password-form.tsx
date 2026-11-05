"use client"
import { useId, useState, type FormEvent, type RefObject } from "react"
import { Eye, EyeOff, LockKeyhole, LockOpen } from "lucide-react"
import { useSite } from "@/components/providers/site-provider"
import { contentLockMessages } from "@/lib/i18n/content-lock"

/** One form for encrypted articles, albums and the private media vault. */
export function PasswordForm({
  inputRef,
  password,
  onPasswordChange,
  onSubmit,
  busy,
  error,
  context,
  note,
}: {
  inputRef: RefObject<HTMLInputElement | null>
  password: string
  onPasswordChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  busy: boolean
  error: string
  context?: string
  note?: string
}) {
  const { locale } = useSite(),
    text = contentLockMessages[locale],
    id = useId(),
    [visible, setVisible] = useState(false)
  return (
    <section className="content-lock" aria-labelledby={`${id}-title`}>
      <header className="content-lock-heading">
        <span className="content-lock-symbol" aria-hidden="true">
          <LockKeyhole size={27} strokeWidth={1.5} />
        </span>
        <h2 id={`${id}-title`}>{text.title}</h2>
        <p id={`${id}-description`}>{text.description}</p>
        {context && <span className="content-lock-context">{context}</span>}
      </header>
      <form onSubmit={onSubmit} aria-busy={busy}>
        <label htmlFor={`${id}-password`}>{text.password}</label>
        <div className={`content-password-input ${error ? "has-error" : ""}`}>
          <input
            ref={inputRef}
            id={`${id}-password`}
            type={visible ? "text" : "password"}
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={`${id}-description${error ? ` ${id}-error` : ""}`}
            autoComplete="off"
            spellCheck={false}
            autoCapitalize="none"
            required
            readOnly={busy}
          />
          <button
            type="button"
            onClick={() => setVisible((value) => !value)}
            aria-label={visible ? text.hide : text.show}
            aria-pressed={visible}
            disabled={busy}
          >
            {visible ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
        {error && (
          <p className="content-lock-error" id={`${id}-error`} role="alert">
            {error}
          </p>
        )}
        <button
          className="button primary content-lock-submit"
          type="submit"
          disabled={busy || !password}
        >
          <LockOpen size={16} strokeWidth={1.7} aria-hidden="true" />
          {busy ? text.busy : text.unlock}
        </button>
      </form>
      <p className="content-lock-note">{note ?? text.note}</p>
    </section>
  )
}
