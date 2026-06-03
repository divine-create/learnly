import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar'

export const metadata: Metadata = {
  title: 'CodeBridge Nigeria — AI Coding Education for Schools',
  description: 'AI-powered coding education platform for Nigerian primary and secondary schools. Built for teachers first.',
  manifest: '/manifest.json',
  themeColor: '#7c3aed',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased">
        <ServiceWorkerRegistrar />
        {children}
        <Toaster position="top-right" toastOptions={{
          duration: 3000,
          style: { fontFamily: 'Inter, sans-serif', fontSize: '14px' },
        }} />
      </body>
    </html>
  )
}
