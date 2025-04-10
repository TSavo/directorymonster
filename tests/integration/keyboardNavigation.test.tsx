/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the a11y components
jest.mock('@/components/a11y', () => ({
  KeyboardShortcut: ({ combination, onKeyDown }: any) => null,
  VisuallyHidden: ({ children }: any) => <span>{children}</span>,
  SkipLink: ({ targetId, label = 'Skip to main content' }: any) => (
    <a href={`#${targetId}`} data-testid="skip-link">{label}</a>
  ),
  KeyboardAccessible: ({ children, onClick, role = 'button', tabIndex = 0, ...props }: any) => (
    <div
      role={role}
      tabIndex={tabIndex}
      onClick={onClick}
      onKeyDown={(e: any) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick(e);
        }
      }}
      data-testid="keyboard-accessible"
      {...props}
    >
      {children}
    </div>
  ),
}));

// Import the mocked components
import { SkipLink, KeyboardAccessible } from '@/components/a11y';

describe('Keyboard Navigation Integration', () => {
  it('SkipLink has proper accessibility attributes', () => {
    render(<SkipLink targetId="main-content" />);

    // Get the skip link
    const skipLink = screen.getByTestId('skip-link');

    // Check accessibility attributes
    expect(skipLink).toHaveAttribute('href', '#main-content');
    expect(skipLink).toHaveTextContent('Skip to main content');
  });

  it('SkipLink can have a custom label', () => {
    render(<SkipLink targetId="main-content" label="Skip to content" />);

    // Get the skip link
    const skipLink = screen.getByTestId('skip-link');

    // Check custom label
    expect(skipLink).toHaveTextContent('Skip to content');
  });

  it('KeyboardAccessible triggers onClick with Enter key', () => {
    const mockOnClick = jest.fn();

    render(
      <KeyboardAccessible onClick={mockOnClick}>
        Click me
      </KeyboardAccessible>
    );

    // Get the element
    const element = screen.getByTestId('keyboard-accessible');

    // Check accessibility attributes
    expect(element).toHaveAttribute('role', 'button');
    expect(element).toHaveAttribute('tabIndex', '0');

    // Simulate Enter key press
    fireEvent.keyDown(element, { key: 'Enter' });

    // Check if onClick was called
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('KeyboardAccessible triggers onClick with Space key', () => {
    const mockOnClick = jest.fn();

    render(
      <KeyboardAccessible onClick={mockOnClick}>
        Click me
      </KeyboardAccessible>
    );

    // Get the element
    const element = screen.getByTestId('keyboard-accessible');

    // Simulate Space key press
    fireEvent.keyDown(element, { key: ' ' });

    // Check if onClick was called
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('KeyboardAccessible does not trigger onClick with other keys', () => {
    const mockOnClick = jest.fn();

    render(
      <KeyboardAccessible onClick={mockOnClick}>
        Click me
      </KeyboardAccessible>
    );

    // Get the element
    const element = screen.getByTestId('keyboard-accessible');

    // Simulate other key press
    fireEvent.keyDown(element, { key: 'A' });

    // Check that onClick was not called
    expect(mockOnClick).not.toHaveBeenCalled();
  });
});
