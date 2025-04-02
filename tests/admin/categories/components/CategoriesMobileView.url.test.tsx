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
    expect(screen.getByTestId('view-link-category_1')).toHaveAttribute('href', '/admin/categories/category_1');
    expect(screen.getByTestId('edit-link-category_1')).toHaveAttribute('href', '/admin/categories/category_1/edit');

    // Check URLs for the second category
    expect(screen.getByTestId('view-link-category_2')).toHaveAttribute('href', '/admin/categories/category_2');
    expect(screen.getByTestId('edit-link-category_2')).toHaveAttribute('href', '/admin/categories/category_2/edit');
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
    expect(screen.getByTestId('view-link-category_1')).toHaveAttribute('href', '/admin/sites/test-site/categories/test-category-1');
    expect(screen.getByTestId('edit-link-category_1')).toHaveAttribute('href', '/admin/sites/test-site/categories/category_1/edit');

    // Check URLs for the second category
    expect(screen.getByTestId('view-link-category_2')).toHaveAttribute('href', '/admin/sites/test-site/categories/test-category-2');
    expect(screen.getByTestId('edit-link-category_2')).toHaveAttribute('href', '/admin/sites/test-site/categories/category_2/edit');
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
    expect(screen.getByTestId('view-link-category_1')).toHaveAttribute('href', '/admin/sites/another-site/categories/test-category-1');
    expect(screen.getByTestId('edit-link-category_1')).toHaveAttribute('href', '/admin/sites/another-site/categories/category_1/edit');
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

    // Check that special character in slug is preserved
    const viewLink = screen.getByTestId('view-link-category_special');
    expect(viewLink).toHaveAttribute('href', '/admin/sites/test-site/categories/special-&-category');
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

    // Check URLs with special characters in site slug
    expect(screen.getByTestId('view-link-category_1')).toHaveAttribute('href', '/admin/sites/site-with-&-special-chars/categories/test-category-1');
    expect(screen.getByTestId('edit-link-category_1')).toHaveAttribute('href', '/admin/sites/site-with-&-special-chars/categories/category_1/edit');
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

    // Empty slug should still work with category ID
    expect(screen.getByTestId('view-link-empty_slug')).toHaveAttribute('href', '/admin/sites/test-site/categories/');
    expect(screen.getByTestId('edit-link-empty_slug')).toHaveAttribute('href', '/admin/sites/test-site/categories/empty_slug/edit');

    // Null slug should still work with category ID
    expect(screen.getByTestId('view-link-null_slug')).toHaveAttribute('href', '/admin/sites/test-site/categories/');
    expect(screen.getByTestId('edit-link-null_slug')).toHaveAttribute('href', '/admin/sites/test-site/categories/null_slug/edit');
  });
});
