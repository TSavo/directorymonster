/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

// Import the component
import { CategoriesMobileView } from '../../../../src/components/admin/categories/components';

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
      />
    );
    
    // Check URLs for the first category in single site mode
    expect(screen.getByTestId('view-link-category_1')).toHaveAttribute('href', '/admin/categories/category_1');
    expect(screen.getByTestId('edit-link-category_1')).toHaveAttribute('href', '/admin/categories/category_1/edit');
    
    // Unmount and rerender with a site slug
    screen.unmount();
    
    // Test with multi-site mode (with site slug)
    render(
      <CategoriesMobileView 
        categories={mockCategories} 
        showSiteColumn={false}
        onDeleteClick={mockOnDeleteClick}
        siteSlug="test-site"
      />
    );
    
    // Check URLs for the first category in multi-site mode
    expect(screen.getByTestId('view-link-category_1')).toHaveAttribute('href', '/admin/sites/test-site/categories/test-category-1');
    expect(screen.getByTestId('edit-link-category_1')).toHaveAttribute('href', '/admin/sites/test-site/categories/category_1/edit');
    
    // Test a different site slug
    screen.unmount();
    
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

  it('navigates correctly when links are clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <CategoriesMobileView 
        categories={mockCategories} 
        showSiteColumn={false}
        onDeleteClick={mockOnDeleteClick}
      />
    );
    
    // Click the view link
    await user.click(screen.getByTestId('view-link-category_1'));
    
    // Check navigation was triggered with correct URL
    expect(mockPush).toHaveBeenCalledWith('/admin/categories/category_1');
    
    // Click the edit link
    await user.click(screen.getByTestId('edit-link-category_1'));
    
    // Check navigation was triggered with correct URL
    expect(mockPush).toHaveBeenCalledWith('/admin/categories/category_1/edit');
  });
  
  it('calls onDeleteClick with the correct category ID', async () => {
    const user = userEvent.setup();
    
    render(
      <CategoriesMobileView 
        categories={mockCategories} 
        showSiteColumn={false}
        onDeleteClick={mockOnDeleteClick}
      />
    );
    
    // Click the delete button
    await user.click(screen.getByTestId('delete-btn-category_1'));
    
    // Check onDeleteClick was called with the correct category ID
    expect(mockOnDeleteClick).toHaveBeenCalledWith('category_1');
  });
});
