import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { WithAuth } from '@/components/admin/auth/WithAuth';
import { useAuth } from '@/components/admin/auth/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';

// Mock the hooks
jest.mock('@/components/admin/auth/hooks/useAuth');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn()
}));

describe('WithAuth component', () => {
  const mockRouter = { push: jest.fn() };
  const mockPathname = '/admin/dashboard';

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (usePathname as jest.Mock).mockReturnValue(mockPathname);
  });

  it('renders children when user is authenticated', async () => {
    // Mock authenticated user
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    // Use act to ensure all effects run
    await act(async () => {
      render(
        <WithAuth>
          <div data-testid="protected-content">Protected Content</div>
        </WithAuth>
      );
    });

    // Should render children
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();

    // Should not redirect
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('renders loading component when authentication is in progress', async () => {
    // Mock authentication in progress
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    // Use act to ensure all effects run
    await act(async () => {
      render(
        <WithAuth>
          <div data-testid="protected-content">Protected Content</div>
        </WithAuth>
      );
    });

    // Should render default loading component and not the protected content
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();

    // Check for the loading spinner
    const loadingSpinner = document.querySelector('.animate-spin');
    expect(loadingSpinner).toBeInTheDocument();

    // Should not redirect yet
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('redirects to login page when user is not authenticated', async () => {
    // Mock unauthenticated user
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    // Simulate client-side rendering
    const originalUseEffect = React.useEffect;
    jest.spyOn(React, 'useEffect').mockImplementationOnce(callback => {
      return originalUseEffect(() => {
        callback();
        return () => {};
      }, []);
    });

    await act(async () => {
      render(
        <WithAuth>
          <div data-testid="protected-content">Protected Content</div>
        </WithAuth>
      );
    });

    // Should not render children
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();

    // Should redirect to login with return URL
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/login?returnUrl=%2Fadmin%2Fdashboard');
    });
  });

  it('renders custom loading component when provided', async () => {
    // Mock authentication in progress
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    // Use act to ensure all effects run
    await act(async () => {
      render(
        <WithAuth loadingComponent={<div data-testid="custom-loader">Custom Loading...</div>}>
          <div data-testid="protected-content">Protected Content</div>
        </WithAuth>
      );
    });

    // Should render custom loading component
    expect(screen.getByTestId('custom-loader')).toBeInTheDocument();
    expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('redirects to custom login path when provided', async () => {
    // Mock unauthenticated user
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    // Simulate client-side rendering
    const originalUseEffect = React.useEffect;
    jest.spyOn(React, 'useEffect').mockImplementationOnce(callback => {
      return originalUseEffect(() => {
        callback();
        return () => {};
      }, []);
    });

    await act(async () => {
      render(
        <WithAuth loginPath="/custom-login">
          <div data-testid="protected-content">Protected Content</div>
        </WithAuth>
      );
    });

    // Should redirect to custom login path
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/custom-login?returnUrl=%2Fadmin%2Fdashboard');
    });
  });
});
