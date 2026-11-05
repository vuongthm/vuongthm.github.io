"use client"
import { createContext } from "react"
import type { Heading } from "@/lib/content/markdown"
export const UnlockContext = createContext<((headings: Heading[]) => void) | undefined>(undefined)
