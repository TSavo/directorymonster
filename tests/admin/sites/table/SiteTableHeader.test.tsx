import React from 'react';
import { render, screen } from '@testing-library/react';
import { SiteTableHeader } from '@/components/admin/sites/table/SiteTableHeader';

describe('SiteTableHeader Component - Basic Rendering', () => {
  // Mock functions
  const mockOnSearch = jest.fn();
  const mockOnCreateSite = jest.fn();
  
  it('renders search input and create button', () => {
    render(
      <SiteTableHeader 
        searchTerm="" 
        onSearch={mockOnSearch}
        onCreateSite={mockOnCreateSite}
      />
    );
    
    // Check search input and button
    expect(screen.getByTestId('site-table-search')).toBeInTheDocument();
    expect(screen.getByTestId('site-table-create-button')).toBeInTheDocument();
    expect(screen.getByTestId('site-table-create-button')).toHaveTextContent(/create|add/i);
  });

  it('displays the search term in the input', () => {
    render(
      <SiteTableHeader 
        searchTerm="test search" 
        onSearch={mockOnSearch}
        onCreateSite={mockOnCreateSite}
      />
    );
    
    // Check if search input has the correct value
    const searchInput = screen.getByTestId('site-table-search');
    expect(searchInput).toHaveValue('test search');
  });

  it('renders the total count when provided', () => {
    render(
      <SiteTableHeader 
        searchTerm="" 
        onSearch={mockOnSearch}
        onCreateSite={mockOnCreateSite}
        totalSites={42}
      />
    );
    
    // Check if the total count is displayed
    const countElement = screen.getByTestId('site-table-count');
    expect(countElement).toBeInTheDocument();
    expect(countElement).toHaveTextContent('42');
  });
});
