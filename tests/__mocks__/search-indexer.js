/**
 * Search Indexer Mock for Tests
 */

const searchIndexerMock = {
  // Listing operations
  indexListing: jest.fn(() => Promise.resolve(true)),
  updateListing: jest.fn(() => Promise.resolve(true)),
  deleteListing: jest.fn(() => Promise.resolve(true)),
  
  // Category operations
  indexCategory: jest.fn(() => Promise.resolve(true)),
  updateCategory: jest.fn(() => Promise.resolve(true)),
  deleteCategory: jest.fn(() => Promise.resolve(true)),
  
  // Site operations
  indexSite: jest.fn(() => Promise.resolve(true)),
  updateSite: jest.fn(() => Promise.resolve(true)),
  deleteSite: jest.fn(() => Promise.resolve(true)),
  
  // Search operations
  search: jest.fn(() => Promise.resolve({
    results: [],
    pagination: {
      totalResults: 0,
      totalPages: 0,
      currentPage: 1,
      limit: 10
    }
  })),
  
  // Helper to reset the mock state
  __resetMock: () => {
    Object.values(searchIndexerMock).forEach(fn => {
      if (typeof fn === 'function' && fn.mockClear) {
        fn.mockClear();
      }
    });
  }
};

module.exports = searchIndexerMock;
