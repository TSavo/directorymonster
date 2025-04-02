export interface Site {
  id: string;
  name: string;
  slug?: string;
  domain?: string;
  description?: string;
  maxListings?: number;
  currentListingCount?: number;
  listingsPerPage?: number;
  tenantId?: string;
  createdAt?: string;
  updatedAt?: string;
}
