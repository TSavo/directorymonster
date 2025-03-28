/**
 * @jest-environment jsdom
 */
import * as searchExports from '../../src/components/search';

describe('Search Component Exports', () => {
  it('exports all search components correctly', () => {
    // Verify that all components are exported
    expect(searchExports.SearchForm).toBeDefined();
    expect(searchExports.SearchResults).toBeDefined();
    expect(searchExports.SearchBar).toBeDefined();
    expect(searchExports.SearchIcon).toBeDefined();
    
    // Verify that there are no unexpected exports
    const exportKeys = Object.keys(searchExports);
    expect(exportKeys).toHaveLength(4);
    expect(exportKeys).toEqual(
      expect.arrayContaining(['SearchForm', 'SearchResults', 'SearchBar', 'SearchIcon'])
    );
  });
});
