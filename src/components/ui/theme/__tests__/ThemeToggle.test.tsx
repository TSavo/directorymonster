/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeToggle } from '@/components/ui/theme';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Mock the Lucide React icons
jest.mock('lucide-react', () => ({
  Moon: () => <div data-testid="moon-icon">Moon Icon</div>,
  Sun: () => <div data-testid="sun-icon">Sun Icon</div>,
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false, // Default to light mode
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('ThemeToggle Component', () => {
  it('renders with light theme by default', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    // Check if the button is rendered
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();

    // Check if the moon icon is rendered (for light theme)
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('sun-icon')).not.toBeInTheDocument();

    // Check if the button has the correct aria-label
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
  });

  it('toggles theme when clicked', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    // Check initial state
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument();

    // Click the button
    fireEvent.click(screen.getByRole('button'));

    // Check if the sun icon is rendered (for dark theme)
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('moon-icon')).not.toBeInTheDocument();

    // Check if the button has the correct aria-label
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Switch to light mode');
  });

  it('applies custom className', () => {
    render(
      <ThemeProvider>
        <ThemeToggle className="custom-class" />
      </ThemeProvider>
    );

    // Check if the custom class is applied
    const button = screen.getByRole('button');
    expect(button.className).toContain('custom-class');
  });

  it('renders with dark theme when system preference is dark', () => {
    // Mock matchMedia to return true for dark mode preference
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    // Reset localStorage mock to ensure we're using system preference
    localStorage.clear();

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    // Check if the sun icon is rendered (for dark theme)
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('moon-icon')).not.toBeInTheDocument();

    // Check if the button has the correct aria-label
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Switch to light mode');
  });
});
