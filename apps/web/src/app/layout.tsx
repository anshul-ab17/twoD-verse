import type { Metadata } from "next"
import { Inter, Space_Grotesk } from "next/font/google"
import "./globals.css"
import { AuthSessionProvider } from "@/features/auth/AuthSessionProvider"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", weight: ["300", "400", "500", "600"] })

export const metadata: Metadata = {
  title: "TwoDverse — Virtual Office for Teams",
  description: "Gather your team in immersive 2D virtual spaces.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('twodverse:site-theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}})()`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Anybody:wdth,wght@100..150,100..900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  )
}
