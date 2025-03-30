import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteTableHeader } from '@/components/admin/sites/table/SiteTableHeader';

describe('SiteTableHeader Component - Interaction', () => {
  // Setup test user for interactions
  const user = userEvent.setup();
  
  it('calls onSearch when search input changes', async () => {
    const mockOnSearch = jest.fn();
    const mockOnCreateSite = jest.fn();
    
    render(
      <SiteTableHeader 
        searchTerm="" 
        onSearch={mockOnSearch}
        onCreateSite={mockOnCreateSite}
      />
    );
    
    // Type in the search input
    const searchInput = screen.getByTestId('site-table-search');
    await user.type(searchInput, 'test search');
    
    // Verify callback was called with the search term
    expect(mockOnSearch).toHaveBeenCalledWith('test search');
  });

  it('calls onCreateSite when create button is clicked', async () => {
    const mockOnSearch = jest.fn();
    const mockOnCreateSite = jest.fn();
    
    render(
      <SiteTableHeader 
        searchTerm="" 
        onSearch={mockOnSearch}
        onCreateSite={mockOnCreateSite}
      />
    );
    
    // Click the create button
    const createButton = screen.getByTestId('site-table-create-button');
    await user.click(createButton);
    
    // Verify callback was called
    expect(mockOnCreateSite).toHaveBeenCalledTimes(1);
  });

  it('has a clear button that resets search when clicked', async () => {
    const mockOnSearch = jest.fn();
    const mockOnCreateSite = jest.fn();
    
    render(
      <SiteTableHeader 
        searchTerm="existing search" 
        onSearch={mockOnSearch}
        onCreateSite={mockOnCreateSite}
      />
    );
    
    // Check if clear button exists and click it
    const clearButton = screen.getByTestId('site-table-search-clear');
    await user.click(clearButton);
    
    // Verify callback was called with empty string
    expect(mockOnSearch).toHaveBeenCalledWith('');
  });
});
