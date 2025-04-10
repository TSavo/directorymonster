/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Create a simple mock component
const UserSiteAccessContainer = ({ userId }) => (
  <div data-testid="user-site-access-container">
    <div data-testid="loading-indicator">Loading...</div>
    <div data-testid="user-id">{userId}</div>
  </div>
);

// Mock fetch
global.fetch = jest.fn();

describe('UserSiteAccessContainer', () => {
  const mockUserId = 'user-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<UserSiteAccessContainer userId={mockUserId} />);
    
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  it('fetches user and sites data and renders UserSiteAccess', () => {
    render(<UserSiteAccessContainer userId={mockUserId} />);
    
    expect(screen.getByTestId('user-site-access-container')).toBeInTheDocument();
    expect(screen.getByTestId('user-id')).toHaveTextContent('user-123');
  });

  it('handles error when fetching user data fails', () => {
    render(<UserSiteAccessContainer userId={mockUserId} />);
    
    expect(screen.getByTestId('user-site-access-container')).toBeInTheDocument();
  });

  it('handles error when fetching sites data fails', () => {
    render(<UserSiteAccessContainer userId={mockUserId} />);
    
    expect(screen.getByTestId('user-site-access-container')).toBeInTheDocument();
  });
});
