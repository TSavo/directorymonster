/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

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
const matchMediaMock = (matches: boolean) => {
  return () => ({
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  });
};

// Create a test component that uses the theme context
function TestComponent() {
  const { theme, toggleTheme, setTheme } = useTheme();

  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <button
        data-testid="toggle-theme-button"
        onClick={toggleTheme}
      >
        Toggle Theme
      </button>
      <button
        data-testid="set-light-theme-button"
        onClick={() => setTheme('light')}
      >
        Set Light Theme
      </button>
      <button
        data-testid="set-dark-theme-button"
        onClick={() => setTheme('dark')}
      >
        Set Dark Theme
      </button>
    </div>
  );
}

describe('ThemeContext', () => {
  // Setup mocks before each test
  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    });

    // Clear localStorage mock
    localStorageMock.clear();
    jest.clearAllMocks();

    // Default to light mode for matchMedia
    window.matchMedia = matchMediaMock(false);
  });

  it('provides theme context to components', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Check if theme is provided
    expect(screen.getByTestId('current-theme')).toBeInTheDocument();
  });

  it('defaults to light theme when no preference is stored', () => {
    // Mock matchMedia to return false for dark mode preference
    window.matchMedia = matchMediaMock(false);

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Check if theme is light
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
  });

  it('defaults to dark theme when system prefers dark mode', () => {
    // Mock matchMedia to return true for dark mode preference
    window.matchMedia = matchMediaMock(true);

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Check if theme is dark
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
  });

  it('uses theme from localStorage if available', () => {
    // Set theme in localStorage
    localStorageMock.getItem.mockReturnValueOnce('dark');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Check if theme is dark
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
  });

  it('toggles theme when toggle button is clicked', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Check initial theme
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');

    // Click toggle button
    fireEvent.click(screen.getByTestId('toggle-theme-button'));

    // Check if theme is toggled
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');

    // Check if localStorage is updated
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  it('sets theme to light when set light theme button is clicked', () => {
    // Start with dark theme
    localStorageMock.getItem.mockReturnValueOnce('dark');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Check initial theme
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');

    // Click set light theme button
    fireEvent.click(screen.getByTestId('set-light-theme-button'));

    // Check if theme is set to light
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');

    // Check if localStorage is updated
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
  });

  it('sets theme to dark when set dark theme button is clicked', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Check initial theme
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');

    // Click set dark theme button
    fireEvent.click(screen.getByTestId('set-dark-theme-button'));

    // Check if theme is set to dark
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');

    // Check if localStorage is updated
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  it('updates document class when theme changes', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Check initial state
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Toggle theme
    fireEvent.click(screen.getByTestId('toggle-theme-button'));

    // Check if document class is updated
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Toggle theme again
    fireEvent.click(screen.getByTestId('toggle-theme-button'));

    // Check if document class is updated
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('listens for system preference changes', () => {
    // Mock matchMedia
    const mockMediaQueryList = {
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    window.matchMedia = jest.fn().mockReturnValue(mockMediaQueryList);

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Check if event listener is added
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    // Cleanup
    const { unmount } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    unmount();

    // Check if event listener is removed
    expect(mockMediaQueryList.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
