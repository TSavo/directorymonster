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
  
  it('calls onEdit when edit button is clicked', async () => {
    const mockOnEdit = jest.fn();
    const mockOnDelete = jest.fn();
    
    render(
      <TableWrapper>
        <SiteTableRow 
          site={mockSite} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      </TableWrapper>
    );
    
    // Click the edit button
    const editButton = screen.getByTestId('site-edit-button-site-123');
    await user.click(editButton);
    
    // Verify callback was called with correct site ID
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith(mockSite.id);
    
    // Delete callback should not be called
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('calls onDelete when delete button is clicked', async () => {
    const mockOnEdit = jest.fn();
    const mockOnDelete = jest.fn();
    
    render(
      <TableWrapper>
        <SiteTableRow 
          site={mockSite} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      </TableWrapper>
    );
    
    // Click the delete button
    const deleteButton = screen.getByTestId('site-delete-button-site-123');
    await user.click(deleteButton);
    
    // Verify callback was called with correct site ID
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith(mockSite.id);
    
    // Edit callback should not be called
    expect(mockOnEdit).not.toHaveBeenCalled();
  });
});
