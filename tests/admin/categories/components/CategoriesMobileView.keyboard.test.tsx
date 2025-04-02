/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
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

describe('CategoriesMobileView Keyboard Accessibility Tests', () => {
  const mockOnDeleteClick = jest.fn();
  const mockOnViewClick = jest.fn();
  const mockOnEditClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('supports keyboard navigation for action links', async () => {
    const user = userEvent.setup();

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

    // Tab to the first actionable element
    await user.tab();
    expect(document.activeElement).toBe(screen.getByTestId('view-button-category_1'));

    // Activate with Enter key
    await user.keyboard('{Enter}');
    expect(mockOnViewClick).toHaveBeenCalledTimes(1);
    expect(mockOnViewClick).toHaveBeenCalledWith('category_1');

    // Reset mock
    mockOnViewClick.mockClear();

    // Tab to edit button
    await user.tab();
    expect(document.activeElement).toBe(screen.getByTestId('edit-button-category_1'));

    // Activate with Enter key
    await user.keyboard('{Enter}');
    expect(mockOnEditClick).toHaveBeenCalledTimes(1);
    expect(mockOnEditClick).toHaveBeenCalledWith('category_1');

    // Tab to delete button
    await user.tab();
    expect(document.activeElement).toBe(screen.getByTestId('delete-button-category_1'));

    // Activate with Space key
    await user.keyboard(' ');
    expect(mockOnDeleteClick).toHaveBeenCalledTimes(1);
    expect(mockOnDeleteClick).toHaveBeenCalledWith('category_1', 'Test Category 1');
  });

  it('maintains keyboard focus order across multiple category cards', async () => {
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

    // Tab through all interactive elements sequentially
    const expectedFocusOrder = [
      'view-button-category_1',
      'edit-button-category_1',
      'delete-button-category_1',
      'view-button-category_2',
      'edit-button-category_2',
      'delete-button-category_2'
    ];

    // Tab through all interactive elements
    for (let i = 0; i < expectedFocusOrder.length; i++) {
      await user.tab();
      expect(document.activeElement).toBe(screen.getByTestId(expectedFocusOrder[i]));
    }
  });

  it('supports Enter key activation for links', async () => {
    const user = userEvent.setup();

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

    // Tab to the first button
    await user.tab();
    expect(document.activeElement).toBe(screen.getByTestId('view-button-category_1'));

    // Activate with Enter key
    await user.keyboard('{Enter}');
    expect(mockOnViewClick).toHaveBeenCalledTimes(1);
    expect(mockOnViewClick).toHaveBeenCalledWith('category_1');
  });

  it('supports Space key activation for delete buttons', async () => {
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

    // Tab to the first delete button (3rd tab as it comes after view and edit buttons)
    await user.tab(); // View button
    await user.tab(); // Edit button
    await user.tab(); // Delete button
    expect(document.activeElement).toBe(screen.getByTestId('delete-button-category_1'));

    // Activate with Space key
    await user.keyboard(' ');
    expect(mockOnDeleteClick).toHaveBeenCalledTimes(1);
    expect(mockOnDeleteClick).toHaveBeenCalledWith('category_1', 'Test Category 1');
  });

  it('can tab backwards through interactive elements', async () => {
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

    // First tab through all elements to reach the end
    await user.tab(); // View button 1
    await user.tab(); // Edit button 1
    await user.tab(); // Delete button 1
    await user.tab(); // View button 2
    await user.tab(); // Edit button 2
    await user.tab(); // Delete button 2

    // Now tab backwards and check focus order is reversed
    await user.keyboard('{Shift>}{Tab}{/Shift}'); // Shift+Tab
    expect(document.activeElement).toBe(screen.getByTestId('edit-button-category_2'));

    await user.keyboard('{Shift>}{Tab}{/Shift}'); // Shift+Tab
    expect(document.activeElement).toBe(screen.getByTestId('view-button-category_2'));

    await user.keyboard('{Shift>}{Tab}{/Shift}'); // Shift+Tab
    expect(document.activeElement).toBe(screen.getByTestId('delete-button-category_1'));
  });

  it('handles keyboard focus with empty category list', async () => {
    const user = userEvent.setup();

    render(
      <CategoriesMobileView
        categories={[]}
        showSiteColumn={false}
        onDeleteClick={mockOnDeleteClick}
        onViewClick={mockOnViewClick}
        onEditClick={mockOnEditClick}
      />
    );

    // Tab should move focus to the next element after the component
    // since there are no interactive elements in the empty component
    await user.tab();

    // There should be no focused elements within our component since it's empty
    const container = screen.getByTestId('categories-mobile-view');
    const focusedElementsInContainer = container.querySelectorAll(':focus');
    expect(focusedElementsInContainer.length).toBe(0);
  });

  it('supports both Enter and Space key activation for buttons', async () => {
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

    // Tab to delete button
    await user.tab(); // View button
    await user.tab(); // Edit button
    await user.tab(); // Delete button
    expect(document.activeElement).toBe(screen.getByTestId('delete-button-category_1'));

    // Activate with Enter key
    await user.keyboard('{Enter}');
    expect(mockOnDeleteClick).toHaveBeenCalledTimes(1);
    expect(mockOnDeleteClick).toHaveBeenCalledWith('category_1', 'Test Category 1');

    mockOnDeleteClick.mockClear();

    // Tab to the next delete button
    await user.tab(); // View button 2
    await user.tab(); // Edit button 2
    await user.tab(); // Delete button 2
    expect(document.activeElement).toBe(screen.getByTestId('delete-button-category_2'));

    // Activate with Space key
    await user.keyboard(' ');
    expect(mockOnDeleteClick).toHaveBeenCalledTimes(1);
    expect(mockOnDeleteClick).toHaveBeenCalledWith('category_2', 'Test Category 2');
  });
});
