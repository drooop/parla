import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Parla",
  description: "Local AI English speaking practice",
  icons: {
    icon: "/favicon.png",
    apple: "/icon-1024.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  )
}
