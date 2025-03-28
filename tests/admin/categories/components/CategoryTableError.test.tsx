/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CategoryTableError } from '../../../../src/components/admin/categories/components';

describe('CategoryTableError Component', () => {
  const mockOnRetry = jest.fn();
  const errorMessage = 'Failed to fetch categories: API error';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders the error message correctly', () => {
    render(<CategoryTableError error={errorMessage} onRetry={mockOnRetry} />);
    
    expect(screen.getByTestId('error-title')).toHaveTextContent('Error Loading Categories');
    expect(screen.getByTestId('error-message')).toHaveTextContent(errorMessage);
    
    // Verify the overall structure
    const errorContainer = screen.getByTestId('error-container');
    const errorBox = errorContainer.firstChild;
    expect(errorContainer).toContainElement(errorBox as HTMLElement);
  });
  
  it('calls onRetry function when retry button is clicked', () => {
    render(<CategoryTableError error={errorMessage} onRetry={mockOnRetry} />);
    
    const retryButton = screen.getByTestId('retry-button');
    fireEvent.click(retryButton);
    
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });
  
  it('handles the case when onRetry is not provided', () => {
    // This should not throw an error
    render(<CategoryTableError error={errorMessage} onRetry={undefined} />);
    
    const retryButton = screen.getByTestId('retry-button');
    expect(() => fireEvent.click(retryButton)).not.toThrow();
  });
  
  it('has proper accessibility attributes', () => {
    render(<CategoryTableError error={errorMessage} onRetry={mockOnRetry} />);
    
    // Alert role for accessibility
    const errorContainer = screen.getByTestId('error-container');
    expect(errorContainer).toHaveAttribute('role', 'alert');
    expect(errorContainer).toHaveAttribute('aria-live', 'assertive');
    
    // Retry button accessibility
    const retryButton = screen.getByTestId('retry-button');
    expect(retryButton).toHaveAttribute('aria-label', 'Retry loading categories');
    expect(retryButton).toHaveTextContent('Try Again');
  });
  
  it('uses appropriate colors for error state', () => {
    render(<CategoryTableError error={errorMessage} onRetry={mockOnRetry} />);
    
    const errorContainer = screen.getByTestId('error-container');
    const errorBox = errorContainer.firstChild as HTMLElement;
    
    expect(errorBox).toHaveClass('bg-red-50');
    expect(errorBox).toHaveClass('border-red-200');
    
    const errorTitle = screen.getByTestId('error-title');
    expect(errorTitle).toHaveClass('text-red-800');
    
    const errorText = screen.getByTestId('error-message');
    expect(errorText).toHaveClass('text-red-600');
    
    // Retry button colors
    const retryButton = screen.getByTestId('retry-button');
    expect(retryButton).toHaveClass('bg-red-600');
    expect(retryButton).toHaveClass('text-white');
    expect(retryButton).toHaveClass('hover:bg-red-700');
  });
  
  it('supports keyboard interaction and focus states', () => {
    render(<CategoryTableError error={errorMessage} onRetry={mockOnRetry} />);
    
    const retryButton = screen.getByTestId('retry-button');
    
    // Test keyboard interaction
    retryButton.focus();
    expect(document.activeElement).toBe(retryButton);
    
    // Simulate keyboard Enter key press - use only keyDown since that's what browsers trigger for buttons
    fireEvent.keyDown(retryButton, { key: 'Enter' });
    
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });
});
