import { Document } from "@/components/providers/document"
export default function Layout({ children }: { children: React.ReactNode }) {
  return <Document locale="vi">{children}</Document>
}
