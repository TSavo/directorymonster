import React from 'react';
import { render, screen } from '@testing-library/react';
import { SiteMobileCard } from '@/components/admin/sites/table/SiteMobileCard';

describe('SiteMobileCard Component - Basic Rendering', () => {
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
  
  it('renders site basic information correctly', () => {
    render(
      <SiteMobileCard 
        site={mockSite} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );
    
    // Check if site name and slug are displayed
    expect(screen.getByTestId('mobile-site-name')).toHaveTextContent('Test Site');
    expect(screen.getByTestId('mobile-site-slug')).toHaveTextContent('test-site');
  });

  it('displays domain information', () => {
    render(
      <SiteMobileCard 
        site={mockSite} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );
    
    // Check if domain is displayed
    expect(screen.getByTestId('mobile-site-domains')).toHaveTextContent('example.com');
  });

  it('shows status indicator', () => {
    render(
      <SiteMobileCard 
        site={mockSite} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );
    
    // Check if status is displayed
    expect(screen.getByTestId('mobile-site-status')).toHaveTextContent('active');
    
    // Active status should have appropriate styling
    expect(screen.getByTestId('mobile-site-status')).toHaveClass('active', { exact: false });
  });

  it('renders action buttons', () => {
    render(
      <SiteMobileCard 
        site={mockSite} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );
    
    // Check if action buttons are rendered
    expect(screen.getByTestId('mobile-edit-button')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-delete-button')).toBeInTheDocument();
  });
});
