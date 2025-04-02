import React from 'react';
import { render, screen } from '@testing-library/react';
import { SiteTablePagination } from '@/components/admin/sites/table/SiteTablePagination';

describe('SiteTablePagination Component - Basic Rendering', () => {
  // Mock functions
  const mockOnPageChange = jest.fn();
  const mockOnPageSizeChange = jest.fn();

  it('renders pagination controls', () => {
    render(
      <SiteTablePagination
        currentPage={2}
        totalItems={50}
        pageSize={10}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />
    );

    // Check if previous and next buttons are rendered
    expect(screen.getByTestId('previous-page-button')).toBeInTheDocument();
    expect(screen.getByTestId('next-page-button')).toBeInTheDocument();

    // Check if page buttons are rendered
    expect(screen.getByTestId('page-button-2')).toBeInTheDocument();
    expect(screen.getByTestId('page-button-2')).toHaveAttribute('aria-current', 'page');

    // Check if page size selector is rendered
    expect(screen.getByTestId('page-size-select')).toBeInTheDocument();
  });

  it('disables previous button on first page', () => {
    render(
      <SiteTablePagination
        currentPage={1}
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

  it('shows correct item range information', () => {
    render(
      <SiteTablePagination
        currentPage={2}
        totalItems={25}
        pageSize={10}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />
    );

    // Should show "Showing 11 to 20 of 25 sites"
    const paginationText = screen.getByText(/showing/i);
    expect(paginationText).toBeInTheDocument();
    expect(paginationText.textContent).toMatch(/11.*to.*20.*of.*25/i);
  });
});
