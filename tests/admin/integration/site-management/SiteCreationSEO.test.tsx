import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import SEOStep from '@/components/admin/sites/components/SEOStep';

// Mock the hooks and API calls
jest.mock('../../../../src/components/admin/sites/hooks/useSites', () => ({
  useSites: jest.fn(),
}));

// Mock hooks implementation
import { useSites } from '@/components/admin/sites/hooks/useSites';

const mockStore = configureStore([]);

describe('Integration: Site Creation - SEO Settings Step', () => {
  let store;
  
  beforeEach(() => {
    // Mock the site hook
    (useSites as jest.Mock).mockReturnValue({
      sites: [],
      isLoading: false,
      error: null,
      validateSiteData: jest.fn(() => ({})),
      currentStep: 3, // SEO step
      setCurrentStep: jest.fn(),
      siteData: {
        name: 'Test Site',
        slug: 'test-site',
        description: 'This is a test site',
        seoSettings: {
          title: '',
          description: '',
          keywords: '',
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

  it('should update SEO settings correctly', async () => {
    const { updateSiteData } = useSites();
    
    render(
      <Provider store={store}>
        <SEOStep />
      </Provider>
    );

    // Fill in SEO fields
    fireEvent.change(screen.getByTestId('seo-title-input'), { target: { value: 'Test Site Title' } });
    fireEvent.change(screen.getByTestId('seo-description-input'), { target: { value: 'This is the SEO description' } });
    fireEvent.change(screen.getByTestId('seo-keywords-input'), { target: { value: 'test, site, keywords' } });
    
    // Toggle noindex option
    fireEvent.click(screen.getByTestId('seo-noindex-toggle'));
    
    // Verify updateSiteData was called with the correct values
    expect(updateSiteData).toHaveBeenCalledWith(expect.objectContaining({
      seoSettings: expect.objectContaining({
        title: 'Test Site Title',
        description: 'This is the SEO description',
        keywords: 'test, site, keywords',
        noindex: true
      })
    }));
  });
});
