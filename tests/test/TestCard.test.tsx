/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TestCard from '@/components/test/TestCard';

describe('TestCard', () => {
  const mockOnCardClick = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders the card with title and content', () => {
    render(
      <TestCard
        title="Card Title"
        content="Card Content"
        onCardClick={mockOnCardClick}
      />
    );
    
    // These should pass
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Content')).toBeInTheDocument();
    
    // This will fail because the data-testid doesn't exist
    expect(screen.getByTestId('card-title')).toBeInTheDocument();
  });
  
  it('calls onCardClick when card is clicked', () => {
    render(
      <TestCard
        title="Card Title"
        content="Card Content"
        onCardClick={mockOnCardClick}
      />
    );
    
    // This will fail because the data-testid doesn't exist
    const card = screen.getByTestId('test-card');
    fireEvent.click(card);
    
    expect(mockOnCardClick).toHaveBeenCalledTimes(1);
  });
  
  it('renders the footer when provided', () => {
    render(
      <TestCard
        title="Card Title"
        content="Card Content"
        footer="Card Footer"
        onCardClick={mockOnCardClick}
      />
    );
    
    // This should pass
    expect(screen.getByText('Card Footer')).toBeInTheDocument();
    
    // This will fail because the data-testid doesn't exist
    const footer = screen.getByTestId('card-footer');
    expect(footer).toHaveTextContent('Card Footer');
  });
});
