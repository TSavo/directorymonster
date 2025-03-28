/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import the component
import { CategoryTableSortHeader } from '../../../../src/components/admin/categories/components';

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
    
    expect(screen.getByText('Name')).toBeInTheDocument();
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
    
    const icon = screen.getByTestId('sort-icon');
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
    
    const icon = screen.getByTestId('sort-icon');
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
    
    const button = screen.getByRole('button');
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
    
    const button = screen.getByRole('button');
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
    
    const button = screen.getByRole('button');
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
    
    const button = screen.getByRole('button');
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
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('focus:outline-none');
    expect(button).toHaveClass('focus:underline');
  });
});
