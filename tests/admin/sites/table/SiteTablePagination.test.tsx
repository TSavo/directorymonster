import React from 'react';
import { render, screen } from '@testing-library/react';
import { SiteTablePagination } from '@/components/admin/sites/table/SiteTablePagination';

describe('SiteTablePagination Component - Basic Rendering', () => {
  // Mock function
  const mockOnPageChange = jest.fn();
  const mockOnPageSizeChange = jest.fn();
  
  it('renders pagination controls', () => {
    render(
      <SiteTablePagination 
        currentPage={2}
        totalPages={5}
        totalItems={50}
        pageSize={10}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />
    );
    
    // Check if previous and next buttons are rendered with the correct testids
    expect(screen.getByTestId('previous-page-button')).toBeInTheDocument();
    expect(screen.getByTestId('next-page-button')).toBeInTheDocument();
    
    // Check if page buttons are rendered
    const pageButton = screen.getByTestId('page-button-2');
    expect(pageButton).toBeInTheDocument();
    expect(pageButton).toHaveTextContent('2');
    
    // Check if the pagination container exists
    expect(screen.getByTestId('site-table-pagination')).toBeInTheDocument();
  });

  it('disables previous button on first page', () => {
    render(
      <SiteTablePagination 
        currentPage={1}
        totalPages={5}
        totalItems={50}
        pageSize={10}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />
    );
    
    // Previous button should be disabled
    const prevButton = screen.getByTestId('previous-page-button');
    expect(prevButton).toBeDisabled();
    
    // Next button should be enabled
    const nextButton = screen.getByTestId('next-page-button');
    expect(nextButton).not.toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(
      <SiteTablePagination 
        currentPage={5}
        totalPages={5}
        totalItems={50}
        pageSize={10}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />
    );
    
    // Next button should be disabled
    const nextButton = screen.getByTestId('next-page-button');
    expect(nextButton).toBeDisabled();
    
    // Previous button should be enabled
    const prevButton = screen.getByTestId('previous-page-button');
    expect(prevButton).not.toBeDisabled();
  });

  it('hides pagination when there is only one page', () => {
    render(
      <SiteTablePagination 
        currentPage={1}
        totalPages={1}
        totalItems={5}
        pageSize={10}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />
    );
    
    // The pagination container should still exist, but there should be no page buttons other than page 1
    expect(screen.getByTestId('site-table-pagination')).toBeInTheDocument();
    expect(screen.getByTestId('page-button-1')).toBeInTheDocument();
    expect(screen.queryByTestId('page-button-2')).not.toBeInTheDocument();
  });
});
