import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeStep } from '@/components/admin/sites/components/ThemeStep';

describe('ThemeStep Component - Interaction', () => {
  // Setup test user for interactions
  const user = userEvent.setup();
  
  // Mock form values
  const mockValues = {
    theme: 'default',
    customCss: ''
  };
  
  it('calls onChange when a theme option is selected', async () => {
    const mockOnChange = jest.fn();
    const mockErrors = {};
    
    render(
      <ThemeStep 
        values={mockValues}
        onChange={mockOnChange}
        errors={mockErrors}
      />
    );
    
    // Click on the dark theme option
    const darkOption = screen.getByTestId('theme-option-dark');
    await user.click(darkOption);
    
    // Verify onChange was called with updated theme
    expect(mockOnChange).toHaveBeenCalledWith('theme', 'dark');
  });

  it('calls onChange when custom CSS is edited', async () => {
    const mockOnChange = jest.fn();
    const mockErrors = {};
    
    render(
      <ThemeStep 
        values={mockValues}
        onChange={mockOnChange}
        errors={mockErrors}
      />
    );
    
    // Enter text in the custom CSS textarea
    const cssTextarea = screen.getByTestId('custom-css-textarea');
    await user.type(cssTextarea, 'body { color: red; }');
    
    // Verify onChange was called with updated CSS
    expect(mockOnChange).toHaveBeenCalledWith('customCss', 'body { color: red; }');
  });

  it('displays theme preview when a theme is selected', async () => {
    const mockOnChange = jest.fn();
    const mockErrors = {};
    
    render(
      <ThemeStep 
        values={mockValues}
        onChange={mockOnChange}
        errors={mockErrors}
      />
    );
    
    // Check if theme preview is displayed for default theme
    expect(screen.getByTestId('theme-preview')).toBeInTheDocument();
    expect(screen.getByTestId('theme-preview-default')).toBeInTheDocument();
    
    // Click on the dark theme option
    const darkOption = screen.getByTestId('theme-option-dark');
    await user.click(darkOption);
    
    // Preview should update to dark theme
    expect(screen.getByTestId('theme-preview-dark')).toBeInTheDocument();
  });

  it('has a reset button for custom CSS', async () => {
    const valuesWithCss = {
      theme: 'default',
      customCss: 'body { color: blue; }'
    };
    
    const mockOnChange = jest.fn();
    const mockErrors = {};
    
    render(
      <ThemeStep 
        values={valuesWithCss}
        onChange={mockOnChange}
        errors={mockErrors}
      />
    );
    
    // Click the reset button
    const resetButton = screen.getByTestId('reset-css-button');
    await user.click(resetButton);
    
    // Verify onChange was called with empty CSS
    expect(mockOnChange).toHaveBeenCalledWith('customCss', '');
  });
});
