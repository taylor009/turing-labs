import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/auth'
import { AppLayout } from '@/components/layout'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'Project Proposal Platform',
  description: 'Manage and submit your project proposals',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppLayout>
            {children}
          </AppLayout>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
