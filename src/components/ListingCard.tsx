import Image from 'next/image';
import { Listing, SiteConfig } from '@/types';
import { ListingLink } from './LinkUtilities';

interface ListingCardProps {
  listing: Listing;
  site: SiteConfig;
}

export default function ListingCard({ listing, site }: ListingCardProps) {
  // Extract rating from custom fields if available
  const ratingValue = listing.customFields?.rating ? Number(listing.customFields.rating) : undefined;
  const reviewCount = listing.customFields?.review_count
    ? String(listing.customFields.review_count)
    : "1";

  return (
    <article
      className="bg-white rounded-xl overflow-hidden shadow-sm hover-lift h-full flex flex-col animate-fade-in"
      itemScope
      itemType="https://schema.org/Product"
    >
      {listing.imageUrl && (
        <div className="relative h-56 w-full overflow-hidden">
          <Image
            src={listing.imageUrl}
            alt={listing.title}
            fill
            className="object-cover hover:scale-105 transition-transform duration-700 ease-in-out"
            itemProp="image"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {listing.customFields?.featured && (
            <div className="absolute top-0 right-0 bg-accent-500 text-white text-xs font-bold px-3 py-1 m-2 rounded-full shadow-md">
              Featured
            </div>
          )}
        </div>
      )}

      <div className="p-6 flex-grow flex flex-col">
        <h2 className="text-xl font-bold text-neutral-900 mb-2 flex-shrink-0 line-clamp-2">
          <ListingLink
            listing={listing}
            className="hover:text-primary-600 transition-colors focus-visible"
          >
            <span itemProp="name">{listing.title}</span>
          </ListingLink>
        </h2>

        {/* Display rating if available */}
        {ratingValue && (
          <div className="flex items-center mb-3 flex-shrink-0">
            <div
              className="flex"
              itemProp="aggregateRating"
              itemScope
              itemType="https://schema.org/AggregateRating"
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} className={`h-5 w-5 ${star <= ratingValue ? 'text-accent-500' : 'text-neutral-200'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              {listing.customFields?.review_count && (
                <span className="ml-2 text-sm text-neutral-500">
                  ({reviewCount} reviews)
                </span>
              )}
              <meta itemProp="ratingValue" content={ratingValue.toString()} />
              <meta itemProp="reviewCount" content={reviewCount} />
              <meta itemProp="bestRating" content="5" />
              <meta itemProp="worstRating" content="1" />
            </div>
          </div>
        )}

        {/* Category tag if available */}
        {listing.categoryName && (
          <div className="mb-3">
            <span className="inline-block bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {listing.categoryName}
            </span>
          </div>
        )}

        <p className="text-neutral-600 text-sm mb-4 line-clamp-3 flex-grow" itemProp="description">
          {listing.metaDescription}
        </p>

        <div className="mt-auto pt-4 border-t border-neutral-100">
          <div className="flex items-center justify-between">
            {/* Add price if available */}
            {listing.customFields?.price && (
              <div
                className="text-lg font-bold text-success-600"
                itemProp="offers"
                itemScope
                itemType="https://schema.org/Offer"
              >
                <span itemProp="price">${String(listing.customFields.price)}</span>
                <meta itemProp="priceCurrency" content="USD" />
                <meta itemProp="availability" content="https://schema.org/InStock" />
              </div>
            )}

            {/* Call to action */}
            <ListingLink
              listing={listing}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md shadow-sm hover:bg-primary-700 focus-visible transition-colors"
              aria-label={`View details for ${listing.title}`}
            >
              View Details
            </ListingLink>
          </div>

          {/* Prominent backlink */}
          {listing.backlinkPosition === 'prominent' && (
            <div className="mt-3 pt-3 border-t border-neutral-100">
              <a
                href={listing.backlinkUrl}
                target="_blank"
                rel={listing.backlinkType === 'nofollow' ? 'nofollow' : ''}
                className="text-primary-600 text-sm font-medium hover:text-primary-800 focus-visible transition-colors"
              >
                {listing.backlinkAnchorText}
              </a>
            </div>
          )}
        </div>

        {/* Add additional metadata */}
        {listing.customFields?.brand && (
          <meta itemProp="brand" content={String(listing.customFields.brand)} />
        )}
        {listing.customFields?.sku && (
          <meta itemProp="sku" content={String(listing.customFields.sku)} />
        )}
      </div>
    </article>
  );
}