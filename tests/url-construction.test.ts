import { 
  generateSiteBaseUrl, 
  generateCategoryUrl, 
  generateListingUrl,
  generateCategoryHref,
  generateListingHref
} from '../src/lib/site-utils';
import { 
  SiteConfig, 
  Category, 
  Listing 
} from '../src/types';

describe('URL Construction End-to-End', () => {
  // Test data
  const site: SiteConfig = {
    id: 'site1',
    name: 'Test Directory',
    slug: 'test-directory',
    domain: 'test-directory.com',
    primaryKeyword: 'test products',
    metaDescription: 'A test directory site',
    headerText: 'Test Directory Header',
    defaultLinkAttributes: 'dofollow',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const siteWithoutDomain: SiteConfig = {
    ...site,
    slug: 'no-domain-site',
    domain: undefined
  };

  const category: Category = {
    id: 'cat1',
    siteId: 'site1',
    name: 'Test Category',
    slug: 'test-category',
    metaDescription: 'A test category',
    order: 1,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const listing: Listing = {
    id: 'list1',
    siteId: 'site1',
    categoryId: 'cat1',
    categorySlug: 'test-category',
    title: 'Test Listing',
    slug: 'test-listing',
    metaDescription: 'A test listing',
    content: 'Test content',
    backlinkUrl: 'https://example.com',
    backlinkAnchorText: 'Example',
    backlinkPosition: 'footer',
    backlinkType: 'dofollow',
    customFields: {},
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const listingWithoutCategorySlug: Listing = {
    ...listing,
    id: 'list2',
    categorySlug: undefined
  };

  describe('Base URL construction', () => {
    it('should generate correct site base URL with domain', () => {
      const url = generateSiteBaseUrl(site);
      expect(url).toBe('https://test-directory.com');
    });

    it('should generate correct site base URL without domain (subdomain)', () => {
      const url = generateSiteBaseUrl(siteWithoutDomain);
      expect(url).toBe('https://no-domain-site.mydirectory.com');
    });
  });

  describe('Category URL construction', () => {
    it('should generate correct category URL with domain', () => {
      const url = generateCategoryUrl(site, category.slug);
      expect(url).toBe('https://test-directory.com/test-category');
    });

    it('should generate correct category URL without domain (subdomain)', () => {
      const url = generateCategoryUrl(siteWithoutDomain, category.slug);
      expect(url).toBe('https://no-domain-site.mydirectory.com/test-category');
    });

    it('should generate correct category href for Link components', () => {
      const href = generateCategoryHref(category.slug);
      expect(href).toBe('/test-category');
    });
  });

  describe('Listing URL construction', () => {
    it('should generate correct listing URL with domain', () => {
      const url = generateListingUrl(site, category.slug, listing.slug);
      expect(url).toBe('https://test-directory.com/test-category/test-listing');
    });

    it('should generate correct listing URL without domain (subdomain)', () => {
      const url = generateListingUrl(siteWithoutDomain, category.slug, listing.slug);
      expect(url).toBe('https://no-domain-site.mydirectory.com/test-category/test-listing');
    });

    it('should generate correct listing href for Link components with categorySlug', () => {
      const href = generateListingHref(listing.categorySlug!, listing.slug);
      expect(href).toBe('/test-category/test-listing');
    });

    it('should generate correct listing href for Link components with categoryId fallback', () => {
      const href = generateListingHref(listingWithoutCategorySlug.categoryId, listingWithoutCategorySlug.slug);
      expect(href).toBe('/cat1/test-listing');
    });
  });

  describe('URL consistency across application', () => {
    it('should maintain consistency between full URLs and hrefs', () => {
      const fullUrl = generateListingUrl(site, category.slug, listing.slug);
      const href = generateListingHref(category.slug, listing.slug);
      const baseUrl = generateSiteBaseUrl(site);

      expect(fullUrl).toBe(`${baseUrl}${href}`);
    });

    it('should maintain consistency between category URL components', () => {
      const fullCategoryUrl = generateCategoryUrl(site, category.slug);
      const categoryHref = generateCategoryHref(category.slug);
      const baseUrl = generateSiteBaseUrl(site);

      expect(fullCategoryUrl).toBe(`${baseUrl}${categoryHref}`);
    });
  });
});