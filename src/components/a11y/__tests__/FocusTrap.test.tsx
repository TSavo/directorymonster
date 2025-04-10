import React from 'react';
import { render, screen } from '@/tests/utils/render';
import FocusTrap from '../FocusTrap';
import { useFocusTrap } from '../hooks/useFocusTrap';

// Mock the useFocusTrap hook
jest.mock('../hooks/useFocusTrap', () => ({
  useFocusTrap: jest.fn()
}));

describe('FocusTrap', () => {
  // Mock hook implementation
  const mockHandleKeyDown = jest.fn();
  const mockContainerRef = { current: null };

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation
    (useFocusTrap as jest.Mock).mockReturnValue({
      containerRef: mockContainerRef,
      handleKeyDown: mockHandleKeyDown
    });
  });

  it('renders children', () => {
    // Render the component
    render(
      <FocusTrap>
        <div data-testid="trap-content">Trapped Content</div>
      </FocusTrap>
    );

    // Check that children are rendered
    expect(screen.getByTestId('trap-content')).toBeInTheDocument();
    expect(screen.getByText('Trapped Content')).toBeInTheDocument();
  });

  it('renders the focus trap container when isActive is true', () => {
    // Render the component with isActive=true
    render(
      <FocusTrap isActive={true}>
        <div data-testid="trap-content">
          <button data-testid="first-button">First</button>
          <button data-testid="middle-button">Middle</button>
          <button data-testid="last-button">Last</button>
        </div>
      </FocusTrap>
    );

    // Check that the focus trap container is rendered
    const focusTrap = screen.getByTestId('focus-trap');
    expect(focusTrap).toBeInTheDocument();
    expect(focusTrap).toContainElement(screen.getByTestId('first-button'));
    expect(focusTrap).toContainElement(screen.getByTestId('middle-button'));
    expect(focusTrap).toContainElement(screen.getByTestId('last-button'));
  });

  it('does not render the focus trap container when isActive is false', () => {
    // Render the component with isActive=false
    render(
      <FocusTrap isActive={false}>
        <div data-testid="trap-content">Trapped Content</div>
      </FocusTrap>
    );

    // Check that the focus trap container is not rendered
    expect(screen.getByTestId('trap-content')).toBeInTheDocument();
    expect(screen.queryByTestId('focus-trap')).not.toBeInTheDocument();
  });

  it('passes props to the useFocusTrap hook', () => {
    // Render the component with custom props
    render(
      <FocusTrap
        isActive={true}
        autoFocus={false}
        returnFocusOnDeactivate={false}
      >
        <div>Child Content</div>
      </FocusTrap>
    );

    // Check that useFocusTrap was called with the correct props
    expect(useFocusTrap).toHaveBeenCalledWith({
      isActive: true,
      autoFocus: false,
      returnFocusOnDeactivate: false
    });
  });

  it('applies the className prop to the container', () => {
    // Render the component with a custom className
    render(
      <FocusTrap className="custom-class">
        <div>Child Content</div>
      </FocusTrap>
    );

    // Check that the className is applied
    expect(screen.getByTestId('focus-trap')).toHaveClass('custom-class');
  });
});
