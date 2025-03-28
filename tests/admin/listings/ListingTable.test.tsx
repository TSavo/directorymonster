/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ListingTable from '../../../src/components/admin/listings/ListingTable';
import '@testing-library/jest-dom';

// Mock data
const mockListings = [
  {
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
  },
  {
    id: 'listing_2',
    siteId: 'site_1',
    categoryId: 'category_2',
    title: 'Test Listing 2',
    slug: 'test-listing-2',
    metaDescription: 'This is test listing 2',
    content: 'Content for test listing 2',
    backlinkUrl: 'https://example.org',
    backlinkAnchorText: 'Another Link',
    backlinkPosition: 'footer' as const,
    backlinkType: 'nofollow' as const,
    customFields: {},
    createdAt: Date.now() - 172800000, // 2 days ago
    updatedAt: Date.now() - 7200000,   // 2 hours ago
    categoryName: 'Another Category',
    siteName: 'Test Site'
  }
];

// Mock the fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockListings),
  })
) as jest.Mock;

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock next/link
jest.mock('next/link', () => {
  // eslint-disable-next-line react/display-name
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('ListingTable Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders loading state initially when no data is provided', () => {
    render(<ListingTable />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading listings data, please wait...', { selector: '.sr-only' })).toBeInTheDocument();
  });
  
  it('renders the table with provided listings data', () => {
    render(<ListingTable initialListings={mockListings} />);
    
    expect(screen.getByText('Listings (2)')).toBeInTheDocument();
    expect(screen.getByText('Test Listing 1')).toBeInTheDocument();
    expect(screen.getByText('Test Listing 2')).toBeInTheDocument();
  });
  
  it('handles search filtering correctly', () => {
    render(<ListingTable initialListings={mockListings} />);
    
    // Get the search input
    const searchInput = screen.getByPlaceholderText('Search listings...');
    
    // Type in the search box
    fireEvent.change(searchInput, { target: { value: 'Listing 1' } });
    
    // Should show only the first listing
    expect(screen.getByText('Test Listing 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Listing 2')).not.toBeInTheDocument();
    
    // Clear the search
    fireEvent.change(searchInput, { target: { value: '' } });
    
    // Should show both listings again
    expect(screen.getByText('Test Listing 1')).toBeInTheDocument();
    expect(screen.getByText('Test Listing 2')).toBeInTheDocument();
  });
  
  it('changes sort order when clicking on column headers', () => {
    render(<ListingTable initialListings={mockListings} />);
    
    // Find the Title column header button
    const titleHeader = screen.getByRole('button', { name: /Sort by title/i });
    
    // Click to sort by title
    fireEvent.click(titleHeader);
    
    // The listings should be sorted by title in ascending order
    const rows = screen.getAllByRole('row').slice(1); // Skip header row
    expect(rows[0]).toHaveTextContent('Test Listing 1');
    expect(rows[1]).toHaveTextContent('Test Listing 2');
    
    // Click again to change sort direction
    fireEvent.click(titleHeader);
    
    // Check for new aria-label to confirm sort direction changed
    expect(titleHeader).toHaveAccessibleName(/Sort by title \(currently sorted desc\)/i);
  });
  
  it('displays an empty state when there are no listings', () => {
    render(<ListingTable initialListings={[]} />);
    
    expect(screen.getByText('No listings found.')).toBeInTheDocument();
    expect(screen.getByText('Create your first listing')).toBeInTheDocument();
  });
  
  it('displays an error state when fetch fails', async () => {
    // Mock a failed fetch
    (global.fetch as jest.Mock).mockImplementationOnce(() => Promise.reject('API error'));
    
    render(<ListingTable />);
    
    // Wait for the error state to appear
    await waitFor(() => {
      expect(screen.getByText('Error Loading Listings')).toBeInTheDocument();
    });
    
    expect(screen.getByRole('button', { name: 'Retry loading listings' })).toBeInTheDocument();
  });
  
  it('shows delete confirmation dialog when delete is clicked', async () => {
    render(<ListingTable initialListings={mockListings} />);
    
    // Find and click the delete button for first listing
    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
    fireEvent.click(deleteButtons[0]);
    
    // Wait for the dialog to appear
    await waitFor(() => {
      expect(screen.getByText('Are you sure you want to delete')).toBeInTheDocument();
    });
    
    // Check for confirmation and cancel buttons
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });
});
