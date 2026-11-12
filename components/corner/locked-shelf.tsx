"use client"
import { useEffect, useState } from "react"
import { usePageAccess } from "@/components/providers/page-access"
import { useSite } from "@/components/providers/site-provider"
import { contentLockMessages } from "@/lib/i18n/content-lock"
import type { CornerItem } from "@/lib/content/types"
import { CornerShelf } from "./shelf"

export function LockedShelf({ payload }: { payload: string }) {
  const { session } = usePageAccess(),
    { locale } = useSite()
  const text = contentLockMessages[locale]
  const [items, setItems] = useState<Omit<CornerItem, "body">[] | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (!session) return
    let active = true
    void import("@/lib/crypto.mjs")
      .then(async ({ decryptString }) => {
        const plaintext = await decryptString(session.password, payload)
        if (!plaintext) throw Error("Unable to open shelf")
        const value = JSON.parse(plaintext)
        if (
          !Array.isArray(value) ||
          value.some(
            (item) =>
              !item ||
              !["books", "films", "podcasts"].includes(item.category) ||
              typeof item.href !== "string",
          )
        )
          throw Error("Invalid reading shelf")
        if (active) setItems(value.filter((item) => item.category === "books"))
      })
      .catch(() => {
        if (active) setFailed(true)
      })
    return () => {
      active = false
    }
  }, [payload, session])
  if (!items)
    return (
      <p className="shelf-unlock-status" role="status">
        {failed ? text.failed : text.busy}
      </p>
    )
  return <CornerShelf items={items} />
}
