import type React from "react"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { Suspense } from "react"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <Header />
        <main>{children}</main>
        <Footer />
      </Suspense>
    </>
  )
}