"use client"

import { useState, useEffect } from "react"
import { Lock, Unlock, KeyRound, ArrowLeft } from "lucide-react"
import { Link } from "@/components/ui/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import CryptoJS from "crypto-js"

interface LockedScreenProps {
  isLocked: boolean
  cacheKey: string
  fallbackKeys?: string[]
  encryptedData: string | Record<string, string>
  onUnlock: (decrypted: any) => void
  backLink: string
  backLabel: string
  lang: "en" | "vi"
  children: React.ReactNode
}

const LABELS = {
  en: {
    lockedTitle: "Private Content",
    lockedDesc: "This content is encrypted and private. Please enter the correct password to unlock and read its content.",
    placeholder: "Enter password...",
    unlockBtn: "Unlock Content",
    wrongPassword: "Incorrect password. Please try again."
  },
  vi: {
    lockedTitle: "Nội dung riêng tư",
    lockedDesc: "Nội dung này đã được mã hóa bảo mật. Vui lòng nhập đúng mật khẩu để mở khóa và xem chi tiết.",
    placeholder: "Nhập mật khẩu...",
    unlockBtn: "Mở khóa",
    wrongPassword: "Mật khẩu không chính xác. Vui lòng thử lại."
  }
}

export function LockedScreen({
  isLocked,
  cacheKey,
  fallbackKeys = [],
  encryptedData,
  onUnlock,
  backLink,
  backLabel,
  lang,
  children
}: LockedScreenProps) {
  const L = LABELS[lang]
  const [password, setPassword] = useState("")
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState(false)

  // Decrypt either a single ciphertext string or a dictionary of ciphertexts
  const decryptData = (passKey: string): any => {
    const trimmedKey = passKey.trim()
    if (typeof encryptedData === "string") {
      const bytes = CryptoJS.AES.decrypt(encryptedData, trimmedKey)
      const decrypted = bytes.toString(CryptoJS.enc.Utf8)
      if (!decrypted) return null
      return decrypted
    } else {
      const decryptedMap: Record<string, string> = {}
      for (const [key, ciphertext] of Object.entries(encryptedData)) {
        const bytes = CryptoJS.AES.decrypt(ciphertext, trimmedKey)
        const decrypted = bytes.toString(CryptoJS.enc.Utf8)
        if (!decrypted) return null
        decryptedMap[key] = decrypted
      }
      return decryptedMap
    }
  }

  // Scan session storage on mount to auto-decrypt content
  useEffect(() => {
    if (!isLocked) {
      setUnlocked(true)
      return
    }

    const keysToCheck = [cacheKey, ...fallbackKeys]
    for (const key of keysToCheck) {
      const cachedPassword = sessionStorage.getItem(key)
      if (cachedPassword) {
        try {
          const decrypted = decryptData(cachedPassword)
          if (decrypted) {
            onUnlock(decrypted)
            setUnlocked(true)
            if (key !== cacheKey) {
              sessionStorage.setItem(cacheKey, cachedPassword)
            }
            return
          }
        } catch (_) {
          sessionStorage.removeItem(key)
        }
      }
    }
  }, [isLocked, cacheKey])

  // Handle password submission and verification
  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return

    try {
      const decrypted = decryptData(password.trim())
      if (!decrypted) {
        setError(true)
        toast.error(L.wrongPassword)
        return
      }

      onUnlock(decrypted)
      setUnlocked(true)
      setError(false)
      sessionStorage.setItem(cacheKey, password.trim())
      toast.success(lang === "en" ? "Content unlocked" : "Đã mở khóa nội dung")
    } catch (_) {
      setError(true)
      toast.error(L.wrongPassword)
    }
  }

  if (isLocked && !unlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] max-w-md mx-auto py-12 px-4">
        <div className="size-16 rounded-2xl bg-muted border border-border flex items-center justify-center text-accent-brand mb-6 shadow-xs animate-bounce">
          <Lock size={28} />
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground text-center mb-3">
          {L.lockedTitle}
        </h1>
        <p className="text-sm text-muted-foreground text-center leading-relaxed mb-8">
          {L.lockedDesc}
        </p>
        
        <form onSubmit={handleUnlockSubmit} className="w-full flex flex-col gap-3">
          <div className="relative w-full">
            <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={L.placeholder}
              className={cn(
                "w-full h-11 pl-10 pr-4 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 transition-all",
                error 
                  ? "border-destructive focus:ring-destructive/20" 
                  : "border-border focus:ring-accent-brand/30 focus:border-accent-brand/60"
              )}
              required
            />
          </div>
          <Button type="submit" variant="default" className="h-11 rounded-xl text-sm font-medium w-full flex items-center justify-center gap-2 cursor-pointer bg-accent-brand hover:opacity-95 border-0">
            <Unlock size={14} />
            {L.unlockBtn}
          </Button>
        </form>
        
        <Link href={backLink} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-8">
          <ArrowLeft size={13} /> {backLabel}
        </Link>
      </div>
    )
  }

  return <>{children}</>
}