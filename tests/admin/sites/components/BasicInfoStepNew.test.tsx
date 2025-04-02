import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteFormProvider } from '@/components/admin/sites/context/SiteFormContext';
import { BasicInfoStep } from '@/components/admin/sites/components/BasicInfoStepNew';

// Wrap component with context provider for testing
const renderWithContext = (initialData = {}) => {
  return render(
    <SiteFormProvider initialData={initialData}>
      <BasicInfoStep />
    </SiteFormProvider>
  );
};

describe('BasicInfoStep with Context', () => {
  it('renders the basic info form fields', () => {
    renderWithContext();
    
    // Check for heading
    expect(screen.getByTestId('basicInfoStep-heading')).toBeInTheDocument();
    
    // Check for form fields
    expect(screen.getByTestId('siteForm-name')).toBeInTheDocument();
    expect(screen.getByTestId('siteForm-slug')).toBeInTheDocument();
    expect(screen.getByTestId('siteForm-description')).toBeInTheDocument();
  });
  
  it('displays initial values when provided', () => {
    const initialData = {
      name: 'Test Site',
      slug: 'test-site',
      description: 'This is a test site'
    };
    
    renderWithContext(initialData);
    
    // Check that initial values are displayed
    expect(screen.getByTestId('siteForm-name')).toHaveValue('Test Site');
    expect(screen.getByTestId('siteForm-slug')).toHaveValue('test-site');
    expect(screen.getByTestId('siteForm-description')).toHaveValue('This is a test site');
  });
  
  it('updates form values when user types', async () => {
    const user = userEvent.setup();
    renderWithContext();
    
    // Type in form fields
    await user.type(screen.getByTestId('siteForm-name'), 'New Site');
    await user.type(screen.getByTestId('siteForm-slug'), 'new-site');
    await user.type(screen.getByTestId('siteForm-description'), 'This is a new site');
    
    // Check that values were updated
    expect(screen.getByTestId('siteForm-name')).toHaveValue('New Site');
    expect(screen.getByTestId('siteForm-slug')).toHaveValue('new-site');
    expect(screen.getByTestId('siteForm-description')).toHaveValue('This is a new site');
  });
});
