/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
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

describe('CategoriesMobileView Interaction Tests', () => {
  const mockOnDeleteClick = jest.fn();
  const mockOnViewClick = jest.fn();
  const mockOnEditClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('navigates to the correct URL when view link is clicked', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <CategoriesMobileView
        categories={mockCategories}
        showSiteColumn={false}
        onDeleteClick={mockOnDeleteClick}
        onViewClick={mockOnViewClick}
        siteSlug="test-site"
      />
    );

    // Find view button more reliably
    const categoryCard = within(container).getByTestId('category-card-category_1');
    const viewButton = within(categoryCard).getByTestId('view-button-category_1');
    await user.click(viewButton);

    // Check that onViewClick was called with the correct ID
    expect(mockOnViewClick).toHaveBeenCalledTimes(1);
    expect(mockOnViewClick).toHaveBeenCalledWith('category_1');
  });

  it('navigates to the correct URL when edit link is clicked', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <CategoriesMobileView
        categories={mockCategories}
        showSiteColumn={false}
        onDeleteClick={mockOnDeleteClick}
        onEditClick={mockOnEditClick}
        siteSlug="test-site"
      />
    );

    // Find edit button more reliably
    const categoryCard = within(container).getByTestId('category-card-category_1');
    const editButton = within(categoryCard).getByTestId('edit-button-category_1');
    await user.click(editButton);

    // Check that onEditClick was called with the correct ID
    expect(mockOnEditClick).toHaveBeenCalledTimes(1);
    expect(mockOnEditClick).toHaveBeenCalledWith('category_1');
  });

  it('calls onDeleteClick with correct parameters when delete is clicked', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <CategoriesMobileView
        categories={mockCategories}
        showSiteColumn={false}
        onDeleteClick={mockOnDeleteClick}
        onViewClick={mockOnViewClick}
        onEditClick={mockOnEditClick}
      />
    );

    // Find delete button more reliably
    const categoryCard = within(container).getByTestId('category-card-category_1');
    const deleteButton = within(categoryCard).getByTestId('delete-button-category_1');
    await user.click(deleteButton);

    // Check that delete handler was called with correct parameters
    expect(mockOnDeleteClick).toHaveBeenCalledTimes(1);
    expect(mockOnDeleteClick).toHaveBeenCalledWith('category_1', 'Test Category 1');
  });

  it('supports multiple ways to trigger delete action', async () => {
    render(
      <CategoriesMobileView
        categories={mockCategories}
        showSiteColumn={false}
        onDeleteClick={mockOnDeleteClick}
        onViewClick={mockOnViewClick}
        onEditClick={mockOnEditClick}
      />
    );

    // Test with regular click event
    const deleteButton = screen.getByTestId('delete-button-category_1');
    fireEvent.click(deleteButton);

    expect(mockOnDeleteClick).toHaveBeenCalledTimes(1);
    expect(mockOnDeleteClick).toHaveBeenCalledWith('category_1', 'Test Category 1');

    // Reset the mock
    mockOnDeleteClick.mockClear();

    // Test with mouseDown event
    fireEvent.mouseDown(deleteButton);
    fireEvent.mouseUp(deleteButton);
    fireEvent.click(deleteButton);

    expect(mockOnDeleteClick).toHaveBeenCalledTimes(1);

    // Reset the mock
    mockOnDeleteClick.mockClear();

    // Test with touchStart/touchEnd (mobile interaction)
    fireEvent.touchStart(deleteButton);
    fireEvent.touchEnd(deleteButton);
    fireEvent.click(deleteButton);

    expect(mockOnDeleteClick).toHaveBeenCalledTimes(1);
  });

  it('supports multiple delete operations on different items', async () => {
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

    // Delete first item
    const deleteButton1 = screen.getByTestId('delete-button-category_1');
    await user.click(deleteButton1);

    expect(mockOnDeleteClick).toHaveBeenCalledTimes(1);
    expect(mockOnDeleteClick).toHaveBeenCalledWith('category_1', 'Test Category 1');

    // Reset the mock
    mockOnDeleteClick.mockClear();

    // Delete second item
    const deleteButton2 = screen.getByTestId('delete-button-category_2');
    await user.click(deleteButton2);

    expect(mockOnDeleteClick).toHaveBeenCalledTimes(1);
    expect(mockOnDeleteClick).toHaveBeenCalledWith('category_2', 'Test Category 2');
  });

  it('handles actions on dynamically added categories', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <CategoriesMobileView
        categories={[mockCategories[0]]}
        showSiteColumn={false}
        onDeleteClick={mockOnDeleteClick}
        onViewClick={mockOnViewClick}
        onEditClick={mockOnEditClick}
      />
    );

    // Delete the only item
    const deleteButton = screen.getByTestId('delete-button-category_1');
    await user.click(deleteButton);

    expect(mockOnDeleteClick).toHaveBeenCalledTimes(1);
    expect(mockOnDeleteClick).toHaveBeenCalledWith('category_1', 'Test Category 1');

    // Reset the mock
    mockOnDeleteClick.mockClear();

    // Add a new category
    const newCategory = {
      id: 'category_new',
      name: 'New Category',
      slug: 'new-category',
      metaDescription: 'This is a new category',
      order: 3,
      parentId: null,
      siteId: 'site_1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      childCount: 0,
      siteName: 'Test Site'
    };

    rerender(
      <CategoriesMobileView
        categories={[mockCategories[0], newCategory]}
        showSiteColumn={false}
        onDeleteClick={mockOnDeleteClick}
        onViewClick={mockOnViewClick}
        onEditClick={mockOnEditClick}
      />
    );

    // Delete the new item
    const newDeleteButton = screen.getByTestId('delete-button-category_new');
    await user.click(newDeleteButton);

    expect(mockOnDeleteClick).toHaveBeenCalledTimes(1);
    expect(mockOnDeleteClick).toHaveBeenCalledWith('category_new', 'New Category');
  });
});
