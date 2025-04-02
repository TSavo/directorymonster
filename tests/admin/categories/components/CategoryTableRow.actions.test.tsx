/**
 * @jest-environment jsdom
 */
import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

// Import test helpers and category test data
import { renderWithTableContext } from '../../../utils/testHelpers';
import { mockCategory, mockCategoryWithSiteSlug, mockDeleteClick } from '../../../fixtures/categoryFixtures';

// Import the component
import { CategoryTableRow } from '@/components/admin/categories/components';

// Mock next/link
jest.mock('next/link', () => {
  // eslint-disable-next-line react/display-name
  return ({ children, href, className }) => (
    <a href={href} data-testid="next-link" className={className}>{children}</a>
  );
});

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

/**
 * Tests for CategoryTableRow action buttons and interactions
 * 
 * This file focuses on testing the action buttons (view, edit, delete),
 * their URLs, click handlers, and keyboard interactions.
 */
describe('CategoryTableRow Component - Action Buttons and Interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset any lingering focus from previous tests
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });

  it('generates correct URLs for view and edit actions', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategory} 
        showSiteColumn={false} 
        onDeleteClick={mockDeleteClick} 
      />
    );
    
    // Check View link URL
    const viewLink = screen.getAllByRole('link')[0];
    expect(viewLink).toHaveTextContent('View');
    expect(viewLink).toHaveAttribute('href', `/admin/categories/${mockCategory.id}`);
    
    // Check Edit link URL
    const editLink = screen.getAllByRole('link')[1];
    expect(editLink).toHaveTextContent('Edit');
    expect(editLink).toHaveAttribute('href', `/admin/categories/${mockCategory.id}/edit`);
  });
  
  it('generates site-specific URLs when siteSlug is provided', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategoryWithSiteSlug} 
        showSiteColumn={false} 
        onDeleteClick={mockDeleteClick} 
      />
    );
    
    // Check View link with site-specific URL
    const viewLink = screen.getAllByRole('link')[0];
    expect(viewLink).toHaveAttribute('href', `/admin/sites/${mockCategoryWithSiteSlug.siteSlug}/categories/${mockCategoryWithSiteSlug.slug}`);
    
    // Check Edit link with site-specific URL
    const editLink = screen.getAllByRole('link')[1];
    expect(editLink).toHaveAttribute('href', `/admin/sites/${mockCategoryWithSiteSlug.siteSlug}/categories/${mockCategoryWithSiteSlug.id}/edit`);
  });
  
  it('calls onDeleteClick when delete button is clicked', async () => {
    const user = userEvent.setup();
    
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategory} 
        showSiteColumn={false} 
        onDeleteClick={mockDeleteClick} 
      />
    );
    
    // Find and click delete button using testid
    const deleteButton = screen.getByTestId(`delete-button-${mockCategory.id}`);
    await user.click(deleteButton);
    
    // Verify callback was called with correct arguments
    expect(mockDeleteClick).toHaveBeenCalledTimes(1);
    expect(mockDeleteClick).toHaveBeenCalledWith(mockCategory.id, mockCategory.name);
  });
  
  it('triggers delete action when Enter key is pressed on delete button', async () => {
    const user = userEvent.setup();
    
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategory} 
        showSiteColumn={false} 
        onDeleteClick={mockDeleteClick} 
      />
    );
    
    // Find delete button using testid
    const deleteButton = screen.getByTestId(`delete-button-${mockCategory.id}`);
    
    // Focus and press Enter
    deleteButton.focus();
    expect(document.activeElement).toBe(deleteButton);
    await user.keyboard('{Enter}');
    
    // Verify callback was called
    expect(mockDeleteClick).toHaveBeenCalledTimes(1);
    expect(mockDeleteClick).toHaveBeenCalledWith(mockCategory.id, mockCategory.name);
  });
  
  it('triggers delete action when Space key is pressed on delete button', async () => {
    const user = userEvent.setup();
    
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategory} 
        showSiteColumn={false} 
        onDeleteClick={mockDeleteClick} 
      />
    );
    
    // Find delete button using testid
    const deleteButton = screen.getByTestId(`delete-button-${mockCategory.id}`);
    
    // Focus and press Space
    deleteButton.focus();
    expect(document.activeElement).toBe(deleteButton);
    await user.keyboard(' ');
    
    // Verify callback was called
    expect(mockDeleteClick).toHaveBeenCalledTimes(1);
    expect(mockDeleteClick).toHaveBeenCalledWith(mockCategory.id, mockCategory.name);
  });
  
  it('provides proper keyboard navigation between action buttons', async () => {
    const user = userEvent.setup();
    
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategory} 
        showSiteColumn={false} 
        onDeleteClick={mockDeleteClick} 
      />
    );
    
    // Get all interactive elements
    const viewLink = screen.getAllByRole('link')[0];
    const editLink = screen.getAllByRole('link')[1];
    const deleteButton = screen.getByTestId(`delete-button-${mockCategory.id}`);
    
    // Test tabbing through interactive elements
    viewLink.focus();
    expect(document.activeElement).toBe(viewLink);
    
    await user.tab();
    expect(document.activeElement).toBe(editLink);
    
    await user.tab();
    expect(document.activeElement).toBe(deleteButton);
  });
  
  it('applies proper visual distinction between action buttons', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategory}
        showSiteColumn={false}
        onDeleteClick={mockDeleteClick}
      />
    );
    
    // Get action buttons by content
    const viewLink = screen.getByText('View').closest('a');
    const editLink = screen.getByText('Edit').closest('a');
    const deleteButton = screen.getByText('Delete').closest('button');
    
    // Verify view button has blue styling
    expect(viewLink).toHaveClass('bg-blue-50');
    expect(viewLink).toHaveClass('text-blue-600');
    
    // Verify edit button has green styling
    expect(editLink).toHaveClass('bg-green-50');
    expect(editLink).toHaveClass('text-green-600');
    
    // Verify delete button has red styling
    expect(deleteButton).toHaveClass('bg-red-50');
    expect(deleteButton).toHaveClass('text-red-600');
  });
  
  it('provides hover states for action buttons', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategory}
        showSiteColumn={false}
        onDeleteClick={mockDeleteClick}
      />
    );
    
    // Get action buttons
    const viewLink = screen.getByText('View').closest('a');
    const editLink = screen.getByText('Edit').closest('a');
    const deleteButton = screen.getByText('Delete').closest('button');
    
    // Verify hover classes
    expect(viewLink).toHaveClass('hover:bg-blue-100');
    expect(editLink).toHaveClass('hover:bg-green-100');
    expect(deleteButton).toHaveClass('hover:bg-red-100');
  });
});
