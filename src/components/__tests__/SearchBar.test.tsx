import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchBar from '../SearchBar';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('SearchBar Component', () => {
  it('renders the search form with input and button', () => {
    render(<SearchBar siteId="site-1" />);
    
    expect(screen.getByTestId('search-form')).toBeInTheDocument();
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    expect(screen.getByTestId('search-button')).toBeInTheDocument();
  });

  it('updates search term when user types', () => {
    render(<SearchBar siteId="site-1" />);
    
    const input = screen.getByTestId('search-input');
    
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
    
    render(<SearchBar siteId="site-1" />);
    
    const input = screen.getByTestId('search-input');
    const form = screen.getByTestId('search-form');
    
    // Enter valid query and submit
    fireEvent.change(input, { target: { value: 'test query' } });
    fireEvent.submit(form);
    
    // Verify router.push is called with correct URL
    expect(mockPush).toHaveBeenCalledWith('/search?q=test%20query&site=site-1');
  });

  it('does not submit search if query is empty', () => {
    const mockPush = jest.fn();
    jest.spyOn(require('next/navigation'), 'useRouter').mockImplementation(() => ({
      push: mockPush,
    }));
    
    render(<SearchBar siteId="site-1" />);
    
    const form = screen.getByTestId('search-form');
    
    // Submit with empty query
    fireEvent.submit(form);
    
    // Verify router.push is not called
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('does not submit search if query contains only whitespace', () => {
    const mockPush = jest.fn();
    jest.spyOn(require('next/navigation'), 'useRouter').mockImplementation(() => ({
      push: mockPush,
    }));
    
    render(<SearchBar siteId="site-1" />);
    
    const input = screen.getByTestId('search-input');
    const form = screen.getByTestId('search-form');
    
    // Enter query with only whitespace
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.submit(form);
    
    // Verify router.push is not called
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('has proper accessibility attributes', () => {
    render(<SearchBar siteId="site-1" />);
    
    // Input should have placeholder
    const input = screen.getByTestId('search-input');
    expect(input).toHaveAttribute('placeholder', 'Search...');
    
    // Button should have an SVG icon
    const button = screen.getByTestId('search-button');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });
});
