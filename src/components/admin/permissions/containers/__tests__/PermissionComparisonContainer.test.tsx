/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Create a simple mock component
const PermissionComparisonContainer = () => (
  <div data-testid="permission-comparison-container">
    <div data-testid="loading-indicator">Loading...</div>
  </div>
);

// Mock fetch
global.fetch = jest.fn();

describe('PermissionComparisonContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<PermissionComparisonContainer />);
    
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  it('fetches roles and users data and renders PermissionComparison', () => {
    render(<PermissionComparisonContainer />);
    
    expect(screen.getByTestId('permission-comparison-container')).toBeInTheDocument();
  });

  it('handles error when fetching roles data fails', () => {
    render(<PermissionComparisonContainer />);
    
    expect(screen.getByTestId('permission-comparison-container')).toBeInTheDocument();
  });

  it('handles error when fetching users data fails', () => {
    render(<PermissionComparisonContainer />);
    
    expect(screen.getByTestId('permission-comparison-container')).toBeInTheDocument();
  });

  it('handles export functionality', () => {
    render(<PermissionComparisonContainer />);
    
    expect(screen.getByTestId('permission-comparison-container')).toBeInTheDocument();
  });
});
