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
    expect(screen.getByTestId('site-domains-site-123')).toHaveTextContent('example.com');
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
    
    // Verify action buttons
    const editButton = screen.getByTestId('site-edit-button-site-123');
    const deleteButton = screen.getByTestId('site-delete-button-site-123');
    
    expect(editButton).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();
    
    // Check for accessible names/labels
    expect(editButton).toHaveAttribute('aria-label', expect.stringContaining('Edit'));
    expect(deleteButton).toHaveAttribute('aria-label', expect.stringContaining('Delete'));
  });
});
