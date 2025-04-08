import React from 'react';
import { render } from '@testing-library/react';
import { SiteFormContainer } from '../SiteFormContainer';
import { useSiteForm } from '../hooks/useSiteForm';
import { SiteFormPresentation } from '../SiteFormPresentation';

// Mock the dependencies
jest.mock('../hooks/useSiteForm');
jest.mock('../SiteFormPresentation', () => ({
  SiteFormPresentation: jest.fn(() => <div data-testid="mock-presentation" />)
}));

describe('SiteFormContainer', () => {
  const mockHookReturn = {
    // State
    activeStep: 'basic_info',
    completedSteps: [],
    newDomain: '',
    isFirstStep: true,
    isLastStep: false,
    
    // Site data and operations
    site: {
      id: 'test-id',
      name: 'Test Site',
      slug: 'test-site',
      description: 'Test description',
      domains: ['example.com'],
      theme: 'default',
      customStyles: '',
      seoTitle: 'Test SEO Title',
      seoDescription: 'Test SEO Description',
      seoKeywords: 'test, seo, keywords',
      enableCanonicalUrls: false
    },
    isLoading: false,
    error: null,
    success: null,
    errors: {},
    
    // Handlers
    handleChange: jest.fn(),
    handleStepChange: jest.fn(),
    handleNext: jest.fn(),
    handlePrevious: jest.fn(),
    handleSubmit: jest.fn(),
    addDomain: jest.fn(),
    removeDomain: jest.fn(),
    
    // From useSites
    updateSite: jest.fn(),
    validateSite: jest.fn(),
    resetErrors: jest.fn()
  };

  const mockProps = {
    initialData: {
      id: 'test-id',
      name: 'Test Site'
    },
    mode: 'edit' as const,
    onCancel: jest.fn(),
    onSuccess: jest.fn(),
    apiEndpoint: '/api/sites/test',
    initialStep: 'domains'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSiteForm as jest.Mock).mockReturnValue(mockHookReturn);
  });

  it('calls useSiteForm with the correct props', () => {
    render(<SiteFormContainer {...mockProps} />);
    expect(useSiteForm).toHaveBeenCalledWith(mockProps);
  });

  it('renders SiteFormPresentation with the correct props', () => {
    render(<SiteFormContainer {...mockProps} />);
    expect(SiteFormPresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        ...mockHookReturn,
        mode: mockProps.mode,
        onCancel: mockProps.onCancel
      }),
      expect.anything()
    );
  });

  it('passes default values when props are not provided', () => {
    render(<SiteFormContainer />);
    expect(useSiteForm).toHaveBeenCalledWith({
      initialData: {},
      mode: 'create',
      onCancel: undefined,
      onSuccess: undefined,
      apiEndpoint: '/api/sites',
      initialStep: undefined
    });
  });
});
