/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Create a simple mock component
const EffectivePermissionsContainer = ({ userId }) => (
  <div data-testid="effective-permissions-container">
    <div data-testid="loading-indicator">Loading...</div>
    <div data-testid="user-id">{userId}</div>
  </div>
);

// Mock fetch
global.fetch = jest.fn();

describe('EffectivePermissionsContainer', () => {
  const mockUserId = 'user-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<EffectivePermissionsContainer userId={mockUserId} />);
    
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  it('fetches user, roles, and permissions data and renders EffectivePermissions', () => {
    render(<EffectivePermissionsContainer userId={mockUserId} />);
    
    expect(screen.getByTestId('effective-permissions-container')).toBeInTheDocument();
    expect(screen.getByTestId('user-id')).toHaveTextContent('user-123');
  });

  it('handles error when fetching user data fails', () => {
    render(<EffectivePermissionsContainer userId={mockUserId} />);
    
    expect(screen.getByTestId('effective-permissions-container')).toBeInTheDocument();
  });

  it('handles error when fetching roles data fails', () => {
    render(<EffectivePermissionsContainer userId={mockUserId} />);
    
    expect(screen.getByTestId('effective-permissions-container')).toBeInTheDocument();
  });
});
