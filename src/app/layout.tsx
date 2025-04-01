import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import './globals.css'
import { resolveTenant } from '../lib/tenant-resolver'

// Generate dynamic metadata based on tenant
export async function generateMetadata(): Promise<Metadata> {
  // Get current tenant
  const tenant = await resolveTenant();
  const headersList = headers();
  
  // Fallback to basic tenant info from headers if resolver fails
  const tenantId = tenant?.id || headersList.get('x-tenant-id') || 'default';
  const tenantName = tenant?.name || headersList.get('x-tenant-name') || 'Directory Monster';
  const hostname = headersList.get('x-hostname') || 'mydirectory.com';
  
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? `https://${hostname}`
    : `http://${hostname}:3000`;
    
  return {
    title: {
      template: `%s | ${tenantName}`,
      default: `${tenantName} - SEO-Focused Directory Platform`,
    },
    description: `A comprehensive SEO-optimized directory for ${tenantName}`,
    applicationName: tenantName,
    authors: [{ name: `${tenantName} Team` }],
    generator: 'Next.js',
    keywords: ['directory', 'reviews', 'products', 'SEO', 'listings', tenantId, tenantName.toLowerCase()],
    referrer: 'origin-when-cross-origin',
    metadataBase: new URL(baseUrl),
    creator: tenantName,
    publisher: tenantName,
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
      siteName: tenantName,
      title: `${tenantName} - SEO-Focused Directory Platform`,
      description: `A comprehensive SEO-optimized directory for ${tenantName}`,
      images: [
        {
          url: '/og-image.jpg',
          width: 1200,
          height: 630,
          alt: tenantName,
        }
      ],
    },
    alternates: {
      canonical: baseUrl,
    }
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get header information
  const headersList = headers();
  const tenantId = headersList.get('x-tenant-id') || 'default';
  const tenantSlug = headersList.get('x-tenant-slug') || 'default';
  const tenantName = headersList.get('x-tenant-name') || 'Directory Monster';
  
  return (
    <html lang="en">
      <head>
        {/* Add tenant metadata for client components */}
        <meta name="tenant-id" content={tenantId} />
        <meta name="tenant-slug" content={tenantSlug} />
        <meta name="tenant-name" content={tenantName} />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}