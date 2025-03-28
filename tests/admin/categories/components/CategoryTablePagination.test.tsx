/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import the component
import { CategoryTablePagination } from '../../../../src/components/admin/categories/components';

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
    
    expect(screen.getByText('Page 2 of 5')).toBeInTheDocument();
  });
  
  it('displays correct item range text', () => {
    render(<CategoryTablePagination {...defaultProps} />);
    
    // Current page is 2, items per page is 10, so showing 11-20 of 47
    expect(screen.getByText('Showing 11 to 20 of 47 categories')).toBeInTheDocument();
  });
  
  it('handles last page with fewer items correctly', () => {
    const props = {
      ...defaultProps,
      currentPage: 5,
      totalPages: 5
    };
    
    render(<CategoryTablePagination {...props} />);
    
    // Last page should show 41-47 of 47
    expect(screen.getByText('Showing 41 to 47 of 47 categories')).toBeInTheDocument();
  });
  
  it('disables previous button on first page', () => {
    const props = {
      ...defaultProps,
      currentPage: 1
    };
    
    render(<CategoryTablePagination {...props} />);
    
    const prevButton = screen.getByRole('button', { name: 'Previous page' });
    expect(prevButton).toBeDisabled();
  });
  
  it('disables next button on last page', () => {
    const props = {
      ...defaultProps,
      currentPage: 5,
      totalPages: 5
    };
    
    render(<CategoryTablePagination {...props} />);
    
    const nextButton = screen.getByRole('button', { name: 'Next page' });
    expect(nextButton).toBeDisabled();
  });
  
  it('calls goToPage with previous page when previous button is clicked', () => {
    render(<CategoryTablePagination {...defaultProps} />);
    
    const prevButton = screen.getByRole('button', { name: 'Previous page' });
    fireEvent.click(prevButton);
    
    expect(defaultProps.goToPage).toHaveBeenCalledWith(1);
  });
  
  it('calls goToPage with next page when next button is clicked', () => {
    render(<CategoryTablePagination {...defaultProps} />);
    
    const nextButton = screen.getByRole('button', { name: 'Next page' });
    fireEvent.click(nextButton);
    
    expect(defaultProps.goToPage).toHaveBeenCalledWith(3);
  });
  
  it('calls setItemsPerPage when items per page dropdown changes', () => {
    render(<CategoryTablePagination {...defaultProps} />);
    
    const dropdown = screen.getByRole('combobox', { name: 'Items per page' });
    fireEvent.change(dropdown, { target: { value: '25' } });
    
    expect(defaultProps.setItemsPerPage).toHaveBeenCalledWith(25);
  });
  
  it('has proper ARIA attributes for accessibility', () => {
    render(<CategoryTablePagination {...defaultProps} />);
    
    const prevButton = screen.getByRole('button', { name: 'Previous page' });
    const nextButton = screen.getByRole('button', { name: 'Next page' });
    const dropdown = screen.getByRole('combobox', { name: 'Items per page' });
    
    expect(prevButton).toHaveAttribute('aria-label', 'Previous page');
    expect(nextButton).toHaveAttribute('aria-label', 'Next page');
    expect(dropdown).toHaveAttribute('aria-label', 'Items per page');
  });
  
  it('uses responsive layout for mobile and desktop', () => {
    render(<CategoryTablePagination {...defaultProps} />);
    
    const container = screen.getByText('Page 2 of 5').closest('div')?.parentElement;
    expect(container).toHaveClass('flex-col md:flex-row');
  });
});
