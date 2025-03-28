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
    
    expect(screen.getByText('Error Loading Categories')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
  
  it('calls onRetry function when retry button is clicked', () => {
    render(<CategoryTableError error={errorMessage} onRetry={mockOnRetry} />);
    
    const retryButton = screen.getByRole('button', { name: /Try Again/i });
    fireEvent.click(retryButton);
    
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });
  
  it('has proper accessibility attributes for the retry button', () => {
    render(<CategoryTableError error={errorMessage} onRetry={mockOnRetry} />);
    
    const retryButton = screen.getByRole('button');
    expect(retryButton).toHaveAttribute('aria-label', 'Retry loading categories');
  });
  
  it('uses appropriate colors for error state', () => {
    render(<CategoryTableError error={errorMessage} onRetry={mockOnRetry} />);
    
    const errorContainer = screen.getByText('Error Loading Categories').closest('div');
    expect(errorContainer).toHaveClass('bg-red-50');
    expect(errorContainer).toHaveClass('border-red-200');
    
    const errorTitle = screen.getByText('Error Loading Categories');
    expect(errorTitle).toHaveClass('text-red-800');
    
    const errorText = screen.getByText(errorMessage);
    expect(errorText).toHaveClass('text-red-600');
  });
});
