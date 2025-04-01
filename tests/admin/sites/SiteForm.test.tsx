import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteForm } from '@/components/admin/sites/SiteForm';

// Import our custom mock router
import { useRouter, resetMocks } from './__mocks__/nextNavigation.tsx';

// Mock the Next.js navigation module
jest.mock('next/navigation', () => ({
  useRouter: () => useRouter(),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('SiteForm Component', () => {
  // Setup test user for interactions
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    resetMocks(); // Reset our custom mock router
    (global.fetch as jest.Mock).mockReset();
    // Setup default successful response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'site-1', name: 'Test Site', slug: 'test-site' })
    });
  });

  it('renders in create mode correctly', () => {
    render(<SiteForm />);

    // Basic rendering tests
    expect(screen.getByTestId('siteForm-header')).toBeInTheDocument();
    expect(screen.getByTestId('siteForm-header')).toHaveTextContent('Create Site');
    expect(screen.getByTestId('siteForm-basic-info-heading')).toHaveTextContent('Basic Information');
    expect(screen.getByTestId('siteForm-name')).toBeInTheDocument();
    expect(screen.getByTestId('siteForm-slug')).toBeInTheDocument();
    expect(screen.getByTestId('siteForm-description')).toBeInTheDocument();
    expect(screen.getByTestId('next-button')).toHaveTextContent('Next');
  });

  it('renders in edit mode with initial data', () => {
    const initialData = {
      id: 'site-1',
      name: 'Test Site',
      slug: 'test-site',
      description: 'A test site description',
      domains: ['example.com', 'test.org']
    };

    render(<SiteForm initialData={initialData} mode="edit" />);

    // Verify component is in edit mode
    expect(screen.getByTestId('siteForm-header')).toHaveTextContent('Edit Site');

    // Verify initial data is loaded into form
    expect(screen.getByTestId('siteForm-name')).toHaveValue('Test Site');
    expect(screen.getByTestId('siteForm-slug')).toHaveValue('test-site');
    expect(screen.getByTestId('siteForm-description')).toHaveValue('A test site description');
  });

  it('navigates to domains step when clicking next', async () => {
    render(<SiteForm />);

    // Fill in required fields in the first step
    await user.type(screen.getByTestId('siteForm-name'), 'Test Site');
    await user.type(screen.getByTestId('siteForm-slug'), 'test-site');

    // Click next button to go to domains step
    await user.click(screen.getByTestId('next-button'));

    // Verify we're on the domains step
    expect(screen.getByTestId('step-button-domains')).toHaveAttribute('aria-current', 'step');

    // Verify domain step components are rendered
    expect(screen.getByTestId('domainStep-heading')).toBeInTheDocument();
    expect(screen.getByTestId('domainStep-domain-input')).toBeInTheDocument();
    expect(screen.getByTestId('domainStep-add-domain')).toBeInTheDocument();
  });

  it('calls onCancel callback when cancel button is clicked', async () => {
    const mockOnCancel = jest.fn();

    render(<SiteForm onCancel={mockOnCancel} />);

    // Find and click the cancel button
    const cancelButton = screen.getByTestId('cancel-button');
    await user.click(cancelButton);

    // Verify callback was called
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('validates required fields when trying to proceed to next step', async () => {
    render(<SiteForm />);

    // Try to go to next step without filling in required fields
    await user.click(screen.getByTestId('next-button'));

    // Verify validation errors for required fields
    expect(screen.getByTestId('siteForm-name')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByTestId('siteForm-slug')).toHaveAttribute('aria-invalid', 'true');

    // Should still be on the first step
    expect(screen.getByTestId('step-button-basic_info')).toHaveAttribute('aria-current', 'step');
  });

  it('validates slug format when trying to proceed to next step', async () => {
    render(<SiteForm />);

    // Fill name but use invalid slug format
    await user.type(screen.getByTestId('siteForm-name'), 'Test Site');
    await user.type(screen.getByTestId('siteForm-slug'), 'Invalid Slug!');

    // Try to go to next step
    await user.click(screen.getByTestId('next-button'));

    // Verify slug validation error
    expect(screen.getByTestId('siteForm-slug')).toHaveAttribute('aria-invalid', 'true');

    // Should still be on the first step
    expect(screen.getByTestId('step-button-basic_info')).toHaveAttribute('aria-current', 'step');
  });

  it('clears validation errors when fields are changed', async () => {
    render(<SiteForm />);

    // Try to go to next step to trigger validation errors
    await user.click(screen.getByTestId('next-button'));

    // Verify we have errors
    expect(screen.getByTestId('siteForm-name')).toHaveAttribute('aria-invalid', 'true');

    // Fix the name field
    await user.type(screen.getByTestId('siteForm-name'), 'Test Site');

    // Error for name should be cleared
    expect(screen.getByTestId('siteForm-name')).toHaveAttribute('aria-invalid', 'false');
  });

  it('completes the first step of the multi-step form', async () => {
    render(<SiteForm />);

    // Step 1: Fill out basic info
    await user.type(screen.getByTestId('siteForm-name'), 'New Test Site');
    await user.type(screen.getByTestId('siteForm-slug'), 'new-test-site');
    await user.type(screen.getByTestId('siteForm-description'), 'This is a test site description');
    await user.click(screen.getByTestId('next-button'));

    // Step 2: Domains - we're now on the domains step
    expect(screen.getByTestId('step-button-domains')).toHaveAttribute('aria-current', 'step');

    // Verify domain step components are rendered
    expect(screen.getByTestId('domainStep-heading')).toBeInTheDocument();
    expect(screen.getByTestId('domainStep-domain-input')).toBeInTheDocument();
    expect(screen.getByTestId('domainStep-add-domain')).toBeInTheDocument();
  });

  it('calls onSuccess callback when form submission succeeds', async () => {
    const mockOnSuccess = jest.fn();

    render(<SiteForm onSuccess={mockOnSuccess} />);

    // Step 1: Fill out basic info
    await user.type(screen.getByTestId('siteForm-name'), 'Test Site');
    await user.type(screen.getByTestId('siteForm-slug'), 'test-site');
    await user.click(screen.getByTestId('next-button'));

    // We're now on the domains step
    expect(screen.getByTestId('step-button-domains')).toHaveAttribute('aria-current', 'step');

    // Mock a successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'site-1', name: 'Test Site', slug: 'test-site' })
    });

    // Simulate form submission by directly calling the onSubmit handler
    // This is a workaround since we can't navigate through all steps in the test
    const formElement = screen.getByTestId('siteForm-form');
    fireEvent.submit(formElement);

    // Verify callback was called with response data
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });
  });
});
