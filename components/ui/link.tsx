"use client"

import NextLink, { LinkProps as NextLinkProps } from "next/link"
import { useLang } from "@/components/providers/lang-provider"
import React from "react"

interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof NextLinkProps>, NextLinkProps {
  children?: React.ReactNode
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(({ href, ...props }, ref) => {
  const { lang } = useLang()
  
  let localizedHref = href
  if (typeof href === "string" && href.startsWith("/")) {
    if (!href.startsWith("/en") && !href.startsWith("/vi") && !href.startsWith("#") && !href.startsWith("/media")) {
      localizedHref = `/${lang}${href === "/" ? "" : href}`
    }
  }
  
  return <NextLink href={localizedHref} ref={ref} {...props} />
})
Link.displayName = "Link"