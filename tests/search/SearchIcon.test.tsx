/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import SearchIcon from '@/components/search/SearchIcon';
import '@testing-library/jest-dom';

describe('SearchIcon Component', () => {
  it('renders with default props', () => {
    render(<SearchIcon />);
    
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '20');
    expect(svg).toHaveAttribute('height', '20');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders with custom size', () => {
    render(<SearchIcon size={30} />);
    
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '30');
    expect(svg).toHaveAttribute('height', '30');
  });

  it('applies custom class name', () => {
    render(<SearchIcon className="custom-class" />);
    
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('custom-class');
  });

  it('renders SVG with proper structure', () => {
    render(<SearchIcon />);
    
    // Check for circle (magnifying glass lens)
    const circle = document.querySelector('circle');
    expect(circle).toBeInTheDocument();
    expect(circle).toHaveAttribute('cx', '11');
    expect(circle).toHaveAttribute('cy', '11');
    
    // Check for line (magnifying glass handle)
    const line = document.querySelector('line');
    expect(line).toBeInTheDocument();
    expect(line).toHaveAttribute('x1', '21');
    expect(line).toHaveAttribute('y1', '21');
  });
});
