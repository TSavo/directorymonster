/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CategoryTableSkeleton } from '@/components/admin/categories/components';

describe('CategoryTableSkeleton Component', () => {
  it('renders the skeleton UI with loading text', () => {
    render(<CategoryTableSkeleton />);
    
    // Check for loading text in screen reader content
    expect(screen.getByText('Loading categories data, please wait...')).toBeInTheDocument();
    
    // Should have a status role for accessibility
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
  
  it('includes animation classes for visual indication of loading', () => {
    render(<CategoryTableSkeleton />);
    
    // Check for animation classes
    const animatedElements = document.querySelectorAll('.animate-pulse');
    expect(animatedElements.length).toBeGreaterThan(0);
  });
  
  it('renders the skeleton rows for data representation', () => {
    render(<CategoryTableSkeleton />);
    
    // We expect 5 skeleton rows as per the component implementation
    const skeletonRows = document.querySelectorAll('div[style*="animation-delay"]');
    expect(skeletonRows.length).toBe(5);
  });
});
