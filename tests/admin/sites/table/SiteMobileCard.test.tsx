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
  const mockOnDelete = jest.fn();
  
  it('renders site basic information correctly', () => {
    render(
      <SiteMobileCard 
        site={mockSite} 
        onDelete={mockOnDelete} 
      />
    );
    
    // Check if site name and slug are displayed with correct testids
    expect(screen.getByTestId('site-mobile-name-site-123')).toHaveTextContent('Test Site');
    expect(screen.getByTestId('site-mobile-slug-site-123')).toHaveTextContent('test-site');
  });

  it('displays domain information', () => {
    render(
      <SiteMobileCard 
        site={mockSite} 
        onDelete={mockOnDelete} 
      />
    );
    
    // Check if domain is displayed
    expect(screen.getByTestId('site-mobile-domain-0-site-123')).toHaveTextContent('example.com');
  });

  it('renders the full mobile card', () => {
    render(
      <SiteMobileCard 
        site={mockSite} 
        onDelete={mockOnDelete} 
      />
    );
    
    // Check if the full card is rendered with the correct testid
    expect(screen.getByTestId('site-mobile-card-site-123')).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    render(
      <SiteMobileCard 
        site={mockSite} 
        onDelete={mockOnDelete} 
      />
    );
    
    // Check if action buttons are rendered with correct testids
    expect(screen.getByTestId('mobile-view-site-site-123')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-edit-site-site-123')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-delete-site-site-123')).toBeInTheDocument();
  });
});
