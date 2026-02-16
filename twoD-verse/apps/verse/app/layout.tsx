import type { Metadata } from "next"
import "./globals.css"
import Link from "next/link"
import { auth, signOut } from "@/lib/auth"
import { ThemeProvider } from "@/components/theme.provider"
import { ThemeToggle } from "@/components/theme-toggle"

export const metadata: Metadata = {
  title: "TwoD verse",
  description: "Created by ab",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Global Navbar */}
          <header className="flex items-center justify-between px-8 py-6">
            <Link
              href="/"
              className="text-xl font-semibold tracking-widest"
            >
              Twodverse
            </Link>

            <div className="flex items-center gap-4">
              <ThemeToggle />

              {session ? (
                <form
                  action={async () => {
                    "use server"
                    await signOut({ redirectTo: "/" })
                  }}
                >
                  <button
                    type="submit"
                    className="text-sm font-medium hover:underline"
                  >
                    Logout
                  </button>
                </form>
              ) : (
                <Link
                  href="/signin"
                  className="text-sm font-medium hover:underline"
                >
                  Sign In
                </Link>
              )}
            </div>
          </header>

          {/* Page Content */}
          <main>{children}</main>

        </ThemeProvider>

      </body>
    </html>
  )
}
