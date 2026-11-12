"use client"
import { useRef, useState } from "react"
import { Search, X } from "lucide-react"

export function ExpandingSearch({
  value,
  onChange,
  label,
  clearLabel,
}: {
  value: string
  onChange: (value: string) => void
  label: string
  clearLabel: string
}) {
  const [expanded, setExpanded] = useState(false)
  const input = useRef<HTMLInputElement>(null),
    trigger = useRef<HTMLButtonElement>(null)
  const open = expanded || !!value
  function close() {
    onChange("")
    setExpanded(false)
    trigger.current?.focus({ preventScroll: true })
  }
  return (
    <div
      className={`expanding-search${open ? " is-open" : ""}`}
      data-search-field
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null) && !value)
          setExpanded(false)
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault()
          event.stopPropagation()
          close()
        }
      }}
    >
      <button
        ref={trigger}
        className="expanding-search-trigger"
        type="button"
        aria-label={label}
        aria-expanded={open}
        title={label}
        onClick={() => {
          setExpanded(true)
          requestAnimationFrame(() => input.current?.focus())
        }}
      >
        <Search size={17} aria-hidden="true" />
      </button>
      <span className="expanding-search-reveal" inert={!open}>
        <input
          ref={input}
          type="search"
          placeholder={label}
          aria-label={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          tabIndex={open ? 0 : -1}
        />
        <button type="button" aria-label={clearLabel} onClick={close}>
          <X size={14} />
        </button>
      </span>
    </div>
  )
}
