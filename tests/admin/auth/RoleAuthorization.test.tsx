import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { SessionManager, useAuth } from '@/components/admin/auth';

// Mock the jsonwebtoken library for decoding tokens
jest.mock('jsonwebtoken', () => ({
  decode: jest.fn()
}));

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
    // Mock admin user token
    jest.requireMock('jsonwebtoken').decode.mockReturnValue({ 
      username: 'testuser', 
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 3600
    });
    
    render(
      <SessionManager>
        <RoleTestComponent />
      </SessionManager>
    );
    
    // Wait for authentication to complete
    await waitFor(() => {
      // Admin should have access to all roles
      expect(screen.getByTestId('admin-access')).toHaveTextContent('Yes');
      expect(screen.getByTestId('editor-access')).toHaveTextContent('Yes');
      expect(screen.getByTestId('viewer-access')).toHaveTextContent('Yes');
    });
  });
  
  it('correctly assigns permissions for editor role', async () => {
    // Mock editor user token
    jest.requireMock('jsonwebtoken').decode.mockReturnValue({ 
      username: 'editoruser', 
      role: 'editor',
      exp: Math.floor(Date.now() / 1000) + 3600
    });
    
    render(
      <SessionManager>
        <RoleTestComponent />
      </SessionManager>
    );
    
    // Wait for authentication to complete
    await waitFor(() => {
      // Editor should have access to editor and viewer roles, but not admin
      expect(screen.getByTestId('admin-access')).toHaveTextContent('No');
      expect(screen.getByTestId('editor-access')).toHaveTextContent('Yes');
      expect(screen.getByTestId('viewer-access')).toHaveTextContent('Yes');
    });
  });
  
  it('correctly assigns permissions for viewer role', async () => {
    // Mock viewer user token
    jest.requireMock('jsonwebtoken').decode.mockReturnValue({ 
      username: 'vieweruser', 
      role: 'viewer',
      exp: Math.floor(Date.now() / 1000) + 3600
    });
    
    render(
      <SessionManager>
        <RoleTestComponent />
      </SessionManager>
    );
    
    // Wait for authentication to complete
    await waitFor(() => {
      // Viewer should only have access to viewer role
      expect(screen.getByTestId('admin-access')).toHaveTextContent('No');
      expect(screen.getByTestId('editor-access')).toHaveTextContent('No');
      expect(screen.getByTestId('viewer-access')).toHaveTextContent('Yes');
    });
  });
  
  it('denies access when not authenticated', async () => {
    // Mock no token
    (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
    
    render(
      <SessionManager>
        <RoleTestComponent />
      </SessionManager>
    );
    
    // No access to any role when not authenticated
    expect(screen.getByTestId('admin-access')).toHaveTextContent('No');
    expect(screen.getByTestId('editor-access')).toHaveTextContent('No');
    expect(screen.getByTestId('viewer-access')).toHaveTextContent('No');
  });
});
