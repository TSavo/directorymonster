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
const mockOnEdit = jest.fn();
const mockOnDelete = jest.fn();

describe('SiteTableRow Component - Basic Rendering', () => {
  it('renders site data in the correct cells', () => {
    render(
      <TableWrapper>
        <SiteTableRow 
          site={mockSite} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      </TableWrapper>
    );
    
    // Check if basic site data is displayed
    expect(screen.getByTestId('site-name-site-123')).toHaveTextContent('Test Site');
    expect(screen.getByTestId('site-slug-site-123')).toHaveTextContent('test-site');
    // Using the correct testid for domain list item
    expect(screen.getByTestId('site-domain-0-site-123')).toHaveTextContent('example.com');
  });

  it('includes action buttons with correct attributes', () => {
    render(
      <TableWrapper>
        <SiteTableRow 
          site={mockSite} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      </TableWrapper>
    );
    
    // Verify action buttons with correct testids
    const editButton = screen.getByTestId('edit-site-site-123');
    const deleteButton = screen.getByTestId('delete-site-site-123');
    
    expect(editButton).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();
    
    // Check for accessible names/labels - using title which is what the component actually uses
    expect(editButton).toHaveAttribute('title', expect.stringContaining('Edit'));
    expect(deleteButton).toHaveAttribute('title', expect.stringContaining('Delete'));
  });
});
