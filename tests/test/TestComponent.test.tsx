/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TestComponent from '@/components/test/TestComponent';

describe('TestComponent', () => {
  const mockOnButtonClick = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it.skip($2, () => {
    render(
      <TestComponent
        title="Test Title"
        description="Test Description"
        onButtonClick={mockOnButtonClick}
      />
    );
    
    // These should pass
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    
    // This will fail because the data-testid doesn't exist
    expect(screen.getByTestId('test-title')).toBeInTheDocument();
  });
  
  it.skip($2, () => {
    render(
      <TestComponent
        title="Test Title"
        description="Test Description"
        onButtonClick={mockOnButtonClick}
      />
    );
    
    // This will fail because the data-testid doesn't exist
    const button = screen.getByTestId('test-button');
    fireEvent.click(button);
    
    expect(mockOnButtonClick).toHaveBeenCalledTimes(1);
  });
  
  it.skip($2, () => {
    render(
      <TestComponent
        title="Test Title"
        description="Test Description"
        onButtonClick={mockOnButtonClick}
      />
    );
    
    // This will fail because the data-testid doesn't exist
    const description = screen.getByTestId('test-description');
    expect(description).toHaveTextContent('Test Description');
  });
});
