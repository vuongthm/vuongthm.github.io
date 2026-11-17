import { defaultLocale } from "@/lib/i18n/config"
import { Document } from "@/components/providers/document"
export default function Layout({ children }: { children: React.ReactNode }) {
  return <Document locale={defaultLocale}>{children}</Document>
}
