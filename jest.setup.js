// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock node-fetch for integration tests
jest.mock('node-fetch', () => jest.fn());

// Mock Next.js headers()
jest.mock('next/headers', () => ({
  headers: jest.fn(() => new Map()),
}));