import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteTablePagination } from '@/components/admin/sites/table/SiteTablePagination';

describe('SiteTablePagination Component - Interaction', () => {
  // Setup test user for interactions
  const user = userEvent.setup();
  const mockOnPageSizeChange = jest.fn();

  it('calls onPageChange with next page when next button is clicked', async () => {
    const mockOnPageChange = jest.fn();

    render(
      <SiteTablePagination
        currentPage={2}
        totalItems={50}
        pageSize={10}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />
    );

    // Click the next button
    const nextButton = screen.getByTestId('next-page-button');
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
        totalItems={50}
        pageSize={10}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />
    );

    // Click the previous button
    const prevButton = screen.getByTestId('previous-page-button');
    await user.click(prevButton);

    // Verify callback was called with previous page number
    expect(mockOnPageChange).toHaveBeenCalledTimes(1);
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('does not call onPageChange when disabled buttons are clicked', async () => {
    const mockOnPageChange = jest.fn();

    const { unmount } = render(
      <SiteTablePagination
        currentPage={1}
        totalItems={50}
        pageSize={10}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />
    );

    // Try to click the disabled previous button
    const prevButton = screen.getByTestId('previous-page-button');
    await user.click(prevButton);

    // Verify callback was not called
    expect(mockOnPageChange).not.toHaveBeenCalled();

    // Clean up the first render
    unmount();

    // Reset mock and render last page
    mockOnPageChange.mockReset();

    render(
      <SiteTablePagination
        currentPage={5}
        totalItems={50}
        pageSize={10}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />
    );

    // Try to click the disabled next button
    const nextButton = screen.getAllByTestId('next-page-button')[0];
    await user.click(nextButton);

    // Verify callback was not called
    expect(mockOnPageChange).not.toHaveBeenCalled();
  });

  it('calls onPageChange when page buttons are clicked', async () => {
    const mockOnPageChange = jest.fn();

    render(
      <SiteTablePagination
        currentPage={2}
        totalItems={50}
        pageSize={10}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />
    );

    // Click on page 3 button
    const page3Button = screen.getByTestId('page-button-3');
    await user.click(page3Button);

    // Verify callback was called with correct page number
    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  it('calls onPageSizeChange when page size selector is changed', async () => {
    const mockOnPageChange = jest.fn();
    const mockOnPageSizeChange = jest.fn();

    render(
      <SiteTablePagination
        currentPage={1}
        totalItems={50}
        pageSize={10}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />
    );

    // Change the page size selector
    const pageSizeSelect = screen.getByTestId('page-size-select');
    await user.selectOptions(pageSizeSelect, '25');

    // Verify callback was called with new page size
    expect(mockOnPageSizeChange).toHaveBeenCalledTimes(1);
    expect(mockOnPageSizeChange).toHaveBeenCalledWith(25);
  });
});
