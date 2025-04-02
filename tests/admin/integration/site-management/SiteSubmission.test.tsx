import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import SiteForm from '@/components/admin/sites/SiteForm';

// Mock the hooks and API calls
jest.mock('../../../../src/components/admin/sites/hooks/useSites', () => ({
  useSites: jest.fn(),
}));

// Mock next router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock hooks implementation
import { useSites } from '@/components/admin/sites/hooks/useSites';
import { useRouter } from 'next/router';

const mockStore = configureStore([]);

describe('Integration: Site Creation - Submission', () => {
  let store;
  
  beforeEach(() => {
    // Mock router
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      pathname: '/admin/sites/new',
      query: {},
      asPath: '/admin/sites/new',
    });
    
    // Mock the site hook with complete site data
    (useSites as jest.Mock).mockReturnValue({
      sites: [],
      isLoading: false,
      error: null,
      validateSiteData: jest.fn(() => ({})),
      currentStep: 3, // Final step
      setCurrentStep: jest.fn(),
      siteData: {
        name: 'Test Site',
        slug: 'test-site',
        description: 'This is a test site',
        domains: [{ name: 'example.com', isPrimary: true }],
        theme: 'default',
        customCSS: '',
        seoSettings: {
          title: 'Test Site Title',
          description: 'SEO description',
          keywords: 'test, site',
          noindex: false,
        }
      },
      updateSiteData: jest.fn(),
      submitSite: jest.fn(),
      isSubmitting: false,
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
    const { submitSite } = useSites();
    const { push } = useRouter();
    
    render(
      <Provider store={store}>
        <SiteForm />
      </Provider>
    );

    // Click the submit button
    fireEvent.click(screen.getByTestId('submit-site-button'));
    
    // Verify submitSite was called with the site data
    expect(submitSite).toHaveBeenCalled();
    
    // Simulate successful submission
    (useSites as jest.Mock).mockReturnValue({
      sites: [],
      isLoading: false,
      error: null,
      validateSiteData: jest.fn(() => ({})),
      currentStep: 3,
      setCurrentStep: jest.fn(),
      siteData: {
        id: 'new-site-id',
        name: 'Test Site',
        slug: 'test-site',
        description: 'This is a test site',
        domains: [{ name: 'example.com', isPrimary: true }],
        theme: 'default',
        customCSS: '',
        seoSettings: {
          title: 'Test Site Title',
          description: 'SEO description',
          keywords: 'test, site',
          noindex: false,
        }
      },
      updateSiteData: jest.fn(),
      submitSite,
      isSubmitting: false,
      submissionSuccess: true,
    });
    
    // Re-render to show success state
    render(
      <Provider store={store}>
        <SiteForm />
      </Provider>
    );
    
    // Verify success message is displayed
    expect(screen.getByTestId('submission-success-message')).toBeInTheDocument();
    
    // Verify router redirection to sites list
    expect(push).toHaveBeenCalledWith('/admin/sites');
  });
});
