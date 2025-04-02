import React from 'react';
import { render, screen } from '@testing-library/react';
import { SiteTableHeader } from '@/components/admin/sites/table/SiteTableHeader';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode, href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('SiteTableHeader Component - Basic Rendering', () => {
  // Mock functions
  const mockOnSearchChange = jest.fn();

  it('renders search input and create button', () => {
    render(
      <SiteTableHeader
        searchTerm=""
        onSearchChange={mockOnSearchChange}
      />
    );

    // Check search input and button
    expect(screen.getByTestId('site-search-input')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create site/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create site/i })).toHaveTextContent(/create site/i);
  });

  it('displays the search term in the input', () => {
    render(
      <SiteTableHeader
        searchTerm="test search"
        onSearchChange={mockOnSearchChange}
      />
    );

    // Check if search input has the correct value
    const searchInput = screen.getByTestId('site-search-input');
    expect(searchInput).toHaveValue('test search');
  });

  it('allows custom create path', () => {
    render(
      <SiteTableHeader
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        createPath="/admin/sites/custom-new"
      />
    );

    // Check if the create button has the custom path
    const createButton = screen.getByRole('link', { name: /create site/i });
    expect(createButton).toHaveAttribute('href', '/admin/sites/custom-new');
  });
});
