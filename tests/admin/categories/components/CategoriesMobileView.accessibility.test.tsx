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
  },
  {
    id: 'category_3',
    name: 'Child Category',
    slug: 'child-category',
    metaDescription: 'This is a child category',
    order: 1,
    parentId: 'category_1',
    siteId: 'site_1',
    createdAt: Date.now() - 43200000,
    updatedAt: Date.now() - 1800000,
    parentName: 'Test Category 1',
    childCount: 0,
    siteName: 'Test Site'
  },
  {
    id: 'category_4',
    name: 'Empty Description',
    slug: 'empty-description',
    metaDescription: '',
    order: 3,
    parentId: null,
    siteId: 'site_1',
    createdAt: Date.now() - 21600000,
    updatedAt: Date.now() - 900000,
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

describe('CategoriesMobileView Accessibility Tests', () => {
  const mockOnDeleteClick = jest.fn();
  const defaultProps = {
    categories: mockCategories,
    showSiteColumn: false,
    onDeleteClick: mockOnDeleteClick
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides proper semantic structure with article elements for each category card', () => {
    render(<CategoriesMobileView {...defaultProps} />);

    // Check that each card uses the semantic article element
    const articleElements = screen.getAllByRole('article');
    expect(articleElements).toHaveLength(mockCategories.length);

    // Verify each article has a heading
    articleElements.forEach((article, index) => {
      const heading = within(article).getByRole('heading');
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent(mockCategories[index].name);
    });
  });

  it('ensures action buttons are keyboard accessible', async () => {
    const user = userEvent.setup();
    render(<CategoriesMobileView {...defaultProps} />);

    // Get all the action buttons for the first category
    const viewButton = screen.getByTestId('view-button-category_1');
    const editButton = screen.getByTestId('edit-button-category_1');
    const deleteButton = screen.getByTestId('delete-button-category_1');

    // Focus and activate the delete button with keyboard
    await user.tab(); // First tab should move focus to the view button
    expect(document.activeElement).toBe(viewButton);

    await user.tab(); // Second tab should move focus to the edit button
    expect(document.activeElement).toBe(editButton);

    await user.tab(); // Third tab should move focus to the delete button
    expect(document.activeElement).toBe(deleteButton);

    // Activate the delete button with Space key
    await user.keyboard(' ');
    expect(mockOnDeleteClick).toHaveBeenCalledTimes(1);
    expect(mockOnDeleteClick).toHaveBeenCalledWith('category_1', 'Test Category 1');

    // Reset the mock
    mockOnDeleteClick.mockClear();

    // Test Enter key on another button
    await user.tab(); // Tab to next category's view button
    await user.tab(); // Tab to next category's edit button
    await user.tab(); // Tab to next category's delete button
    expect(document.activeElement).toBe(screen.getByTestId('delete-button-category_2'));

    await user.keyboard('{Enter}');
    expect(mockOnDeleteClick).toHaveBeenCalledTimes(1);
    expect(mockOnDeleteClick).toHaveBeenCalledWith('category_2', 'Test Category 2');
  });

  it('maintains keyboard focus order across multiple category cards', async () => {
    const user = userEvent.setup();
    render(<CategoriesMobileView {...defaultProps} />);

    // Tab through all interactive elements sequentially
    const expectedFocusOrder = [
      'view-button-category_1',
      'edit-button-category_1',
      'delete-button-category_1',
      'view-button-category_2',
      'edit-button-category_2',
      'delete-button-category_2',
      'view-button-category_3',
      'edit-button-category_3',
      'delete-button-category_3',
      'view-button-category_4',
      'edit-button-category_4',
      'delete-button-category_4'
    ];

    // Tab through all interactive elements
    for (let i = 0; i < expectedFocusOrder.length; i++) {
      await user.tab();
      expect(document.activeElement).toBe(screen.getByTestId(expectedFocusOrder[i]));
    }
  });

  it('handles empty metadata gracefully for accessibility', () => {
    render(<CategoriesMobileView {...defaultProps} />);

    // Find the category with empty description
    const emptyDescriptionCard = screen.getByTestId('category-card-category_4');
    expect(emptyDescriptionCard).toBeInTheDocument();

    // Verify the name is still displayed correctly
    const nameElement = within(emptyDescriptionCard).getByTestId('category-name-category_4');
    expect(nameElement).toHaveTextContent('Empty Description');

    // Verify other information is displayed properly even with missing metadata
    const orderValue = within(emptyDescriptionCard).getByTestId('order-value-category_4');
    expect(orderValue).toHaveTextContent('3');

    // Verify date is still formatted properly
    const dateElement = within(emptyDescriptionCard).getByTestId('updated-date-category_4');
    expect(dateElement.textContent).toMatch(/\w+\s\d+,\s\d{4}/);
  });

  it('handles special characters in category names properly', () => {
    // Create a new set of categories with special characters in names
    const specialCharCategories = [
      ...mockCategories.slice(0, 1),
      {
        ...mockCategories[1],
        name: 'Test & Category <script>alert("XSS")</script>',
      }
    ];

    render(<CategoriesMobileView
      categories={specialCharCategories}
      showSiteColumn={false}
      onDeleteClick={mockOnDeleteClick}
    />);

    // Verify the name with special characters renders correctly
    const nameElement = screen.getByTestId('category-name-category_2');
    expect(nameElement).toHaveTextContent('Test & Category <script>alert("XSS")</script>');

    // Ensure no script execution (this would be handled by React naturally)
    expect(document.querySelector('script')).not.toBeInTheDocument();
  });

  it('handles edge case of very long category names', () => {
    // Create a category with a very long name
    const longNameCategories = [
      ...mockCategories.slice(0, 1),
      {
        ...mockCategories[1],
        name: 'This is an extremely long category name that might cause layout issues if not handled properly with text overflow or wrapping strategies',
      }
    ];

    render(<CategoriesMobileView
      categories={longNameCategories}
      showSiteColumn={false}
      onDeleteClick={mockOnDeleteClick}
    />);

    // Verify the long name renders
    const nameElement = screen.getByTestId('category-name-category_2');
    expect(nameElement).toHaveTextContent('This is an extremely long category name that might cause layout issues if not handled properly with text overflow or wrapping strategies');

    // No specific assertions for overflow handling as that's a CSS concern
    // We're just ensuring it renders without errors
  });

  it('preserves parent-child relationships for accessibility and comprehension', () => {
    render(<CategoriesMobileView {...defaultProps} />);

    // Find the child category
    const childCategory = screen.getByTestId('category-card-category_3');

    // Verify parent label is present for a11y
    const parentLabel = within(childCategory).getByTestId('parent-label');
    expect(parentLabel).toHaveTextContent('Parent:');

    // Verify parent name is associated
    const parentName = within(childCategory).getByTestId('parent-name-category_3');
    expect(parentName).toHaveTextContent('Test Category 1');

    // Verify they're adjacent for screen reader context
    expect(parentLabel.nextSibling).toBe(parentName);
  });

  it('ensures site information appears consistently when enabled', () => {
    render(<CategoriesMobileView {...defaultProps} showSiteColumn={true} />);

    // Should show site labels for all categories
    const siteLabels = screen.getAllByTestId('site-label');
    expect(siteLabels).toHaveLength(mockCategories.length);

    // Each should have the correct label for screen readers
    siteLabels.forEach(label => {
      expect(label).toHaveTextContent('Site:');
    });

    // Each should have a corresponding site name
    mockCategories.forEach(category => {
      const siteNameElement = screen.getByTestId(`site-name-${category.id}`);
      expect(siteNameElement).toHaveTextContent('Test Site');
    });
  });

  it('handles empty arrays gracefully', () => {
    render(<CategoriesMobileView
      categories={[]}
      showSiteColumn={false}
      onDeleteClick={mockOnDeleteClick}
    />);

    // Container should be present but empty
    const container = screen.getByTestId('categories-mobile-view');
    expect(container).toBeInTheDocument();
    expect(container.children).toHaveLength(0);
  });

  it('displays action buttons with accessible hover and focus states', async () => {
    render(<CategoriesMobileView {...defaultProps} />);

    // Get one of each action button type
    const viewButton = screen.getByTestId('view-button-category_1');
    const editButton = screen.getByTestId('edit-button-category_1');
    const deleteButton = screen.getByTestId('delete-button-category_1');

    // Verify buttons have different colors for action differentiation
    // Check that each has a different color class (not testing specific colors as they may change)
    const viewButtonClass = viewButton.className;
    const editButtonClass = editButton.className;
    const deleteButtonClass = deleteButton.className;

    // Verify buttons are visually distinct (have different class names)
    expect(viewButtonClass).not.toBe(editButtonClass);
    expect(viewButtonClass).not.toBe(deleteButtonClass);
    expect(editButtonClass).not.toBe(deleteButtonClass);

    // Verify view button contains the word "View" for screen readers
    expect(viewButton).toHaveTextContent('View');

    // Verify edit button contains the word "Edit" for screen readers
    expect(editButton).toHaveTextContent('Edit');

    // Verify delete button contains the word "Delete" for screen readers
    expect(deleteButton).toHaveTextContent('Delete');
  });
});
