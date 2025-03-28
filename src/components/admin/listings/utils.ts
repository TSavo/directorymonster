/**
 * Format a timestamp to a readable date string
 */
export const formatDate = (timestamp?: number): string => {
  if (!timestamp) return 'N/A';
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Generate a URL path for a listing based on site and listing information
 */
export const getListingViewUrl = (siteSlug: string | undefined, categorySlug: string | undefined, listingSlug: string): string => {
  if (!siteSlug) return '/'; // Fallback
  if (!categorySlug) return `/${siteSlug}/${listingSlug}`;
  return `/${siteSlug}/${categorySlug}/${listingSlug}`;
};

/**
 * Generate the admin URL for a listing based on site and listing information
 */
export const getListingAdminUrl = (siteSlug: string | undefined, listingId: string, listingSlug: string): string => {
  if (siteSlug) {
    return `/admin/${siteSlug}/listings/${listingSlug}`;
  }
  return `/admin/listings/${listingId}`;
};

/**
 * Generate the edit URL for a listing based on site and listing information
 */
export const getListingEditUrl = (siteSlug: string | undefined, listingId: string, listingSlug: string): string => {
  if (siteSlug) {
    return `/admin/${siteSlug}/listings/${listingSlug}/edit`;
  }
  return `/admin/listings/${listingId}/edit`;
};

/**
 * Truncate a string to a specified length
 */
export const truncateString = (str: string, maxLength: number = 100): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
};

/**
 * Get a human-readable backlink status
 */
export const getBacklinkStatus = (verifiedAt?: number): { status: 'verified' | 'unverified'; label: string } => {
  if (!verifiedAt) {
    return { status: 'unverified', label: 'Unverified' };
  }
  
  return { 
    status: 'verified', 
    label: `Verified ${formatDate(verifiedAt)}` 
  };
};
