/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchBar from '@/components/search/SearchBar';
import '@testing-library/jest-dom';

// Mock SearchIcon component
jest.mock('../../src/components/search/SearchIcon', () => {
  return function MockSearchIcon(props: any) {
    return <div data-testid="mock-search-icon" {...props} />;
  };
});

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('SearchBar Component', () => {
  it('renders in collapsed state by default', () => {
    render(<SearchBar />);
    
    // Search icon button should be visible
    const searchButton = screen.getByLabelText('Open search');
    expect(searchButton).toBeInTheDocument();
    expect(searchButton).toHaveClass('block');
    
    // Input should not be visible (zero width)
    const inputContainer = searchButton.nextElementSibling;
    expect(inputContainer).toHaveClass('opacity-0 w-0 pointer-events-none');
  });

  it('renders in expanded state when expanded prop is true', () => {
    render(<SearchBar expanded={true} />);
    
    // Search icon button should be hidden (not removed)
    const searchButton = screen.queryByLabelText('Open search');
    expect(searchButton).toBeInTheDocument();
    expect(searchButton).toHaveClass('hidden');
    
    // Input should be visible
    const input = screen.getByRole('searchbox');
    const inputContainer = input.closest('div');
    expect(inputContainer).toHaveClass('opacity-100 w-60');
    
    // Close button should be visible
    const closeButton = screen.getByLabelText('Close search');
    expect(closeButton).toBeInTheDocument();
  });

  it('toggles between collapsed and expanded states when search button is clicked', () => {
    render(<SearchBar />);
    
    // Initially in collapsed state
    const searchButton = screen.getByLabelText('Open search');
    expect(searchButton).toHaveClass('block');
    
    // Click to expand
    fireEvent.click(searchButton);
    
    // Now should be expanded
    expect(searchButton).toHaveClass('hidden');
    
    // Input should be visible
    const input = screen.getByRole('searchbox');
    const inputContainer = input.closest('div');
    expect(inputContainer).toHaveClass('opacity-100 w-60');
    
    // Close button should be visible
    const closeButton = screen.getByLabelText('Close search');
    expect(closeButton).toBeInTheDocument();
    
    // Click to collapse
    fireEvent.click(closeButton);
    
    // Should be back to collapsed state
    const searchButtonAfterCollapse = screen.getByLabelText('Open search');
    expect(searchButtonAfterCollapse).toHaveClass('block');
    
    // Input container should be hidden again
    const inputContainerAfterCollapse = searchButtonAfterCollapse.nextElementSibling;
    expect(inputContainerAfterCollapse).toHaveClass('opacity-0 w-0 pointer-events-none');
  });

  it('handles user input', () => {
    render(<SearchBar expanded={true} />);
    
    const input = screen.getByRole('searchbox');
    
    // Simulate user typing
    fireEvent.change(input, { target: { value: 'test query' } });
    
    // Verify input value is updated
    expect(input).toHaveValue('test query');
  });

  it('calls router.push with correct URL when search is submitted', () => {
    const mockPush = jest.fn();
    jest.spyOn(require('next/navigation'), 'useRouter').mockImplementation(() => ({
      push: mockPush,
    }));
    
    render(<SearchBar expanded={true} />);
    
    const input = screen.getByRole('searchbox');
    const form = input.closest('form');
    
    // Enter valid query and submit
    fireEvent.change(input, { target: { value: 'valid search term' } });
    fireEvent.submit(form!);
    
    // Verify router.push is called with correct URL
    expect(mockPush).toHaveBeenCalledWith('/search?q=valid+search+term');
  });

  it('includes site ID in search URL when provided', () => {
    const mockPush = jest.fn();
    jest.spyOn(require('next/navigation'), 'useRouter').mockImplementation(() => ({
      push: mockPush,
    }));
    
    render(<SearchBar siteId="site123" expanded={true} />);
    
    const input = screen.getByRole('searchbox');
    const form = input.closest('form');
    
    // Enter valid query and submit
    fireEvent.change(input, { target: { value: 'test query' } });
    fireEvent.submit(form!);
    
    // Verify router.push is called with site ID in URL
    expect(mockPush).toHaveBeenCalledWith('/search?q=test+query&siteId=site123');
  });

  it('does not submit search if query is empty', () => {
    const mockPush = jest.fn();
    jest.spyOn(require('next/navigation'), 'useRouter').mockImplementation(() => ({
      push: mockPush,
    }));
    
    render(<SearchBar expanded={true} />);
    
    const input = screen.getByRole('searchbox');
    const form = input.closest('form');
    
    // Submit with empty query
    fireEvent.submit(form!);
    
    // Verify router.push is not called
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('does not submit search if all terms are too short', () => {
    const mockPush = jest.fn();
    jest.spyOn(require('next/navigation'), 'useRouter').mockImplementation(() => ({
      push: mockPush,
    }));
    
    render(<SearchBar expanded={true} />);
    
    const input = screen.getByRole('searchbox');
    const form = input.closest('form');
    
    // Enter query with only short terms
    fireEvent.change(input, { target: { value: 'a b c' } });
    fireEvent.submit(form!);
    
    // Verify router.push is not called
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('applies custom class name', () => {
    render(<SearchBar className="custom-class" />);
    
    const container = screen.getByRole('search').closest('div');
    expect(container).toHaveClass('custom-class');
  });

  it('has proper accessibility attributes', () => {
    render(<SearchBar />);
    
    // Form should have search role
    const form = screen.getByRole('search');
    expect(form).toBeInTheDocument();
    
    // Open search button should have proper aria-label
    const openButton = screen.getByLabelText('Open search');
    expect(openButton).toBeInTheDocument();
    
    // Expand and check expanded state accessibility
    fireEvent.click(openButton);
    
    // Input should have proper aria-label
    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('aria-label', 'Search query');
    
    // Submit button should have proper aria-label
    const submitButton = screen.getByLabelText('Submit search');
    expect(submitButton).toBeInTheDocument();
    
    // Close button should have proper aria-label
    const closeButton = screen.getByLabelText('Close search');
    expect(closeButton).toBeInTheDocument();
  });
});
