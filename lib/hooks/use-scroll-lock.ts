"use client"
import { useEffect } from "react"

const locks = new WeakMap<Document, { count: number; overflow: string; rootOverflow: string }>()
/** Overlapping menus/dialogs share ownership, including when one replaces another. */
export function lockDocumentScroll(doc: Document) {
  const state = locks.get(doc) ?? {
    count: 0,
    overflow: doc.body.style.overflow,
    rootOverflow: doc.documentElement.style.overflow,
  }
  state.count++
  locks.set(doc, state)
  doc.body.style.overflow = "hidden"
  doc.documentElement.style.overflow = "hidden"
  let released = false
  return () => {
    if (released) return
    released = true
    if (--state.count === 0) {
      doc.body.style.overflow = state.overflow
      doc.documentElement.style.overflow = state.rootOverflow
      locks.delete(doc)
    }
  }
}
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (active) return lockDocumentScroll(document)
  }, [active])
}
