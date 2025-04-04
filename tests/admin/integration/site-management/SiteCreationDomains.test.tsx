import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import SiteForm from '@/components/admin/sites/SiteForm';
import { DomainManager } from '@/components/admin/sites/DomainManager';

// Mock the hooks and API calls
jest.mock('@/components/admin/sites/hooks/useSites', () => ({
  useSites: jest.fn(),
}));

jest.mock('@/components/admin/sites/hooks/useDomains', () => ({
  useDomains: jest.fn(),
}));

// Mock hooks implementation
import { useSites } from '@/components/admin/sites/hooks/useSites';
import { useDomains } from '@/components/admin/sites/hooks/useDomains';

const mockStore = configureStore([]);

describe('Integration: Site Creation - Domain Management Step', () => {
  let store;

  beforeEach(() => {
    // Mock the site hook
    (useSites as jest.Mock).mockReturnValue({
      sites: [],
      isLoading: false,
      error: null,
      validateSiteData: jest.fn(() => ({})),
      currentStep: 1, // Domain step
      setCurrentStep: jest.fn(),
      siteData: {
        name: 'Test Site',
        slug: 'test-site',
        description: 'This is a test site',
        domains: []
      },
      updateSiteData: jest.fn(),
    });

    // Mock the domains hook
    (useDomains as jest.Mock).mockReturnValue({
      domains: [],
      isLoading: false,
      error: null,
      addDomain: jest.fn(),
      removeDomain: jest.fn(),
      setPrimaryDomain: jest.fn(),
      validateDomain: jest.fn(() => ({})), // No validation errors
    });

    // Create a mock store
    store = mockStore({
      sites: {
        items: [],
        loading: false,
        error: null,
        currentSite: null,
      },
    });
  });

  it('should add a domain to the site', async () => {
    const mockAddDomain = jest.fn();
    (useDomains as jest.Mock).mockReturnValue({
      domains: [],
      isLoading: false,
      error: null,
      success: null,
      domainInput: 'example.com',
      errors: {},
      setDomainInput: jest.fn(),
      addDomain: mockAddDomain,
      removeDomain: jest.fn(),
      setPrimaryDomain: jest.fn(),
      validateDomain: jest.fn(() => ({})),
      handleInputChange: jest.fn(),
      handleSubmit: jest.fn(),
    });

    render(
      <Provider store={store}>
        <DomainManager
          initialData={{ domains: [] }}
          mode="create"
        />
      </Provider>
    );

    // Find the add domain button and click it
    const addButton = screen.getByTestId('domainManager-add-domain');
    fireEvent.click(addButton);

    // Verify the addDomain function was called
    expect(mockAddDomain).toHaveBeenCalled();
  });

  it('should show domain validation errors', async () => {
    (useDomains as jest.Mock).mockReturnValue({
      domains: [],
      isLoading: false,
      error: null,
      success: null,
      domainInput: 'invalid domain',
      errors: {
        domainInput: 'Please enter a valid domain name'
      },
      setDomainInput: jest.fn(),
      addDomain: jest.fn(),
      removeDomain: jest.fn(),
      setPrimaryDomain: jest.fn(),
      validateDomain: jest.fn(),
      handleInputChange: jest.fn(),
      handleSubmit: jest.fn(),
    });

    render(
      <Provider store={store}>
        <DomainManager
          initialData={{ domains: [] }}
          mode="create"
        />
      </Provider>
    );

    // Verify the error message is displayed
    const errorMessage = screen.getByTestId('domainManager-domain-input-error');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveTextContent('Please enter a valid domain name');
  });

  it('should remove a domain from the site', async () => {
    const mockRemoveDomain = jest.fn();

    (useDomains as jest.Mock).mockReturnValue({
      domains: ['example.com', 'test.com'],
      isLoading: false,
      error: null,
      success: null,
      domainInput: '',
      errors: {},
      setDomainInput: jest.fn(),
      addDomain: jest.fn(),
      removeDomain: mockRemoveDomain,
      setPrimaryDomain: jest.fn(),
      validateDomain: jest.fn(),
      handleInputChange: jest.fn(),
      handleSubmit: jest.fn(),
    });

    render(
      <Provider store={store}>
        <DomainManager
          initialData={{ domains: ['example.com', 'test.com'] }}
          mode="create"
        />
      </Provider>
    );

    // Find the remove button for the first domain and click it
    const removeButton = screen.getByTestId('domainManager-remove-domain-0');
    fireEvent.click(removeButton);

    // Verify the removeDomain function was called with the correct domain
    expect(mockRemoveDomain).toHaveBeenCalledWith('example.com');
  });

  it('should disable the add button when no domain is entered', async () => {
    (useDomains as jest.Mock).mockReturnValue({
      domains: [],
      isLoading: false,
      error: null,
      success: null,
      domainInput: '',
      errors: {},
      setDomainInput: jest.fn(),
      addDomain: jest.fn(),
      removeDomain: jest.fn(),
      setPrimaryDomain: jest.fn(),
      validateDomain: jest.fn(),
      handleInputChange: jest.fn(),
      handleSubmit: jest.fn(),
    });

    render(
      <Provider store={store}>
        <DomainManager
          initialData={{ domains: [] }}
          mode="create"
        />
      </Provider>
    );

    // Find the add domain button and verify it's disabled
    const addButton = screen.getByTestId('domainManager-add-domain');
    expect(addButton).toBeDisabled();
  });
});
