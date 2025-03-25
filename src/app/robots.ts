import { MetadataRoute } from 'next';
import { getHostname } from '@/lib/site-utils';

export default async function robots(): Promise<MetadataRoute.Robots> {
  // Try to get the current hostname
  const hostname = await getHostname() || 'mydirectory.com';
  const baseUrl = hostname.includes('localhost') ? 'https://mydirectory.com' : `https://${hostname}`;
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/_next/',
          '/static/images/private/',
          '/*.json$',
          '/*.js$',
          '/*.map$'
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}