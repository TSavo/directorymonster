/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import KeyboardAccessible from '../KeyboardAccessible';

describe('KeyboardAccessible Component', () => {
  it('renders children correctly', () => {
    render(
      <KeyboardAccessible>
        <span>Click me</span>
      </KeyboardAccessible>
    );
    
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('has button role by default', () => {
    render(<KeyboardAccessible>Click me</KeyboardAccessible>);
    
    const element = screen.getByRole('button');
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent('Click me');
  });
  
  it('can have a custom role', () => {
    render(<KeyboardAccessible role="link">Click me</KeyboardAccessible>);
    
    const element = screen.getByRole('link');
    expect(element).toBeInTheDocument();
  });
  
  it('has tabIndex of 0 by default', () => {
    render(<KeyboardAccessible>Click me</KeyboardAccessible>);
    
    const element = screen.getByRole('button');
    expect(element).toHaveAttribute('tabIndex', '0');
  });
  
  it('can have a custom tabIndex', () => {
    render(<KeyboardAccessible tabIndex={-1}>Click me</KeyboardAccessible>);
    
    const element = screen.getByRole('button');
    expect(element).toHaveAttribute('tabIndex', '-1');
  });
  
  it('triggers onClick when clicked', () => {
    const mockOnClick = jest.fn();
    
    render(<KeyboardAccessible onClick={mockOnClick}>Click me</KeyboardAccessible>);
    
    const element = screen.getByRole('button');
    fireEvent.click(element);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
  
  it('triggers onClick when Enter key is pressed', () => {
    const mockOnClick = jest.fn();
    
    render(<KeyboardAccessible onClick={mockOnClick}>Press Enter</KeyboardAccessible>);
    
    const element = screen.getByRole('button');
    fireEvent.keyDown(element, { key: 'Enter' });
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
  
  it('triggers onClick when Space key is pressed', () => {
    const mockOnClick = jest.fn();
    
    render(<KeyboardAccessible onClick={mockOnClick}>Press Space</KeyboardAccessible>);
    
    const element = screen.getByRole('button');
    fireEvent.keyDown(element, { key: ' ' });
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
  
  it('does not trigger onClick for other keys', () => {
    const mockOnClick = jest.fn();
    
    render(<KeyboardAccessible onClick={mockOnClick}>Press a key</KeyboardAccessible>);
    
    const element = screen.getByRole('button');
    fireEvent.keyDown(element, { key: 'a' });
    
    expect(mockOnClick).not.toHaveBeenCalled();
  });
  
  it('applies additional className', () => {
    render(<KeyboardAccessible className="custom-class">Click me</KeyboardAccessible>);
    
    const element = screen.getByRole('button');
    expect(element).toHaveClass('custom-class');
  });
  
  it('passes additional props to the div', () => {
    render(
      <KeyboardAccessible data-testid="custom-id" aria-label="Accessible button">
        Click me
      </KeyboardAccessible>
    );
    
    const element = screen.getByTestId('custom-id');
    expect(element).toHaveAttribute('aria-label', 'Accessible button');
  });
});
