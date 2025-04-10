import React from 'react';
import { render } from '@/tests/utils/render';
import UserActivityTracker from '../UserActivityTracker';
import { UserActivityContainer } from '../UserActivityContainer';

// Mock the UserActivityContainer component
jest.mock('../UserActivityContainer', () => ({
  UserActivityContainer: jest.fn(() => <div data-testid="mock-container" />)
}));

describe('UserActivityTracker', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the container component', () => {
    // Render the tracker
    render(<UserActivityTracker />);

    // Check that the container component was rendered
    expect(UserActivityContainer).toHaveBeenCalled();
  });

  it('passes userId to the container component', () => {
    // Render the tracker with userId
    render(<UserActivityTracker userId="user-1" />);

    // Check that the container component was rendered with correct props
    expect(UserActivityContainer).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1'
      }),
      expect.anything()
    );
  });
});
