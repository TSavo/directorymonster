/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import the component
import { CategoryTableSortHeader } from '@/components/admin/categories/components';

describe('CategoryTableSortHeader Component', () => {
  const mockOnSort = jest.fn();
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders the header with correct label', () => {
    render(
      <table>
        <thead>
          <tr>
            <CategoryTableSortHeader
              label="Name"
              field="name"
              currentSortField="order"
              currentSortOrder="asc"
              onSort={mockOnSort}
            />
          </tr>
        </thead>
      </table>
    );
    
    const labelElement = screen.getByTestId('sort-label-name');
    expect(labelElement).toBeInTheDocument();
    expect(labelElement).toHaveTextContent('Name');
  });
  
  it('highlights the header when it is the current sort field', () => {
    render(
      <table>
        <thead>
          <tr>
            <CategoryTableSortHeader
              label="Name"
              field="name"
              currentSortField="name" // Same as field
              currentSortOrder="asc"
              onSort={mockOnSort}
            />
          </tr>
        </thead>
      </table>
    );
    
    const icon = screen.getByTestId('sort-icon-name');
    expect(icon).toHaveClass('text-blue-500');
  });
  
  it('does not highlight the header when it is not the current sort field', () => {
    render(
      <table>
        <thead>
          <tr>
            <CategoryTableSortHeader
              label="Name"
              field="name"
              currentSortField="order" // Different from field
              currentSortOrder="asc"
              onSort={mockOnSort}
            />
          </tr>
        </thead>
      </table>
    );
    
    const icon = screen.getByTestId('sort-icon-name');
    expect(icon).toHaveClass('text-gray-400');
  });
  
  it('calls onSort with the correct field when clicked', () => {
    render(
      <table>
        <thead>
          <tr>
            <CategoryTableSortHeader
              label="Name"
              field="name"
              currentSortField="order"
              currentSortOrder="asc"
              onSort={mockOnSort}
            />
          </tr>
        </thead>
      </table>
    );
    
    const button = screen.getByTestId('sort-button-name');
    fireEvent.click(button);
    
    expect(mockOnSort).toHaveBeenCalledTimes(1);
    expect(mockOnSort).toHaveBeenCalledWith('name');
  });
  
  it('has proper ARIA attributes for accessibility', () => {
    render(
      <table>
        <thead>
          <tr>
            <CategoryTableSortHeader
              label="Name"
              field="name"
              currentSortField="name"
              currentSortOrder="asc"
              onSort={mockOnSort}
            />
          </tr>
        </thead>
      </table>
    );
    
    const button = screen.getByTestId('sort-button-name');
    expect(button).toHaveAttribute('aria-label', 'Sort by Name (currently sorted asc)');
  });
  
  it('indicates descending sort order in ARIA label when currentSortOrder is desc', () => {
    render(
      <table>
        <thead>
          <tr>
            <CategoryTableSortHeader
              label="Name"
              field="name"
              currentSortField="name"
              currentSortOrder="desc"
              onSort={mockOnSort}
            />
          </tr>
        </thead>
      </table>
    );
    
    const button = screen.getByTestId('sort-button-name');
    expect(button).toHaveAttribute('aria-label', 'Sort by Name (currently sorted desc)');
  });
  
  it('does not indicate sort order in ARIA label when it is not the current sort field', () => {
    render(
      <table>
        <thead>
          <tr>
            <CategoryTableSortHeader
              label="Name"
              field="name"
              currentSortField="order" // Different from field
              currentSortOrder="asc"
              onSort={mockOnSort}
            />
          </tr>
        </thead>
      </table>
    );
    
    const button = screen.getByTestId('sort-button-name');
    expect(button).toHaveAttribute('aria-label', 'Sort by Name');
  });
  
  it('has accessible focus states', () => {
    render(
      <table>
        <thead>
          <tr>
            <CategoryTableSortHeader
              label="Name"
              field="name"
              currentSortField="name"
              currentSortOrder="asc"
              onSort={mockOnSort}
            />
          </tr>
        </thead>
      </table>
    );
    
    const button = screen.getByTestId('sort-button-name');
    
    // Check for focus-related CSS classes without tight coupling to specific implementation
    const className = button.getAttribute('class') || '';
    expect(className).toMatch(/focus:/); // Verify some focus handling exists
    
    // We're specifically looking for focus styles for accessibility
    expect(className).toMatch(/focus:(outline|underline)/);
  });
  
  it('renders with proper semantic structure', () => {
    render(
      <table>
        <thead>
          <tr>
            <CategoryTableSortHeader
              label="Name"
              field="name"
              currentSortField="order"
              currentSortOrder="asc"
              onSort={mockOnSort}
            />
          </tr>
        </thead>
      </table>
    );
    
    // Check the proper semantic tag is used
    const header = screen.getByTestId('sort-header-name');
    expect(header.tagName).toBe('TH');
    expect(header).toHaveAttribute('scope', 'col');
    
    // Verify the button structure
    const button = screen.getByTestId('sort-button-name');
    expect(button.tagName).toBe('BUTTON');
    
    // Verify icon has proper accessibility attribute
    const icon = screen.getByTestId('sort-icon-name');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });
});
