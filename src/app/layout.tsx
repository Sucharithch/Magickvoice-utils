import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MagickVoice Post-Call Mailer',
  description: 'Post-call email processor for MagickVoice',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0f0f0f] text-white min-h-screen">{children}</body>
    </html>
  )
}
