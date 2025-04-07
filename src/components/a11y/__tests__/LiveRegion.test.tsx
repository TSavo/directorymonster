/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import LiveRegion from '../LiveRegion';

// Mock timers
jest.useFakeTimers();

describe('LiveRegion Component', () => {
  it('renders with the provided message', () => {
    render(<LiveRegion message="Status update" />);
    
    const liveRegion = screen.getByText('Status update');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveClass('sr-only');
  });
  
  it('has polite aria-live by default', () => {
    render(<LiveRegion message="Status update" />);
    
    const liveRegion = screen.getByTestId('live-region');
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });
  
  it('can be set to assertive', () => {
    render(<LiveRegion message="Important update" assertive={true} />);
    
    const liveRegion = screen.getByTestId('live-region');
    expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
  });
  
  it('clears message after specified time', () => {
    render(<LiveRegion message="Status update" clearAfter={1000} />);
    
    // Message should be present initially
    expect(screen.getByText('Status update')).toBeInTheDocument();
    
    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    
    // Message should be cleared
    expect(screen.queryByText('Status update')).not.toBeInTheDocument();
  });
  
  it('updates message when prop changes', () => {
    const { rerender } = render(<LiveRegion message="First message" />);
    
    // First message should be present
    expect(screen.getByText('First message')).toBeInTheDocument();
    
    // Update the message
    rerender(<LiveRegion message="Updated message" />);
    
    // Updated message should be present
    expect(screen.getByText('Updated message')).toBeInTheDocument();
    expect(screen.queryByText('First message')).not.toBeInTheDocument();
  });
  
  it('does not clear message if clearAfter is 0', () => {
    render(<LiveRegion message="Persistent message" clearAfter={0} />);
    
    // Message should be present initially
    expect(screen.getByText('Persistent message')).toBeInTheDocument();
    
    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    
    // Message should still be present
    expect(screen.getByText('Persistent message')).toBeInTheDocument();
  });
  
  it('applies additional className', () => {
    render(<LiveRegion message="Status update" className="custom-class" />);
    
    const liveRegion = screen.getByTestId('live-region');
    expect(liveRegion).toHaveClass('sr-only');
    expect(liveRegion).toHaveClass('custom-class');
  });
});
