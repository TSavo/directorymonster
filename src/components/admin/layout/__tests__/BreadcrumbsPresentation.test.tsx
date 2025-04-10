import React from 'react';
import { render, screen } from '@testing-library/react';
import { BreadcrumbsPresentation } from '../BreadcrumbsPresentation';

// Mock the ChevronRightIcon
jest.mock('../icons', () => ({
  ChevronRightIcon: () => <span data-testid="chevron-icon">></span>
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ href, children, className, 'aria-current': ariaCurrent }) => (
    <a 
      href={href} 
      className={className} 
      aria-current={ariaCurrent}
      data-testid={`link-to-${href}`}
    >
      {children}
    </a>
  );
});

describe('BreadcrumbsPresentation', () => {
  const mockBreadcrumbItems = [
    { href: '/admin', label: 'Admin' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/users/123', label: '123' }
  ];

  it('renders the Admin link', () => {
    render(<BreadcrumbsPresentation breadcrumbItems={mockBreadcrumbItems} />);
    
    const adminLink = screen.getByTestId('link-to-/admin');
    expect(adminLink).toBeInTheDocument();
    expect(adminLink).toHaveTextContent('Admin');
  });

  it('renders all breadcrumb items except the first one (Admin)', () => {
    render(<BreadcrumbsPresentation breadcrumbItems={mockBreadcrumbItems} />);
    
    // Check that we have the correct number of links (Admin + 2 more)
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);
    
    // Check that the Users link is rendered
    const usersLink = screen.getByTestId('link-to-/admin/users');
    expect(usersLink).toBeInTheDocument();
    expect(usersLink).toHaveTextContent('Users');
    
    // Check that the 123 link is rendered
    const userDetailLink = screen.getByTestId('link-to-/admin/users/123');
    expect(userDetailLink).toBeInTheDocument();
    expect(userDetailLink).toHaveTextContent('123');
  });

  it('renders chevron icons between breadcrumb items', () => {
    render(<BreadcrumbsPresentation breadcrumbItems={mockBreadcrumbItems} />);
    
    // We should have 2 chevron icons (one for each item after Admin)
    const chevrons = screen.getAllByTestId('chevron-icon');
    expect(chevrons).toHaveLength(2);
  });

  it('marks the last item as current page', () => {
    render(<BreadcrumbsPresentation breadcrumbItems={mockBreadcrumbItems} />);
    
    // The last link should have aria-current="page"
    const lastLink = screen.getByTestId('link-to-/admin/users/123');
    expect(lastLink).toHaveAttribute('aria-current', 'page');
    
    // Other links should not have aria-current
    const adminLink = screen.getByTestId('link-to-/admin');
    expect(adminLink).not.toHaveAttribute('aria-current');
    
    const usersLink = screen.getByTestId('link-to-/admin/users');
    expect(usersLink).not.toHaveAttribute('aria-current');
  });

  it('applies different styles to the last item', () => {
    render(<BreadcrumbsPresentation breadcrumbItems={mockBreadcrumbItems} />);
    
    // The last link should have text-gray-900 class
    const lastLink = screen.getByTestId('link-to-/admin/users/123');
    expect(lastLink.className).toContain('text-gray-900');
    expect(lastLink.className).not.toContain('text-gray-500');
    
    // Other links should have text-gray-500 class
    const usersLink = screen.getByTestId('link-to-/admin/users');
    expect(usersLink.className).toContain('text-gray-500');
    expect(usersLink.className).not.toContain('text-gray-900');
  });
});
