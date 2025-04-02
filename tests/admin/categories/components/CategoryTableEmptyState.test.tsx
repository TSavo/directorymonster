/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import the component
import { CategoryTableEmptyState } from '../../../../src/components/admin/categories/components';

// Mock next/link
jest.mock('next/link', () => {
  // eslint-disable-next-line react/display-name
  return ({ children, href, className, 'data-testid': dataTestId, onClick }: {
    children: React.ReactNode;
    href: string;
    className?: string;
    'data-testid'?: string;
    onClick?: () => void;
  }) => (
    <a href={href} className={className} data-testid={dataTestId || 'create-category-button'} onClick={onClick}>{children}</a>
  );
});

describe('CategoryTableEmptyState Component', () => {
  it('renders the empty state message correctly', () => {
    render(<CategoryTableEmptyState />);

    const message = screen.getByTestId('empty-state-message');
    expect(message).toBeInTheDocument();
    expect(message).toHaveTextContent('No categories found.');
  });

  it('renders the create button with default URL', () => {
    render(<CategoryTableEmptyState />);

    const createButton = screen.getByTestId('create-category-button');
    expect(createButton).toBeInTheDocument();
    expect(createButton).toHaveAttribute('href', '/admin/categories/new');
    expect(createButton.textContent).toContain('Create your first category');
  });

  it('uses site-specific URL when siteSlug is provided', () => {
    render(<CategoryTableEmptyState siteSlug="test-site" />);

    const createButton = screen.getByTestId('create-category-button');
    expect(createButton).toHaveAttribute('href', '/admin/sites/test-site/categories/new');
    expect(createButton.textContent).toContain('Create your first category');
  });

  it('has proper styling for the empty state container', () => {
    render(<CategoryTableEmptyState />);

    const container = screen.getByTestId('empty-state-container');
    // Only test essential styling classes that affect functionality
    expect(container).toHaveClass('text-center');
    expect(container).toHaveClass('rounded-lg');
  });

  it('has accessible focus states for the create button', () => {
    render(<CategoryTableEmptyState />);

    const createButton = screen.getByTestId('create-category-button');
    // Test for the presence of focus-related attributes but not specific implementation
    const className = createButton.getAttribute('class') || '';
    expect(className).toContain('focus:');

    // Instead of testing specific classes, ensure accessibility features are present
    expect(className).toMatch(/focus:(outline|ring)/);
  });
});
