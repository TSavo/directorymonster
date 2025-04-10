import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteFormPresentation } from '../SiteFormPresentation';
import { STEPS } from '../hooks/useSiteForm';

// Mock the components
jest.mock('../components', () => ({
  BasicInfoStep: () => <div data-testid="basic-info-step">Basic Info Step</div>,
  DomainStep: () => <div data-testid="domain-step">Domain Step</div>,
  ThemeStep: () => <div data-testid="theme-step">Theme Step</div>,
  SEOStep: () => <div data-testid="seo-step">SEO Step</div>,
  SiteFormPreview: () => <div data-testid="preview-step">Preview Step</div>,
  StepNavigation: ({ steps, activeStep, onStepChange }) => (
    <div data-testid="step-navigation">
      {steps.map(step => (
        <button
          key={step.id}
          data-testid={`step-${step.id}`}
          onClick={() => onStepChange(step.id)}
        >
          {step.label}
        </button>
      ))}
      <span data-testid="active-step">{activeStep}</span>
    </div>
  ),
  FormActions: ({ onPrevious, onNext, onCancel }) => (
    <div data-testid="form-actions">
      <button data-testid="previous-button" onClick={onPrevious}>Previous</button>
      <button data-testid="next-button" onClick={onNext}>Next</button>
      <button data-testid="cancel-button" onClick={onCancel}>Cancel</button>
      <button data-testid="submit-button" type="submit">Submit</button>
    </div>
  )
}));

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    back: jest.fn()
  })
}));

describe('SiteFormPresentation', () => {
  const mockSite = {
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
  };

  const mockProps = {
    // State
    activeStep: 'basic_info',
    completedSteps: [],
    newDomain: '',
    isFirstStep: true,
    isLastStep: false,
    
    // Site data and operations
    site: mockSite,
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
    resetErrors: jest.fn(),
    
    // Props
    mode: 'create' as const,
    onCancel: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form with the correct title for create mode', () => {
    render(<SiteFormPresentation {...mockProps} />);
    expect(screen.getByTestId('siteForm-header')).toHaveTextContent('Create Site');
  });

  it('renders the form with the correct title for edit mode', () => {
    render(<SiteFormPresentation {...mockProps} mode="edit" />);
    expect(screen.getByTestId('siteForm-header')).toHaveTextContent('Edit Site');
  });

  it('displays error message when error is provided', () => {
    render(<SiteFormPresentation {...mockProps} error="Test error message" />);
    expect(screen.getByTestId('siteForm-error')).toHaveTextContent('Test error message');
  });

  it('displays success message when success is provided', () => {
    render(<SiteFormPresentation {...mockProps} success="Test success message" />);
    expect(screen.getByTestId('siteForm-success')).toHaveTextContent('Test success message');
  });

  it('renders the step navigation component', () => {
    render(<SiteFormPresentation {...mockProps} />);
    expect(screen.getByTestId('step-navigation')).toBeInTheDocument();
  });

  it('renders the correct step content based on activeStep', () => {
    // Basic info step
    render(<SiteFormPresentation {...mockProps} activeStep="basic_info" />);
    expect(screen.getByTestId('basic-info-step')).toBeInTheDocument();

    // Domain step
    render(<SiteFormPresentation {...mockProps} activeStep="domains" />);
    expect(screen.getByTestId('domain-step')).toBeInTheDocument();

    // Theme step
    render(<SiteFormPresentation {...mockProps} activeStep="theme" />);
    expect(screen.getByTestId('theme-step')).toBeInTheDocument();

    // SEO step
    render(<SiteFormPresentation {...mockProps} activeStep="seo" />);
    expect(screen.getByTestId('seo-step')).toBeInTheDocument();

    // Preview step
    render(<SiteFormPresentation {...mockProps} activeStep="preview" />);
    expect(screen.getByTestId('preview-step')).toBeInTheDocument();
  });

  it('renders the form actions component', () => {
    render(<SiteFormPresentation {...mockProps} />);
    expect(screen.getByTestId('form-actions')).toBeInTheDocument();
  });

  it('calls handleSubmit when form is submitted', async () => {
    render(<SiteFormPresentation {...mockProps} />);
    const user = userEvent.setup();
    
    const form = screen.getByTestId('siteForm-form');
    await user.click(screen.getByTestId('submit-button'));
    
    expect(mockProps.handleSubmit).toHaveBeenCalled();
  });

  it('calls handleNext when next button is clicked', async () => {
    render(<SiteFormPresentation {...mockProps} />);
    const user = userEvent.setup();
    
    await user.click(screen.getByTestId('next-button'));
    
    expect(mockProps.handleNext).toHaveBeenCalled();
  });

  it('calls handlePrevious when previous button is clicked', async () => {
    render(<SiteFormPresentation {...mockProps} />);
    const user = userEvent.setup();
    
    await user.click(screen.getByTestId('previous-button'));
    
    expect(mockProps.handlePrevious).toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    render(<SiteFormPresentation {...mockProps} />);
    const user = userEvent.setup();
    
    await user.click(screen.getByTestId('cancel-button'));
    
    expect(mockProps.onCancel).toHaveBeenCalled();
  });

  it('calls handleStepChange when a step button is clicked', async () => {
    render(<SiteFormPresentation {...mockProps} />);
    const user = userEvent.setup();
    
    await user.click(screen.getByTestId('step-basic_info'));
    
    expect(mockProps.handleStepChange).toHaveBeenCalledWith('basic_info');
  });
});
