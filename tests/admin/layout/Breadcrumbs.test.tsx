import React from 'react';
import { render, screen } from '@testing-library/react';
import { Breadcrumbs } from '@/components/admin/layout';

// Mock next/link
jest.mock('next/link', () => {
  return ({ href, children, className, 'aria-current': ariaCurrent, ...rest }: any) => {
    return (
      <a
        href={href}
        className={className}
        aria-current={ariaCurrent}
        data-testid={rest['data-testid']}
      >
        {children}
      </a>
    );
  };
});

// Mock the ChevronRightIcon component
jest.mock('@/components/admin/layout/icons', () => ({
  ChevronRightIcon: ({ className }: { className: string }) => (
    <svg className={className} data-testid="chevron-right-icon" />
  ),
}));

describe('Breadcrumbs Component', () => {
  it('renders nothing when on admin root path', () => {
    const { container } = render(<Breadcrumbs pathname="/admin" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders correct breadcrumbs for single-level path', () => {
    render(<Breadcrumbs pathname="/admin/listings" />);

    // Check that correct breadcrumbs are rendered
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Listings')).toBeInTheDocument();

    // Check the links have proper hrefs
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/admin');
    expect(links[1]).toHaveAttribute('href', '/admin/listings');
  });

  it('renders correct breadcrumbs for multi-level path', () => {
    render(<Breadcrumbs pathname="/admin/listings/create" />);

    // Check that correct breadcrumbs are rendered
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Listings')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();

    // Check the links have proper hrefs
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/admin');
    expect(links[1]).toHaveAttribute('href', '/admin/listings');
    expect(links[2]).toHaveAttribute('href', '/admin/listings/create');
  });

  it('formats path segments properly with capitalization and spaces', () => {
    render(<Breadcrumbs pathname="/admin/user-management/create-user" />);

    // Check for proper formatting of segments
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('Create User')).toBeInTheDocument();
  });

  it('renders the correct ARIA attributes for accessibility', () => {
    render(<Breadcrumbs pathname="/admin/listings/edit/123" />);

    // Check that the breadcrumb has proper ARIA attributes
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Breadcrumb');

    // Check that the current page has current attribute
    const links = screen.getAllByRole('link');
    expect(links[links.length - 1]).toHaveAttribute('aria-current', 'page');
  });
});