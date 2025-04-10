import React from 'react';
import { render } from '@/tests/utils/render';
import { QuickActionsMenu } from '../QuickActionsMenu';
import { QuickActionsContainer } from '../QuickActionsContainer';

// Mock the QuickActionsContainer component
jest.mock('../QuickActionsContainer', () => ({
  QuickActionsContainer: jest.fn(() => <div data-testid="mock-container" />)
}));

describe('QuickActionsMenu', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the container component', () => {
    // Render the menu
    render(<QuickActionsMenu />);

    // Check that the container component was rendered
    expect(QuickActionsContainer).toHaveBeenCalled();
  });

  it('passes className to the container component', () => {
    // Render the menu with className
    render(<QuickActionsMenu className="custom-class" />);

    // Check that the container component was rendered with correct props
    expect(QuickActionsContainer).toHaveBeenCalledWith(
      expect.objectContaining({
        className: 'custom-class'
      }),
      expect.anything()
    );
  });
});
