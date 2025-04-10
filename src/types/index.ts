export interface SiteConfig {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  primaryKeyword: string;
  metaDescription: string;
  logoUrl?: string;
  headerText: string;
  defaultLinkAttributes: 'dofollow' | 'nofollow';
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: string;
  siteId: string;
  tenantId: string; // Added tenantId to ensure tenant isolation
  name: string;
  slug: string;
  metaDescription: string;
  parentId?: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

// Re-export the Listing type from the unified listing type definition
export { Listing, ListingStatus, ListingMedia, ListingPrice, BacklinkInfo, CustomField } from './listing';

export interface ApiKey {
  id: string;
  siteId: string;
  key: string;
  name: string;
  permissions: string[];
  createdAt: number;
  expiresAt?: number;
}

export interface SiteIdentity {
  siteConfig: SiteConfig | null;
  isAdmin: boolean;
  isApiRequest: boolean;
}

export interface ACLEntry {
  resource: {
    type: string;
    id?: string;
  };
  permission: string;
}

export interface ACL {
  entries: ACLEntry[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'editor';
  acl: ACL;
  createdAt: number;
  updatedAt: number;
}