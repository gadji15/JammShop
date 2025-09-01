import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { Suspense } from "react"
import { headers } from "next/headers"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const hdrs = headers()
  const pathname = hdrs.get("x-invoke-path") || hdrs.get("next-url") || ""
  const isAdminRoute = pathname.startsWith("/admin")

  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={<div>Loading...</div>}>
          {!isAdminRoute && <Header />}
          <main>{children}</main>
          {!isAdminRoute && <Footer />}
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
