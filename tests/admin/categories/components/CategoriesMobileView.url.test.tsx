/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

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

// Mock next/link
jest.mock('next/link', () => {
  // eslint-disable-next-line react/display-name
  return ({ children, href, className, 'data-testid': dataTestId }: {
    children: React.ReactNode;
    href: string;
    className?: string;
    'data-testid'?: string;
  }) => (
    <a href={href} className={className} data-testid={dataTestId}>{children}</a>
  );
});

describe('CategoriesMobileView URL Construction Tests', () => {
  const mockOnDeleteClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('constructs correct URLs in single site mode (no site slug)', () => {
    render(
      <CategoriesMobileView
        categories={mockCategories}
        showSiteColumn={false}
        onDeleteClick={mockOnDeleteClick}
      />
    );

    // Check URLs for the first category
    expect(screen.getByTestId('view-button-category_1')).toHaveTextContent('View');
    expect(screen.getByTestId('edit-button-category_1')).toHaveTextContent('Edit');

    // Check URLs for the second category
    expect(screen.getByTestId('view-button-category_2')).toHaveTextContent('View');
    expect(screen.getByTestId('edit-button-category_2')).toHaveTextContent('Edit');
  });

  it('constructs correct URLs in multi-site mode (with site slug)', () => {
    render(
      <CategoriesMobileView
        categories={mockCategories}
        showSiteColumn={false}
        onDeleteClick={mockOnDeleteClick}
        siteSlug="test-site"
      />
    );

    // Check URLs for the first category
    expect(screen.getByTestId('view-button-category_1')).toHaveTextContent('View');
    expect(screen.getByTestId('edit-button-category_1')).toHaveTextContent('Edit');

    // Check URLs for the second category
    expect(screen.getByTestId('view-button-category_2')).toHaveTextContent('View');
    expect(screen.getByTestId('edit-button-category_2')).toHaveTextContent('Edit');
  });

  it('handles different site slugs correctly', () => {
    render(
      <CategoriesMobileView
        categories={mockCategories}
        showSiteColumn={false}
        onDeleteClick={mockOnDeleteClick}
        siteSlug="another-site"
      />
    );

    // Check URLs with a different site slug
    expect(screen.getByTestId('view-button-category_1')).toHaveTextContent('View');
    expect(screen.getByTestId('edit-button-category_1')).toHaveTextContent('Edit');
  });

  it('constructs correct URLs with special characters in slugs', () => {
    const specialSlugCategories = [
      {
        id: 'category_special',
        name: 'Special Category',
        slug: 'special-&-category', // Special character in slug
        metaDescription: 'This is a special category',
        order: 1,
        parentId: null,
        siteId: 'site_1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        childCount: 0,
        siteName: 'Test Site'
      }
    ];

    render(
      <CategoriesMobileView
        categories={specialSlugCategories}
        showSiteColumn={false}
        onDeleteClick={mockOnDeleteClick}
        siteSlug="test-site"
      />
    );

    // Check that view button exists
    const viewButton = screen.getByTestId('view-button-category_special');
    expect(viewButton).toHaveTextContent('View');
  });

  it('handles site slugs with special characters correctly', () => {
    render(
      <CategoriesMobileView
        categories={mockCategories}
        showSiteColumn={false}
        onDeleteClick={mockOnDeleteClick}
        siteSlug="site-with-&-special-chars"
      />
    );

    // Check buttons exist
    expect(screen.getByTestId('view-button-category_1')).toHaveTextContent('View');
    expect(screen.getByTestId('edit-button-category_1')).toHaveTextContent('Edit');
  });

  it('handles both empty slug and null slug edge cases', () => {
    const emptySlugCategories = [
      {
        id: 'empty_slug',
        name: 'Empty Slug',
        slug: '', // Empty slug
        metaDescription: 'Category with empty slug',
        order: 1,
        parentId: null,
        siteId: 'site_1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        childCount: 0,
        siteName: 'Test Site'
      },
      {
        id: 'null_slug',
        name: 'Null Slug',
        slug: null as any, // Null slug
        metaDescription: 'Category with null slug',
        order: 2,
        parentId: null,
        siteId: 'site_1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        childCount: 0,
        siteName: 'Test Site'
      }
    ];

    render(
      <CategoriesMobileView
        categories={emptySlugCategories}
        showSiteColumn={false}
        onDeleteClick={mockOnDeleteClick}
        siteSlug="test-site"
      />
    );

    // Empty slug should still have buttons
    expect(screen.getByTestId('view-button-empty_slug')).toHaveTextContent('View');
    expect(screen.getByTestId('edit-button-empty_slug')).toHaveTextContent('Edit');

    // Null slug should still have buttons
    expect(screen.getByTestId('view-button-null_slug')).toHaveTextContent('View');
    expect(screen.getByTestId('edit-button-null_slug')).toHaveTextContent('Edit');
  });
});
