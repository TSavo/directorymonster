import Image from 'next/image';
import Link from 'next/link';
import { Listing, SiteConfig } from '@/types';

interface ListingCardProps {
  listing: Listing;
  site: SiteConfig;
}

export default function ListingCard({ listing, site }: ListingCardProps) {
  // Extract rating from custom fields if available
  const ratingValue = listing.customFields?.rating ? Number(listing.customFields.rating) : undefined;
  
  return (
    <div 
      className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      itemScope 
      itemType="https://schema.org/Product"
    >
      {listing.imageUrl && (
        <div className="relative h-48 w-full">
          <Image
            src={listing.imageUrl}
            alt={listing.title}
            fill
            className="object-cover"
            itemProp="image"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-2">
          <Link 
            href={`/${listing.categoryId}/${listing.slug}`} 
            className="hover:underline"
            itemProp="url"
          >
            <span itemProp="name">{listing.title}</span>
          </Link>
        </h2>
        
        {/* Display rating if available */}
        {ratingValue && (
          <div className="flex items-center mb-2">
            <div 
              className="flex text-yellow-400" 
              itemProp="aggregateRating" 
              itemScope 
              itemType="https://schema.org/AggregateRating"
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} className={`h-4 w-4 ${star <= ratingValue ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <meta itemProp="ratingValue" content={ratingValue.toString()} />
              <meta itemProp="reviewCount" content={String(listing.customFields?.review_count || 1)} />
              <meta itemProp="bestRating" content="5" />
              <meta itemProp="worstRating" content="1" />
            </div>
          </div>
        )}
        
        <p className="text-gray-600 mb-4 line-clamp-3" itemProp="description">{listing.metaDescription}</p>
        
        {/* Add price if available */}
        {listing.customFields?.price && (
          <div 
            className="text-green-700 font-medium mb-2"
            itemProp="offers" 
            itemScope 
            itemType="https://schema.org/Offer"
          >
            <span itemProp="price">${listing.customFields.price}</span>
            <meta itemProp="priceCurrency" content="USD" />
            <meta itemProp="availability" content="https://schema.org/InStock" />
          </div>
        )}
        
        {/* Prominent backlink */}
        {listing.backlinkPosition === 'prominent' && (
          <div className="mt-4 mb-2">
            <a 
              href={listing.backlinkUrl}
              target="_blank"
              rel={listing.backlinkType === 'nofollow' ? 'nofollow' : ''}
              className="text-blue-600 font-medium hover:underline"
            >
              {listing.backlinkAnchorText}
            </a>
          </div>
        )}
        
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