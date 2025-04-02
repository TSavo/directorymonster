import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeStep } from '@/components/admin/sites/components/ThemeStep';

describe('ThemeStep Component - Basic Rendering', () => {
  // Mock form values
  const mockValues = {
    theme: 'default',
    customStyles: ''
  };

  // Mock functions
  const mockOnChange = jest.fn();
  const mockErrors = {};

  it('renders the theme select correctly', () => {
    render(
      <ThemeStep
        values={mockValues}
        onChange={mockOnChange}
        errors={mockErrors}
      />
    );

    // Check if theme select is rendered
    const themeSelect = screen.getByTestId('siteSettings-theme');
    expect(themeSelect).toBeInTheDocument();

    // Check if it has options
    expect(themeSelect.querySelectorAll('option').length).toBeGreaterThan(0);
  });

  it('selects the current theme option', () => {
    render(
      <ThemeStep
        values={mockValues}
        onChange={mockOnChange}
        errors={mockErrors}
      />
    );

    // Check if the default theme is selected
    const themeSelect = screen.getByTestId('siteSettings-theme');
    expect(themeSelect).toHaveValue('default');
  });

  it('renders the custom CSS textarea', () => {
    render(
      <ThemeStep
        values={mockValues}
        onChange={mockOnChange}
        errors={mockErrors}
      />
    );

    // Check if custom CSS textarea is rendered
    const cssTextarea = screen.getByTestId('siteSettings-customStyles');
    expect(cssTextarea).toBeInTheDocument();
    expect(cssTextarea).toHaveValue('');
  });

  it('displays initial values in form fields', () => {
    const valuesWithData = {
      theme: 'dark',
      customStyles: 'body { background-color: #000; }'
    };

    render(
      <ThemeStep
        values={valuesWithData}
        onChange={mockOnChange}
        errors={mockErrors}
      />
    );

    // Check if the dark theme is selected
    const themeSelect = screen.getByTestId('siteSettings-theme');
    expect(themeSelect).toHaveValue('dark');

    // Check if custom CSS has correct value
    const cssTextarea = screen.getByTestId('siteSettings-customStyles');
    expect(cssTextarea).toHaveValue('body { background-color: #000; }');
  });

  it('displays error message when provided', () => {
    const errorsWithCustomStyles = {
      customStyles: 'Invalid CSS syntax'
    };

    render(
      <ThemeStep
        values={mockValues}
        onChange={mockOnChange}
        errors={errorsWithCustomStyles}
      />
    );

    // Check if error message is displayed
    const errorElement = screen.getByRole('alert');
    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toHaveTextContent('Invalid CSS syntax');
  });
});
