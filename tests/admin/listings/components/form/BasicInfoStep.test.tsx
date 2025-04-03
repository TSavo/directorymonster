import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BasicInfoStep } from '@/components/admin/listings/components/form/BasicInfoStep';
import { ListingStatus } from '@/components/admin/listings/types';

describe('BasicInfoStep Component', () => {
  const defaultProps = {
    formData: {
      title: 'Test Listing',
      description: 'This is a test listing description',
      status: ListingStatus.DRAFT
    },
    errors: {},
    updateField: jest.fn()
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders all form fields with correct values', () => {
    render(<BasicInfoStep {...defaultProps} />);
    
    // Check if all fields are rendered with correct values
    expect(screen.getByTestId('listing-title')).toHaveValue('Test Listing');
    expect(screen.getByTestId('listing-description')).toHaveValue('This is a test listing description');
    
    // Status should be set to DRAFT
    const statusSelect = screen.getByTestId('listing-status');
    expect(statusSelect).toHaveValue(ListingStatus.DRAFT);
  });
  
  it('displays validation errors when present', () => {
    const propsWithErrors = {
      ...defaultProps,
      errors: {
        title: 'Title is required',
        description: 'Description must be at least 20 characters'
      }
    };
    
    render(<BasicInfoStep {...propsWithErrors} />);
    
    // Check if error messages are displayed
    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Description must be at least 20 characters')).toBeInTheDocument();
  });
  
  it('calls updateField when title input changes', () => {
    render(<BasicInfoStep {...defaultProps} />);
    
    const titleInput = screen.getByTestId('listing-title');
    fireEvent.change(titleInput, { target: { value: 'New Title' } });
    
    expect(defaultProps.updateField).toHaveBeenCalledWith('title', 'New Title');
  });
  
  it('calls updateField when description textarea changes', () => {
    render(<BasicInfoStep {...defaultProps} />);
    
    const descriptionTextarea = screen.getByTestId('listing-description');
    fireEvent.change(descriptionTextarea, { target: { value: 'New description text' } });
    
    expect(defaultProps.updateField).toHaveBeenCalledWith('description', 'New description text');
  });
  
  it('calls updateField when status select changes', () => {
    render(<BasicInfoStep {...defaultProps} />);
    
    const statusSelect = screen.getByTestId('listing-status');
    fireEvent.change(statusSelect, { target: { value: ListingStatus.PUBLISHED } });
    
    expect(defaultProps.updateField).toHaveBeenCalledWith('status', ListingStatus.PUBLISHED);
  });
  
  it('renders all status options in the dropdown', () => {
    render(<BasicInfoStep {...defaultProps} />);
    
    // Open the select dropdown
    const statusSelect = screen.getByTestId('listing-status');
    fireEvent.click(statusSelect);
    
    // Check if all status options are available
    Object.values(ListingStatus).forEach(status => {
      const option = screen.getByRole('option', { name: new RegExp(status, 'i') });
      expect(option).toBeInTheDocument();
      expect(option).toHaveValue(status);
    });
  });
  
  it('applies required attribute to mandatory fields', () => {
    render(<BasicInfoStep {...defaultProps} />);
    
    expect(screen.getByTestId('listing-title')).toBeRequired();
    expect(screen.getByTestId('listing-description')).toBeRequired();
  });
  
  it('renders with empty values when formData is empty', () => {
    const emptyProps = {
      formData: {
        title: '',
        description: '',
        status: ListingStatus.DRAFT
      },
      errors: {},
      updateField: jest.fn()
    };
    
    render(<BasicInfoStep {...emptyProps} />);
    
    expect(screen.getByTestId('listing-title')).toHaveValue('');
    expect(screen.getByTestId('listing-description')).toHaveValue('');
  });
  
  it('applies correct ARIA attributes for accessibility', () => {
    const propsWithErrors = {
      ...defaultProps,
      errors: {
        title: 'Title is required'
      }
    };
    
    render(<BasicInfoStep {...propsWithErrors} />);
    
    // Fields with errors should have aria-invalid="true"
    expect(screen.getByTestId('listing-title')).toHaveAttribute('aria-invalid', 'true');
    
    // Fields without errors should not have aria-invalid="true"
    expect(screen.getByTestId('listing-description')).not.toHaveAttribute('aria-invalid', 'true');
  });
});
