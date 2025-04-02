import React from 'react';
import { render, screen } from '@testing-library/react';
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

// Mock functions
const mockOnDelete = jest.fn();

describe('SiteTableRow Component - Basic Rendering', () => {
  it('renders site data in the correct cells', () => {
    render(
      <TableWrapper>
        <SiteTableRow
          site={mockSite}
          onDelete={mockOnDelete}
        />
      </TableWrapper>
    );

    // Check if basic site data is displayed
    expect(screen.getByTestId(`site-name-${mockSite.id}`)).toHaveTextContent('Test Site');
    expect(screen.getByTestId(`site-slug-${mockSite.id}`)).toHaveTextContent('test-site');

    // Check for domains list
    const domainElement = screen.getByTestId(`site-domain-0-${mockSite.id}`);
    expect(domainElement).toBeInTheDocument();
    expect(domainElement).toHaveTextContent('example.com');
  });

  it('includes action buttons with correct attributes', () => {
    render(
      <TableWrapper>
        <SiteTableRow
          site={mockSite}
          onDelete={mockOnDelete}
        />
      </TableWrapper>
    );

    // Verify action buttons
    const viewButton = screen.getByTestId(`view-site-${mockSite.id}`);
    const editButton = screen.getByTestId(`edit-site-${mockSite.id}`);
    const deleteButton = screen.getByTestId(`delete-site-${mockSite.id}`);

    expect(viewButton).toBeInTheDocument();
    expect(editButton).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();

    // Check for accessible titles
    expect(viewButton).toHaveAttribute('title', 'View Site');
    expect(editButton).toHaveAttribute('title', 'Edit Site');
    expect(deleteButton).toHaveAttribute('title', 'Delete Site');
  });
});
