import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { kv } from '@/lib/redis-client';
import { SiteConfig, Category, Listing } from '@/types';
import SiteHeader from '@/components/SiteHeader';
import { getSiteByHostname } from '@/lib/site-utils';

interface ListingPageProps {
  params: {
    categorySlug: string;
    listingSlug: string;
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

// Generate metadata for the listing page
export async function generateMetadata({ params, searchParams }: ListingPageProps & { searchParams: any }): Promise<Metadata> {
  // Get host from headers (server component)
  const headerHost = await getHostname();
  
  // For testing, hostname parameter takes precedence
  const debugHostname = searchParams?.hostname as string | undefined;
  
  // Use debug param first, then header host, then localhost fallback
  const hostname = debugHostname || headerHost || 'localhost:3001';
  
  console.log(`DEBUG: Listing Metadata - searchParams:`, searchParams);
  console.log(`DEBUG: Listing Metadata - Using hostname:`, hostname); 
  
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
  
  // Get all categories
  const categoryKeys = await kv.keys(`category:site:${site.id}:*`);
  const categories = await Promise.all(
    categoryKeys.map(async (key) => await kv.get<Category>(key))
  );
  
  // Find current category
  const category = categories.find(cat => cat?.slug === params.categorySlug);
  
  if (!category) {
    notFound();
  }
  
  // Get listing
  const listingKeys = await kv.keys(`listing:category:${category.id}:*`);
  const listings = await Promise.all(
    listingKeys.map(async (key) => await kv.get<Listing>(key))
  );
  
  const listing = listings.find(item => item?.slug === params.listingSlug);
  
  if (!listing) {
    notFound();
  }
  
  return {
    title: `${listing.title} - ${site.name}`,
    description: listing.metaDescription,
    openGraph: {
      title: `${listing.title} - ${site.name}`,
      description: listing.metaDescription,
      type: 'article',
      images: listing.imageUrl ? [{ url: listing.imageUrl }] : undefined,
    },
  };
}

export default async function ListingPage({ params, searchParams }: ListingPageProps & { searchParams: any }) {
  // Get host from headers (server component)
  const headerHost = await getHostname();
  
  // For testing, hostname parameter takes precedence
  const debugHostname = searchParams?.hostname as string | undefined;
  
  // Use debug param first, then header host, then localhost fallback
  const hostname = debugHostname || headerHost || 'localhost:3001';
  
  console.log(`DEBUG: Listing Page - searchParams:`, searchParams);
  console.log(`DEBUG: Listing Page - Using hostname:`, hostname);
  
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
  
  // Get listing
  const listingKeys = await kv.keys(`listing:category:${category.id}:*`);
  const listings = await Promise.all(
    listingKeys.map(async (key) => await kv.get<Listing>(key))
  );
  
  const listing = listings.find(item => item?.slug === params.listingSlug);
  
  if (!listing) {
    notFound();
  }
  
  // Build the canonical URL for this listing
  const baseUrl = site.domain 
    ? `https://${site.domain}` 
    : `https://${site.slug}.mydirectory.com`;
  const canonicalUrl = `${baseUrl}/${category.slug}/${listing.slug}`;
  
  // Extract rating from custom fields if available
  const ratingValue = listing.customFields?.rating ? Number(listing.customFields.rating) : undefined;
  const reviewCount = listing.customFields?.review_count ? Number(listing.customFields.review_count) : undefined;
  
  // Format structured data for this product
  const productData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.title,
    description: listing.metaDescription,
    image: listing.imageUrl,
    url: canonicalUrl,
    ...(ratingValue && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: ratingValue,
        reviewCount: reviewCount || 1,
        bestRating: 5,
        worstRating: 1,
      }
    }),
    ...(listing.customFields?.brand && {
      brand: {
        '@type': 'Brand',
        name: String(listing.customFields.brand)
      }
    }),
    offers: {
      '@type': 'Offer',
      url: listing.backlinkUrl,
      priceCurrency: 'USD',
      price: listing.customFields?.price || '0',
      availability: 'https://schema.org/InStock'
    }
  };

  // JSON-LD structured data string
  const structuredDataStr = JSON.stringify(productData);

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
        dangerouslySetInnerHTML={{ __html: structuredDataStr }}
      />
      
      {/* Breadcrumbs for better SEO and navigation */}
      <nav aria-label="Breadcrumb" className="container mx-auto px-4 pt-4">
        <ol className="flex text-sm text-gray-500">
          <li className="flex items-center">
            <a href={baseUrl} className="hover:text-gray-700">Home</a>
            <svg className="h-4 w-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
            </svg>
          </li>
          <li className="flex items-center">
            <a href={`${baseUrl}/${category.slug}`} className="hover:text-gray-700">{category.name}</a>
            <svg className="h-4 w-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
            </svg>
          </li>
          <li className="text-gray-800 font-medium">{listing.title}</li>
        </ol>
      </nav>
      
      <main className="container mx-auto px-4 py-8">
        <article className="max-w-4xl mx-auto" itemScope itemType="https://schema.org/Product">
          {/* Hidden canonical URL for SEO */}
          <link rel="canonical" href={canonicalUrl} />
          
          <h1 className="text-4xl font-bold mb-4" itemProp="name">{listing.title}</h1>
          
          {/* Meta data for social sharing */}
          <meta property="og:title" content={`${listing.title} - ${site.name}`} />
          <meta property="og:description" content={listing.metaDescription} />
          {listing.imageUrl && <meta property="og:image" content={listing.imageUrl} />}
          <meta property="og:type" content="product" />
          <meta property="og:url" content={canonicalUrl} />
          
          {listing.imageUrl && (
            <div className="relative h-96 w-full mb-6 rounded-lg overflow-hidden">
              <Image
                src={listing.imageUrl}
                alt={listing.title}
                fill
                className="object-cover"
                itemProp="image"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )}
          
          {/* Display rating if available */}
          {ratingValue && (
            <div className="flex items-center mb-4">
              <div className="flex text-yellow-400" itemProp="aggregateRating" itemScope itemType="https://schema.org/AggregateRating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className={`h-5 w-5 ${star <= ratingValue ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="ml-2 text-gray-600" itemProp="ratingValue">{ratingValue.toFixed(1)}</span>
                <meta itemProp="reviewCount" content={String(reviewCount || 1)} />
                <meta itemProp="bestRating" content="5" />
                <meta itemProp="worstRating" content="1" />
              </div>
              {reviewCount && <span className="ml-2 text-gray-600">({reviewCount} reviews)</span>}
            </div>
          )}
          
          {/* Prominent backlink */}
          {listing.backlinkPosition === 'prominent' && (
            <div className="bg-gray-100 p-4 my-6 rounded-lg">
              <p className="font-medium">Learn more about this product:</p>
              <a 
                href={listing.backlinkUrl}
                target="_blank"
                rel={listing.backlinkType === 'nofollow' ? 'nofollow' : ''}
                className="text-blue-600 font-bold hover:underline"
                itemProp="url"
              >
                {listing.backlinkAnchorText}
              </a>
            </div>
          )}
          
          <div className="prose prose-lg max-w-none mt-8" itemProp="description">
            {listing.content}
            
            {/* Body backlink */}
            {listing.backlinkPosition === 'body' && (
              <p className="my-6">
                For more information, check out the{' '}
                <a 
                  href={listing.backlinkUrl}
                  target="_blank"
                  rel={listing.backlinkType === 'nofollow' ? 'nofollow' : ''}
                  className="text-blue-600 font-medium hover:underline"
                >
                  {listing.backlinkAnchorText}
                </a>
                .
              </p>
            )}
          </div>
          
          {/* Custom fields display */}
          {listing.customFields && Object.keys(listing.customFields).length > 0 && (
            <div className="mt-10 border-t pt-6">
              <h2 className="text-2xl font-bold mb-4">Product Details</h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                {Object.entries(listing.customFields).map(([key, value]) => (
                  <div key={key} className="py-2">
                    <dt className="font-medium text-gray-500 capitalize">{key.replace(/_/g, ' ')}</dt>
                    <dd>{String(value)}</dd>
                    {/* Add structured data properties */}
                    {key === 'brand' && <meta itemProp="brand" content={String(value)} />}
                    {key === 'sku' && <meta itemProp="sku" content={String(value)} />}
                    {key === 'price' && <meta itemProp="offers" content={String(value)} />}
                  </div>
                ))}
              </dl>
            </div>
          )}
          
          {/* Footer backlink */}
          {listing.backlinkPosition === 'footer' && (
            <div className="mt-10 pt-6 border-t">
              <p>
                <a 
                  href={listing.backlinkUrl}
                  target="_blank"
                  rel={listing.backlinkType === 'nofollow' ? 'nofollow' : ''}
                  className="text-blue-600 hover:underline"
                >
                  {listing.backlinkAnchorText}
                </a>
              </p>
            </div>
          )}
          
          {/* Last updated date (good for SEO freshness) */}
          <div className="mt-8 text-sm text-gray-500">
            <p>Last updated: {new Date(listing.updatedAt).toLocaleDateString()}</p>
          </div>
        </article>
      </main>
    </div>
  );
}