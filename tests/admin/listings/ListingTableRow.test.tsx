/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ListingTableRow } from '@/components/admin/listings/components';
import '@testing-library/jest-dom';

// Mock next/link
jest.mock('next/link', () => {
  // eslint-disable-next-line react/display-name
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('ListingTableRow Component', () => {
  const mockListing = {
    id: 'listing_1',
    siteId: 'site_1',
    categoryId: 'category_1',
    title: 'Test Listing 1',
    slug: 'test-listing-1',
    metaDescription: 'This is test listing 1',
    content: 'Content for test listing 1',
    backlinkUrl: 'https://example.com',
    backlinkAnchorText: 'Example Link',
    backlinkPosition: 'body' as const,
    backlinkType: 'dofollow' as const,
    backlinkVerifiedAt: Date.now(),
    customFields: {},
    createdAt: Date.now() - 86400000, // 1 day ago
    updatedAt: Date.now() - 3600000,  // 1 hour ago
    categoryName: 'Test Category',
    siteName: 'Test Site'
  };
  
  // Helper function to render the component inside a table context
  const renderWithTableContext = (ui: React.ReactElement) => {
    return render(
      <table>
        <tbody>
          {ui}
        </tbody>
      </table>
    );
  };
  
  it('renders the listing title correctly', () => {
    renderWithTableContext(
      <ListingTableRow 
        listing={mockListing} 
        showSiteColumn={false} 
        onDeleteClick={jest.fn()} 
      />
    );
    
    expect(screen.getByText('Test Listing 1')).toBeInTheDocument();
  });
  
  it('renders the category name correctly', () => {
    renderWithTableContext(
      <ListingTableRow 
        listing={mockListing} 
        showSiteColumn={false} 
        onDeleteClick={jest.fn()} 
      />
    );
    
    expect(screen.getByText('Test Category')).toBeInTheDocument();
  });
  
  it('shows site column when showSiteColumn is true', () => {
    renderWithTableContext(
      <ListingTableRow 
        listing={mockListing} 
        showSiteColumn={true} 
        onDeleteClick={jest.fn()} 
      />
    );
    
    expect(screen.getByText('Test Site')).toBeInTheDocument();
  });
  
  it('hides site column when showSiteColumn is false', () => {
    renderWithTableContext(
      <ListingTableRow 
        listing={mockListing} 
        showSiteColumn={false} 
        onDeleteClick={jest.fn()} 
      />
    );
    
    expect(screen.queryByText('Test Site')).not.toBeInTheDocument();
  });
  
  it('displays verified status badge when backlinkVerifiedAt is set', () => {
    renderWithTableContext(
      <ListingTableRow 
        listing={mockListing} 
        showSiteColumn={false} 
        onDeleteClick={jest.fn()} 
      />
    );
    
    const verifiedBadge = screen.getByText(/Verified/);
    expect(verifiedBadge).toBeInTheDocument();
    expect(verifiedBadge).toHaveClass('bg-green-100 text-green-800');
  });
  
  it('displays unverified status badge when backlinkVerifiedAt is not set', () => {
    const unverifiedListing = { 
      ...mockListing, 
      backlinkVerifiedAt: undefined 
    };
    
    renderWithTableContext(
      <ListingTableRow 
        listing={unverifiedListing} 
        showSiteColumn={false} 
        onDeleteClick={jest.fn()} 
      />
    );
    
    const unverifiedBadge = screen.getByText('Unverified');
    expect(unverifiedBadge).toBeInTheDocument();
    expect(unverifiedBadge).toHaveClass('bg-yellow-100 text-yellow-800');
  });
  
  it('renders action buttons with correct URLs', () => {
    renderWithTableContext(
      <ListingTableRow 
        listing={mockListing} 
        showSiteColumn={false} 
        onDeleteClick={jest.fn()} 
      />
    );
    
    // Check that View and Edit links exist
    const viewLink = screen.getByRole('link', { name: /View/i });
    const editLink = screen.getByRole('link', { name: /Edit/i });
    
    expect(viewLink).toBeInTheDocument();
    expect(editLink).toBeInTheDocument();
    
    // Check URLs without siteSlug
    expect(viewLink).toHaveAttribute('href', `/admin/listings/${mockListing.id}`);
    
    // Check Delete button exists
    const deleteButton = screen.getByRole('button', { name: /Delete/i });
    expect(deleteButton).toBeInTheDocument();
  });
  
  it('uses site-specific URLs when siteSlug is provided', () => {
    renderWithTableContext(
      <ListingTableRow 
        listing={mockListing} 
        showSiteColumn={false} 
        siteSlug="test-site"
        onDeleteClick={jest.fn()} 
      />
    );
    
    const viewLink = screen.getByRole('link', { name: /View/i });
    
    // Check URL with siteSlug
    expect(viewLink).toHaveAttribute('href', `/admin/test-site/listings/${mockListing.slug}`);
  });
});
