import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteTableRow } from '@/components/admin/sites/table/SiteTableRow';

// Create a wrapper to provide tbody context
const TableWrapper = ({ children }: { children: React.ReactNode }) => (
  <table>
    <tbody>
      {children}
    </tbody>
  </table>
);

// Mock site data
const mockSite = {
  id: 'site-123',
  name: 'Test Site',
  slug: 'test-site',
  domains: ['example.com'],
  lastModified: '2025-03-30T14:30:00Z',
  status: 'active'
};

describe('SiteTableRow Component - Interaction', () => {
  // Setup test user for interactions
  const user = userEvent.setup();

  it('calls onDelete when delete button is clicked', async () => {
    const mockOnDelete = jest.fn();

    render(
      <TableWrapper>
        <SiteTableRow
          site={mockSite}
          onDelete={mockOnDelete}
        />
      </TableWrapper>
    );

    // Click the delete button
    const deleteButton = screen.getByTestId(`delete-site-${mockSite.id}`);
    await user.click(deleteButton);

    // Verify callback was called with correct site ID
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith(mockSite.id);
  });

  it('navigates to edit page when edit button is clicked', async () => {
    // We can't fully test navigation in this unit test, but we can verify the link
    const mockOnDelete = jest.fn();

    render(
      <TableWrapper>
        <SiteTableRow
          site={mockSite}
          onDelete={mockOnDelete}
        />
      </TableWrapper>
    );

    // Check that the edit button has the correct href
    const editButton = screen.getByTestId(`edit-site-${mockSite.id}`);
    expect(editButton).toHaveAttribute('href', `/admin/sites/${mockSite.id}/edit`);
  });

  it('navigates to view page when view button is clicked', async () => {
    // We can't fully test navigation in this unit test, but we can verify the link
    const mockOnDelete = jest.fn();

    render(
      <TableWrapper>
        <SiteTableRow
          site={mockSite}
          onDelete={mockOnDelete}
        />
      </TableWrapper>
    );

    // Check that the view button has the correct href
    const viewButton = screen.getByTestId(`view-site-${mockSite.id}`);
    expect(viewButton).toHaveAttribute('href', `/admin/sites/${mockSite.id}`);
  });
});
