import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { kv } from '@/lib/redis-client';
import { SiteConfig, Category, Listing } from '@/types';
import ListingCard from '@/components/ListingCard';
import SiteHeader from '@/components/SiteHeader';
import { getSiteByHostname } from '@/lib/site-utils';

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
  const listings = await Promise.all(
    listingKeys.map(async (key) => await kv.get<Listing>(key))
  );
  
  // Build the canonical URL for this category
  const baseUrl = site.domain 
    ? `https://${site.domain}` 
    : `https://${site.slug}.mydirectory.com`;
  const canonicalUrl = `${baseUrl}/${category.slug}`;
  
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
    <div>
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
      
      {/* Breadcrumb navigation */}
      <nav aria-label="Breadcrumb" className="container mx-auto px-4 pt-4">
        <ol className="flex text-sm text-gray-500">
          <li className="flex items-center">
            <a href={baseUrl} className="hover:text-gray-700">Home</a>
            <svg className="h-4 w-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
            </svg>
          </li>
          <li className="text-gray-800 font-medium">{category.name}</li>
        </ol>
      </nav>
      
      <main className="container mx-auto px-4 py-8">
        {/* Canonical link for SEO */}
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Category heading with semantic HTML */}
        <header>
          <h1 className="text-3xl font-bold mb-3">{category.name}</h1>
          <p className="text-gray-600 mb-8 max-w-3xl">{category.metaDescription}</p>
        </header>
        
        {/* Meta tags for social sharing */}
        <meta property="og:title" content={`${category.name} - ${site.name}`} />
        <meta property="og:description" content={category.metaDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        
        {/* Listings grid with structured data attributes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" itemScope itemType="https://schema.org/ItemList">
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
            <p className="col-span-full text-center text-gray-500 py-8">
              No listings found in this category.
            </p>
          )}
        </div>
        
        {/* Category footer with last updated info */}
        <footer className="mt-12 text-sm text-gray-500">
          <p>Last updated: {new Date(category.updatedAt).toLocaleDateString()}</p>
        </footer>
      </main>
    </div>
  );
}