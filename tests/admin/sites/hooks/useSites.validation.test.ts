/**
 * @jest-environment jsdom
 */
import { validateSite } from '@/components/admin/sites/hooks/useSites/validation';
import { SiteData } from '@/components/admin/sites/hooks/useSites/types';

// Valid site data for testing
const validSite: SiteData = {
  name: 'Test Site',
  slug: 'test-site',
  description: 'A test site for validation',
  domains: ['example.com'],
  theme: 'default',
  customStyles: 'body { color: blue; }',
  seoTitle: 'Test Site - SEO Title',
  seoDescription: 'This is a test site for SEO description',
  contactEmail: 'contact@example.com',
  listingsPerPage: 20
};

describe('Site Validation - Complete Site', () => {
  it('validates a fully valid site without errors', () => {
    const { errors, isValid } = validateSite(validSite);
    
    expect(isValid).toBe(true);
    expect(Object.keys(errors).length).toBe(0);
  });

  it('validates all sections when no section is specified', () => {
    const invalidSite: SiteData = {
      name: '',  // Basic info error
      slug: 'test-site',
      domains: [], // Domains error
      customStyles: 'body { color: red;', // Theme error - unbalanced braces
      seoTitle: 'A'.repeat(70) // SEO error - too long
    };
    
    const { errors, isValid } = validateSite(invalidSite);
    
    expect(isValid).toBe(false);
    expect(errors.name).toBeDefined();
    expect(errors.domains).toBeDefined();
    expect(errors.customStyles).toBeDefined();
    expect(errors.seoTitle).toBeDefined();
  });
});

describe('Site Validation - Basic Info Section', () => {
  it('requires a name', () => {
    const { errors, isValid } = validateSite({ ...validSite, name: '' }, 'basic');
    
    expect(isValid).toBe(false);
    expect(errors.name).toBe('Name is required');
  });

  it('limits name length to 50 characters', () => {
    const { errors, isValid } = validateSite({ ...validSite, name: 'A'.repeat(51) }, 'basic');
    
    expect(isValid).toBe(false);
    expect(errors.name).toBe('Name cannot exceed 50 characters');
  });

  it('requires a slug', () => {
    const { errors, isValid } = validateSite({ ...validSite, slug: '' }, 'basic');
    
    expect(isValid).toBe(false);
    expect(errors.slug).toBe('Slug is required');
  });

  it('validates slug format (lowercase, numbers, hyphens only)', () => {
    const { errors, isValid } = validateSite({ ...validSite, slug: 'Invalid Slug!' }, 'basic');
    
    expect(isValid).toBe(false);
    expect(errors.slug).toBe('Slug can only contain lowercase letters, numbers, and hyphens');
  });

  it('limits slug length to 50 characters', () => {
    const { errors, isValid } = validateSite({ ...validSite, slug: 'a'.repeat(51) }, 'basic');
    
    expect(isValid).toBe(false);
    expect(errors.slug).toBe('Slug cannot exceed 50 characters');
  });

  it('limits description length to 500 characters', () => {
    const { errors, isValid } = validateSite({ ...validSite, description: 'A'.repeat(501) }, 'basic');
    
    expect(isValid).toBe(false);
    expect(errors.description).toBe('Description cannot exceed 500 characters');
  });

  it('accepts valid basic info', () => {
    const { errors, isValid } = validateSite({
      name: 'Valid Name',
      slug: 'valid-slug',
      description: 'Valid description',
      domains: ['example.com']
    }, 'basic');
    
    expect(isValid).toBe(true);
    expect(Object.keys(errors).length).toBe(0);
  });
});

describe('Site Validation - Domains Section', () => {
  it('requires at least one domain', () => {
    const { errors, isValid } = validateSite({ ...validSite, domains: [] }, 'domains');
    
    expect(isValid).toBe(false);
    expect(errors.domains).toBe('At least one domain is required');
  });

  it('accepts valid domain configurations', () => {
    const { errors, isValid } = validateSite({ ...validSite, domains: ['example.com', 'test.com'] }, 'domains');
    
    expect(isValid).toBe(true);
    expect(errors.domains).toBeUndefined();
  });
  
  it('only validates domains section when specified', () => {
    const invalidSite: SiteData = {
      name: '', // Invalid name
      slug: 'valid-slug',
      domains: ['example.com'] // Valid domains
    };
    
    const { errors, isValid } = validateSite(invalidSite, 'domains');
    
    // Should be valid because only domains section is being validated
    expect(isValid).toBe(true);
    expect(errors.name).toBeUndefined();
    expect(errors.domains).toBeUndefined();
  });
});

describe('Site Validation - Theme Section', () => {
  it('validates CSS syntax for balanced braces', () => {
    const { errors, isValid } = validateSite({ ...validSite, customStyles: 'body { color: red;' }, 'theme');
    
    expect(isValid).toBe(false);
    expect(errors.customStyles).toBe('CSS syntax error: unbalanced braces');
  });

  it('accepts valid CSS syntax', () => {
    const { errors, isValid } = validateSite({ 
      ...validSite, 
      customStyles: 'body { color: red; } .header { font-size: 16px; }'
    }, 'theme');
    
    expect(isValid).toBe(true);
    expect(errors.customStyles).toBeUndefined();
  });
  
  it('accepts empty CSS', () => {
    const { errors, isValid } = validateSite({ ...validSite, customStyles: '' }, 'theme');
    
    expect(isValid).toBe(true);
    expect(errors.customStyles).toBeUndefined();
  });
});

describe('Site Validation - SEO Section', () => {
  it('limits SEO title length to 60 characters', () => {
    const { errors, isValid } = validateSite({ ...validSite, seoTitle: 'A'.repeat(61) }, 'seo');
    
    expect(isValid).toBe(false);
    expect(errors.seoTitle).toBe('SEO title should be 60 characters or less');
  });

  it('limits SEO description length to 160 characters', () => {
    const { errors, isValid } = validateSite({ ...validSite, seoDescription: 'A'.repeat(161) }, 'seo');
    
    expect(isValid).toBe(false);
    expect(errors.seoDescription).toBe('SEO description should be 160 characters or less');
  });

  it('accepts valid SEO data', () => {
    const { errors, isValid } = validateSite({
      ...validSite,
      seoTitle: 'Valid SEO Title',
      seoDescription: 'Valid SEO description that is under the 160 character limit'
    }, 'seo');
    
    expect(isValid).toBe(true);
    expect(errors.seoTitle).toBeUndefined();
    expect(errors.seoDescription).toBeUndefined();
  });
});

describe('Site Validation - Settings Section', () => {
  it('validates listings per page range', () => {
    // Test too low
    let result = validateSite({ ...validSite, listingsPerPage: 0 }, 'settings');
    expect(result.isValid).toBe(false);
    expect(result.errors.listingsPerPage).toBe('Listings per page must be between 1 and 100');
    
    // Test too high
    result = validateSite({ ...validSite, listingsPerPage: 101 }, 'settings');
    expect(result.isValid).toBe(false);
    expect(result.errors.listingsPerPage).toBe('Listings per page must be between 1 and 100');
  });

  it('validates email format', () => {
    const { errors, isValid } = validateSite({ ...validSite, contactEmail: 'invalid-email' }, 'settings');
    
    expect(isValid).toBe(false);
    expect(errors.contactEmail).toBe('Please enter a valid email address');
  });

  it('accepts valid settings data', () => {
    const { errors, isValid } = validateSite({
      ...validSite,
      listingsPerPage: 25,
      contactEmail: 'valid@example.com',
      enableCategories: true,
      enableSearch: true
    }, 'settings');
    
    expect(isValid).toBe(true);
    expect(errors.listingsPerPage).toBeUndefined();
    expect(errors.contactEmail).toBeUndefined();
  });
});

describe('Site Validation - Multiple Sections', () => {
  it('validates across multiple sections when no specific section is provided', () => {
    const invalidSite: SiteData = {
      name: 'Valid Name',
      slug: 'valid-slug',
      description: 'Valid description',
      domains: [], // Invalid domains
      seoTitle: 'A'.repeat(61), // Invalid SEO title
      listingsPerPage: 0 // Invalid settings
    };
    
    const { errors, isValid } = validateSite(invalidSite);
    
    expect(isValid).toBe(false);
    expect(errors.domains).toBeDefined();
    expect(errors.seoTitle).toBeDefined();
    expect(errors.listingsPerPage).toBeDefined();
  });
  
  it('ignores other section errors when specific section is provided', () => {
    const invalidSite: SiteData = {
      name: 'Valid Name',
      slug: 'valid-slug',
      description: 'Valid description',
      domains: [], // Invalid domains
      seoTitle: 'A'.repeat(61), // Invalid SEO title
      listingsPerPage: 0 // Invalid settings
    };
    
    // Only validate SEO section
    const { errors, isValid } = validateSite(invalidSite, 'seo');
    
    expect(isValid).toBe(false);
    expect(errors.domains).toBeUndefined(); // Should not be validated
    expect(errors.seoTitle).toBeDefined(); // Should be validated
    expect(errors.listingsPerPage).toBeUndefined(); // Should not be validated
  });
});
