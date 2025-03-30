import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { SiteForm } from '../../../../src/components/admin/sites/SiteForm';

// Mock the hooks and API calls
jest.mock('../../../../src/components/admin/sites/hooks/useSites', () => ({
  useSites: jest.fn(),
}));

// Mock next router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock the hooks implementation
import { useSites } from '../../../../src/components/admin/sites/hooks/useSites';
import { useRouter } from 'next/router';

const mockStore = configureStore([]);

describe('Integration: Site Creation - Basic Info Step', () => {
  let store;
  
  beforeEach(() => {
    // Mock router
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      pathname: '/admin/sites/new',
      query: {},
      asPath: '/admin/sites/new',
    });
    
    // Mock the site hook
    (useSites as jest.Mock).mockReturnValue({
      sites: [],
      isLoading: false,
      error: null,
      createSite: jest.fn(),
      validateSiteData: jest.fn(() => ({})), // No validation errors
      currentStep: 0,
      setCurrentStep: jest.fn(),
      siteData: {
        name: '',
        slug: '',
        description: '',
      },
      updateSiteData: jest.fn(),
      isSubmitting: false,
      submitSite: jest.fn(),
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

  it('should validate and update basic info data correctly', async () => {
    const { updateSiteData, validateSiteData, setCurrentStep } = useSites();
    
    render(
      <Provider store={store}>
        <SiteForm />
      </Provider>
    );

    // Check that we're on the first step (Basic Info)
    expect(screen.getByTestId('site-form-step-0')).toBeInTheDocument();
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    
    // Fill in basic info
    fireEvent.change(screen.getByTestId('site-name-input'), { target: { value: 'Test Site' } });
    fireEvent.change(screen.getByTestId('site-slug-input'), { target: { value: 'test-site' } });
    fireEvent.change(screen.getByTestId('site-description-input'), { target: { value: 'This is a test site' } });
    
    // Check that updateSiteData was called with correct values
    expect(updateSiteData).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Test Site',
      slug: 'test-site',
      description: 'This is a test site',
    }));
    
    // Try to go to next step
    fireEvent.click(screen.getByTestId('next-step-button'));
    
    // Verify validation was called
    expect(validateSiteData).toHaveBeenCalled();
    
    // Verify navigation to next step
    expect(setCurrentStep).toHaveBeenCalledWith(1);
  });

  it('should show validation errors when data is invalid', async () => {
    // Mock validation errors
    (useSites as jest.Mock).mockReturnValue({
      sites: [],
      isLoading: false,
      error: null,
      createSite: jest.fn(),
      validateSiteData: jest.fn(() => ({ 
        name: 'Site name is required',
        slug: 'Slug is required'
      })),
      currentStep: 0,
      setCurrentStep: jest.fn(),
      siteData: {
        name: '',
        slug: '',
        description: '',
      },
      updateSiteData: jest.fn(),
      isSubmitting: false,
      submitSite: jest.fn(),
    });
    
    render(
      <Provider store={store}>
        <SiteForm />
      </Provider>
    );
    
    // Try to go to next step without filling required fields
    fireEvent.click(screen.getByTestId('next-step-button'));
    
    // Verify validation errors are displayed
    expect(screen.getByText('Site name is required')).toBeInTheDocument();
    expect(screen.getByText('Slug is required')).toBeInTheDocument();
    
    // Verify we didn't navigate to the next step
    expect(useSites().setCurrentStep).not.toHaveBeenCalled();
  });

  it('should auto-generate a slug from the site name', async () => {
    const { updateSiteData } = useSites();
    
    render(
      <Provider store={store}>
        <SiteForm />
      </Provider>
    );
    
    // Fill in site name only
    fireEvent.change(screen.getByTestId('site-name-input'), { target: { value: 'My Test Site' } });
    
    // Click the auto-generate slug button
    fireEvent.click(screen.getByTestId('generate-slug-button'));
    
    // Check that updateSiteData was called with the auto-generated slug
    expect(updateSiteData).toHaveBeenCalledWith(expect.objectContaining({
      slug: 'my-test-site'
    }));
  });
});
