/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FocusTrap from '../FocusTrap';

describe('FocusTrap Component', () => {
  // Mock focus functions
  const mockFocus = jest.fn();
  const mockPreviousFocus = jest.fn();

  beforeEach(() => {
    // Mock document.activeElement
    Object.defineProperty(document, 'activeElement', {
      writable: true,
      value: { focus: mockPreviousFocus },
    });

    // Reset mocks
    jest.clearAllMocks();
  });

  it('renders children correctly', () => {
    render(
      <FocusTrap>
        <div data-testid="trap-content">Trapped Content</div>
      </FocusTrap>
    );

    expect(screen.getByTestId('trap-content')).toBeInTheDocument();
    expect(screen.getByTestId('trap-content')).toHaveTextContent('Trapped Content');
  });

  it('renders with focus trap wrapper', () => {
    // Create a component with focusable elements
    render(
      <FocusTrap>
        <div data-testid="trap-content">
          <button data-testid="first-button">First</button>
          <button data-testid="middle-button">Middle</button>
          <button data-testid="last-button">Last</button>
        </div>
      </FocusTrap>
    );

    // Check if the focus trap wrapper is rendered
    const focusTrap = screen.getByTestId('focus-trap');
    expect(focusTrap).toBeInTheDocument();
    expect(focusTrap).toContainElement(screen.getByTestId('first-button'));
    expect(focusTrap).toContainElement(screen.getByTestId('middle-button'));
    expect(focusTrap).toContainElement(screen.getByTestId('last-button'));
  });

  it('does not trap focus when isActive is false', () => {
    render(
      <FocusTrap isActive={false}>
        <div data-testid="trap-content">Trapped Content</div>
      </FocusTrap>
    );

    // The component should just render children without the focus trap wrapper
    expect(screen.getByTestId('trap-content')).toBeInTheDocument();
    expect(screen.queryByTestId('focus-trap')).not.toBeInTheDocument();
  });
});
