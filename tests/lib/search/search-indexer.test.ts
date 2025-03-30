/**
 * @jest-environment node
 */
import { searchIndexer } from '../../../src/lib/search/search-indexer';
import { Category, Listing } from '../../../src/types';
import { CategoryIndexer } from '../../../src/lib/search/category-indexer';
import { ListingIndexer } from '../../../src/lib/search/listing-indexer';

// Mock category and listing indexers using spyOn instead of jest.mock
jest.mock('../../../src/lib/search/category-indexer');
jest.mock('../../../src/lib/search/listing-indexer');

describe('Search Indexer', () => {
  let mockCategoryIndexer: {
    indexCategory: jest.Mock;
    updateCategory: jest.Mock;
    removeCategory: jest.Mock;
    searchCategories: jest.Mock;
  };
  
  let mockListingIndexer: {
    indexListing: jest.Mock;
    updateListing: jest.Mock;
    removeListing: jest.Mock;
    searchListings: jest.Mock;
    countSearchResults: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup the mock implementation for CategoryIndexer
    mockCategoryIndexer = {
      indexCategory: jest.fn(),
      updateCategory: jest.fn(),
      removeCategory: jest.fn(),
      searchCategories: jest.fn()
    };
    
    // Setup the mock implementation for ListingIndexer
    mockListingIndexer = {
      indexListing: jest.fn(),
      updateListing: jest.fn(),
      removeListing: jest.fn(),
      searchListings: jest.fn(),
      countSearchResults: jest.fn()
    };
    
    // Replace the original instances with our mock instances
    (CategoryIndexer as jest.Mock).mockImplementation(() => mockCategoryIndexer);
    (ListingIndexer as jest.Mock).mockImplementation(() => mockListingIndexer);
    
    // Recreate the searchIndexer to use our mocked instances
    Object.defineProperty(searchIndexer, 'categoryIndexer', {
      value: mockCategoryIndexer
    });
    
    Object.defineProperty(searchIndexer, 'listingIndexer', {
      value: mockListingIndexer
    });
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
    expect(mockCategoryIndexer.indexCategory).toHaveBeenCalledWith(mockCategory);
  });
  
  it('delegates category update to CategoryIndexer', async () => {
    await searchIndexer.updateCategory(mockCategory);
    expect(mockCategoryIndexer.updateCategory).toHaveBeenCalledWith(mockCategory);
  });
  
  it('delegates category removal to CategoryIndexer', async () => {
    await searchIndexer.removeCategory('cat1', 'site1');
    expect(mockCategoryIndexer.removeCategory).toHaveBeenCalledWith('cat1', 'site1');
  });
  
  it('delegates category search to CategoryIndexer', async () => {
    await searchIndexer.searchCategories('site1', 'test');
    expect(mockCategoryIndexer.searchCategories).toHaveBeenCalledWith('site1', 'test');
  });
  
  it('delegates listing indexing to ListingIndexer', async () => {
    await searchIndexer.indexListing(mockListing);
    expect(mockListingIndexer.indexListing).toHaveBeenCalledWith(mockListing);
  });
  
  it('delegates listing update to ListingIndexer', async () => {
    await searchIndexer.updateListing(mockListing);
    expect(mockListingIndexer.updateListing).toHaveBeenCalledWith(mockListing);
  });
  
  it('delegates listing removal to ListingIndexer', async () => {
    await searchIndexer.removeListing('listing1', 'site1');
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
    expect(mockListingIndexer.countSearchResults).toHaveBeenCalledWith(
      'site1', 'test', countOptions
    );
  });
});
