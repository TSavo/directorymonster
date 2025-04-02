import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteTableHeader } from '@/components/admin/sites/table/SiteTableHeader';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode, href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('SiteTableHeader Component - Interaction', () => {
  // Setup test user for interactions
  const user = userEvent.setup();

  it('calls onSearchChange when search input changes', async () => {
    const mockOnSearchChange = jest.fn();

    render(
      <SiteTableHeader
        searchTerm=""
        onSearchChange={mockOnSearchChange}
      />
    );

    // Type in the search input
    const searchInput = screen.getByTestId('site-search-input');
    await user.type(searchInput, 'test search');

    // Verify callback was called with the change event
    expect(mockOnSearchChange).toHaveBeenCalled();
  });

  it('has a create button with the correct href', async () => {
    render(
      <SiteTableHeader
        searchTerm=""
        onSearchChange={jest.fn()}
      />
    );

    // Check the create button
    const createButton = screen.getByRole('link', { name: /create site/i });
    expect(createButton).toBeInTheDocument();
    expect(createButton).toHaveAttribute('href', '/admin/sites/new');
  });

  it('allows custom create path', async () => {
    render(
      <SiteTableHeader
        searchTerm=""
        onSearchChange={jest.fn()}
        createPath="/admin/sites/custom-new"
      />
    );

    // Check the create button has the custom path
    const createButton = screen.getByRole('link', { name: /create site/i });
    expect(createButton).toHaveAttribute('href', '/admin/sites/custom-new');
  });
});
