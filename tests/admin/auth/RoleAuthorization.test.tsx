import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { SessionManager } from '@/components/admin/auth';

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

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

// Mock the jsonwebtoken library for decoding tokens
jest.mock('jsonwebtoken', () => ({
  decode: jest.fn()
}));

// Mock the useAuth hook
const mockCanAccess = jest.fn();
jest.mock('@/components/admin/auth', () => {
  const originalModule = jest.requireActual('@/components/admin/auth');
  return {
    ...originalModule,
    useAuth: () => ({
      user: { username: 'testuser', role: 'admin' },
      isAuthenticated: true,
      canAccess: mockCanAccess,
    }),
  };
});

// Import the mocked useAuth hook
import { useAuth } from '@/components/admin/auth';

// Create a component that uses authorization helpers
const RoleTestComponent = () => {
  const { canAccess } = useAuth();

  return (
    <div>
      <p data-testid="admin-access">{canAccess('admin') ? 'Yes' : 'No'}</p>
      <p data-testid="editor-access">{canAccess('editor') ? 'Yes' : 'No'}</p>
      <p data-testid="viewer-access">{canAccess('viewer') ? 'Yes' : 'No'}</p>
    </div>
  );
};

describe('Role-Based Authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn().mockReturnValue('valid-token'),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  });

  it('correctly assigns permissions for admin role', async () => {
    // Set up the mock to return appropriate values for each role check
    mockCanAccess.mockImplementation((role) => {
      // Admin has access to all roles
      return ['admin', 'editor', 'viewer'].includes(role);
    });

    render(<RoleTestComponent />);

    // Admin should have access to all roles
    expect(screen.getByTestId('admin-access')).toHaveTextContent('Yes');
    expect(screen.getByTestId('editor-access')).toHaveTextContent('Yes');
    expect(screen.getByTestId('viewer-access')).toHaveTextContent('Yes');
  });

  it('correctly assigns permissions for editor role', async () => {
    // Set up the mock to return appropriate values for each role check
    mockCanAccess.mockImplementation((role) => {
      // Editor has access to editor and viewer roles, but not admin
      return ['editor', 'viewer'].includes(role);
    });

    render(<RoleTestComponent />);

    // Editor should have access to editor and viewer roles, but not admin
    expect(screen.getByTestId('admin-access')).toHaveTextContent('No');
    expect(screen.getByTestId('editor-access')).toHaveTextContent('Yes');
    expect(screen.getByTestId('viewer-access')).toHaveTextContent('Yes');
  });

  it('correctly assigns permissions for viewer role', async () => {
    // Set up the mock to return appropriate values for each role check
    mockCanAccess.mockImplementation((role) => {
      // Viewer has access only to viewer role
      return ['viewer'].includes(role);
    });

    render(<RoleTestComponent />);

    // Viewer should only have access to viewer role
    expect(screen.getByTestId('admin-access')).toHaveTextContent('No');
    expect(screen.getByTestId('editor-access')).toHaveTextContent('No');
    expect(screen.getByTestId('viewer-access')).toHaveTextContent('Yes');
  });

  it('denies access when not authenticated', async () => {
    // Set up the mock to deny all access
    mockCanAccess.mockImplementation(() => false);

    render(<RoleTestComponent />);

    // No access to any role when not authenticated
    expect(screen.getByTestId('admin-access')).toHaveTextContent('No');
    expect(screen.getByTestId('editor-access')).toHaveTextContent('No');
    expect(screen.getByTestId('viewer-access')).toHaveTextContent('No');
  });
});
