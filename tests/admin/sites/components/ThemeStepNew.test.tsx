import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteFormProvider } from '@/components/admin/sites/context/SiteFormContext';
import { ThemeStep } from '@/components/admin/sites/components/ThemeStepNew';

// Wrap component with context provider for testing
const renderWithContext = (initialData = {}) => {
  return render(
    <SiteFormProvider initialData={initialData}>
      <ThemeStep />
    </SiteFormProvider>
  );
};

describe('ThemeStep with Context', () => {
  it('renders the theme settings form', () => {
    renderWithContext();

    // Check for heading
    expect(screen.getByTestId('themeStep-heading')).toBeInTheDocument();

    // Check for form fields
    expect(screen.getByTestId('siteForm-theme')).toBeInTheDocument();
    expect(screen.getByTestId('siteForm-customStyles')).toBeInTheDocument();
  });

  it('displays initial values when provided', () => {
    const initialData = {
      theme: 'dark',
      customStyles: '.custom { color: red; }'
    };

    renderWithContext(initialData);

    // Check that initial values are displayed
    expect(screen.getByTestId('siteForm-theme')).toHaveValue('dark');
    expect(screen.getByTestId('siteForm-customStyles')).toHaveValue('.custom { color: red; }');
  });

  it('updates form values when user interacts', async () => {
    const user = userEvent.setup();
    renderWithContext();

    // Select a theme
    await user.selectOptions(screen.getByTestId('siteForm-theme'), 'dark');

    // Type in custom CSS (using simpler text to avoid special character issues)
    await user.type(screen.getByTestId('siteForm-customStyles'), '.custom-class');

    // Check that values were updated
    expect(screen.getByTestId('siteForm-theme')).toHaveValue('dark');
    expect(screen.getByTestId('siteForm-customStyles')).toHaveValue('.custom-class');
  });
});
