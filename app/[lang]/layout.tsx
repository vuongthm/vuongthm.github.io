export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "vi" }]
}

export default function LangLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}