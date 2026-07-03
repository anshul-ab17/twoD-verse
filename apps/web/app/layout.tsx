export const metadata = { title: "twoD-verse" }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#101218" }}>{children}</body>
    </html>
  )
}
