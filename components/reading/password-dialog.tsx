"use client"
import { useEffect, useRef, type ReactNode, type RefObject } from "react"
import { ArrowLeft } from "lucide-react"
import { useSite } from "@/components/providers/site-provider"
import { contentLockMessages } from "@/lib/i18n/content-lock"

/** Native modal supplies a top layer, inert background and keyboard focus containment. */
export function PasswordDialog({
  label,
  descriptionId,
  initialFocus,
  onClose,
  children,
}: {
  label: string
  descriptionId?: string
  initialFocus: RefObject<HTMLInputElement | null>
  onClose: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const { locale } = useSite()
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const overflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = "hidden"
    initialFocus.current?.focus({ preventScroll: true })
    return () => {
      if (dialog.open) dialog.close()
      document.body.style.overflow = overflow
    }
  }, [initialFocus])
  return (
    <dialog
      ref={ref}
      className="content-lock-dialog"
      aria-label={label}
      aria-describedby={descriptionId}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return
        const bounds = event.currentTarget.getBoundingClientRect()
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          onClose()
      }}
      onKeyDownCapture={(event) => {
        if (event.key === "Tab") {
          const items = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              'button:not([disabled]),input:not([disabled]),a[href],select:not([disabled]),textarea:not([disabled]),[tabindex="0"]',
            ),
          ).filter((element) => element.getClientRects().length > 0)
          const first = items[0],
            last = items[items.length - 1]
          if (
            first &&
            last &&
            (event.shiftKey ? document.activeElement === first : document.activeElement === last)
          ) {
            event.preventDefault()
            const target = event.shiftKey ? last : first
            target.focus()
          }
        }
        if (event.key === "Escape") {
          event.preventDefault()
          event.stopPropagation()
          onClose()
        }
        // Keep the global search shortcut from opening a second dialog over the gate.
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
          event.preventDefault()
          event.stopPropagation()
        }
      }}
    >
      {children}
      <div className="content-lock-navigation">
        <button type="button" className="content-lock-back" onClick={onClose}>
          <ArrowLeft size={15} aria-hidden="true" />
          {contentLockMessages[locale].back}
        </button>
      </div>
    </dialog>
  )
}
