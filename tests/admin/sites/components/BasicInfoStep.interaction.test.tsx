import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BasicInfoStep } from '@/components/admin/sites/components/BasicInfoStep';

describe('BasicInfoStep Component - Interaction', () => {
  // Setup test user for interactions
  const user = userEvent.setup();
  
  // Mock form values
  const mockValues = {
    name: '',
    slug: '',
    description: ''
  };
  
  it('calls onChange when name field is updated', async () => {
    const mockOnChange = jest.fn();
    const mockErrors = {};
    
    render(
      <BasicInfoStep 
        values={mockValues}
        onChange={mockOnChange}
        errors={mockErrors}
      />
    );
    
    // Type in the name field
    const nameInput = screen.getByTestId('site-form-name');
    await user.type(nameInput, 'New Site Name');
    
    // Verify onChange was called with updated value
    expect(mockOnChange).toHaveBeenCalledWith('name', 'New Site Name');
  });

  it('calls onChange when slug field is updated', async () => {
    const mockOnChange = jest.fn();
    const mockErrors = {};
    
    render(
      <BasicInfoStep 
        values={mockValues}
        onChange={mockOnChange}
        errors={mockErrors}
      />
    );
    
    // Type in the slug field
    const slugInput = screen.getByTestId('site-form-slug');
    await user.type(slugInput, 'new-site-slug');
    
    // Verify onChange was called with updated value
    expect(mockOnChange).toHaveBeenCalledWith('slug', 'new-site-slug');
  });

  it('calls onChange when description field is updated', async () => {
    const mockOnChange = jest.fn();
    const mockErrors = {};
    
    render(
      <BasicInfoStep 
        values={mockValues}
        onChange={mockOnChange}
        errors={mockErrors}
      />
    );
    
    // Type in the description field
    const descriptionInput = screen.getByTestId('site-form-description');
    await user.type(descriptionInput, 'This is a new description');
    
    // Verify onChange was called with updated value
    expect(mockOnChange).toHaveBeenCalledWith('description', 'This is a new description');
  });
});
