import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import SiteForm from '@/components/admin/sites/SiteForm';
import DomainStep from '@/components/admin/sites/components/DomainStep';

// Mock the hooks and API calls
jest.mock('../../../../src/components/admin/sites/hooks/useSites', () => ({
  useSites: jest.fn(),
}));

jest.mock('../../../../src/components/admin/sites/hooks/useDomains', () => ({
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

  it.skip($2, async () => {
    const { addDomain, validateDomain } = useDomains();
    const { updateSiteData } = useSites();
    
    render(
      <Provider store={store}>
        <DomainStep />
      </Provider>
    );

    // Enter a domain name
    fireEvent.change(screen.getByTestId('domain-input'), { target: { value: 'example.com' } });
    
    // Click add domain button
    fireEvent.click(screen.getByTestId('add-domain-button'));
    
    // Verify domain validation was called
    expect(validateDomain).toHaveBeenCalledWith('example.com');
    
    // Verify domain was added
    expect(addDomain).toHaveBeenCalledWith('example.com');
    
    // Update domain state to show added domain
    (useDomains as jest.Mock).mockReturnValue({
      domains: [{ name: 'example.com', isPrimary: true }],
      isLoading: false,
      error: null,
      addDomain,
      removeDomain: jest.fn(),
      setPrimaryDomain: jest.fn(),
      validateDomain,
    });
    
    // Re-render component with updated domain
    render(
      <Provider store={store}>
        <DomainStep />
      </Provider>
    );
    
    // Verify the domain appears in the list
    expect(screen.getByText('example.com')).toBeInTheDocument();
    
    // Verify site data was updated with the domain
    expect(updateSiteData).toHaveBeenCalledWith(
      expect.objectContaining({
        domains: [{ name: 'example.com', isPrimary: true }]
      })
    );
  });

  it.skip($2, async () => {
    // Mock a validation error
    (useDomains as jest.Mock).mockReturnValue({
      domains: [],
      isLoading: false,
      error: null,
      addDomain: jest.fn(),
      removeDomain: jest.fn(),
      setPrimaryDomain: jest.fn(),
      validateDomain: jest.fn(() => ({ 
        domain: 'Invalid domain format'
      })),
    });
    
    render(
      <Provider store={store}>
        <DomainStep />
      </Provider>
    );

    // Enter an invalid domain name
    fireEvent.change(screen.getByTestId('domain-input'), { target: { value: 'invalid-domain' } });
    
    // Click add domain button
    fireEvent.click(screen.getByTestId('add-domain-button'));
    
    // Verify validation error is displayed
    expect(screen.getByText('Invalid domain format')).toBeInTheDocument();
    
    // Verify domain was not added
    expect(useDomains().addDomain).not.toHaveBeenCalled();
  });

  it.skip($2, async () => {
    const { removeDomain } = useDomains();
    const { updateSiteData } = useSites();
    
    // Start with an existing domain
    (useDomains as jest.Mock).mockReturnValue({
      domains: [{ name: 'example.com', isPrimary: true }],
      isLoading: false,
      error: null,
      addDomain: jest.fn(),
      removeDomain,
      setPrimaryDomain: jest.fn(),
      validateDomain: jest.fn(() => ({})),
    });
    
    render(
      <Provider store={store}>
        <DomainStep />
      </Provider>
    );

    // Verify the domain appears in the list
    expect(screen.getByText('example.com')).toBeInTheDocument();
    
    // Click the remove domain button
    fireEvent.click(screen.getByTestId('remove-domain-example.com'));
    
    // Verify removeDomain was called
    expect(removeDomain).toHaveBeenCalledWith('example.com');
    
    // Update domain state to show empty domains
    (useDomains as jest.Mock).mockReturnValue({
      domains: [],
      isLoading: false,
      error: null,
      addDomain: jest.fn(),
      removeDomain,
      setPrimaryDomain: jest.fn(),
      validateDomain: jest.fn(() => ({})),
    });
    
    // Re-render component with updated domains
    render(
      <Provider store={store}>
        <DomainStep />
      </Provider>
    );
    
    // Verify the domain is no longer in the list
    expect(screen.queryByText('example.com')).not.toBeInTheDocument();
    
    // Verify site data was updated with empty domains
    expect(updateSiteData).toHaveBeenCalledWith(
      expect.objectContaining({
        domains: []
      })
    );
  });

  it.skip($2, async () => {
    const { setPrimaryDomain } = useDomains();
    
    // Start with multiple domains
    (useDomains as jest.Mock).mockReturnValue({
      domains: [
        { name: 'example.com', isPrimary: true },
        { name: 'test.com', isPrimary: false }
      ],
      isLoading: false,
      error: null,
      addDomain: jest.fn(),
      removeDomain: jest.fn(),
      setPrimaryDomain,
      validateDomain: jest.fn(() => ({})),
    });
    
    render(
      <Provider store={store}>
        <DomainStep />
      </Provider>
    );

    // Verify both domains appear in the list
    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.getByText('test.com')).toBeInTheDocument();
    
    // Check that example.com is marked as primary
    expect(screen.getByTestId('primary-domain-example.com')).toBeInTheDocument();
    
    // Set test.com as the primary domain
    fireEvent.click(screen.getByTestId('set-primary-test.com'));
    
    // Verify setPrimaryDomain was called
    expect(setPrimaryDomain).toHaveBeenCalledWith('test.com');
    
    // Update domain state to show the new primary domain
    (useDomains as jest.Mock).mockReturnValue({
      domains: [
        { name: 'example.com', isPrimary: false },
        { name: 'test.com', isPrimary: true }
      ],
      isLoading: false,
      error: null,
      addDomain: jest.fn(),
      removeDomain: jest.fn(),
      setPrimaryDomain,
      validateDomain: jest.fn(() => ({})),
    });
    
    // Re-render component with updated primary domain
    render(
      <Provider store={store}>
        <DomainStep />
      </Provider>
    );
    
    // Verify test.com is now marked as primary
    expect(screen.getByTestId('primary-domain-test.com')).toBeInTheDocument();
  });
});
