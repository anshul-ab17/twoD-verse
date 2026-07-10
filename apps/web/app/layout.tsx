import "./globals.css"

export const metadata = { title: "Verse", description: "The gamified office" }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
