import Link from 'next/link';
import { kv } from '@/lib/redis-client';
import { SiteConfig, Category } from '@/types';
import { getSiteByHostname, generateSiteBaseUrl, generateCategoryHref } from '@/lib/site-utils';
import { CategoryLink } from '@/components/LinkUtilities';
import MainLayout from '@/components/MainLayout';

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
  
  // Get site by hostname
  let site = await getSiteByHostname(hostname);
  
  // If no site found, try to get any site for local testing
  if (!site && (hostname === 'localhost:3001' || hostname === 'localhost:3000' || hostname.includes('127.0.0.1'))) {
    console.log('No site found for localhost, trying to get any site for testing');
    const siteKeys = await kv.keys('site:*');
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
    const baseUrl = generateSiteBaseUrl(site);

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

    // Convert to JSON strings for script tags
    const websiteDataStr = JSON.stringify(websiteData);
    const organizationDataStr = JSON.stringify(organizationData);

    return (
      <>
        {/* Add structured data for SEO */}
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

        <MainLayout site={site} categories={categories}>
          {/* Hero section with site name and description */}
          <div className="bg-white shadow-sm border-b" data-testid="hero-section">
            <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
                  {site.name}
                </h1>
                <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
                  {site.metaDescription}
                </p>
              </div>
              
              {/* SEO-friendly markup for primary keyword */}
              <div className="hidden">
                <h2>Best {site.primaryKeyword} Reviews and Guides</h2>
                <p>Comprehensive {site.primaryKeyword} reviews, comparisons, and buyer guides.</p>
              </div>
            </div>
          </div>

          {/* Categories section */}
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8" data-testid="category-section">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Browse Categories</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" itemScope itemType="https://schema.org/ItemList">
              {categories.filter(category => category !== null).map((category, index) => (
                <div
                  key={category.id}
                  itemProp="itemListElement"
                  itemScope
                  itemType="https://schema.org/ListItem"
                >
                  <CategoryLink
                    category={category}
                    className="group"
                  >
                    <div className="bg-white overflow-hidden shadow-md rounded-lg hover:shadow-lg transition duration-300 h-full flex flex-col">
                      <div className="p-6 flex-grow">
                        <meta itemProp="position" content={String(index + 1)} />
                        <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition duration-300" itemProp="name">
                          {category.name}
                        </h3>
                        <p className="mt-3 text-base text-gray-500" itemProp="description">
                          {category.metaDescription}
                        </p>
                        <meta itemProp="url" content={`${baseUrl}/${category.slug}`} />
                      </div>
                      <div className="bg-gray-50 px-6 py-4">
                        <div className="text-sm font-medium text-blue-600 group-hover:text-blue-800">
                          View listings →
                        </div>
                      </div>
                    </div>
                  </CategoryLink>
                </div>
              ))}

              {categories.filter(category => category !== null).length === 0 && (
                <div className="col-span-full bg-white p-6 rounded-lg shadow text-center">
                  <p className="text-gray-500">No categories found. Try seeding data first.</p>
                  <p className="mt-2 text-sm text-gray-400">Run: <code className="bg-gray-100 p-1 rounded">npm run seed</code></p>
                </div>
              )}
            </div>
          </div>

          {/* Admin section with lighter visual weight */}
          <div className="bg-white border-t">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Platform Administration</h2>
                  <p className="mt-1 text-sm text-gray-500">Access the admin dashboard to manage your directory.</p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <Link
                    href="/admin"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Admin Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </MainLayout>
      </>
    );
  }
  
  // If no site exists, this is a fresh installation
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="min-h-screen flex flex-col items-center justify-center">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight sm:text-6xl md:text-7xl">
              Directory<span className="text-blue-600">Monster</span>
            </h1>
            <p className="mt-6 text-xl text-gray-500 max-w-2xl mx-auto">
              SEO-Focused Multitenancy Directory Platform
            </p>
          </div>

          <div className="bg-white shadow-md overflow-hidden rounded-lg max-w-lg w-full mb-12">
            <div className="bg-blue-600 px-6 py-4">
              <h2 className="text-lg font-semibold text-white">Getting Started</h2>
            </div>
            <div className="px-6 py-6">
              <p className="text-gray-600 mb-4">
                No directory sites found. To seed sample data, run:
              </p>
              <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
                <code className="text-sm text-gray-800">npm run seed</code>
              </div>

              <div className="mt-8">
                <Link
                  href="/admin"
                  className="w-full flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Admin Dashboard
                </Link>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>A modern directory platform for creating SEO-optimized listing sites</p>
          </div>
        </div>
      </div>
    </main>
  );
}
