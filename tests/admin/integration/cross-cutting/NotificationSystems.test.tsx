import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import SiteForm from '@/components/admin/sites/SiteForm';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';

// Mock the hooks and API calls
jest.mock('@/components/admin/sites/hooks', () => ({
  useSites: jest.fn(),
}));

jest.mock('@/components/notifications/hooks/useNotifications', () => ({
  useNotifications: jest.fn(),
}));

// Mock hooks implementation
import { useSites } from '@/components/admin/sites/hooks';
import { useNotifications } from '@/components/notifications/hooks/useNotifications';

const mockStore = configureStore([]);

describe('Integration: Notification Systems for Operations', () => {
  let store;

  beforeEach(() => {
    // Mock the notifications hook
    const showNotification = jest.fn();
    const dismissNotification = jest.fn();

    (useNotifications as jest.Mock).mockReturnValue({
      notifications: [],
      showNotification,
      dismissNotification,
    });

    // Mock the sites hook with submit functionality
    (useSites as jest.Mock).mockReturnValue({
      sites: [],
      isLoading: false,
      error: null,
      success: null,
      errors: {},
      site: {
        name: 'Test Site',
        slug: 'test-site',
        description: 'This is a test site',
        domains: [],
        id: 'test-id'
      },
      updateSite: jest.fn(),
      validateSite: jest.fn(() => true),
      createSite: jest.fn(),
      saveSite: jest.fn(),
      resetErrors: jest.fn(),
    });

    // Create a mock store
    store = mockStore({
      sites: {
        items: [],
        loading: false,
        error: null,
      },
      notifications: {
        items: [],
      },
    });
  });

  it('should show a success notification when site creation succeeds', async () => {
    const { createSite } = useSites();
    const { showNotification } = useNotifications();

    // Implement a successful submission
    createSite.mockImplementation(() => {
      return Promise.resolve({
        success: true,
        data: { id: 'new-site-id', name: 'Test Site' }
      });
    });

    render(
      <Provider store={store}>
        <NotificationProvider>
          <SiteForm />
        </NotificationProvider>
      </Provider>
    );

    // Get the form and submit it directly
    const form = screen.getByTestId('siteForm-form');
    fireEvent.submit(form);

    // Verify createSite was called
    expect(createSite).toHaveBeenCalled();

    // Wait for the async submission to complete
    await waitFor(() => {
      // Verify showNotification was called with success message
      expect(showNotification).toHaveBeenCalledWith(expect.objectContaining({
        type: 'success',
        title: 'Site Created',
        message: 'Your site has been created successfully'
      }));
    });

    // Verify notification was shown
    expect(showNotification).toHaveBeenCalled();
  });

  it('should show an error notification when site creation fails', async () => {
    const { createSite } = useSites();
    const { showNotification } = useNotifications();

    // Implement a failed submission
    createSite.mockImplementation(() => {
      return Promise.reject(new Error('API Error'));
    });

    render(
      <Provider store={store}>
        <NotificationProvider>
          <SiteForm />
        </NotificationProvider>
      </Provider>
    );

    // Get the form and submit it directly
    const form = screen.getByTestId('siteForm-form');
    fireEvent.submit(form);

    // Verify createSite was called
    expect(createSite).toHaveBeenCalled();

    // Wait for the async submission to complete
    await waitFor(() => {
      // Verify showNotification was called with error message
      expect(showNotification).toHaveBeenCalledWith(expect.objectContaining({
        type: 'error',
        title: 'Site Creation Failed',
        message: expect.stringContaining('There was an error creating your site')
      }));
    });

    // Verify notification was shown
    expect(showNotification).toHaveBeenCalled();
  });
});
