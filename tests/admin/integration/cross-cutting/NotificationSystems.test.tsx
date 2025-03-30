import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { SiteForm } from '@/components/admin/sites/SiteForm';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';

// Mock the hooks and API calls
jest.mock('@/hooks/useSites', () => ({
  useSites: jest.fn(),
}));

jest.mock('@/hooks/useNotifications', () => ({
  useNotifications: jest.fn(),
}));

// Mock hooks implementation
import { useSites } from '@/hooks/useSites';
import { useNotifications } from '@/hooks/useNotifications';

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
      currentStep: 0,
      setCurrentStep: jest.fn(),
      siteData: {
        name: 'Test Site',
        slug: 'test-site',
        description: 'This is a test site',
      },
      updateSiteData: jest.fn(),
      validateSiteData: jest.fn(() => ({})),
      submitSite: jest.fn(),
      isSubmitting: false,
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
    const { submitSite } = useSites();
    const { showNotification } = useNotifications();
    
    // Implement a successful submission
    submitSite.mockImplementation(() => {
      showNotification({
        type: 'success',
        title: 'Site Created',
        message: 'Your site has been created successfully',
        duration: 5000,
      });
      
      return Promise.resolve({ id: 'new-site-id', name: 'Test Site' });
    });
    
    render(
      <Provider store={store}>
        <NotificationProvider>
          <SiteForm />
        </NotificationProvider>
      </Provider>
    );
    
    // Submit the form
    fireEvent.click(screen.getByTestId('submit-site-button'));
    
    // Verify submitSite was called
    expect(submitSite).toHaveBeenCalled();
    
    // Wait for the async submission to complete
    await waitFor(() => {
      // Verify showNotification was called with success message
      expect(showNotification).toHaveBeenCalledWith({
        type: 'success',
        title: 'Site Created',
        message: 'Your site has been created successfully',
        duration: 5000,
      });
    });
    
    // Update notifications in the mock hook
    (useNotifications as jest.Mock).mockReturnValue({
      notifications: [{
        id: 'notification-1',
        type: 'success',
        title: 'Site Created',
        message: 'Your site has been created successfully',
      }],
      showNotification: jest.fn(),
      dismissNotification: jest.fn(),
    });
    
    // Re-render with the notification
    render(
      <Provider store={store}>
        <NotificationProvider>
          <SiteForm />
        </NotificationProvider>
      </Provider>
    );
    
    // Verify notification is displayed
    expect(screen.getByText('Site Created')).toBeInTheDocument();
    expect(screen.getByText('Your site has been created successfully')).toBeInTheDocument();
  });

  it('should show an error notification when site creation fails', async () => {
    const { submitSite } = useSites();
    const { showNotification } = useNotifications();
    
    // Implement a failed submission
    submitSite.mockImplementation(() => {
      showNotification({
        type: 'error',
        title: 'Site Creation Failed',
        message: 'There was an error creating your site',
        duration: 5000,
      });
      
      return Promise.reject(new Error('API Error'));
    });
    
    render(
      <Provider store={store}>
        <NotificationProvider>
          <SiteForm />
        </NotificationProvider>
      </Provider>
    );
    
    // Submit the form
    fireEvent.click(screen.getByTestId('submit-site-button'));
    
    // Verify submitSite was called
    expect(submitSite).toHaveBeenCalled();
    
    // Wait for the async submission to complete
    await waitFor(() => {
      // Verify showNotification was called with error message
      expect(showNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Site Creation Failed',
        message: 'There was an error creating your site',
        duration: 5000,
      });
    });
    
    // Update notifications in the mock hook
    (useNotifications as jest.Mock).mockReturnValue({
      notifications: [{
        id: 'notification-1',
        type: 'error',
        title: 'Site Creation Failed',
        message: 'There was an error creating your site',
      }],
      showNotification: jest.fn(),
      dismissNotification: jest.fn(),
    });
    
    // Re-render with the notification
    render(
      <Provider store={store}>
        <NotificationProvider>
          <SiteForm />
        </NotificationProvider>
      </Provider>
    );
    
    // Verify notification is displayed
    expect(screen.getByText('Site Creation Failed')).toBeInTheDocument();
    expect(screen.getByText('There was an error creating your site')).toBeInTheDocument();
  });
});
