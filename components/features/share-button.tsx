"use client"

import { Share2, Link2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { Lang } from "@/lib/data"

function XShareIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}
function FacebookIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}
function LinkedinIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

interface ShareButtonProps {
  title: string
  url?: string
  lang?: Lang
}

const LABELS = {
  en: { copy: "Copy link", copied: "Link copied!", share: "Share" },
  vi: { copy: "Sao chép liên kết", copied: "Đã sao chép!", share: "Chia sẻ" },
}

export function ShareButton({ title, url, lang = "en" }: ShareButtonProps) {
  const L = LABELS[lang]
  const [open, setOpen] = useState(false)
  const shareUrl = typeof window !== "undefined" ? url ?? window.location.href : url ?? ""

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl })
      } catch (_) {}
      return
    }
    setOpen((v) => !v)
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl)
    toast.success(L.copied)
    setOpen(false)
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={handleNativeShare}
        className={cn(
          "flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground",
          "px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors duration-150"
        )}
      >
        <Share2 size={14} /> {L.share}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full mb-2 right-0 z-40 bg-popover border border-border rounded-xl shadow-lg p-1 min-w-[180px]">
            <button onClick={copyLink} className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors">
              <Link2 size={14} className="text-muted-foreground" /> {L.copy}
            </button>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <span className="text-muted-foreground"><XShareIcon /></span> Twitter / X
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <span className="text-muted-foreground"><FacebookIcon /></span> Facebook
            </a>
            <a
              href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <span className="text-muted-foreground"><LinkedinIcon /></span> LinkedIn
            </a>
          </div>
        </>
      )}
    </div>
  )
}