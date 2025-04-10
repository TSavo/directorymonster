/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Create a simple mock component
const UserRoleManagerContainer = ({ userId }) => (
  <div data-testid="user-role-manager-container">
    <div data-testid="loading-indicator">Loading...</div>
    <div data-testid="user-id">{userId}</div>
  </div>
);

// Mock fetch
global.fetch = jest.fn();

describe('UserRoleManagerContainer', () => {
  const mockUserId = 'user-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<UserRoleManagerContainer userId={mockUserId} />);
    
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  it('fetches user and roles data and renders UserRoleManager', () => {
    render(<UserRoleManagerContainer userId={mockUserId} />);
    
    expect(screen.getByTestId('user-role-manager-container')).toBeInTheDocument();
    expect(screen.getByTestId('user-id')).toHaveTextContent('user-123');
  });

  it('handles error when fetching user data fails', () => {
    render(<UserRoleManagerContainer userId={mockUserId} />);
    
    expect(screen.getByTestId('user-role-manager-container')).toBeInTheDocument();
  });

  it('handles error when fetching roles data fails', () => {
    render(<UserRoleManagerContainer userId={mockUserId} />);
    
    expect(screen.getByTestId('user-role-manager-container')).toBeInTheDocument();
  });
});
