/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, within, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import the component
import { CategoriesMobileView } from '@/components/admin/categories/components';

// Mock data with edge cases
const mockCategoriesWithEdgeCases = [
  // Category with maximum values for all fields
  {
    id: 'very_long_category_id_that_exceeds_normal_parameters',
    name: 'Very Long Category Name That Exceeds Normal Parameters And Might Cause Layout Issues If Not Handled Properly',
    slug: 'very-long-slug-that-exceeds-normal-parameters',
    metaDescription: 'This is an extremely long description that contains a lot of text and might cause layout issues if not handled properly with text truncation, overflow handling, or other UI techniques to ensure a consistent and usable interface across all scenarios.',
    order: 999999,
    parentId: null,
    siteId: 'site_1',
    createdAt: 2147483647000, // Maximum timestamp
    updatedAt: 2147483647000, // Maximum timestamp
    childCount: 9999,
    siteName: 'Very Long Site Name That Exceeds Normal Parameters And Might Cause Layout Issues'
  },
  // Category with minimum values
  {
    id: '',
    name: '',
    slug: '',
    metaDescription: '',
    order: 0,
    parentId: null,
    siteId: '',
    createdAt: 0, // Minimum timestamp (1970-01-01)
    updatedAt: 0, // Minimum timestamp (1970-01-01)
    childCount: 0,
    siteName: ''
  },
  // Category with special characters
  {
    id: 'special_chars',
    name: '<script>alert("XSS")</script> & " \' < > &amp;',
    slug: 'special-chars',
    metaDescription: 'Contains special characters: & " \' < > ®™©',
    order: 3,
    parentId: null,
    siteId: 'site_1',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    childCount: 0,
    siteName: 'Site with <special> & "characters"'
  },
  // Category with deep nesting
  {
    id: 'deeply_nested',
    name: 'Deeply Nested Category',
    slug: 'deeply-nested',
    metaDescription: 'This is a deeply nested category',
    order: 4,
    parentId: 'parent_of_parent_of_parent', // Deep nesting
    siteId: 'site_1',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    childCount: 0,
    siteName: 'Test Site',
    parentName: 'Great Grandparent Category with Very Long Name That Might Not Fit Properly'
  },
  // Category with null fields that should be optional
  {
    id: 'null_fields',
    name: 'Category With Null Fields',
    slug: null as any, // Simulating a null field
    metaDescription: null as any, // Simulating a null field
    order: null as any, // Simulating a null field
    parentId: null,
    siteId: 'site_1',
    createdAt: Date.now(),
    updatedAt: null as any, // Simulating a null field
    childCount: null as any, // Simulating a null field
    siteName: null as any  // Simulating a null field
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

describe('CategoriesMobileView Edge Cases', () => {
  const mockOnDeleteClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles extremely long category names without breaking layout', () => {
    const mockOnViewClick = jest.fn();
    const mockOnEditClick = jest.fn();

    render(
      <CategoriesMobileView
        categories={[mockCategoriesWithEdgeCases[0]]}
        showSiteColumn={true}
        onDeleteClick={mockOnDeleteClick}
        onViewClick={mockOnViewClick}
        onEditClick={mockOnEditClick}
      />
    );

    // Verify long name renders without error
    const nameElement = screen.getByTestId(`category-name-${mockCategoriesWithEdgeCases[0].id}`);
    expect(nameElement).toHaveTextContent(mockCategoriesWithEdgeCases[0].name);

    // Verify long site name renders without error
    const siteNameElement = screen.getByTestId(`site-name-${mockCategoriesWithEdgeCases[0].id}`);
    expect(siteNameElement).toHaveTextContent(mockCategoriesWithEdgeCases[0].siteName!);

    // Verify extremely large order number renders correctly
    const orderElement = screen.getByTestId(`order-value-${mockCategoriesWithEdgeCases[0].id}`);
    expect(orderElement).toHaveTextContent('999999');

    // Verify large child count badge renders correctly
    const childCountElement = screen.getByTestId(`child-count-${mockCategoriesWithEdgeCases[0].id}`);
    expect(childCountElement).toHaveTextContent('9999');
  });

  it('handles empty or blank field values gracefully', () => {
    const mockOnViewClick = jest.fn();
    const mockOnEditClick = jest.fn();

    render(
      <CategoriesMobileView
        categories={[mockCategoriesWithEdgeCases[1]]}
        showSiteColumn={true}
        onDeleteClick={mockOnDeleteClick}
        onViewClick={mockOnViewClick}
        onEditClick={mockOnEditClick}
      />
    );

    // Empty category card should still render
    const card = screen.getByTestId(`category-card-${mockCategoriesWithEdgeCases[1].id}`);
    expect(card).toBeInTheDocument();

    // Name should not break even if empty
    const nameElement = screen.getByTestId(`category-name-${mockCategoriesWithEdgeCases[1].id}`);
    expect(nameElement).toBeInTheDocument();
    expect(nameElement.textContent).toBe('');

    // Empty site name should render without error
    const siteNameElement = screen.getByTestId(`site-name-${mockCategoriesWithEdgeCases[1].id}`);
    expect(siteNameElement).toBeInTheDocument();
    expect(siteNameElement.textContent).toBe('');

    // Verify order still renders even with value 0
    const orderElement = screen.getByTestId(`order-value-${mockCategoriesWithEdgeCases[1].id}`);
    expect(orderElement).toHaveTextContent('0');

    // Early date should still format properly
    const dateElement = screen.getByTestId(`updated-date-${mockCategoriesWithEdgeCases[1].id}`);
    expect(dateElement).toBeInTheDocument();
    // We're not checking exact format as that depends on browser locale
  });

  it('properly escapes and renders special characters', () => {
    const mockOnViewClick = jest.fn();
    const mockOnEditClick = jest.fn();

    render(
      <CategoriesMobileView
        categories={[mockCategoriesWithEdgeCases[2]]}
        showSiteColumn={true}
        onDeleteClick={mockOnDeleteClick}
        onViewClick={mockOnViewClick}
        onEditClick={mockOnEditClick}
      />
    );

    // Verify special characters in name are properly escaped but displayed
    const nameElement = screen.getByTestId(`category-name-${mockCategoriesWithEdgeCases[2].id}`);
    expect(nameElement).toHaveTextContent('<script>alert("XSS")</script> & " \' < > &amp;');

    // No actual script should be executed
    expect(document.querySelector('script')).not.toBeInTheDocument();

    // Special characters in site name
    const siteNameElement = screen.getByTestId(`site-name-${mockCategoriesWithEdgeCases[2].id}`);
    expect(siteNameElement).toHaveTextContent('Site with <special> & "characters"');
  });

  it('correctly displays deeply nested category relationships', () => {
    const mockOnViewClick = jest.fn();
    const mockOnEditClick = jest.fn();

    render(
      <CategoriesMobileView
        categories={[mockCategoriesWithEdgeCases[3]]}
        showSiteColumn={false}
        onDeleteClick={mockOnDeleteClick}
        onViewClick={mockOnViewClick}
        onEditClick={mockOnEditClick}
      />
    );

    // Verify parent relationship display for deep nesting
    const parentLabel = screen.getByTestId('parent-label');
    expect(parentLabel).toHaveTextContent('Parent:');

    // Verify long parent name display
    const parentNameElement = screen.getByTestId(`parent-name-${mockCategoriesWithEdgeCases[3].id}`);
    expect(parentNameElement).toHaveTextContent('Great Grandparent Category with Very Long Name That Might Not Fit Properly');
  });

  it('handles null fields gracefully without errors', () => {
    const mockOnViewClick = jest.fn();
    const mockOnEditClick = jest.fn();

    render(
      <CategoriesMobileView
        categories={[mockCategoriesWithEdgeCases[4]]}
        showSiteColumn={true}
        onDeleteClick={mockOnDeleteClick}
        onViewClick={mockOnViewClick}
        onEditClick={mockOnEditClick}
      />
    );

    // Card should render without errors despite null fields
    const card = screen.getByTestId(`category-card-${mockCategoriesWithEdgeCases[4].id}`);
    expect(card).toBeInTheDocument();

    // Name should still display correctly
    const nameElement = screen.getByTestId(`category-name-${mockCategoriesWithEdgeCases[4].id}`);
    expect(nameElement).toHaveTextContent('Category With Null Fields');

    // Order should handle null gracefully
    const orderElement = screen.getByTestId(`order-value-${mockCategoriesWithEdgeCases[4].id}`);
    expect(orderElement).toBeInTheDocument();

    // Site name with null should not break rendering
    const siteLabelElement = screen.getByTestId('site-label');
    expect(siteLabelElement).toBeInTheDocument();
    expect(siteLabelElement.textContent).toBe('Site:');

    // Updated date with null should still render
    const dateElement = screen.getByTestId(`updated-date-${mockCategoriesWithEdgeCases[4].id}`);
    expect(dateElement).toBeInTheDocument();
  });

  it('handles an empty array of categories gracefully', () => {
    const mockOnViewClick = jest.fn();
    const mockOnEditClick = jest.fn();

    render(
      <CategoriesMobileView
        categories={[]}
        showSiteColumn={true}
        onDeleteClick={mockOnDeleteClick}
        onViewClick={mockOnViewClick}
        onEditClick={mockOnEditClick}
      />
    );

    // Container should exist but be empty
    const container = screen.getByTestId('categories-mobile-view');
    expect(container).toBeInTheDocument();
    expect(container.children.length).toBe(0);
  });

  it('builds correct URLs with empty or special character slugs', () => {
    // Mock the view and edit click handlers
    const mockOnViewClick = jest.fn();
    const mockOnEditClick = jest.fn();

    // Test with category that has empty slug
    render(
      <CategoriesMobileView
        categories={[mockCategoriesWithEdgeCases[1]]}
        showSiteColumn={false}
        onDeleteClick={mockOnDeleteClick}
        onViewClick={mockOnViewClick}
        onEditClick={mockOnEditClick}
        siteSlug="test-site"
      />
    );

    // Even with empty slug, view button should be clickable
    const viewButton = screen.getByTestId(`view-button-${mockCategoriesWithEdgeCases[1].id}`);
    expect(viewButton).toBeInTheDocument();
    expect(viewButton).toHaveTextContent('View');
    fireEvent.click(viewButton);
    expect(mockOnViewClick).toHaveBeenCalledWith(mockCategoriesWithEdgeCases[1].id);

    // Edit button should be clickable
    const editButton = screen.getByTestId(`edit-button-${mockCategoriesWithEdgeCases[1].id}`);
    expect(editButton).toBeInTheDocument();
    expect(editButton).toHaveTextContent('Edit');
    fireEvent.click(editButton);
    expect(mockOnEditClick).toHaveBeenCalledWith(mockCategoriesWithEdgeCases[1].id);

    // Reset mocks
    mockOnViewClick.mockReset();
    mockOnEditClick.mockReset();

    // Now test with special character slug
    render(
      <CategoriesMobileView
        categories={[mockCategoriesWithEdgeCases[2]]}
        showSiteColumn={false}
        onDeleteClick={mockOnDeleteClick}
        onViewClick={mockOnViewClick}
        onEditClick={mockOnEditClick}
        siteSlug="test-site"
      />
    );

    // Special character slug should have clickable buttons
    const viewButtonSpecial = screen.getByTestId(`view-button-${mockCategoriesWithEdgeCases[2].id}`);
    expect(viewButtonSpecial).toBeInTheDocument();
    expect(viewButtonSpecial).toHaveTextContent('View');
    fireEvent.click(viewButtonSpecial);
    expect(mockOnViewClick).toHaveBeenCalledWith(mockCategoriesWithEdgeCases[2].id);
  });

  it('handles multiple categories with the same name', () => {
    // Create duplicate named categories
    const duplicateNameCategories = [
      {
        id: 'category_1',
        name: 'Duplicate Name',
        slug: 'duplicate-1',
        metaDescription: 'First duplicate',
        order: 1,
        parentId: null,
        siteId: 'site_1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        childCount: 0,
        siteName: 'Test Site'
      },
      {
        id: 'category_2',
        name: 'Duplicate Name',
        slug: 'duplicate-2',
        metaDescription: 'Second duplicate',
        order: 2,
        parentId: null,
        siteId: 'site_1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        childCount: 0,
        siteName: 'Test Site'
      }
    ];

    const mockOnViewClick = jest.fn();
    const mockOnEditClick = jest.fn();

    render(
      <CategoriesMobileView
        categories={duplicateNameCategories}
        showSiteColumn={false}
        onDeleteClick={mockOnDeleteClick}
        onViewClick={mockOnViewClick}
        onEditClick={mockOnEditClick}
      />
    );

    // Both categories should render correctly despite having the same name
    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(2);

    // Each card should have distinct IDs even with same content
    expect(screen.getByTestId('category-card-category_1')).toBeInTheDocument();
    expect(screen.getByTestId('category-card-category_2')).toBeInTheDocument();

    // Both should show the same name
    expect(screen.getByTestId('category-name-category_1')).toHaveTextContent('Duplicate Name');
    expect(screen.getByTestId('category-name-category_2')).toHaveTextContent('Duplicate Name');

    // But they should have different orders to distinguish them
    expect(screen.getByTestId('order-value-category_1')).toHaveTextContent('1');
    expect(screen.getByTestId('order-value-category_2')).toHaveTextContent('2');
  });

  it('handles child counts with various values correctly', () => {
    // Test different child count scenarios
    const childCountCategories = [
      {
        id: 'zero_children',
        name: 'No Children',
        slug: 'no-children',
        metaDescription: 'Category with no children',
        order: 1,
        parentId: null,
        siteId: 'site_1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        childCount: 0,
        siteName: 'Test Site'
      },
      {
        id: 'one_child',
        name: 'One Child',
        slug: 'one-child',
        metaDescription: 'Category with one child',
        order: 2,
        parentId: null,
        siteId: 'site_1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        childCount: 1,
        siteName: 'Test Site'
      },
      {
        id: 'many_children',
        name: 'Many Children',
        slug: 'many-children',
        metaDescription: 'Category with many children',
        order: 3,
        parentId: null,
        siteId: 'site_1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        childCount: 100,
        siteName: 'Test Site'
      }
    ];

    const mockOnViewClick = jest.fn();
    const mockOnEditClick = jest.fn();

    render(
      <CategoriesMobileView
        categories={childCountCategories}
        showSiteColumn={false}
        onDeleteClick={mockOnDeleteClick}
        onViewClick={mockOnViewClick}
        onEditClick={mockOnEditClick}
      />
    );

    // Category with no children should not show child count badge
    expect(screen.queryByTestId('child-count-zero_children')).not.toBeInTheDocument();

    // Category with one child should show badge with count 1
    const oneChildBadge = screen.getByTestId('child-count-one_child');
    expect(oneChildBadge).toBeInTheDocument();
    expect(oneChildBadge).toHaveTextContent('1');

    // Category with many children should show badge with count 100
    const manyChildrenBadge = screen.getByTestId('child-count-many_children');
    expect(manyChildrenBadge).toBeInTheDocument();
    expect(manyChildrenBadge).toHaveTextContent('100');
  });

  it('displays correctly when showSiteColumn toggled during component lifecycle', () => {
    const mockOnViewClick = jest.fn();
    const mockOnEditClick = jest.fn();

    // Test initial render with showSiteColumn = false
    const { rerender } = render(
      <CategoriesMobileView
        categories={[mockCategoriesWithEdgeCases[0]]}
        showSiteColumn={false}
        onDeleteClick={mockOnDeleteClick}
        onViewClick={mockOnViewClick}
        onEditClick={mockOnEditClick}
      />
    );

    // Site column should not be shown initially
    expect(screen.queryByTestId('site-label')).not.toBeInTheDocument();
    expect(screen.queryByTestId(`site-name-${mockCategoriesWithEdgeCases[0].id}`)).not.toBeInTheDocument();

    // Now rerender with showSiteColumn = true
    rerender(
      <CategoriesMobileView
        categories={[mockCategoriesWithEdgeCases[0]]}
        showSiteColumn={true}
        onDeleteClick={mockOnDeleteClick}
        onViewClick={mockOnViewClick}
        onEditClick={mockOnEditClick}
      />
    );

    // Site column should now be shown
    expect(screen.getByTestId('site-label')).toBeInTheDocument();
    expect(screen.getByTestId(`site-name-${mockCategoriesWithEdgeCases[0].id}`)).toBeInTheDocument();

    // Rerender again with showSiteColumn = false
    rerender(
      <CategoriesMobileView
        categories={[mockCategoriesWithEdgeCases[0]]}
        showSiteColumn={false}
        onDeleteClick={mockOnDeleteClick}
        onViewClick={mockOnViewClick}
        onEditClick={mockOnEditClick}
      />
    );

    // Site column should be hidden again
    expect(screen.queryByTestId('site-label')).not.toBeInTheDocument();
    expect(screen.queryByTestId(`site-name-${mockCategoriesWithEdgeCases[0].id}`)).not.toBeInTheDocument();
  });

  it('handles dynamic category list changes correctly', () => {
    const mockOnViewClick = jest.fn();
    const mockOnEditClick = jest.fn();

    // Start with one category
    const { rerender } = render(
      <CategoriesMobileView
        categories={[mockCategoriesWithEdgeCases[0]]}
        showSiteColumn={false}
        onDeleteClick={mockOnDeleteClick}
        onViewClick={mockOnViewClick}
        onEditClick={mockOnEditClick}
      />
    );

    // Should show just one card
    expect(screen.getAllByRole('article')).toHaveLength(1);

    // Now add two more categories
    rerender(
      <CategoriesMobileView
        categories={[
          mockCategoriesWithEdgeCases[0],
          mockCategoriesWithEdgeCases[2],
          mockCategoriesWithEdgeCases[3]
        ]}
        showSiteColumn={false}
        onDeleteClick={mockOnDeleteClick}
        onViewClick={mockOnViewClick}
        onEditClick={mockOnEditClick}
      />
    );

    // Should now show three cards
    expect(screen.getAllByRole('article')).toHaveLength(3);

    // Now remove all categories
    rerender(
      <CategoriesMobileView
        categories={[]}
        showSiteColumn={false}
        onDeleteClick={mockOnDeleteClick}
        onViewClick={mockOnViewClick}
        onEditClick={mockOnEditClick}
      />
    );

    // Should have no cards
    expect(screen.queryByRole('article')).not.toBeInTheDocument();

    // But container should still exist
    expect(screen.getByTestId('categories-mobile-view')).toBeInTheDocument();
  });
});
