/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UnifiedAuthComponent } from '@/components/auth/UnifiedAuthComponent';

// Mock the authentication context
jest.mock('@/components/admin/auth/hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}));

// Import the mocked useAuth
import { useAuth } from '@/components/admin/auth/hooks/useAuth';

describe('UnifiedAuthComponent', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Terminology Tests', () => {
    it('should use "Log In" (verb) for the login button', () => {
      // Mock unauthenticated state
      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        user: null
      });

      render(<UnifiedAuthComponent />);

      // Check for "Log In" text (not "Sign In" or "Login")
      const loginButton = screen.getByRole('button', { name: /log in/i });
      expect(loginButton).toBeInTheDocument();
      expect(loginButton).not.toHaveTextContent(/sign in/i);
      expect(loginButton).not.toHaveTextContent(/login/i);
    });

    it('should use "Log Out" (verb) for the logout option', () => {
      // Mock authenticated state
      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        user: { username: 'testuser', role: 'user' },
        logout: jest.fn()
      });

      render(<UnifiedAuthComponent />);

      // Open the dropdown
      const userButton = screen.getByText('testuser');
      fireEvent.click(userButton);

      // Check for "Log Out" text (not "Sign Out" or "Logout")
      const logoutButton = screen.getByRole('menuitem', { name: /log out/i });
      expect(logoutButton).toBeInTheDocument();
      expect(logoutButton).not.toHaveTextContent(/sign out/i);
      expect(logoutButton).not.toHaveTextContent(/logout/i);
    });
  });

  describe('Authentication State Tests', () => {
    it('should show login button when user is not authenticated', () => {
      // Mock unauthenticated state
      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        user: null
      });

      render(<UnifiedAuthComponent />);

      // Check for login button
      expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();

      // Verify user menu is not shown
      expect(screen.queryByText(/testuser/i)).not.toBeInTheDocument();
    });

    it('should show user info and dropdown when user is authenticated', () => {
      // Mock authenticated state
      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        user: { username: 'testuser', role: 'user' },
        logout: jest.fn()
      });

      render(<UnifiedAuthComponent />);

      // Check for user info
      expect(screen.getByText('testuser')).toBeInTheDocument();

      // Verify login button is not shown
      expect(screen.queryByRole('button', { name: /log in/i })).not.toBeInTheDocument();
    });

    it('should call logout when Log Out is clicked', () => {
      // Mock authenticated state with logout function
      const mockLogout = jest.fn();
      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        user: { username: 'testuser', role: 'user' },
        logout: mockLogout
      });

      render(<UnifiedAuthComponent />);

      // Open the dropdown
      const userButton = screen.getByText('testuser');
      fireEvent.click(userButton);

      // Click logout
      const logoutButton = screen.getByRole('menuitem', { name: /log out/i });
      fireEvent.click(logoutButton);

      // Verify logout was called
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('Role-Based Tests', () => {
    it('should indicate admin role when user is an admin', () => {
      // Mock authenticated admin state
      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        user: { username: 'adminuser', role: 'admin' },
        logout: jest.fn()
      });

      render(<UnifiedAuthComponent />);

      // Open the dropdown
      const userButton = screen.getByText('adminuser');
      fireEvent.click(userButton);

      // Check for admin indicator
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('should not show admin indicator for regular users', () => {
      // Mock authenticated regular user state
      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        user: { username: 'regularuser', role: 'user' },
        logout: jest.fn()
      });

      render(<UnifiedAuthComponent />);

      // Open the dropdown
      const userButton = screen.getByText('regularuser');
      fireEvent.click(userButton);

      // Check that admin indicator is not present
      expect(screen.queryByText(/admin/i)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    it('should have proper ARIA attributes for the dropdown menu', () => {
      // Mock authenticated state
      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        user: { username: 'testuser', role: 'user' },
        logout: jest.fn()
      });

      render(<UnifiedAuthComponent />);

      // Check for proper ARIA attributes on the dropdown button
      const userButton = screen.getByText('testuser');
      expect(userButton).toHaveAttribute('aria-haspopup', 'true');

      // Open the dropdown
      fireEvent.click(userButton);

      // Check that the dropdown has proper ARIA attributes
      const dropdown = screen.getByRole('menu');
      expect(dropdown).toBeInTheDocument();
      expect(dropdown).toHaveAttribute('aria-labelledby', userButton.id);
    });

    it('should be keyboard navigable', () => {
      // Mock authenticated state
      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        user: { username: 'testuser', role: 'user' },
        logout: jest.fn()
      });

      render(<UnifiedAuthComponent />);

      // Focus the user button
      const userButton = screen.getByText('testuser');
      userButton.focus();
      expect(document.activeElement).toBe(userButton);

      // Press Enter to open dropdown
      fireEvent.keyDown(userButton, { key: 'Enter', code: 'Enter' });

      // Check that dropdown is open
      const dropdown = screen.getByRole('menu');
      expect(dropdown).toBeInTheDocument();

      // Check that first menu item is focusable
      const firstMenuItem = screen.getByRole('menuitem', { name: /profile/i });
      firstMenuItem.focus();
      expect(document.activeElement).toBe(firstMenuItem);
    });
  });

  describe('Customization Tests', () => {
    it('should accept custom className prop', () => {
      // Mock unauthenticated state
      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        user: null
      });

      render(<UnifiedAuthComponent className="custom-class" />);

      // Check that the component has the custom class
      const component = screen.getByTestId('unified-auth-component');
      expect(component).toHaveClass('custom-class');
    });

    it('should accept custom position prop', () => {
      // Mock unauthenticated state
      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        user: null
      });

      render(<UnifiedAuthComponent position="left" />);

      // Check that the component has the left position class
      const component = screen.getByTestId('unified-auth-component');
      expect(component).toHaveClass('justify-start');
    });
  });
});
