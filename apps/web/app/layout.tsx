import { Inter, Space_Grotesk } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", weight: ["300", "400", "500", "600"] })

export const metadata = { title: "TwoD VERSE", description: "The gamified office" }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Anybody: variable width+weight for the loader wordmark */}
        <link href="https://fonts.googleapis.com/css2?family=Anybody:wdth,wght@100..150,100..900&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
