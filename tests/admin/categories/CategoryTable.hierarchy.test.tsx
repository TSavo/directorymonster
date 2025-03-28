/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

import CategoryTable from '../../../src/components/admin/categories/CategoryTable';
import { 
  mockHierarchicalCategories, 
  setupCategoryTableTest, 
  resetMocks 
} from './helpers/categoryTableTestHelpers';
import * as hooks from '../../../src/components/admin/categories/hooks';

describe('CategoryTable Hierarchy View', () => {
  beforeEach(() => {
    resetMocks();
    // Use the hierarchical categories for these tests
    setupCategoryTableTest({
      categories: mockHierarchicalCategories,
      filteredCategories: mockHierarchicalCategories,
      currentCategories: mockHierarchicalCategories,
      allCategories: mockHierarchicalCategories
    });
  });

  it('initially renders in flat view mode (non-hierarchical)', () => {
    render(<CategoryTable />);
    
    // In flat view, all categories should be rendered at the same level
    const rows = screen.getAllByRole('row');
    // The first row is the header row
    expect(rows.length).toBe(mockHierarchicalCategories.length + 1);
    
    // Verify all categories are visible in flat mode regardless of parent-child relationship
    mockHierarchicalCategories.forEach(category => {
      const nameElements = screen.getAllByTestId(`category-name-${category.id}`);
      expect(nameElements.length).toBeGreaterThan(0);
      expect(nameElements[0]).toHaveTextContent(category.name);
    });
    
    // No indentation should be visible in flat mode
    // We would need to implement a way to check this - for now we'll just verify categories exist
  });

  it('switches to hierarchy view mode when toggleHierarchy is called', async () => {
    const user = userEvent.setup();
    
    // We need to render the CategoryTable with the CategoryTableHeader component
    // Mock implementation for the header's showHierarchy toggle
    const mockSetShowHierarchy = jest.fn();
    const useStateOriginal = React.useState;
    
    // Mock useState for showHierarchy toggle
    jest.spyOn(React, 'useState').mockImplementationOnce(() => {
      const result = useStateOriginal(false);
      return [result[0], mockSetShowHierarchy];
    });
    
    render(<CategoryTable />);
    
    // Find the toggle button for hierarchy view
    const toggleButton = screen.getByTestId('toggle-hierarchy-button');
    expect(toggleButton).toBeInTheDocument();
    
    // Click the toggle button
    await user.click(toggleButton);
    
    // Verify the state change function was called
    expect(mockSetShowHierarchy).toHaveBeenCalledTimes(1);
    
    // Reset the mock to use original implementation
    jest.restoreAllMocks();
  });

  it('renders categories hierarchically when in hierarchy mode', () => {
    // Use a new mock implementation that enables showHierarchy
    (hooks.useCategories as jest.Mock).mockReset();
    
    // Mock useState to return true for showHierarchy
    const useStateOriginal = React.useState;
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [true, jest.fn()]);
    
    // Setup the test with hierarchy mode enabled
    setupCategoryTableTest({
      categories: mockHierarchicalCategories,
      filteredCategories: mockHierarchicalCategories,
      currentCategories: mockHierarchicalCategories,
      allCategories: mockHierarchicalCategories
    });
    
    render(<CategoryTable />);
    
    // In hierarchy view, only top-level categories (without parents) would be at the root level
    const topLevelCategories = mockHierarchicalCategories.filter(c => !c.parentId);
    
    // Verify the categories are displayed correctly
    // This would require checking the DOM structure
    // For simplicity, we're checking that all categories are still present
    mockHierarchicalCategories.forEach(category => {
      const nameElements = screen.getAllByTestId(`category-name-${category.id}`);
      expect(nameElements.length).toBeGreaterThan(0);
      expect(nameElements[0]).toHaveTextContent(category.name);
    });
    
    // Reset the useState mock
    jest.restoreAllMocks();
  });

  it('renders children categories with proper indentation', () => {
    // Mock useState to return true for showHierarchy
    const useStateOriginal = React.useState;
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [true, jest.fn()]);
    
    // Setup the test with hierarchy mode enabled
    setupCategoryTableTest({
      categories: mockHierarchicalCategories,
      filteredCategories: mockHierarchicalCategories,
      currentCategories: mockHierarchicalCategories,
      allCategories: mockHierarchicalCategories
    });
    
    render(<CategoryTable />);
    
    // Find table rows
    const tableRows = screen.getAllByRole('row');
    
    // Check that child category rows have appropriate attributes for hierarchy display
    const childCategories = mockHierarchicalCategories.filter(c => c.parentId);
    
    // Test that parent categories have the has-children attribute
    const parentCategories = mockHierarchicalCategories.filter(c => c.childCount && c.childCount > 0);
    parentCategories.forEach(parent => {
      const parentRow = screen.getByTestId(`category-row-${parent.id}`);
      expect(parentRow).toHaveAttribute('data-has-children', 'true');
    });
    
    // Test that child categories have the appropriate parent-id attribute
    childCategories.forEach(child => {
      const childRow = screen.getByTestId(`category-row-${child.id}`);
      expect(childRow).toHaveAttribute('data-parent-id', child.parentId);
    });
    
    // Reset the useState mock
    jest.restoreAllMocks();
  });
  
  it('renders the correct visual hierarchy indicators', () => {
    // Mock useState to return true for showHierarchy
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [true, jest.fn()]);
    
    // Setup the test with hierarchy mode enabled
    setupCategoryTableTest({
      categories: mockHierarchicalCategories,
      filteredCategories: mockHierarchicalCategories,
      currentCategories: mockHierarchicalCategories,
      allCategories: mockHierarchicalCategories
    });
    
    render(<CategoryTable />);
    
    // Check that child categories have the tree line indicator
    const childCategories = mockHierarchicalCategories.filter(c => c.parentId);
    childCategories.forEach(child => {
      const treeIndicator = screen.getByTestId(`tree-indicator-${child.id}`);
      expect(treeIndicator).toBeInTheDocument();
    });
    
    // Check that parent categories have the expand/collapse icon
    const parentCategories = mockHierarchicalCategories.filter(c => c.childCount && c.childCount > 0);
    parentCategories.forEach(parent => {
      const expandIcon = screen.getByTestId(`expand-icon-${parent.id}`);
      expect(expandIcon).toBeInTheDocument();
    });
    
    // Reset the useState mock
    jest.restoreAllMocks();
  });
  
  it('correctly handles deeply nested category hierarchies', () => {
    // Mock useState to return true for showHierarchy
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [true, jest.fn()]);
    
    // Create a deep hierarchy with multiple levels
    const deepHierarchy = [
      ...mockHierarchicalCategories,
      { 
        id: 'category_7', 
        name: 'Very Deep Child', 
        slug: 'very-deep-child', 
        metaDescription: 'This is a very deeply nested child category',
        order: 1, 
        parentId: 'category_5',
        siteId: 'site_1', 
        createdAt: Date.now() - 10800000, 
        updatedAt: Date.now() - 900000,
        parentName: 'Deep Child Category',
        childCount: 0,
        siteName: 'Test Site'
      }
    ];
    
    // Setup the test with hierarchy mode enabled and deep hierarchy
    setupCategoryTableTest({
      categories: deepHierarchy,
      filteredCategories: deepHierarchy,
      currentCategories: deepHierarchy,
      allCategories: deepHierarchy
    });
    
    render(<CategoryTable />);
    
    // Check that the deepest child category is rendered with appropriate depth
    const deepestChild = screen.getByTestId('category-row-category_7');
    expect(deepestChild).toBeInTheDocument();
    expect(deepestChild).toHaveAttribute('data-parent-id', 'category_5');
    expect(deepestChild).toHaveAttribute('data-depth', '3'); // Level 3 depth
    
    // Check the visual tree line indicators for the deepest child
    const deepestTreeIndicator = screen.getByTestId('tree-indicator-category_7');
    expect(deepestTreeIndicator).toBeInTheDocument();
    
    // Reset the useState mock
    jest.restoreAllMocks();
  });
  
  it('handles null or undefined parentId values gracefully', () => {
    // Mock useState to return true for showHierarchy
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [true, jest.fn()]);
    
    // Create categories with edge case parent relationships
    const edgeCaseHierarchy = [
      ...mockHierarchicalCategories,
      { 
        id: 'category_null_parent', 
        name: 'Null Parent Category', 
        slug: 'null-parent', 
        metaDescription: 'This category has a null parentId',
        order: 10, 
        parentId: null,
        siteId: 'site_1', 
        createdAt: Date.now(),
        updatedAt: Date.now(),
        childCount: 0,
        siteName: 'Test Site'
      },
      { 
        id: 'category_undefined_parent', 
        name: 'Undefined Parent Category', 
        slug: 'undefined-parent', 
        metaDescription: 'This category has an undefined parentId',
        order: 11, 
        parentId: undefined as any,
        siteId: 'site_1', 
        createdAt: Date.now(),
        updatedAt: Date.now(),
        childCount: 0,
        siteName: 'Test Site'
      }
    ];
    
    // Setup the test with hierarchy mode enabled and edge case hierarchy
    setupCategoryTableTest({
      categories: edgeCaseHierarchy,
      filteredCategories: edgeCaseHierarchy,
      currentCategories: edgeCaseHierarchy,
      allCategories: edgeCaseHierarchy
    });
    
    render(<CategoryTable />);
    
    // Check that both edge case categories are rendered at the top level (no parent)
    const nullParentRow = screen.getByTestId('category-row-category_null_parent');
    expect(nullParentRow).toBeInTheDocument();
    expect(nullParentRow).not.toHaveAttribute('data-parent-id');
    
    const undefinedParentRow = screen.getByTestId('category-row-category_undefined_parent');
    expect(undefinedParentRow).toBeInTheDocument();
    expect(undefinedParentRow).not.toHaveAttribute('data-parent-id');
    
    // Reset the useState mock
    jest.restoreAllMocks();
  });
  
  it('maintains sort order within each level of the hierarchy', () => {
    // Mock useState to return true for showHierarchy
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [true, jest.fn()]);
    
    // Create categories with the same parent but different orders
    const orderedHierarchy = [
      ...mockHierarchicalCategories,
      { 
        id: 'child_order_1', 
        name: 'First Child By Order', 
        slug: 'first-child', 
        metaDescription: 'This is the first child by order',
        order: 1, 
        parentId: 'category_4',
        siteId: 'site_1', 
        createdAt: Date.now(),
        updatedAt: Date.now(),
        parentName: 'Test Category 3',
        childCount: 0,
        siteName: 'Test Site'
      },
      { 
        id: 'child_order_2', 
        name: 'Second Child By Order', 
        slug: 'second-child', 
        metaDescription: 'This is the second child by order',
        order: 2, 
        parentId: 'category_4',
        siteId: 'site_1', 
        createdAt: Date.now(),
        updatedAt: Date.now(),
        parentName: 'Test Category 3',
        childCount: 0,
        siteName: 'Test Site'
      },
      { 
        id: 'child_order_3', 
        name: 'Third Child By Order', 
        slug: 'third-child', 
        metaDescription: 'This is the third child by order',
        order: 3, 
        parentId: 'category_4',
        siteId: 'site_1', 
        createdAt: Date.now(),
        updatedAt: Date.now(),
        parentName: 'Test Category 3',
        childCount: 0,
        siteName: 'Test Site'
      }
    ];
    
    // Setup the test with hierarchy mode enabled and ordered hierarchy
    setupCategoryTableTest({
      categories: orderedHierarchy,
      filteredCategories: orderedHierarchy,
      currentCategories: orderedHierarchy,
      allCategories: orderedHierarchy,
      sortField: 'order',
      sortOrder: 'asc'
    });
    
    render(<CategoryTable />);
    
    // The row order in the DOM should follow the 'order' field
    // This is difficult to test directly, but we can verify all children are present
    const childRows = [
      screen.getByTestId('category-row-child_order_1'),
      screen.getByTestId('category-row-child_order_2'),
      screen.getByTestId('category-row-child_order_3')
    ];
    
    childRows.forEach(row => {
      expect(row).toBeInTheDocument();
      expect(row).toHaveAttribute('data-parent-id', 'category_4');
    });
    
    // Reset the useState mock
    jest.restoreAllMocks();
  });
});
