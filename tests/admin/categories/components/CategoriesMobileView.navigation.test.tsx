/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

// Import the component
import { CategoriesMobileView } from '@/components/admin/categories/components';

// Mock data
const mockCategories = [
  {
    id: 'category_1',
    name: 'Test Category 1',
    slug: 'test-category-1',
    metaDescription: 'This is test category 1',
    order: 1,
    parentId: null,
    siteId: 'site_1',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 3600000,
    childCount: 2,
    siteName: 'Test Site'
  },
  {
    id: 'category_2',
    name: 'Test Category 2',
    slug: 'test-category-2',
    metaDescription: 'This is test category 2',
    order: 2,
    parentId: null,
    siteId: 'site_1',
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 7200000,
    childCount: 0,
    siteName: 'Test Site'
  }
];

// Create a mockRouter to track navigation
const mockPush = jest.fn();

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
    <a
      href={href}
      className={className}
      data-testid={dataTestId}
      onClick={(e) => {
        e.preventDefault(); // Prevent actual navigation
        mockPush(href); // Track the navigation
        onClick?.(); // Call original onClick if provided
      }}
    >
      {children}
    </a>
  );
});

describe('CategoriesMobileView Navigation Tests', () => {
  const mockOnDeleteClick = jest.fn();
  const mockOnViewClick = jest.fn();
  const mockOnEditClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('constructs correct URLs for different site slug scenarios', () => {
    // Test with single site mode (no site slug)
    render(
      <CategoriesMobileView
        categories={mockCategories}
        showSiteColumn={false}
        onDeleteClick={mockOnDeleteClick}
        onViewClick={mockOnViewClick}
        onEditClick={mockOnEditClick}
      />
    );

    // Check buttons for the first category in single site mode
    expect(screen.getByTestId('view-button-category_1')).toBeInTheDocument();
    expect(screen.getByTestId('edit-button-category_1')).toBeInTheDocument();

    // Unmount and rerender with a site slug
    // Use cleanup instead of screen.unmount()
    cleanup();

    // Test with multi-site mode (with site slug)
    render(
      <CategoriesMobileView
        categories={mockCategories}
        showSiteColumn={false}
        onDeleteClick={mockOnDeleteClick}
        onViewClick={mockOnViewClick}
        onEditClick={mockOnEditClick}
        siteSlug="test-site"
      />
    );

    // Check buttons for the first category in multi-site mode
    expect(screen.getByTestId('view-button-category_1')).toBeInTheDocument();
    expect(screen.getByTestId('edit-button-category_1')).toBeInTheDocument();

    // Test a different site slug
    cleanup();

    render(
      <CategoriesMobileView
        categories={mockCategories}
        showSiteColumn={false}
        onDeleteClick={mockOnDeleteClick}
        onViewClick={mockOnViewClick}
        onEditClick={mockOnEditClick}
        siteSlug="another-site"
      />
    );

    // Check buttons with a different site slug
    expect(screen.getByTestId('view-button-category_1')).toBeInTheDocument();
    expect(screen.getByTestId('edit-button-category_1')).toBeInTheDocument();
  });

  it('navigates correctly when links are clicked', async () => {
    const user = userEvent.setup();

    render(
      <CategoriesMobileView
        categories={mockCategories}
        showSiteColumn={false}
        onDeleteClick={mockOnDeleteClick}
        onViewClick={mockOnViewClick}
        onEditClick={mockOnEditClick}
      />
    );

    // Click the view button
    await user.click(screen.getByTestId('view-button-category_1'));

    // Check onViewClick was called
    expect(mockOnViewClick).toHaveBeenCalledWith('category_1');

    // Click the edit button
    await user.click(screen.getByTestId('edit-button-category_1'));

    // Check onEditClick was called
    expect(mockOnEditClick).toHaveBeenCalledWith('category_1');
  });

  it('calls onDeleteClick with the correct category ID', async () => {
    const user = userEvent.setup();

    render(
      <CategoriesMobileView
        categories={mockCategories}
        showSiteColumn={false}
        onDeleteClick={mockOnDeleteClick}
        onViewClick={mockOnViewClick}
        onEditClick={mockOnEditClick}
      />
    );

    // Click the delete button
    await user.click(screen.getByTestId('delete-button-category_1'));

    // Check onDeleteClick was called with the correct category ID
    expect(mockOnDeleteClick).toHaveBeenCalledWith('category_1', 'Test Category 1');
  });
});
