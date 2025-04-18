import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { kv } from '@/lib/redis-client';
import { SiteConfig, Category, Listing } from '@/types';
import ListingCard from '@/components/ListingCard';
import SiteHeader from '@/components/SiteHeader';
import { getSiteByHostname, generateSiteBaseUrl, generateCategoryUrl } from '@/lib/site-utils';

interface CategoryPageProps {
  params: {
    categorySlug: string;
  };
}

// Function to get hostname from request headers in server component
async function getHostname() {
  // This works on the server side to get the current hostname
  const { headers } = await import('next/headers');
  const headersList = headers();
  const hostHeader = headersList.get('host') || '';
  return hostHeader;
}

// Generate metadata for the category page
export async function generateMetadata({ params, searchParams }: CategoryPageProps & { searchParams: any }): Promise<Metadata> {
  // Get host from headers (server component)
  const headerHost = await getHostname();
  
  // For testing, hostname parameter takes precedence
  const debugHostname = searchParams?.hostname as string | undefined;
  
  // Use debug param first, then header host, then localhost fallback
  const hostname = debugHostname || headerHost || 'localhost:3001';
  
  console.log(`DEBUG: Category Metadata - searchParams:`, searchParams);
  console.log(`DEBUG: Category Metadata - Using hostname:`, hostname);
  
  // Get site config based on hostname or fallback to first site
  let site: SiteConfig | null = null;
  
  // Try to get site by hostname
  if (debugHostname) {
    site = await getSiteByHostname(debugHostname);
  }
  
  // Fallback to first site if no site found
  if (!site) {
    const siteKeys = await kv.keys('site:slug:*');
    const sites = await Promise.all(
      siteKeys.map(async (key) => await kv.get<SiteConfig>(key))
    );
    site = sites[0]; // For local testing, just use the first site
  }
  
  if (!site) {
    notFound();
  }
  
  // Get category
  const categoryKeys = await kv.keys(`category:site:${site.id}:*`);
  const categories = await Promise.all(
    categoryKeys.map(async (key) => await kv.get<Category>(key))
  );
  
  const category = categories.find(cat => cat?.slug === params.categorySlug);
  
  if (!category) {
    notFound();
  }
  
  return {
    title: `${category.name} - ${site.name}`,
    description: category.metaDescription,
    openGraph: {
      title: `${category.name} - ${site.name}`,
      description: category.metaDescription,
      type: 'website',
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps & { searchParams: any }) {
  // Get host from headers (server component)
  const headerHost = await getHostname();
  
  // For testing, hostname parameter takes precedence
  const debugHostname = searchParams?.hostname as string | undefined;
  
  // Use debug param first, then header host, then localhost fallback
  const hostname = debugHostname || headerHost || 'localhost:3001';
  
  console.log(`DEBUG: Category Page - searchParams:`, searchParams);
  console.log(`DEBUG: Category Page - Using hostname:`, hostname);
  
  // Get site config based on hostname or fallback to first site
  let site: SiteConfig | null = null;
  
  // Try to get site by hostname
  if (debugHostname) {
    site = await getSiteByHostname(debugHostname);
  }
  
  // Fallback to first site if no site found
  if (!site) {
    const siteKeys = await kv.keys('site:slug:*');
    const sites = await Promise.all(
      siteKeys.map(async (key) => await kv.get<SiteConfig>(key))
    );
    site = sites[0]; // For local testing, just use the first site
  }
  
  if (!site) {
    notFound();
  }
  
  // Get all categories for navigation
  const categoryKeys = await kv.keys(`category:site:${site.id}:*`);
  const categories = await Promise.all(
    categoryKeys.map(async (key) => await kv.get<Category>(key))
  );
  
  // Find current category
  const category = categories.find(cat => cat?.slug === params.categorySlug);
  
  if (!category) {
    notFound();
  }
  
  // Get listings for this category
  const listingKeys = await kv.keys(`listing:category:${category.id}:*`);
  const listingsPromises = listingKeys.map(async (key) => {
    const listing = await kv.get<Listing>(key);
    // Add categorySlug to each listing for proper URL construction
    if (listing) {
      listing.categorySlug = category.slug;
    }
    return listing;
  });
  const listings = await Promise.all(listingsPromises);
  
  // Build the canonical URL for this category
  const baseUrl = generateSiteBaseUrl(site);
  const canonicalUrl = generateCategoryUrl(site, category.slug);
  
  // Format structured data for category page
  const listingItems = listings.filter(listing => listing !== null).map(listing => ({
    '@type': 'ListItem',
    position: listings.indexOf(listing) + 1,
    item: {
      '@type': 'Product',
      name: listing.title,
      url: `${canonicalUrl}/${listing.slug}`,
      image: listing.imageUrl,
      description: listing.metaDescription
    }
  }));
  
  // Build breadcrumb structured data
  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': site.name,
        'item': baseUrl
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': category.name,
        'item': canonicalUrl
      }
    ]
  };
  
  // Build collection structured data
  const collectionData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': `${category.name} - ${site.name}`,
    'description': category.metaDescription,
    'url': canonicalUrl,
    'mainEntity': {
      '@type': 'ItemList',
      'itemListElement': listingItems
    }
  };
  
  // Convert to JSON strings
  const breadcrumbDataStr = JSON.stringify(breadcrumbData);
  const collectionDataStr = JSON.stringify(collectionData);

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader 
        site={site} 
        categories={categories.filter(cat => cat !== null).map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
        }))} 
      />
      
      {/* Add Structured Data */}
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbDataStr }}
      />
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: collectionDataStr }}
      />
      
      {/* Page header with breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb navigation */}
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex text-sm text-gray-500">
              <li className="flex items-center">
                <a href={baseUrl} className="hover:text-blue-600 transition-colors">Home</a>
                <svg className="h-4 w-4 mx-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
              </li>
              <li className="text-gray-900 font-medium">{category.name}</li>
            </ol>
          </nav>
          
          {/* Category heading with semantic HTML */}
          <header>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{category.name}</h1>
            <p className="text-gray-600 max-w-3xl">{category.metaDescription}</p>
          </header>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Canonical link for SEO */}
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Meta tags for social sharing */}
        <meta property="og:title" content={`${category.name} - ${site.name}`} />
        <meta property="og:description" content={category.metaDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        
        {/* Listings grid with structured data attributes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" itemScope itemType="https://schema.org/ItemList">
          {listings.filter(listing => listing !== null).map((listing, index) => (
            <div key={listing.id} itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <meta itemProp="position" content={String(index + 1)} />
              <div itemScope itemType="https://schema.org/Product">
                <ListingCard 
                  listing={listing} 
                  site={site}
                />
              </div>
            </div>
          ))}
          
          {listings.filter(listing => listing !== null).length === 0 && (
            <div className="col-span-full bg-white p-12 rounded-lg shadow-sm text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No listings yet</h3>
              <p className="mt-1 text-gray-500">
                No listings found in this category.
              </p>
            </div>
          )}
        </div>
      </main>
      
      {/* Category footer with last updated info */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-500">Last updated: {new Date(category.updatedAt).toLocaleDateString()}</p>
        </div>
      </footer>
    </div>
  );
}