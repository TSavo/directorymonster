/**
 * @jest-environment node
 */
import { searchIndexer } from '../../../src/lib/search/search-indexer';
import { Category, Listing } from '../../../src/types';

// Mock category and listing indexers
jest.mock('../../../src/lib/search/category-indexer', () => {
  return {
    CategoryIndexer: jest.fn().mockImplementation(() => ({
      indexCategory: jest.fn(),
      updateCategory: jest.fn(),
      removeCategory: jest.fn(),
      searchCategories: jest.fn()
    }))
  };
});

jest.mock('../../../src/lib/search/listing-indexer', () => {
  return {
    ListingIndexer: jest.fn().mockImplementation(() => ({
      indexListing: jest.fn(),
      updateListing: jest.fn(),
      removeListing: jest.fn(),
      searchListings: jest.fn(),
      countSearchResults: jest.fn()
    }))
  };
});

describe('Search Indexer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  const mockCategory: Category = {
    id: 'cat1',
    name: 'Test Category',
    slug: 'test-category',
    parentId: null,
    siteId: 'site1',
    metaDescription: 'Test category description',
    featuredImage: null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  const mockListing: Listing = {
    id: 'listing1',
    title: 'Test Listing',
    slug: 'test-listing',
    siteId: 'site1',
    categoryId: 'cat1',
    categorySlug: 'test-category',
    metaDescription: 'Test listing description',
    content: 'Test listing content',
    backlinkUrl: 'https://example.com',
    backlinkAnchorText: 'Example Link',
    backlinkPosition: 'prominent',
    backlinkType: 'dofollow',
    customFields: {},
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  it('delegates category indexing to CategoryIndexer', async () => {
    await searchIndexer.indexCategory(mockCategory);
    
    // Get the mock implementation
    const { CategoryIndexer } = require('../../../src/lib/search/category-indexer');
    const mockCategoryIndexer = CategoryIndexer.mock.instances[0];
    
    expect(mockCategoryIndexer.indexCategory).toHaveBeenCalledWith(mockCategory);
  });
  
  it('delegates category update to CategoryIndexer', async () => {
    await searchIndexer.updateCategory(mockCategory);
    
    const { CategoryIndexer } = require('../../../src/lib/search/category-indexer');
    const mockCategoryIndexer = CategoryIndexer.mock.instances[0];
    
    expect(mockCategoryIndexer.updateCategory).toHaveBeenCalledWith(mockCategory);
  });
  
  it('delegates category removal to CategoryIndexer', async () => {
    await searchIndexer.removeCategory('cat1', 'site1');
    
    const { CategoryIndexer } = require('../../../src/lib/search/category-indexer');
    const mockCategoryIndexer = CategoryIndexer.mock.instances[0];
    
    expect(mockCategoryIndexer.removeCategory).toHaveBeenCalledWith('cat1', 'site1');
  });
  
  it('delegates category search to CategoryIndexer', async () => {
    await searchIndexer.searchCategories('site1', 'test');
    
    const { CategoryIndexer } = require('../../../src/lib/search/category-indexer');
    const mockCategoryIndexer = CategoryIndexer.mock.instances[0];
    
    expect(mockCategoryIndexer.searchCategories).toHaveBeenCalledWith('site1', 'test');
  });
  
  it('delegates listing indexing to ListingIndexer', async () => {
    await searchIndexer.indexListing(mockListing);
    
    const { ListingIndexer } = require('../../../src/lib/search/listing-indexer');
    const mockListingIndexer = ListingIndexer.mock.instances[0];
    
    expect(mockListingIndexer.indexListing).toHaveBeenCalledWith(mockListing);
  });
  
  it('delegates listing update to ListingIndexer', async () => {
    await searchIndexer.updateListing(mockListing);
    
    const { ListingIndexer } = require('../../../src/lib/search/listing-indexer');
    const mockListingIndexer = ListingIndexer.mock.instances[0];
    
    expect(mockListingIndexer.updateListing).toHaveBeenCalledWith(mockListing);
  });
  
  it('delegates listing removal to ListingIndexer', async () => {
    await searchIndexer.removeListing('listing1', 'site1');
    
    const { ListingIndexer } = require('../../../src/lib/search/listing-indexer');
    const mockListingIndexer = ListingIndexer.mock.instances[0];
    
    expect(mockListingIndexer.removeListing).toHaveBeenCalledWith('listing1', 'site1');
  });
  
  it('delegates listing search to ListingIndexer with options', async () => {
    const searchOptions = {
      categoryId: 'cat1',
      limit: 10,
      offset: 0,
      featuredOnly: true,
      sortBy: 'newest'
    };
    
    await searchIndexer.searchListings('site1', 'test', searchOptions);
    
    const { ListingIndexer } = require('../../../src/lib/search/listing-indexer');
    const mockListingIndexer = ListingIndexer.mock.instances[0];
    
    expect(mockListingIndexer.searchListings).toHaveBeenCalledWith(
      'site1', 'test', searchOptions
    );
  });
  
  it('delegates count search results to ListingIndexer', async () => {
    const countOptions = {
      categoryId: 'cat1',
      featuredOnly: true
    };
    
    await searchIndexer.countSearchResults('site1', 'test', countOptions);
    
    const { ListingIndexer } = require('../../../src/lib/search/listing-indexer');
    const mockListingIndexer = ListingIndexer.mock.instances[0];
    
    expect(mockListingIndexer.countSearchResults).toHaveBeenCalledWith(
      'site1', 'test', countOptions
    );
  });
});
