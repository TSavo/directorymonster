// Mock for searchIndexer
const searchIndexer = {
  clearIndex: jest.fn(),
  indexListing: jest.fn(),
  indexCategory: jest.fn(),
  search: jest.fn().mockReturnValue([]),
  searchListings: jest.fn().mockReturnValue([]),
  searchCategories: jest.fn().mockReturnValue([]),
  getListingById: jest.fn(),
  getCategoryById: jest.fn(),
  removeListingById: jest.fn(),
  removeCategoryById: jest.fn(),
  getListingsBySiteId: jest.fn().mockReturnValue([]),
  getCategoriesBySiteId: jest.fn().mockReturnValue([])
};

// Make searchIndexer globally available
global.searchIndexer = searchIndexer;

// Export the mock for direct access in tests
module.exports = searchIndexer;
