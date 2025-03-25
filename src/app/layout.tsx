import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | Directory Monster',
    default: 'Directory Monster - SEO-Focused Directory Platform',
  },
  description: 'A comprehensive SEO-optimized multi-tenant directory platform for product reviews and listings',
  applicationName: 'Directory Monster',
  authors: [{ name: 'Directory Monster Team' }],
  generator: 'Next.js',
  keywords: ['directory', 'reviews', 'products', 'SEO', 'listings', 'multi-tenant'],
  referrer: 'origin-when-cross-origin',
  metadataBase: new URL('https://mydirectory.com'),
  creator: 'Directory Monster',
  publisher: 'Directory Monster',
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@directorymonster',
    site: '@directorymonster',
  },
  openGraph: {
    type: 'website',
    siteName: 'Directory Monster',
    title: 'Directory Monster - SEO-Focused Directory Platform',
    description: 'A comprehensive SEO-optimized multi-tenant directory platform for product reviews and listings',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Directory Monster',
      }
    ],
  },
  alternates: {
    canonical: 'https://mydirectory.com',
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' }
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}