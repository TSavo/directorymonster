import React from 'react';
import { render, screen } from '@testing-library/react';
import { SiteTableHeader } from '@/components/admin/sites/table/SiteTableHeader';

describe('SiteTableHeader Component - Basic Rendering', () => {
  // Mock functions
  const mockOnSearchChange = jest.fn();
  
  it('renders search input and create button', () => {
    render(
      <SiteTableHeader 
        searchTerm="" 
        onSearchChange={mockOnSearchChange}
        createPath="/admin/sites/new"
      />
    );
    
    // Check search input and button with correct testids
    expect(screen.getByTestId('site-search-input')).toBeInTheDocument();
    expect(screen.getByTestId('create-site-button')).toBeInTheDocument();
    expect(screen.getByTestId('create-site-button')).toHaveTextContent(/create|add/i);
  });

  it('displays the search term in the input', () => {
    render(
      <SiteTableHeader 
        searchTerm="test search" 
        onSearchChange={mockOnSearchChange}
        createPath="/admin/sites/new"
      />
    );
    
    // Check if search input has the correct value
    const searchInput = screen.getByTestId('site-search-input');
    expect(searchInput).toHaveValue('test search');
  });

  it('verifies the header component is rendered', () => {
    render(
      <SiteTableHeader 
        searchTerm="" 
        onSearchChange={mockOnSearchChange}
        createPath="/admin/sites/new"
      />
    );
    
    // Check if the header container is rendered
    const header = screen.getByTestId('site-table-header');
    expect(header).toBeInTheDocument();
    expect(header.querySelector('h2')).toHaveTextContent('Sites');
  });
});
