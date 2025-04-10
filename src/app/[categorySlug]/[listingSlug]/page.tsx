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
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white border-b relative">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs for better SEO and navigation */}
          <nav aria-label="Breadcrumb">
            <ol className="flex text-sm text-white/80">
              <li className="flex items-center">
                <a href={baseUrl} className="hover:text-white transition-colors focus-visible">Home</a>
                <svg className="h-4 w-4 mx-2 text-white/60" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
              </li>
              <li className="flex items-center">
                <CategoryLink category={category} className="hover:text-white transition-colors focus-visible">
                  {category.name}
                </CategoryLink>
                <svg className="h-4 w-4 mx-2 text-white/60" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
              </li>
              <li className="text-white font-medium">{listing.title}</li>
            </ol>
          </nav>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent"></div>
      </div>

      <main className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <article className="bg-white shadow-sm rounded-xl overflow-hidden border border-neutral-100 animate-fade-in" itemScope itemType="https://schema.org/Product">
          {/* Hidden canonical URL for SEO */}
          <link rel="canonical" href={canonicalUrl} />

          {/* Meta data for social sharing */}
          <meta property="og:title" content={`${listing.title} - ${site.name}`} />
          <meta property="og:description" content={listing.metaDescription} />
          {listing.imageUrl && <meta property="og:image" content={listing.imageUrl} />}
          <meta property="og:type" content="product" />
          <meta property="og:url" content={canonicalUrl} />

          <div className="lg:grid lg:grid-cols-2 lg:gap-12">
            {/* Image section */}
            {listing.imageUrl ? (
              <div className="relative overflow-hidden lg:rounded-r-none">
                <div className="relative aspect-[4/3] w-full group">
                  <Image
                    src={listing.imageUrl}
                    alt={listing.title}
                    fill
                    className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                    itemProp="image"
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  {listing.customFields?.featured && (
                    <div className="absolute top-0 right-0 bg-accent-500 text-white text-xs font-bold px-3 py-1 m-4 rounded-full shadow-md">
                      Featured
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="relative aspect-[4/3] w-full bg-neutral-100 flex items-center justify-center">
                <svg className="h-20 w-20 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}

            <div className="p-8 lg:p-10">
              {/* Category tag */}
              <div className="mb-4">
                <span className="inline-block bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {category.name}
                </span>
              </div>

              <h1 className="text-3xl font-bold text-neutral-900 mb-4" itemProp="name">{listing.title}</h1>

              {/* Display rating if available */}
              {ratingValue && (
                <div className="flex items-center mb-6">
                  <div className="flex" itemProp="aggregateRating" itemScope itemType="https://schema.org/AggregateRating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className={`h-5 w-5 ${star <= ratingValue ? 'text-accent-500' : 'text-neutral-200'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ml-2 text-neutral-600" itemProp="ratingValue">{ratingValue.toFixed(1)}</span>
                    <meta itemProp="reviewCount" content={String(reviewCount || 1)} />
                    <meta itemProp="bestRating" content="5" />
                    <meta itemProp="worstRating" content="1" />
                  </div>
                  {reviewCount && <span className="ml-2 text-neutral-600">({reviewCount} reviews)</span>}
                </div>
              )}

              <p className="text-neutral-600 mb-8 leading-relaxed" itemProp="description">
                {listing.metaDescription}
              </p>

              {/* Price display if available */}
              {listing.customFields?.price && (
                <div className="mb-8 flex items-center">
                  <span className="text-2xl font-bold text-success-600 mr-2">${listing.customFields.price}</span>
                  {listing.customFields?.originalPrice && (
                    <span className="text-lg text-neutral-400 line-through">${listing.customFields.originalPrice}</span>
                  )}
                </div>
              )}

              {/* Prominent backlink styled as a button */}
              {listing.backlinkPosition === 'prominent' && (
                <div className="mb-8">
                  <a
                    href={listing.backlinkUrl}
                    target="_blank"
                    rel={listing.backlinkType === 'nofollow' ? 'nofollow' : ''}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus-visible transition-colors"
                    itemProp="url"
                  >
                    {listing.backlinkAnchorText}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="px-8 py-12 border-t border-neutral-100">
            <div className="prose prose-lg max-w-none prose-headings:text-neutral-900 prose-p:text-neutral-700 prose-a:text-primary-600 prose-a:no-underline hover:prose-a:text-primary-700" itemProp="description">
              {listing.content}

              {/* Body backlink */}
              {listing.backlinkPosition === 'body' && (
                <div className="my-8 p-6 bg-primary-50 border-l-4 border-primary-500 rounded-lg">
                  <p className="mb-2 font-medium text-primary-900">For more information:</p>
                  <a
                    href={listing.backlinkUrl}
                    target="_blank"
                    rel={listing.backlinkType === 'nofollow' ? 'nofollow' : ''}
                    className="text-primary-600 font-medium hover:text-primary-800 transition-colors focus-visible"
                  >
                    {listing.backlinkAnchorText}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Custom fields display with a more modern look */}
          {listing.customFields && Object.keys(listing.customFields).length > 0 && (
            <div className="px-8 py-12 bg-neutral-50 border-t border-neutral-100">
              <h2 className="text-2xl font-bold text-neutral-900 mb-8">Product Details</h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {Object.entries(listing.customFields)
                  .filter(([key]) => !['rating', 'review_count', 'featured', 'originalPrice'].includes(key)) // Skip fields shown elsewhere
                  .map(([key, value]) => (
                    <div key={key} className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100 transition-all duration-300 hover:shadow-md">
                      <dt className="font-medium text-neutral-500 text-sm uppercase tracking-wider mb-1">
                        {key.replace(/_/g, ' ')}
                      </dt>
                      <dd className="text-neutral-900 font-medium">{String(value)}</dd>
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
            <div className="px-8 py-6 bg-neutral-50 border-t border-neutral-100">
              <a
                href={listing.backlinkUrl}
                target="_blank"
                rel={listing.backlinkType === 'nofollow' ? 'nofollow' : ''}
                className="text-primary-600 hover:text-primary-800 transition-colors font-medium focus-visible"
              >
                {listing.backlinkAnchorText}
              </a>
            </div>
          )}

          {/* Last updated date (good for SEO freshness) */}
          <div className="px-8 py-4 bg-neutral-100 border-t border-neutral-200 text-sm text-neutral-500">
            <p>Last updated: <time dateTime={listing.updatedAt}>{new Date(listing.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</time></p>
          </div>
        </article>
      </main>
    </div>
  );
}