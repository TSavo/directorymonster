import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DomainStep } from '@/components/admin/sites/components/DomainStepFixed';
import { SiteFormProvider } from '@/components/admin/sites/context/SiteFormContext';

// Mock the SiteFormContext
jest.mock('@/components/admin/sites/context/SiteFormContext', () => {
  // Create a mock state that we can modify in our tests
  let mockState = {
    formData: {
      id: '',
      name: 'Test Site',
      slug: 'test-site',
      description: 'A test site description',
      domains: ['example.com', 'test.org'],
      theme: 'default',
      customStyles: '',
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
      enableCanonicalUrls: false
    },
    errors: {},
    isLoading: false,
    success: false,
    error: null,
    currentStep: 'domains',
    completedSteps: ['basic_info']
  };

  // Function to reset the state
  const resetState = () => {
    mockState = {
      formData: {
        id: '',
        name: 'Test Site',
        slug: 'test-site',
        description: 'A test site description',
        domains: ['example.com', 'test.org'],
        theme: 'default',
        customStyles: '',
        seoTitle: '',
        seoDescription: '',
        seoKeywords: '',
        enableCanonicalUrls: false
      },
      errors: {},
      isLoading: false,
      success: false,
      error: null,
      currentStep: 'domains',
      completedSteps: ['basic_info']
    };
  };

  // Create a mock implementation of the context
  const mockUpdateField = jest.fn((field, value) => {
    if (field === 'domains') {
      mockState.formData.domains = value;
    } else if (field === 'errors') {
      mockState.errors = value;
    }
  });

  return {
    useSiteForm: () => ({
      state: mockState,
      updateField: mockUpdateField,
      validateStep: jest.fn().mockReturnValue(true),
      goToStep: jest.fn(),
      submitForm: jest.fn()
    }),
    SiteFormProvider: ({ children }) => children,
    // Add a function to reset the mock state between tests
    __resetMockState: resetState
  };
});

describe('DomainStep Component - Basic Rendering', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock state
    const { __resetMockState } = require('@/components/admin/sites/context/SiteFormContext');
    __resetMockState();
  });

  it('renders the domain step component', () => {
    render(<DomainStep />);

    // Check if heading and description are rendered
    expect(screen.getByTestId('domainStep-heading')).toBeInTheDocument();
    expect(screen.getByTestId('domainStep-heading')).toHaveTextContent(/domain management/i);
    expect(screen.getByTestId('domainStep-description')).toBeInTheDocument();
  });

  it('displays the current domains', () => {
    render(<DomainStep />);

    // Check if domains are displayed
    expect(screen.getByTestId('domainStep-domain-0')).toHaveTextContent('example.com');
    expect(screen.getByTestId('domainStep-domain-1')).toHaveTextContent('test.org');
  });

  it('allows adding a new domain', async () => {
    render(<DomainStep />);

    // Type a new domain in the input
    const domainInput = screen.getByTestId('domainStep-domain-input');
    await user.type(domainInput, 'newdomain.com');

    // Click the add button
    const addButton = screen.getByTestId('domainStep-add-domain');
    await user.click(addButton);

    // Check if the new domain is added to the form data
    // We can't check the DOM directly because our mock doesn't re-render
    // So we'll check that updateField was called with the right arguments
    const { useSiteForm } = require('@/components/admin/sites/context/SiteFormContext');
    const { updateField } = useSiteForm();
    expect(updateField).toHaveBeenCalledWith('domains', ['example.com', 'test.org', 'newdomain.com']);
  });

  it('allows removing a domain', async () => {
    // Reset the mock before this test
    jest.clearAllMocks();

    render(<DomainStep />);

    // Get the domains
    const domain0 = screen.getByTestId('domainStep-domain-0');
    const domain1 = screen.getByTestId('domainStep-domain-1');
    expect(domain0).toHaveTextContent('example.com');
    expect(domain1).toHaveTextContent('test.org');

    // Click the remove button for the first domain
    const removeButton = screen.getByTestId('domainStep-remove-domain-0');
    await user.click(removeButton);

    // Check that updateField was called with the right arguments
    const { useSiteForm } = require('@/components/admin/sites/context/SiteFormContext');
    const { updateField } = useSiteForm();
    expect(updateField).toHaveBeenCalledWith('domains', ['test.org']);
  });
});
