"use client"
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react"
import { Check, ChevronDown } from "lucide-react"

type Choice = { value: string; label: string; detail?: string }
export function ChoiceSelect({
  label,
  value,
  options,
  onChange,
  compact = false,
}: {
  label: string
  value: string
  options: Choice[]
  onChange: (value: string) => void
  compact?: boolean
}) {
  const id = useId(),
    root = useRef<HTMLDivElement>(null),
    trigger = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLDivElement>(null),
    typed = useRef({ value: "", at: 0 })
  const [open, setOpen] = useState(false)
  const selected = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )
  useEffect(() => {
    if (!open) return
    const frame = requestAnimationFrame(() =>
      list.current?.querySelectorAll<HTMLButtonElement>("[role=option]")[selected]?.focus(),
    )
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", outside)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener("pointerdown", outside)
    }
  }, [open, selected])
  function choose(next: string) {
    onChange(next)
    setOpen(false)
    trigger.current?.focus()
  }
  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    const items = [...(list.current?.querySelectorAll<HTMLButtonElement>("[role=option]") ?? [])]
    const index = items.indexOf(document.activeElement as HTMLButtonElement)
    if ((event.key === "Enter" || event.key === " ") && index >= 0) {
      event.preventDefault()
      choose(options[index].value)
      return
    }
    let next: number | undefined
    if (event.key === "ArrowDown") next = (index + 1) % items.length
    if (event.key === "ArrowUp") next = (index - 1 + items.length) % items.length
    if (event.key === "Home") next = 0
    if (event.key === "End") next = items.length - 1
    if (event.key === "Escape") {
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
      trigger.current?.focus()
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && event.key !== " ") {
      typed.current = {
        value: (event.timeStamp - typed.current.at < 650 ? typed.current.value : "") + event.key,
        at: event.timeStamp,
      }
      const match = options.findIndex((option) =>
        option.label.toLocaleLowerCase().startsWith(typed.current.value.toLocaleLowerCase()),
      )
      if (match >= 0) next = match
    }
    if (next !== undefined) {
      event.preventDefault()
      items[next]?.focus()
    }
  }
  return (
    <div
      ref={root}
      className={`choice-select${compact ? " is-compact" : ""}${open ? " is-open" : ""}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="choice-trigger"
        data-ui-sound="menu"
        aria-label={`${label}: ${options[selected]?.label ?? ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => {
          if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
            event.preventDefault()
            setOpen(true)
          }
        }}
      >
        <span>{options[selected]?.label}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <div
          ref={list}
          id={id}
          role="listbox"
          aria-label={label}
          className="choice-list"
          onKeyDown={keyboard}
        >
          {options.map((option) => (
            <button
              type="button"
              role="option"
              data-ui-sound="select"
              tabIndex={-1}
              key={option.value}
              aria-selected={value === option.value}
              onClick={() => choose(option.value)}
            >
              <span>
                <span>{option.label}</span>
                {option.detail && <small>{option.detail}</small>}
              </span>
              {value === option.value && <Check size={15} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
