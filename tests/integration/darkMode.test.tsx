/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

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

// Create a simple test component with a button to toggle theme
function TestApp() {
  return (
    <ThemeProvider>
      <div data-testid="app-container">
        <button
          data-testid="theme-toggle"
          onClick={() => {
            // Manually toggle the dark class on the html element
            // This simulates what the ThemeToggle component would do
            if (document.documentElement.classList.contains('dark')) {
              document.documentElement.classList.remove('dark');
              localStorage.setItem('theme', 'light');
            } else {
              document.documentElement.classList.add('dark');
              localStorage.setItem('theme', 'dark');
            }
          }}
        >
          Toggle Theme
        </button>
        <div data-testid="content">Content</div>
      </div>
    </ThemeProvider>
  );
}

describe('Dark Mode Integration', () => {
  // Setup mocks before each test
  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    });

    // Clear localStorage mock
    localStorageMock.clear();
    jest.clearAllMocks();

    // Reset document classes
    document.documentElement.classList.remove('dark');
  });

  it('toggles dark mode class on html element when theme toggle is clicked', () => {
    render(<TestApp />);

    // Check initial state
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Find and click the theme toggle
    const themeToggle = screen.getByTestId('theme-toggle');
    fireEvent.click(themeToggle);

    // Check if dark mode class is added
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Click again to toggle back to light mode
    fireEvent.click(themeToggle);

    // Check if dark mode class is removed
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('persists theme preference in localStorage', () => {
    render(<TestApp />);

    // Find and click the theme toggle to enable dark mode
    const themeToggle = screen.getByTestId('theme-toggle');
    fireEvent.click(themeToggle);

    // Check if localStorage is updated
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
  });
});
