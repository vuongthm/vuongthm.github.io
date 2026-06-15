import type { Metadata, Viewport } from "next"
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { LangProvider } from "@/components/providers/lang-provider"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Vuong's Blog",
    template: "%s | Vuong's Blog",
  },
  description:
    "Personal blog by Vuong (vuongthm) — life stories and lessons learned.",
  authors: [{ name: "Vuong", url: "https://vuongthm.com" }],
  creator: "Vuong (vuongthm)",
  metadataBase: new URL("https://vuongthm.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://vuongthm.com",
    siteName: "Vuong's Blog",
    title: "Vuong's Blog",
    description:
      "Personal blog by Vuong (vuongthm) — life stories and lessons learned.",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@vuongthm",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable} bg-background`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="font-sans antialiased min-h-screen">
        <ThemeProvider>
          <LangProvider>
            {children}
            <Toaster richColors position="bottom-right" />
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}