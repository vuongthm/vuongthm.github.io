import { notFound } from "next/navigation"

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "vi" }]
}

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function LangLayout({
  children,
  params,
}: LayoutProps) {
  // Unwrap Promise params with await, per the Next.js 15+ & 16 specification
  const { lang } = await params

  // Protection filter to prevent Next.js from incorrectly compiling static paths into dynamic pages
  if (lang !== "en" && lang !== "vi") {
    notFound()
  }

  return <>{children}</>
}