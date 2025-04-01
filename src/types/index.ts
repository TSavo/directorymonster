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

export interface Listing {
  id: string;
  siteId: string;
  categoryId: string;
  categorySlug?: string; // Added optional categorySlug for better URL construction
  title: string;
  slug: string;
  metaDescription: string;
  content: string;
  imageUrl?: string;
  backlinkUrl: string;
  backlinkAnchorText: string;
  backlinkPosition: 'prominent' | 'body' | 'footer';
  backlinkType: 'dofollow' | 'nofollow';
  backlinkVerifiedAt?: number;
  customFields: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

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