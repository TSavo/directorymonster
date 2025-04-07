/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import VisuallyHidden from '../VisuallyHidden';

describe('VisuallyHidden Component', () => {
  it('renders children correctly', () => {
    render(<VisuallyHidden>Hidden Text</VisuallyHidden>);
    
    const hiddenElement = screen.getByText('Hidden Text');
    expect(hiddenElement).toBeInTheDocument();
    expect(hiddenElement).toHaveClass('sr-only');
  });
  
  it('renders with default span element', () => {
    render(<VisuallyHidden>Hidden Text</VisuallyHidden>);
    
    const hiddenElement = screen.getByText('Hidden Text');
    expect(hiddenElement.tagName).toBe('SPAN');
  });
  
  it('renders with custom element type', () => {
    render(<VisuallyHidden as="div">Hidden Text</VisuallyHidden>);
    
    const hiddenElement = screen.getByText('Hidden Text');
    expect(hiddenElement.tagName).toBe('DIV');
  });
  
  it('applies additional className', () => {
    render(<VisuallyHidden className="custom-class">Hidden Text</VisuallyHidden>);
    
    const hiddenElement = screen.getByText('Hidden Text');
    expect(hiddenElement).toHaveClass('sr-only');
    expect(hiddenElement).toHaveClass('custom-class');
  });
  
  it('passes additional props to the element', () => {
    render(
      <VisuallyHidden data-custom="test" aria-label="Hidden content">
        Hidden Text
      </VisuallyHidden>
    );
    
    const hiddenElement = screen.getByText('Hidden Text');
    expect(hiddenElement).toHaveAttribute('data-custom', 'test');
    expect(hiddenElement).toHaveAttribute('aria-label', 'Hidden content');
  });
});
