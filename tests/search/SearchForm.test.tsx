/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchForm from '@/components/search/SearchForm';
import '@testing-library/jest-dom';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('SearchForm Component', () => {
  it('renders with default props', () => {
    render(<SearchForm />);
    
    // Verify input and button are rendered
    const input = screen.getByRole('searchbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Search...');
    
    const button = screen.getByRole('button', { name: /search/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Search');
  });

  it('renders with custom props', () => {
    render(
      <SearchForm 
        placeholder="Custom placeholder" 
        buttonText="Find" 
        className="custom-class"
      />
    );
    
    // Verify custom placeholder and button text
    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('placeholder', 'Custom placeholder');
    
    // Find button by type instead of text content
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Find');
    
    // Verify custom class is applied
    const form = screen.getByRole('search');
    expect(form).toHaveClass('custom-class');
  });

  it('handles user input', () => {
    render(<SearchForm />);
    
    const input = screen.getByRole('searchbox');
    
    // Simulate user typing
    fireEvent.change(input, { target: { value: 'test query' } });
    
    // Verify input value is updated
    expect(input).toHaveValue('test query');
  });

  it('shows validation error for empty search', () => {
    render(<SearchForm />);
    
    // Submit without entering a query
    const button = screen.getByRole('button', { name: /search/i });
    fireEvent.click(button);
    
    // Verify error message is shown
    const errorMessage = screen.getByText('Please enter a search term');
    expect(errorMessage).toBeInTheDocument();
  });

  it('shows validation error for short search terms', () => {
    render(<SearchForm minQueryLength={3} />);
    
    const input = screen.getByRole('searchbox');
    
    // Enter query with terms less than minimum length
    fireEvent.change(input, { target: { value: 'a b' } });
    
    // Submit the form
    const button = screen.getByRole('button', { name: /search/i });
    fireEvent.click(button);
    
    // Verify error message is shown
    const errorMessage = screen.getByText(/search terms must be at least 3 characters long/i);
    expect(errorMessage).toBeInTheDocument();
  });

  it('calls router.push with correct URL for valid search', () => {
    const mockPush = jest.fn();
    jest.spyOn(require('next/navigation'), 'useRouter').mockImplementation(() => ({
      push: mockPush,
    }));
    
    render(<SearchForm />);
    
    const input = screen.getByRole('searchbox');
    const button = screen.getByRole('button', { name: /search/i });
    
    // Enter valid query and submit
    fireEvent.change(input, { target: { value: 'valid search term' } });
    fireEvent.click(button);
    
    // Verify router.push is called with correct URL
    expect(mockPush).toHaveBeenCalledWith('/search?q=valid+search+term');
  });

  it('includes site ID in search URL when provided', () => {
    const mockPush = jest.fn();
    jest.spyOn(require('next/navigation'), 'useRouter').mockImplementation(() => ({
      push: mockPush,
    }));
    
    render(<SearchForm siteId="site123" />);
    
    const input = screen.getByRole('searchbox');
    const button = screen.getByRole('button', { name: /search/i });
    
    // Enter valid query and submit
    fireEvent.change(input, { target: { value: 'test query' } });
    fireEvent.click(button);
    
    // Verify router.push is called with site ID in URL
    expect(mockPush).toHaveBeenCalledWith('/search?q=test+query&siteId=site123');
  });

  it('clears error message when valid search is submitted', async () => {
    const mockPush = jest.fn();
    jest.spyOn(require('next/navigation'), 'useRouter').mockImplementation(() => ({
      push: mockPush,
    }));
    
    render(<SearchForm />);
    
    const input = screen.getByRole('searchbox');
    const button = screen.getByRole('button', { name: /search/i });
    
    // First submit an invalid search
    fireEvent.click(button);
    
    // Verify error is shown
    let errorMessage = screen.getByText('Please enter a search term');
    expect(errorMessage).toBeInTheDocument();
    
    // Now enter a valid search term
    fireEvent.change(input, { target: { value: 'valid search term' } });
    fireEvent.click(button);
    
    // Verify error is no longer in the document
    expect(screen.queryByText('Please enter a search term')).not.toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<SearchForm />);
    
    // Check form has proper role and ARIA label
    const form = screen.getByRole('search');
    expect(form).toHaveAttribute('aria-label', 'Site search');
    
    // Check input has proper ARIA attributes
    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('aria-label', 'Search query');
    expect(input).toHaveAttribute('aria-required', 'true');
    
    // Initially, the input should have aria-invalid="false" (not invalid)
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(input).not.toHaveAttribute('aria-describedby');
    
    // Submit form without query to trigger validation error
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Now input should have error-related ARIA attributes
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'search-error');
    
    // Error message should have appropriate ID and role
    const errorMessage = screen.getByText('Please enter a search term');
    expect(errorMessage).toHaveAttribute('id', 'search-error');
    expect(errorMessage).toHaveAttribute('role', 'alert');
  });
});
