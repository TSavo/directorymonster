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
    <div 
      className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 h-full flex flex-col transform hover:-translate-y-1"
      itemScope 
      itemType="https://schema.org/Product"
    >
      {listing.imageUrl && (
        <div className="relative h-52 w-full overflow-hidden">
          <Image
            src={listing.imageUrl}
            alt={listing.title}
            fill
            className="object-cover hover:scale-105 transition-transform duration-500"
            itemProp="image"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      
      <div className="p-6 flex-grow flex flex-col">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex-shrink-0">
          <ListingLink 
            listing={listing}
            className="hover:text-blue-600 transition-colors"
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
                <svg key={star} className={`h-5 w-5 ${star <= ratingValue ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              {listing.customFields?.review_count && (
                <span className="ml-2 text-sm text-gray-500">
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
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow" itemProp="description">
          {listing.metaDescription}
        </p>
        
        <div className="mt-auto">
          {/* Add price if available */}
          {listing.customFields?.price && (
            <div 
              className="text-lg font-semibold text-green-700 mb-3"
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
            className="inline-block text-sm font-medium text-blue-600 hover:text-blue-800 mt-2"
          >
            View Details →
          </ListingLink>
          
          {/* Prominent backlink */}
          {listing.backlinkPosition === 'prominent' && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <a 
                href={listing.backlinkUrl}
                target="_blank"
                rel={listing.backlinkType === 'nofollow' ? 'nofollow' : ''}
                className="text-blue-600 text-sm font-medium hover:text-blue-800"
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
    </div>
  );
}