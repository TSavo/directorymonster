/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import the component
import { CategoryTablePagination } from '@/components/admin/categories/components';

describe('CategoryTablePagination Component', () => {
  const defaultProps = {
    currentPage: 2,
    totalPages: 5,
    goToPage: jest.fn(),
    itemsPerPage: 10,
    setItemsPerPage: jest.fn(),
    totalItems: 47
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders with correct current page and total pages', () => {
    render(<CategoryTablePagination {...defaultProps} />);
    
    const pageIndicator = screen.getByTestId('page-indicator');
    expect(pageIndicator).toHaveTextContent('Page 2 of 5');
  });
  
  it('displays correct item range text', () => {
    render(<CategoryTablePagination {...defaultProps} />);
    
    // Current page is 2, items per page is 10, so showing 11-20 of 47
    const statusText = screen.getByTestId('pagination-status');
    expect(statusText).toHaveTextContent('Showing 11 to 20 of 47 categories');
  });
  
  it('handles last page with fewer items correctly', () => {
    const props = {
      ...defaultProps,
      currentPage: 5,
      totalPages: 5
    };
    
    render(<CategoryTablePagination {...props} />);
    
    // Last page should show 41-47 of 47
    const statusText = screen.getByTestId('pagination-status');
    expect(statusText).toHaveTextContent('Showing 41 to 47 of 47 categories');
  });
  
  it('disables previous button on first page', () => {
    const props = {
      ...defaultProps,
      currentPage: 1
    };
    
    render(<CategoryTablePagination {...props} />);
    
    const prevButton = screen.getByTestId('previous-page-button');
    expect(prevButton).toBeDisabled();
    
    // Also verify aria attributes on disabled state
    expect(prevButton).toHaveAttribute('aria-label', 'Previous page');
  });
  
  it('disables next button on last page', () => {
    const props = {
      ...defaultProps,
      currentPage: 5,
      totalPages: 5
    };
    
    render(<CategoryTablePagination {...props} />);
    
    const nextButton = screen.getByTestId('next-page-button');
    expect(nextButton).toBeDisabled();
    
    // Also verify aria attributes on disabled state
    expect(nextButton).toHaveAttribute('aria-label', 'Next page');
  });
  
  it('disables next button when there are no pages', () => {
    const props = {
      ...defaultProps,
      currentPage: 1,
      totalPages: 0,
      totalItems: 0
    };
    
    render(<CategoryTablePagination {...props} />);
    
    const nextButton = screen.getByTestId('next-page-button');
    expect(nextButton).toBeDisabled();
  });
  
  it('calls goToPage with previous page when previous button is clicked', () => {
    render(<CategoryTablePagination {...defaultProps} />);
    
    const prevButton = screen.getByTestId('previous-page-button');
    fireEvent.click(prevButton);
    
    expect(defaultProps.goToPage).toHaveBeenCalledWith(1);
  });
  
  it('calls goToPage with next page when next button is clicked', () => {
    render(<CategoryTablePagination {...defaultProps} />);
    
    const nextButton = screen.getByTestId('next-page-button');
    fireEvent.click(nextButton);
    
    expect(defaultProps.goToPage).toHaveBeenCalledWith(3);
  });
  
  it('calls setItemsPerPage when items per page dropdown changes', () => {
    render(<CategoryTablePagination {...defaultProps} />);
    
    const dropdown = screen.getByTestId('items-per-page-select');
    fireEvent.change(dropdown, { target: { value: '25' } });
    
    expect(defaultProps.setItemsPerPage).toHaveBeenCalledWith(25);
  });
  
  it('renders all available page size options', () => {
    render(<CategoryTablePagination {...defaultProps} />);
    
    const dropdown = screen.getByTestId('items-per-page-select');
    
    // Verify all options are present
    const options = within(dropdown).getAllByRole('option');
    expect(options).toHaveLength(4);
    expect(options[0]).toHaveValue('5');
    expect(options[1]).toHaveValue('10');
    expect(options[2]).toHaveValue('25');
    expect(options[3]).toHaveValue('50');
    
    // Verify the current selection
    expect(dropdown).toHaveValue('10');
  });
  
  it('has proper ARIA attributes for accessibility', () => {
    render(<CategoryTablePagination {...defaultProps} />);
    
    const prevButton = screen.getByTestId('previous-page-button');
    const nextButton = screen.getByTestId('next-page-button');
    const dropdown = screen.getByTestId('items-per-page-select');
    
    expect(prevButton).toHaveAttribute('aria-label', 'Previous page');
    expect(nextButton).toHaveAttribute('aria-label', 'Next page');
    expect(dropdown).toHaveAttribute('aria-label', 'Items per page');
    expect(dropdown).toHaveAttribute('id', 'itemsPerPage');
    
    // Verify label for dropdown is properly connected
    const label = screen.getByText('Show:');
    expect(label).toHaveAttribute('for', 'itemsPerPage');
  });
  
  it('uses responsive layout for mobile and desktop', () => {
    render(<CategoryTablePagination {...defaultProps} />);
    
    const container = screen.getByTestId('pagination-container');
    
    // Check for responsive classes without tight coupling to exact class names
    expect(container.className).toContain('flex-col');
    expect(container.className).toContain('md:flex-row');
  });
  
  it('properly groups navigation elements for usability', () => {
    render(<CategoryTablePagination {...defaultProps} />);
    
    // Verify proper grouping of controls
    const controlsGroup = screen.getByTestId('pagination-controls');
    const itemsPerPageContainer = screen.getByTestId('items-per-page-container');
    
    // Ensure items per page control is within the controls group
    expect(controlsGroup).toContainElement(itemsPerPageContainer);
    
    // Ensure nav buttons and page indicator are within the controls group
    const prevButton = screen.getByTestId('previous-page-button');
    const nextButton = screen.getByTestId('next-page-button');
    const pageIndicator = screen.getByTestId('page-indicator');
    
    expect(controlsGroup).toContainElement(prevButton);
    expect(controlsGroup).toContainElement(nextButton);
    expect(controlsGroup).toContainElement(pageIndicator);
  });
});
