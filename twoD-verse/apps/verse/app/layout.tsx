import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme/theme.provider"
import Navbar from "@/components/layout/navbar"

export const metadata: Metadata = {
  title: "TwoD verse",
  description: "Created by ab",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />

          <main className="relative">
            {children}
          </main>

        </ThemeProvider>

      </body>
    </html>
  )
}
