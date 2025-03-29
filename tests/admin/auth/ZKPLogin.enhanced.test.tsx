import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ZKPLogin } from '@/components/admin/auth';
import { generateProof, verifyProof } from '@/lib/zkp';
import * as zkpLib from '@/lib/zkp';

// Mock the Next.js router
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  pathname: '/admin',
};

// Add the router mock before the tests run
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter
}));

// Mock the ZKP library functions
jest.mock('@/lib/zkp', () => ({
  generateProof: jest.fn(),
  verifyProof: jest.fn(),
  generateSalt: jest.fn().mockReturnValue('test-salt-value'),
  derivePublicKey: jest.fn().mockReturnValue('test-derived-public-key'),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('ZKPLogin Component', () => {
  // Setup our mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    
    // Reset localStorage mock
    localStorageMock.clear();
    
    // Default mock implementation for generateProof
    (zkpLib.generateProof as jest.Mock).mockResolvedValue({
      proof: 'mock-proof-string',
      publicSignals: ['mock-public-signal-1', 'mock-public-signal-2'],
    });
    
    // Default mock implementation for fetch
    (global.fetch as jest.Mock).mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, token: 'mock-auth-token' }),
      })
    );
    
    // Mock document.cookie to provide a CSRF token
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'csrf_token=test-csrf-token',
    });
  });

  // RENDERING TESTS
  describe('Rendering', () => {
    it('renders the login form with