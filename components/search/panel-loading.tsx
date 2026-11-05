"use client"
import { copy } from "@/lib/i18n/copy"
import { LoaderCircle, X } from "lucide-react"
import { useSite } from "@/components/providers/site-provider"
import { Dialog } from "./dialog"
export function PanelLoading() {
  const { aiOpen, dictionary: m, locale, setSearchOpen, setAiOpen } = useSite()
  const close = () => {
    setSearchOpen(false)
    setAiOpen(false)
  }
  return (
    <Dialog
      label={aiOpen ? m.assistant : m.search}
      onClose={close}
      className={aiOpen ? "assistant-dialog" : "search-dialog"}
    >
      <div className="panel-loading">
        <span role="status">
          <LoaderCircle className="spin" size={17} />
          {copy(locale, "Đang mở…", "Opening…")}
        </span>
        <button className="icon-button" aria-label={m.close} onClick={close}>
          <X size={17} />
        </button>
      </div>
    </Dialog>
  )
}
