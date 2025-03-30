import React from 'react';
import { render, screen } from '@testing-library/react';
import { SiteTablePagination } from '@/components/admin/sites/table/SiteTablePagination';

describe('SiteTablePagination Component - Basic Rendering', () => {
  // Mock function
  const mockOnPageChange = jest.fn();
  
  it('renders pagination controls', () => {
    render(
      <SiteTablePagination 
        currentPage={2}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );
    
    // Check if previous and next buttons are rendered
    expect(screen.getByTestId('pagination-previous')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-next')).toBeInTheDocument();
    
    // Check if current page indicator is rendered
    const pageIndicator = screen.getByTestId('pagination-current');
    expect(pageIndicator).toBeInTheDocument();
    expect(pageIndicator).toHaveTextContent('2');
    
    // Check if total pages indicator is rendered
    const totalIndicator = screen.getByTestId('pagination-total');
    expect(totalIndicator).toBeInTheDocument();
    expect(totalIndicator).toHaveTextContent('5');
  });

  it('disables previous button on first page', () => {
    render(
      <SiteTablePagination 
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );
    
    // Previous button should be disabled
    const prevButton = screen.getByTestId('pagination-previous');
    expect(prevButton).toBeDisabled();
    
    // Next button should be enabled
    const nextButton = screen.getByTestId('pagination-next');
    expect(nextButton).not.toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(
      <SiteTablePagination 
        currentPage={5}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );
    
    // Next button should be disabled
    const nextButton = screen.getByTestId('pagination-next');
    expect(nextButton).toBeDisabled();
    
    // Previous button should be enabled
    const prevButton = screen.getByTestId('pagination-previous');
    expect(prevButton).not.toBeDisabled();
  });

  it('hides pagination when there is only one page', () => {
    render(
      <SiteTablePagination 
        currentPage={1}
        totalPages={1}
        onPageChange={mockOnPageChange}
      />
    );
    
    // Pagination controls should not be rendered
    expect(screen.queryByTestId('pagination-controls')).not.toBeInTheDocument();
  });
});
