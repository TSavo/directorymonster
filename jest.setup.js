// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock node-fetch for integration tests
jest.mock('node-fetch', () => jest.fn());

// Mock Next.js headers()
jest.mock('next/headers', () => ({
  headers: jest.fn(() => new Map()),
}));

// Additional UI component mocks might be needed
// If a component is referenced but not found, add it here
jest.mock('@/ui/button', () => {
  const Button = ({ children, ...props }) => <button data-testid="mocked-button" {...props}>{children}</button>;
  Button.displayName = 'MockedButton';
  return {
    __esModule: true,
    Button,
    default: Button
  };
});