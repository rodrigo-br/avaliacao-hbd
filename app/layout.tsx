import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

import './globals.css'

const _inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Hei Bora Dancar - Perfil do Aluno',
  description: 'Perfil RPG do aluno de danca - Hei Bora Dancar',
  icons: {
    icon: '/images/mini-logo.jpeg',
  },
}

export const viewport: Viewport = {
  themeColor: '#ff6a00',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
