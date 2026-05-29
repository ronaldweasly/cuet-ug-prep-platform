import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CUET UG Exam Platform',
  description: 'Comprehensive preparation platform for CUET UG entrance exam',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'CUET UG Exam Platform',
    description: 'Prepare for CUET with authentic past papers and adaptive tests',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        {/* Theme provider would go here */}
        {children}
      </body>
    </html>
  )
}
