import type React from "react"
import type { Metadata } from "next"

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
  // Root layout now only provides HTML shell; public and admin segments define their own UI
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
} ${GeistMono.variable}`}>
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
