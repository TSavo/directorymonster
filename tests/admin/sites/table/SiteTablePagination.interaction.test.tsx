import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteTablePagination } from '@/components/admin/sites/table/SiteTablePagination';

describe('SiteTablePagination Component - Interaction', () => {
  // Setup test user for interactions
  const user = userEvent.setup();
  
  it('calls onPageChange with next page when next button is clicked', async () => {
    const mockOnPageChange = jest.fn();
    
    render(
      <SiteTablePagination 
        currentPage={2}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );
    
    // Click the next button
    const nextButton = screen.getByTestId('pagination-next');
    await user.click(nextButton);
    
    // Verify callback was called with next page number
    expect(mockOnPageChange).toHaveBeenCalledTimes(1);
    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  it('calls onPageChange with previous page when previous button is clicked', async () => {
    const mockOnPageChange = jest.fn();
    
    render(
      <SiteTablePagination 
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );
    
    // Click the previous button
    const prevButton = screen.getByTestId('pagination-previous');
    await user.click(prevButton);
    
    // Verify callback was called with previous page number
    expect(mockOnPageChange).toHaveBeenCalledTimes(1);
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('does not call onPageChange when disabled buttons are clicked', async () => {
    const mockOnPageChange = jest.fn();
    
    render(
      <SiteTablePagination 
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );
    
    // Try to click the disabled previous button
    const prevButton = screen.getByTestId('pagination-previous');
    await user.click(prevButton);
    
    // Verify callback was not called
    expect(mockOnPageChange).not.toHaveBeenCalled();
    
    // Reset mock and render last page
    mockOnPageChange.mockReset();
    
    render(
      <SiteTablePagination 
        currentPage={5}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );
    
    // Try to click the disabled next button
    const nextButton = screen.getByTestId('pagination-next');
    await user.click(nextButton);
    
    // Verify callback was not called
    expect(mockOnPageChange).not.toHaveBeenCalled();
  });

  it('supports keyboard navigation', async () => {
    const mockOnPageChange = jest.fn();
    
    render(
      <SiteTablePagination 
        currentPage={2}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );
    
    // Tab to the previous button
    await user.tab();
    expect(screen.getByTestId('pagination-previous')).toHaveFocus();
    
    // Press Enter to click
    await user.keyboard('{Enter}');
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
    
    // Reset mock
    mockOnPageChange.mockReset();
    
    // Tab to the next button
    await user.tab();
    expect(screen.getByTestId('pagination-next')).toHaveFocus();
    
    // Press Space to click
    await user.keyboard(' ');
    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });
});
