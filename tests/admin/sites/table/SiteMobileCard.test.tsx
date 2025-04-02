import React from 'react';
import { render, screen } from '@testing-library/react';
import { SiteMobileCard } from '@/components/admin/sites/table/SiteMobileCard';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode, href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('SiteMobileCard Component - Basic Rendering', () => {
  // Mock site data
  const mockSite = {
    id: 'site-123',
    name: 'Test Site',
    slug: 'test-site',
    domains: ['example.com'],
    createdAt: '2025-03-30T14:30:00Z',
    updatedAt: '2025-03-30T14:30:00Z'
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

    // Check if site name and slug are displayed
    expect(screen.getByTestId(`site-mobile-name-${mockSite.id}`)).toHaveTextContent('Test Site');
    expect(screen.getByTestId(`site-mobile-slug-${mockSite.id}`)).toHaveTextContent('test-site');
  });

  it('displays domain information', () => {
    render(
      <SiteMobileCard
        site={mockSite}
        onDelete={mockOnDelete}
      />
    );

    // Check if domain is displayed
    expect(screen.getByTestId(`site-mobile-domain-0-${mockSite.id}`)).toHaveTextContent('example.com');
  });

  it('shows created date', () => {
    render(
      <SiteMobileCard
        site={mockSite}
        onDelete={mockOnDelete}
      />
    );

    // Check if created date is displayed
    expect(screen.getByTestId(`site-mobile-created-${mockSite.id}`)).toBeInTheDocument();
    // Since we're using a date formatter, we can't check the exact text content
  });

  it('renders action buttons', () => {
    render(
      <SiteMobileCard
        site={mockSite}
        onDelete={mockOnDelete}
      />
    );

    // Check if action buttons are rendered
    expect(screen.getByRole('link', { name: /edit site/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete site/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view site/i })).toBeInTheDocument();

    // Check delete button has the correct data-testid
    expect(screen.getByTestId(`mobile-delete-site-${mockSite.id}`)).toBeInTheDocument();
  });
});
