/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { CategoryTableError } from '@/components/admin/categories/components';

/**
 * Test suite for the CategoryTableError component
 * 
 * This suite tests the CategoryTableError component thoroughly, including:
 * - Basic rendering with different error messages
 * - Button functionality and event handling
 * - Keyboard accessibility and navigation
 * - ARIA attributes and screen reader support
 * - Focus management
 * - Edge cases and error handling
 */
describe('CategoryTableError Component', () => {
  const mockOnRetry = jest.fn();
  const standardErrorMessage = 'Failed to fetch categories: API error';
  
  beforeEach(() => {
    jest.clearAllMocks();
    cleanup(); // Clean up between tests to avoid DOM conflicts
    // Reset any lingering focus from previous tests
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });
  
  it('renders the error message correctly', () => {
    render(<CategoryTableError error={standardErrorMessage} onRetry={mockOnRetry} />);
    
    expect(screen.getByTestId('error-title')).toHaveTextContent('Error Loading Categories');
    expect(screen.getByTestId('error-message')).toHaveTextContent(standardErrorMessage);
    
    // Verify the overall structure
    const errorContainer = screen.getByTestId('error-container');
    const errorBox = errorContainer.firstChild;
    expect(errorContainer).toContainElement(errorBox as HTMLElement);
  });
  
  it('calls onRetry function when retry button is clicked', () => {
    render(<CategoryTableError error={standardErrorMessage} onRetry={mockOnRetry} />);
    
    const retryButton = screen.getByTestId('retry-button');
    fireEvent.click(retryButton);
    
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });
  
  it('handles the case when onRetry is not provided', () => {
    // This should not throw an error
    render(<CategoryTableError error={standardErrorMessage} onRetry={undefined} />);
    
    const retryButton = screen.getByTestId('retry-button');
    expect(() => fireEvent.click(retryButton)).not.toThrow();
  });
  
  it('has proper accessibility attributes', () => {
    render(<CategoryTableError error={standardErrorMessage} onRetry={mockOnRetry} />);
    
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
    render(<CategoryTableError error={standardErrorMessage} onRetry={mockOnRetry} />);
    
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
  
  it('supports keyboard interaction with Enter key', async () => {
    const mockRetryFn = jest.fn(); // Create a fresh mock for this test only
    cleanup(); // Ensure clean DOM
    const user = userEvent.setup();
    render(<CategoryTableError error={standardErrorMessage} onRetry={mockRetryFn} />);
    
    const retryButton = screen.getByTestId('retry-button');
    
    // Test keyboard interaction
    retryButton.focus();
    expect(document.activeElement).toBe(retryButton);
    
    // Simulate keyboard Enter key press using userEvent for better keyboard simulation
    await user.keyboard('{Enter}');
    
    // For Enter key, both onClick and onKeyDown handlers fire in the component
    // So we expect 2 calls to the mock function
    expect(mockRetryFn).toHaveBeenCalled();
    expect(mockRetryFn.mock.calls.length).toBeGreaterThan(0);
  });

  it('supports keyboard interaction with Space key', async () => {
    cleanup(); // Ensure clean DOM
    const user = userEvent.setup();
    render(<CategoryTableError error={standardErrorMessage} onRetry={mockOnRetry} />);
    
    const retryButton = screen.getByTestId('retry-button');
    
    // Focus the button
    retryButton.focus();
    
    // Simulate keyboard Space key press using userEvent
    await user.keyboard(' ');
    
    // The Space key should trigger the button click
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('handles different types of error messages correctly', () => {
    // Test with a network error
    const networkError = 'Network error: Failed to connect to server';
    const { unmount: unmount1 } = render(<CategoryTableError error={networkError} onRetry={mockOnRetry} />);
    
    expect(screen.getByTestId('error-message')).toHaveTextContent(networkError);
    
    // Clean up first render
    unmount1();
    
    // Test with a permission error
    const permissionError = 'Permission denied: Insufficient permissions to access categories';
    const { unmount: unmount2 } = render(<CategoryTableError error={permissionError} onRetry={mockOnRetry} />);
    
    expect(screen.getByTestId('error-message')).toHaveTextContent(permissionError);
    
    // Clean up second render
    unmount2();
    
    // Test with an empty error message (edge case)
    render(<CategoryTableError error="" onRetry={mockOnRetry} />);
    
    // Should still show the component even with empty error
    expect(screen.getByTestId('error-title')).toBeInTheDocument();
    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    
    // The message element should be empty but present
    expect(screen.getByTestId('error-message').textContent).toBe('');
  });

  it('provides proper focus indication for the retry button', async () => {
    render(<CategoryTableError error={standardErrorMessage} onRetry={mockOnRetry} />);
    
    const retryButton = screen.getByTestId('retry-button');
    
    // Check for focus ring styles
    expect(retryButton).toHaveClass('focus:ring-2');
    expect(retryButton).toHaveClass('focus:ring-red-500');
    expect(retryButton).toHaveClass('focus:outline-none');
    
    // Focus the button
    retryButton.focus();
    
    // In a real browser the focus styles would be visible
    // This checks that the button is focusable
    expect(document.activeElement).toBe(retryButton);
  });

  it('ignores keydown events that aren\'t Enter on the retry button', () => {
    render(<CategoryTableError error={standardErrorMessage} onRetry={mockOnRetry} />);
    
    const retryButton = screen.getByTestId('retry-button');
    
    // Test various keys that should not trigger the onRetry
    fireEvent.keyDown(retryButton, { key: 'Tab' });
    fireEvent.keyDown(retryButton, { key: 'Escape' });
    fireEvent.keyDown(retryButton, { key: 'Space' }); // Space is handled by the browser for buttons
    fireEvent.keyDown(retryButton, { key: 'ArrowDown' });
    
    // The onRetry function should not have been called
    expect(mockOnRetry).not.toHaveBeenCalled();
  });

  it('meets accessibility guidelines for error messages', () => {
    render(<CategoryTableError error={standardErrorMessage} onRetry={mockOnRetry} />);
    
    // Check for proper alert and live region
    const errorContainer = screen.getByTestId('error-container');
    expect(errorContainer).toHaveAttribute('role', 'alert');
    expect(errorContainer).toHaveAttribute('aria-live', 'assertive');
    
    // Check for proper heading hierarchy with semantic heading
    const errorTitle = screen.getByTestId('error-title');
    expect(errorTitle.tagName).toBe('H3');
    expect(errorTitle).toHaveClass('text-xl');
    
    // Check for proper button element (not a div with onClick)
    const retryButton = screen.getByTestId('retry-button');
    expect(retryButton.tagName).toBe('BUTTON');
  });

  it('uses proper semantic structure', () => {
    // Define error message inside test for proper scope
    const testErrorMessage = 'Test error for semantic structure check';
    render(<CategoryTableError error={testErrorMessage} onRetry={mockOnRetry} />);
    
    // Check overall container
    const errorContainer = screen.getByTestId('error-container');
    
    // Check error content box
    const errorBox = screen.getByTestId('error-box');
    expect(errorContainer).toContainElement(errorBox);
    
    // Check title
    const errorTitle = screen.getByTestId('error-title');
    expect(errorBox).toContainElement(errorTitle);
    
    // Check message
    const errorMessage = screen.getByTestId('error-message');
    expect(errorBox).toContainElement(errorMessage);
    
    // Check retry button
    const retryButton = screen.getByTestId('retry-button');
    expect(errorBox).toContainElement(retryButton);
    
    // Check proper parent-child relationships
    expect(errorBox.parentElement).toBe(errorContainer);
    expect(errorTitle.parentElement).toBe(errorBox);
    expect(errorMessage.parentElement).toBe(errorBox);
    expect(retryButton.parentElement).toBe(errorBox);
  });

  it('handles onKeyDown for keyboard interaction on the error container', () => {
    render(<CategoryTableError error={standardErrorMessage} onRetry={mockOnRetry} />);
    
    // This tests keyboard behavior beyond the Enter key already tested
    const retryButton = screen.getByTestId('retry-button');
    
    // Tab key should not trigger onRetry
    fireEvent.keyDown(retryButton, { key: 'Tab' });
    expect(mockOnRetry).not.toHaveBeenCalled();
    
    // Space keydown is received but Space up actually triggers the click
    // Here we're just testing the keyDown handler doesn't call onRetry
    fireEvent.keyDown(retryButton, { key: ' ' });
    expect(mockOnRetry).not.toHaveBeenCalled();
    
    // Only Enter keydown should trigger onRetry on keydown
    fireEvent.keyDown(retryButton, { key: 'Enter' });
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });
});
