import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
// Import components directly without using the @ alias
import { ListingTable } from '../../../../src/components/admin/listings/ListingTable';
import { SiteTable } from '../../../../src/components/admin/sites/table/SiteTable';
import { AuthProvider } from '../../../../src/components/admin/auth/AuthContainer';
import { WithAuth } from '../../../../src/components/admin/layout/WithAuth';

// Mock the hooks and API calls
const mockUseAuth = jest.fn();
const mockUseListings = jest.fn();
const mockUseSites = jest.fn();
const mockUseRouter = jest.fn();

// Create the mocks
jest.mock('../../../../src/components/admin/auth/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../../../../src/components/admin/listings/hooks/useListings', () => ({
  useListings: () => mockUseListings(),
}));

jest.mock('../../../../src/components/admin/sites/hooks/useSites', () => ({
  useSites: () => mockUseSites(),
}));

// Mock next router
jest.mock('next/router', () => ({
  useRouter: () => mockUseRouter(),
}));

// Import hooks
import { useAuth } from '../../../../src/components/admin/auth/hooks/useAuth';
import { useListings } from '../../../../src/components/admin/listings/hooks/useListings';
import { useSites } from '../../../../src/components/admin/sites/hooks/useSites';
import { useRouter } from 'next/router';

const mockStore = configureStore([]);

describe('Integration: Authorization Boundaries between Components', () => {
  let store;
  
  beforeEach(() => {
    // Mock router
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
      pathname: '/admin/listings',
      query: {},
      asPath: '/admin/listings',
    });
    
    // Create a mock store
    store = mockStore({
      auth: {
        user: {
          id: 'user1',
          role: 'editor', // Default role
        },
        isAuthenticated: true,
        loading: false,
        error: null,
      },
      listings: {
        items: [
          { id: 'listing1', title: 'Listing 1', ownerId: 'user1' },
          { id: 'listing2', title: 'Listing 2', ownerId: 'user2' },
        ],
        loading: false,
        error: null,
      },
      sites: {
        items: [
          { id: 'site1', name: 'Site 1', ownerId: 'user1' },
          { id: 'site2', name: 'Site 2', ownerId: 'user2' },
        ],
        loading: false,
        error: null,
      },
    });
  });

  it('should only show edit actions for owned content to editors', async () => {
    // Mock auth hook for editor role
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user1',
        role: 'editor',
      },
      isAuthenticated: true,
      isLoading: false,
      error: null,
      hasPermission: jest.fn((action, resourceId, ownerId) => {
        // Editors can edit their own content
        if (action === 'edit' && ownerId === 'user1') {
          return true;
        }
        return false;
      }),
    });
    
    // Mock listings hook
    mockUseListings.mockReturnValue({
      listings: [
        { id: 'listing1', title: 'Listing 1', ownerId: 'user1' },
        { id: 'listing2', title: 'Listing 2', ownerId: 'user2' },
      ],
      isLoading: false,
      error: null,
    });
    
    render(
      <Provider store={store}>
        <AuthProvider>
          <WithAuth requiredPermissions={['view_listings']}>
            <ListingTable />
          </WithAuth>
        </AuthProvider>
      </Provider>
    );

    // Verify that both listings are visible
    expect(screen.getByText('Listing 1')).toBeInTheDocument();
    expect(screen.getByText('Listing 2')).toBeInTheDocument();
    
    // Verify edit button is shown only for the user's own listing
    expect(screen.getByTestId('edit-listing-listing1')).toBeInTheDocument();
    expect(screen.queryByTestId('edit-listing-listing2')).not.toBeInTheDocument();
  });

  it('should show all edit actions to admin users', async () => {
    // Mock auth hook for admin role
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user1',
        role: 'admin',
      },
      isAuthenticated: true,
      isLoading: false,
      error: null,
      hasPermission: jest.fn(() => true), // Admins can do anything
    });
    
    // Mock listings hook
    mockUseListings.mockReturnValue({
      listings: [
        { id: 'listing1', title: 'Listing 1', ownerId: 'user1' },
        { id: 'listing2', title: 'Listing 2', ownerId: 'user2' },
      ],
      isLoading: false,
      error: null,
    });
    
    render(
      <Provider store={store}>
        <AuthProvider>
          <WithAuth requiredPermissions={['view_listings']}>
            <ListingTable />
          </WithAuth>
        </AuthProvider>
      </Provider>
    );

    // Verify that both listings are visible
    expect(screen.getByText('Listing 1')).toBeInTheDocument();
    expect(screen.getByText('Listing 2')).toBeInTheDocument();
    
    // Verify edit buttons are shown for all listings
    expect(screen.getByTestId('edit-listing-listing1')).toBeInTheDocument();
    expect(screen.getByTestId('edit-listing-listing2')).toBeInTheDocument();
  });

  it('should redirect users without required permissions', async () => {
    const push = jest.fn();
    mockUseRouter.mockReturnValue({ push });
    
    // Mock auth hook with insufficient permissions
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user1',
        role: 'viewer',
      },
      isAuthenticated: true,
      isLoading: false,
      error: null,
      hasPermission: jest.fn((action) => {
        // Viewers can only view, not manage
        return action === 'view';
      }),
    });
    
    // Mock sites hook
    mockUseSites.mockReturnValue({
      sites: [
        { id: 'site1', name: 'Site 1', ownerId: 'user1' },
        { id: 'site2', name: 'Site 2', ownerId: 'user2' },
      ],
      isLoading: false,
      error: null,
    });
    
    render(
      <Provider store={store}>
        <AuthProvider>
          <WithAuth requiredPermissions={['manage_sites']}>
            <SiteTable />
          </WithAuth>
        </AuthProvider>
      </Provider>
    );

    // Verify redirection to unauthorized page
    expect(push).toHaveBeenCalledWith('/admin/unauthorized');
    
    // Verify the component is not rendered
    expect(screen.queryByText('Site 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Site 2')).not.toBeInTheDocument();
  });
});
