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
  // Giải nén Promise params bằng await theo đúng tiêu chuẩn Next.js 15+ & 16
  const { lang } = await params

  // Bộ lọc bảo vệ ngăn chặn Next.js biên dịch nhầm các đường dẫn tĩnh thành trang động
  if (lang !== "en" && lang !== "vi") {
    notFound()
  }

  return <>{children}</>
}