/**
 * Unified Listing Type Definition
 *
 * This file provides a single source of truth for the Listing type
 * used throughout the application.
 */

/**
 * Listing status enum
 */
export enum ListingStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  PENDING_REVIEW = 'pending_review',
  REJECTED = 'rejected',
}

/**
 * Media type enum
 */
export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
}

/**
 * Price type enum
 */
export enum PriceType {
  FREE = 'free',
  FIXED = 'fixed',
  STARTING_AT = 'starting_at',
  VARIABLE = 'variable',
  CONTACT = 'contact',
}

/**
 * Listing Media interface
 */
export interface ListingMedia {
  id: string;
  url: string;
  type: MediaType;
  alt?: string;
  width?: number;
  height?: number;
  isPrimary?: boolean;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Listing Price interface
 */
export interface ListingPrice {
  type: PriceType;
  amount?: number;
  currency?: string;
  period?: string;
  description?: string;
}

/**
 * Contact information interface
 */
export interface ContactInfo {
  name?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  hours?: string;
}

/**
 * SEO data interface
 */
export interface SEOData {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  noFollow?: boolean;
}

/**
 * Backlink information interface
 */
export interface BacklinkInfo {
  url: string;
  anchorText?: string;
  targetPage?: string;
  position?: 'prominent' | 'body' | 'footer';
  type?: 'dofollow' | 'nofollow';
  verified?: boolean;
  verifiedAt?: string;
  status?: 'pending' | 'verified' | 'failed';
}

/**
 * Custom field interface
 */
export interface CustomField {
  key: string;
  value: string | number | boolean | string[];
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect';
  options?: string[];
}

/**
 * Main Listing interface
 */
export interface Listing {
  id: string;
  siteId: string;
  tenantId: string;
  title: string;
  slug: string;
  description: string;
  content?: string;
  status: ListingStatus | string;
  categoryIds: string[];
  categorySlug?: string;
  categories?: { id: string; name: string; slug: string; }[]; // Simplified Category type
  media: ListingMedia[];
  price?: ListingPrice;
  contactInfo?: ContactInfo;
  seoData?: SEOData;
  backlinkInfo?: BacklinkInfo;
  customFields?: CustomField[] | Record<string, unknown>;
  featured?: boolean;
  featuredUntil?: string;
  viewCount?: number;
  clickCount?: number;
  submissionId?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  expiresAt?: string;
  userId: string;
  userDisplayName?: string;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates a listing object
 *
 * @param listing - The listing to validate
 * @returns A validation result object
 */
export function validateListing(listing: Listing): ValidationResult {
  const errors: string[] = [];

  // Check required fields
  if (!listing.siteId) {
    errors.push('siteId is required');
  }

  if (!listing.tenantId) {
    errors.push('tenantId is required');
  }

  if (!listing.title) {
    errors.push('title is required');
  }

  if (!listing.categoryIds || listing.categoryIds.length === 0) {
    errors.push('At least one categoryId is required');
  }

  if (!listing.userId) {
    errors.push('userId is required');
  }

  // Validate status
  const validStatuses = Object.values(ListingStatus);
  if (listing.status && !validStatuses.includes(listing.status as ListingStatus)) {
    errors.push(`status must be one of: ${validStatuses.join(', ')}`);
  }

  // Validate media
  if (listing.media) {
    for (const media of listing.media) {
      if (!media.url) {
        errors.push('Media URL is required for all media items');
      }

      if (!media.type || !Object.values(MediaType).includes(media.type as MediaType)) {
        errors.push(`Media type must be one of: ${Object.values(MediaType).join(', ')}`);
      }
    }
  }

  // Validate price
  if (listing.price) {
    if (!listing.price.type || !Object.values(PriceType).includes(listing.price.type as PriceType)) {
      errors.push(`Price type must be one of: ${Object.values(PriceType).join(', ')}`);
    }

    if (listing.price.type !== PriceType.FREE && listing.price.type !== PriceType.CONTACT && !listing.price.amount) {
      errors.push('Price amount is required for non-free and non-contact price types');
    }
  }

  // Validate backlink info
  if (listing.backlinkInfo && !listing.backlinkInfo.url) {
    errors.push('Backlink URL is required when backlink info is provided');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Creates a slug from a title
 *
 * @param title - The title to create a slug from
 * @returns A URL-friendly slug
 */
export function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Form data for creating/updating a listing
 */
export interface ListingFormData {
  title: string;
  description: string;
  content?: string;
  status: ListingStatus;
  categoryIds: string[];
  media: ListingMedia[];
  siteId?: string;
  price?: ListingPrice;
  contactInfo?: ContactInfo;
  seoData?: SEOData;
  backlinkInfo?: BacklinkInfo;
  customFields?: CustomField[];
  featured?: boolean;
  featuredUntil?: string;
}

/**
 * Listing sort options
 */
export type ListingSortField =
  | 'title'
  | 'createdAt'
  | 'updatedAt'
  | 'publishedAt'
  | 'viewCount'
  | 'clickCount'
  | 'status';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Listing filters interface
 */
export interface ListingFilters {
  search?: string;
  status?: ListingStatus[];
  categoryIds?: string[];
  featured?: boolean;
  fromDate?: string;
  toDate?: string;
  userId?: string;
}

/**
 * Listing pagination interface
 */
export interface ListingPagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

/**
 * Listing API response
 */
export interface ListingApiResponse {
  data: Listing[];
  pagination: ListingPagination;
}
