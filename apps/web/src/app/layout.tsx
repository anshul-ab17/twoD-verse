import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import PageTransition from "@/components/layout/PageTransition"
import { AuthSessionProvider } from "@/components/providers/AuthSessionProvider"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TwoDverse — Virtual Office for Teams",
  description:
    "Gather your team in immersive 2D virtual spaces. Real-time movement, proximity voice & video, chat, and more.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      {/* Anti-flash: set theme from localStorage before paint */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('twodverse:site-theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <PageTransition>
          <AuthSessionProvider>{children}</AuthSessionProvider>
        </PageTransition>
      </body>
    </html>
  )
}
