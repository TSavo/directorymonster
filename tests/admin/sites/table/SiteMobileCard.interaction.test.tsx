import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteMobileCard } from '@/components/admin/sites/table/SiteMobileCard';

describe('SiteMobileCard Component - Interaction', () => {
  // Setup test user for interactions
  const user = userEvent.setup();

  // Mock site data
  const mockSite = {
    id: 'site-123',
    name: 'Test Site',
    slug: 'test-site',
    domains: ['example.com'],
    lastModified: '2025-03-30T14:30:00Z',
    status: 'active'
  };

  it('calls onEdit when edit button is clicked', async () => {
    const mockOnEdit = jest.fn();
    const mockOnDelete = jest.fn();

    render(
      <SiteMobileCard
        site={mockSite}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Click the edit button
    const editButton = screen.getByTestId('mobile-edit-site-site-123');
    await user.click(editButton);

    // Verify callback was called with site ID
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith(mockSite.id);

    // Delete callback should not be called
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('calls onDelete when delete button is clicked', async () => {
    const mockOnEdit = jest.fn();
    const mockOnDelete = jest.fn();

    render(
      <SiteMobileCard
        site={mockSite}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Click the delete button
    const deleteButton = screen.getByTestId('mobile-delete-site-site-123');
    await user.click(deleteButton);

    // Verify callback was called with site ID
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith(mockSite.id);

    // Edit callback should not be called
    expect(mockOnEdit).not.toHaveBeenCalled();
  });

  it('expands/collapses details when card is clicked', async () => {
    const mockOnEdit = jest.fn();
    const mockOnDelete = jest.fn();

    render(
      <SiteMobileCard
        site={mockSite}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Initially, detailed info should be hidden
    expect(screen.queryByTestId('mobile-site-details')).not.toBeInTheDocument();

    // Click the card to expand
    const card = screen.getByTestId('site-mobile-card-site-123');
    await user.click(card);

    // Detailed info should now be visible
    expect(screen.getByTestId('mobile-site-details')).toBeInTheDocument();

    // Click again to collapse
    await user.click(card);

    // Detailed info should be hidden again
    expect(screen.queryByTestId('mobile-site-details')).not.toBeInTheDocument();
  });
});
