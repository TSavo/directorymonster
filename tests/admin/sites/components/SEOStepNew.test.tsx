import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteFormProvider, useSiteForm } from '@/components/admin/sites/context/SiteFormContext';
import { SEOStep } from '@/components/admin/sites/components/SEOStepNew';

// Wrap component with context provider for testing
const renderWithContext = (initialData = {}) => {
  return render(
    <SiteFormProvider initialData={initialData}>
      <SEOStep />
    </SiteFormProvider>
  );
};

describe('SEOStep with Context', () => {
  it('renders the SEO settings form', () => {
    renderWithContext();

    // Check for heading
    expect(screen.getByTestId('seoStep-heading')).toBeInTheDocument();

    // Check for form fields
    expect(screen.getByTestId('siteForm-seoTitle')).toBeInTheDocument();
    expect(screen.getByTestId('siteForm-seoDescription')).toBeInTheDocument();
    expect(screen.getByTestId('siteForm-seoKeywords')).toBeInTheDocument();
    expect(screen.getByTestId('siteForm-enableCanonicalUrls')).toBeInTheDocument();
  });

  it('displays initial values when provided', () => {
    const initialData = {
      seoTitle: 'Test SEO Title',
      seoDescription: 'Test SEO Description',
      seoKeywords: 'test, seo, keywords',
      enableCanonicalUrls: true
    };

    renderWithContext(initialData);

    // Check that initial values are displayed
    expect(screen.getByTestId('siteForm-seoTitle')).toHaveValue('Test SEO Title');
    expect(screen.getByTestId('siteForm-seoDescription')).toHaveValue('Test SEO Description');
    expect(screen.getByTestId('siteForm-seoKeywords')).toHaveValue('test, seo, keywords');
    expect(screen.getByTestId('siteForm-enableCanonicalUrls')).toBeChecked();
  });

  it('updates form values when user interacts', async () => {
    const user = userEvent.setup();
    renderWithContext();

    // Type in SEO fields
    await user.type(screen.getByTestId('siteForm-seoTitle'), 'New SEO Title');
    await user.type(screen.getByTestId('siteForm-seoDescription'), 'New SEO Description');
    await user.type(screen.getByTestId('siteForm-seoKeywords'), 'new, seo, keywords');

    // Toggle checkbox
    await user.click(screen.getByTestId('siteForm-enableCanonicalUrls'));

    // Check that values were updated
    expect(screen.getByTestId('siteForm-seoTitle')).toHaveValue('New SEO Title');
    expect(screen.getByTestId('siteForm-seoDescription')).toHaveValue('New SEO Description');
    expect(screen.getByTestId('siteForm-seoKeywords')).toHaveValue('new, seo, keywords');
    expect(screen.getByTestId('siteForm-enableCanonicalUrls')).toBeChecked();
  });

  it('shows validation errors for SEO fields', async () => {
    // Create a test component that can trigger validation
    const TestValidationComponent = () => {
      const { validateStep } = useSiteForm();

      return (
        <>
          <SEOStep />
          <button
            data-testid="validate-button"
            onClick={() => validateStep('seo')}
          >
            Validate
          </button>
        </>
      );
    };

    const WrappedComponent = () => (
      <SiteFormProvider initialData={{
        seoTitle: 'A'.repeat(70), // Too long
        seoDescription: 'A'.repeat(170) // Too long
      }}>
        <TestValidationComponent />
      </SiteFormProvider>
    );

    const user = userEvent.setup();
    render(<WrappedComponent />);

    // Trigger validation
    await user.click(screen.getByTestId('validate-button'));

    // Check for validation errors
    expect(await screen.findByTestId('siteForm-seoTitle-error')).toBeInTheDocument();
    expect(await screen.findByTestId('siteForm-seoDescription-error')).toBeInTheDocument();
  });
});
