/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SkipLink from '../SkipLink';

describe('SkipLink Component', () => {
  // Mock focus function for target element
  const mockFocus = jest.fn();
  
  beforeEach(() => {
    // Create a target element in the DOM
    const targetElement = document.createElement('div');
    targetElement.id = 'main-content';
    targetElement.focus = mockFocus;
    document.body.appendChild(targetElement);
  });
  
  afterEach(() => {
    // Clean up the DOM
    const targetElement = document.getElementById('main-content');
    if (targetElement) {
      document.body.removeChild(targetElement);
    }
    jest.clearAllMocks();
  });
  
  it('renders with default label', () => {
    render(<SkipLink targetId="main-content" />);
    
    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });
  
  it('renders with custom label', () => {
    render(<SkipLink targetId="main-content" label="Skip to content" />);
    
    const skipLink = screen.getByText('Skip to content');
    expect(skipLink).toBeInTheDocument();
  });
  
  it('is hidden by default and visible on focus', () => {
    render(<SkipLink targetId="main-content" />);
    
    const skipLink = screen.getByText('Skip to main content');
    
    // Should be translated up (hidden) by default
    expect(skipLink).toHaveClass('-translate-y-full');
    
    // Should be visible when focused
    fireEvent.focus(skipLink);
    expect(skipLink).toHaveClass('translate-y-0');
    
    // Should be hidden again when blurred
    fireEvent.blur(skipLink);
    expect(skipLink).toHaveClass('-translate-y-full');
  });
  
  it('focuses the target element when clicked', () => {
    render(<SkipLink targetId="main-content" />);
    
    const skipLink = screen.getByText('Skip to main content');
    
    // Click the skip link
    fireEvent.click(skipLink);
    
    // Check if the target element was focused
    expect(mockFocus).toHaveBeenCalled();
  });
});
