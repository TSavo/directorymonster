import Link from 'next/link';
import { kv } from '@/lib/redis-client';
import { SiteConfig, Category } from '@/types';
import { getSiteByHostname } from '@/lib/site-utils';

// Types for Next.js App Router page props
type PageProps = {
  params: {};
  searchParams: { [key: string]: string | string[] | undefined };
}

// Function to get hostname from request headers in server component
async function getHostname() {
  // This works on the server side to get the current hostname
  const { headers } = await import('next/headers');
  const headersList = headers();
  const hostHeader = headersList.get('host') || '';
  return hostHeader;
}

export default async function Home({ searchParams }: PageProps) {
  // Get host from headers (server component)
  const headerHost = await getHostname();
  
  // For testing, hostname parameter takes precedence
  const debugHostname = searchParams?.hostname as string | undefined;
  
  // Use debug param first, then header host, then localhost fallback
  const hostname = debugHostname || headerHost || 'localhost:3001';
  
  // Log to debug hostnames
  console.log(`DEBUG: Homepage - Headers host:`, headerHost);
  console.log(`DEBUG: Homepage - Query param hostname:`, debugHostname);
  console.log(`DEBUG: Homepage - Using final hostname:`, hostname);
  
  // Get site config based on hostname or fallback to first site
  let site: SiteConfig | null = null;
  
  // Try to get site by hostname
  // First try the hostname parameter, then fallback to localhost
  console.log(`DEBUG: Looking up site by hostname: ${hostname}`);
  site = await getSiteByHostname(hostname);
  console.log(`DEBUG: Hostname lookup result:`, site?.name || 'null');
  
  // Fallback to first site if no site found
  if (!site) {
    const siteKeys = await kv.keys('site:slug:*');
    const sites = await Promise.all(
      siteKeys.map(async (key) => await kv.get<SiteConfig>(key))
    );
    site = sites[0]; // For local testing, just use the first site
  }

  // If site exists, this is platform
  if (site) {
    // Get categories for this site
    const categoryKeys = await kv.keys(`category:site:${site.id}:*`);
    const categories = await Promise.all(
      categoryKeys.map(async (key) => await kv.get<Category>(key))
    );
    
    // Build base URL for site
    const baseUrl = site.domain 
      ? `https://${site.domain}` 
      : `https://${site.slug}.mydirectory.com`;
    
    // Create structured data for WebSite
    const websiteData = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: site.name,
      url: baseUrl,
      description: site.metaDescription,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${baseUrl}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    };
    
    // Create structured data for Organization
    const organizationData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: site.name,
      url: baseUrl,
      logo: site.logoUrl || `${baseUrl}/logo.png`,
      description: site.metaDescription
    };
    
    // Convert structured data to JSON strings
    const websiteDataStr = JSON.stringify(websiteData);
    const organizationDataStr = JSON.stringify(organizationData);
    
    return (
      <main className="flex min-h-screen flex-col p-8">
        {/* Add structured data */}
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: websiteDataStr }}
        />
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: organizationDataStr }}
        />
        
        {/* Add canonical URL for SEO */}
        <link rel="canonical" href={baseUrl} />
        
        {/* Add meta tags for social sharing */}
        <meta property="og:title" content={site.name} />
        <meta property="og:description" content={site.metaDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={baseUrl} />
        {site.logoUrl && <meta property="og:image" content={site.logoUrl} />}
        
        {/* Main content with semantic HTML */}
        <div className="max-w-5xl mx-auto w-full">
          <header>
            <h1 className="text-4xl font-bold mb-4">{site.name}</h1>
            <p className="text-xl mb-8">{site.metaDescription}</p>
            
            {/* SEO-friendly markup for primary keyword */}
            <div className="hidden">
              <h2>Best {site.primaryKeyword} Reviews and Guides</h2>
              <p>Comprehensive {site.primaryKeyword} reviews, comparisons, and buyer guides.</p>
            </div>
          </header>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8" itemScope itemType="https://schema.org/ItemList">
              {categories.filter(category => category !== null).map((category, index) => (
                <Link 
                  key={category.id}
                  href={`/${category.slug}`}
                  className="border p-4 rounded-lg hover:bg-gray-50 transition-colors"
                  itemProp="itemListElement"
                  itemScope
                  itemType="https://schema.org/ListItem"
                >
                  <meta itemProp="position" content={String(index + 1)} />
                  <h3 className="text-lg font-medium mb-2" itemProp="name">{category.name}</h3>
                  <p className="text-gray-600 text-sm" itemProp="description">{category.metaDescription}</p>
                  <meta itemProp="url" content={`${baseUrl}/${category.slug}`} />
                </Link>
              ))}
              
              {categories.filter(category => category !== null).length === 0 && (
                <p className="col-span-full text-gray-500">No categories found. Try seeding data first.</p>
              )}
            </div>
          </section>
          
          <section>
            <div className="mt-12 mb-8 border-t pt-8">
              <h2 className="text-2xl font-semibold mb-4">Platform Administration</h2>
              <Link href="/admin" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                Admin Dashboard
              </Link>
            </div>
          </section>

          <footer className="text-sm text-gray-500 mt-12">
            <p>To seed sample data, run: <code className="bg-gray-100 p-1 rounded">npm run seed</code></p>
            <p className="mt-2">Last updated: {new Date(site.updatedAt).toLocaleDateString()}</p>
          </footer>
        </div>
      </main>
    );
  }
  
  // If no site exists, this is a fresh installation
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Directory Monster</h1>
      <p className="text-xl mb-6">SEO-Focused Multitenancy Directory Platform</p>
      
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-8 max-w-lg">
        <h2 className="text-lg font-medium text-amber-800 mb-2">Getting Started</h2>
        <p className="text-amber-700 mb-2">
          No directory sites found. To seed sample data, run:
        </p>
        <pre className="bg-amber-100 p-2 rounded text-amber-800 overflow-x-auto">
          npm run seed
        </pre>
      </div>
      
      <Link href="/admin" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
        Admin Dashboard
      </Link>
    </main>
  );
}