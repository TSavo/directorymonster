import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { kv } from '@/lib/redis-client';
import { SiteConfig, Category, Listing } from '@/types';
import SiteHeader from '@/components/SiteHeader';
import { getSiteByHostname, generateSiteBaseUrl, generateCategoryHref, generateListingUrl } from '@/lib/site-utils';
import { CategoryLink } from '@/components/LinkUtilities';

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
  const baseUrl = generateSiteBaseUrl(site);
  const canonicalUrl = generateListingUrl(site, category.slug, listing.slug);
  
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
        dangerouslySetInnerHTML={{ __html: structuredDataStr }}
      />
      
      {/* Page header with breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs for better SEO and navigation */}
          <nav aria-label="Breadcrumb">
            <ol className="flex text-sm text-gray-500">
              <li className="flex items-center">
                <a href={baseUrl} className="hover:text-blue-600 transition-colors">Home</a>
                <svg className="h-4 w-4 mx-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
              </li>
              <li className="flex items-center">
                <CategoryLink category={category} className="hover:text-blue-600 transition-colors">
                  {category.name}
                </CategoryLink>
                <svg className="h-4 w-4 mx-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
              </li>
              <li className="text-gray-900 font-medium">{listing.title}</li>
            </ol>
          </nav>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <article className="bg-white shadow-sm rounded-lg overflow-hidden" itemScope itemType="https://schema.org/Product">
          {/* Hidden canonical URL for SEO */}
          <link rel="canonical" href={canonicalUrl} />
          
          {/* Meta data for social sharing */}
          <meta property="og:title" content={`${listing.title} - ${site.name}`} />
          <meta property="og:description" content={listing.metaDescription} />
          {listing.imageUrl && <meta property="og:image" content={listing.imageUrl} />}
          <meta property="og:type" content="product" />
          <meta property="og:url" content={canonicalUrl} />
          
          <div className="md:flex">
            {listing.imageUrl && (
              <div className="md:w-1/2 relative">
                <div className="relative aspect-[4/3] w-full h-full">
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
              </div>
            )}
            
            <div className={`p-8 ${listing.imageUrl ? 'md:w-1/2' : 'w-full'}`}>
              <h1 className="text-3xl font-bold text-gray-900 mb-4" itemProp="name">{listing.title}</h1>
              
              {/* Display rating if available */}
              {ratingValue && (
                <div className="flex items-center mb-6">
                  <div className="flex" itemProp="aggregateRating" itemScope itemType="https://schema.org/AggregateRating">
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
              
              <p className="text-gray-700 mb-6" itemProp="description">
                {listing.metaDescription}
              </p>
              
              {/* Price display if available */}
              {listing.customFields?.price && (
                <div className="mb-6">
                  <span className="text-2xl font-bold text-green-700">${listing.customFields.price}</span>
                </div>
              )}
              
              {/* Prominent backlink styled as a button */}
              {listing.backlinkPosition === 'prominent' && (
                <div className="mb-8">
                  <a 
                    href={listing.backlinkUrl}
                    target="_blank"
                    rel={listing.backlinkType === 'nofollow' ? 'nofollow' : ''}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    itemProp="url"
                  >
                    {listing.backlinkAnchorText}
                  </a>
                </div>
              )}
            </div>
          </div>
          
          <div className="px-8 py-10 border-t border-gray-200">
            <div className="prose prose-lg max-w-none" itemProp="description">
              {listing.content}
              
              {/* Body backlink */}
              {listing.backlinkPosition === 'body' && (
                <div className="my-8 p-4 bg-gray-50 border-l-4 border-blue-500 rounded">
                  <p className="mb-2 font-medium">For more information:</p>
                  <a 
                    href={listing.backlinkUrl}
                    target="_blank"
                    rel={listing.backlinkType === 'nofollow' ? 'nofollow' : ''}
                    className="text-blue-600 font-medium hover:text-blue-800 transition-colors"
                  >
                    {listing.backlinkAnchorText}
                  </a>
                </div>
              )}
            </div>
          </div>
          
          {/* Custom fields display with a more modern look */}
          {listing.customFields && Object.keys(listing.customFields).length > 0 && (
            <div className="px-8 py-10 bg-gray-50 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Details</h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {Object.entries(listing.customFields)
                  .filter(([key]) => !['rating', 'review_count'].includes(key)) // Skip rating fields as they're shown elsewhere
                  .map(([key, value]) => (
                    <div key={key} className="bg-white p-4 rounded shadow-sm">
                      <dt className="font-medium text-gray-500 text-sm uppercase tracking-wider mb-1">
                        {key.replace(/_/g, ' ')}
                      </dt>
                      <dd className="text-gray-900 font-medium">{String(value)}</dd>
                      {/* Add structured data properties */}
                      {key === 'brand' && <meta itemProp="brand" content={String(value)} />}
                      {key === 'sku' && <meta itemProp="sku" content={String(value)} />}
                      {key === 'price' && <meta itemProp="offers" content={String(value)} />}
                    </div>
                  ))}
              </dl>
            </div>
          )}
          
          {/* Footer backlink in a footer section */}
          {listing.backlinkPosition === 'footer' && (
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
              <a 
                href={listing.backlinkUrl}
                target="_blank"
                rel={listing.backlinkType === 'nofollow' ? 'nofollow' : ''}
                className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
              >
                {listing.backlinkAnchorText}
              </a>
            </div>
          )}
          
          {/* Last updated date (good for SEO freshness) */}
          <div className="px-8 py-4 bg-gray-100 border-t border-gray-200 text-sm text-gray-500">
            <p>Last updated: {new Date(listing.updatedAt).toLocaleDateString()}</p>
          </div>
        </article>
      </main>
    </div>
  );
}