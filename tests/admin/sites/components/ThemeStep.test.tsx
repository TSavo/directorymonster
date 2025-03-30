import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeStep } from '@/components/admin/sites/components/ThemeStep';

describe('ThemeStep Component - Basic Rendering', () => {
  // Mock form values
  const mockValues = {
    theme: 'default',
    customCss: ''
  };
  
  // Mock functions
  const mockOnChange = jest.fn();
  const mockErrors = {};
  
  it('renders all theme options correctly', () => {
    render(
      <ThemeStep 
        values={mockValues}
        onChange={mockOnChange}
        errors={mockErrors}
      />
    );
    
    // Check if theme selector is rendered
    expect(screen.getByTestId('theme-selector')).toBeInTheDocument();
    
    // Check if theme options are rendered
    expect(screen.getByTestId('theme-option-default')).toBeInTheDocument();
    expect(screen.getByTestId('theme-option-dark')).toBeInTheDocument();
    expect(screen.getByTestId('theme-option-light')).toBeInTheDocument();
    expect(screen.getByTestId('theme-option-colorful')).toBeInTheDocument();
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
    const defaultOption = screen.getByTestId('theme-option-default');
    expect(defaultOption).toHaveAttribute('aria-selected', 'true');
    
    // Other options should not be selected
    const darkOption = screen.getByTestId('theme-option-dark');
    expect(darkOption).toHaveAttribute('aria-selected', 'false');
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
    const cssTextarea = screen.getByTestId('custom-css-textarea');
    expect(cssTextarea).toBeInTheDocument();
    expect(cssTextarea).toHaveValue('');
  });

  it('displays initial values in form fields', () => {
    const valuesWithData = {
      theme: 'dark',
      customCss: 'body { background-color: #000; }'
    };
    
    render(
      <ThemeStep 
        values={valuesWithData}
        onChange={mockOnChange}
        errors={mockErrors}
      />
    );
    
    // Check if the dark theme is selected
    const darkOption = screen.getByTestId('theme-option-dark');
    expect(darkOption).toHaveAttribute('aria-selected', 'true');
    
    // Check if custom CSS has correct value
    const cssTextarea = screen.getByTestId('custom-css-textarea');
    expect(cssTextarea).toHaveValue('body { background-color: #000; }');
  });

  it('displays error message when provided', () => {
    const errorsWithCustomCss = {
      customCss: 'Invalid CSS syntax'
    };
    
    render(
      <ThemeStep 
        values={mockValues}
        onChange={mockOnChange}
        errors={errorsWithCustomCss}
      />
    );
    
    // Check if error message is displayed
    const errorElement = screen.getByTestId('custom-css-error');
    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toHaveTextContent('Invalid CSS syntax');
  });
});
