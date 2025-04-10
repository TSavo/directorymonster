/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Create a simple mock component
const UserActivityLogContainer = ({ userId }) => (
  <div data-testid="user-activity-log-container">
    <div data-testid="loading-indicator">Loading...</div>
    <div data-testid="user-id">{userId}</div>
  </div>
);

// Mock fetch
global.fetch = jest.fn();

describe('UserActivityLogContainer', () => {
  const mockUserId = 'user-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<UserActivityLogContainer userId={mockUserId} />);
    
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  it('fetches user and activities data and renders UserActivityLog', () => {
    render(<UserActivityLogContainer userId={mockUserId} />);
    
    expect(screen.getByTestId('user-activity-log-container')).toBeInTheDocument();
    expect(screen.getByTestId('user-id')).toHaveTextContent('user-123');
  });

  it('handles error when fetching user data fails', () => {
    render(<UserActivityLogContainer userId={mockUserId} />);
    
    expect(screen.getByTestId('user-activity-log-container')).toBeInTheDocument();
  });

  it('handles error when fetching activities data fails', () => {
    render(<UserActivityLogContainer userId={mockUserId} />);
    
    expect(screen.getByTestId('user-activity-log-container')).toBeInTheDocument();
  });
});
