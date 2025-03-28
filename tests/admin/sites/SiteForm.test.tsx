import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteForm } from '@/components/admin/sites/SiteForm';

/**
 * Base tests for the SiteForm component
 * 
 * These tests focus on basic rendering, structure, and initial behavior:
 * - Component rendering with and without initial data
 * - Presence of all required form fields
 * - Form field organization and grouping
 * - Field labels and placeholders
 * - Default values and states
 */
describe('SiteForm', () => {
  
  it('renders SiteForm component with all required fields', () => {
    render(<SiteForm />);
    
    // Test for presence of all required fields
    expect(screen.getByTestId('site-form')).toBeInTheDocument();
    expect(screen.getByLabelText(/site name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/site slug/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByTestId('site-form-submit')).toBeInTheDocument();
  });

  it('renders with correct field labels and placeholders', () => {
    render(<SiteForm />);
    
    // Test field labels and placeholders
    expect(screen.getByLabelText(/site name/i)).toHaveAttribute('placeholder', 'Enter site name');
    expect(screen.getByLabelText(/site slug/i)).toHaveAttribute('placeholder', 'my-site-slug');
    expect(screen.getByLabelText(/description/i)).toHaveAttribute('placeholder', 'Brief description of the site');
  });

  it('renders with default empty values when no initial data is provided', () => {
    render(<SiteForm />);
    
    // Test default empty values
    expect(screen.getByLabelText(/site name/i)).toHaveValue('');
    expect(screen.getByLabelText(/site slug/i)).toHaveValue('');
    expect(screen.getByLabelText(/description/i)).toHaveValue('');
  });

  it('renders with initial values when site data is provided', () => {
    const siteData = {
      name: 'Test Site',
      slug: 'test-site',
      description: 'A test site for testing',
      domains: ['test.example.com']
    };
    
    render(<SiteForm initialData={siteData} />);
    
    // Test initial values
    expect(screen.getByLabelText(/site name/i)).toHaveValue(siteData.name);
    expect(screen.getByLabelText(/site slug/i)).toHaveValue(siteData.slug);
    expect(screen.getByLabelText(/description/i)).toHaveValue(siteData.description);
  });

  it('organizes fields into logical sections', () => {
    render(<SiteForm />);
    
    // Test for field grouping and organization
    const basicInfoSection = screen.getByTestId('site-form-basic-info');
    expect(basicInfoSection).toBeInTheDocument();
    expect(within(basicInfoSection).getByLabelText(/site name/i)).toBeInTheDocument();
    expect(within(basicInfoSection).getByLabelText(/site slug/i)).toBeInTheDocument();
    
    const descriptionSection = screen.getByTestId('site-form-description');
    expect(descriptionSection).toBeInTheDocument();
    expect(within(descriptionSection).getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('renders fields in edit mode for existing sites', () => {
    const siteData = {
      id: '123',
      name: 'Existing Site',
      slug: 'existing-site',
      description: 'An existing site for testing',
      domains: ['existing.example.com']
    };
    
    render(<SiteForm initialData={siteData} mode="edit" />);
    
    // Test edit mode specific elements
    expect(screen.getByTestId('site-form-header')).toHaveTextContent('Edit Site');
    expect(screen.getByTestId('site-form-submit')).toHaveTextContent('Update Site');
    expect(screen.getByLabelText(/site slug/i)).toBeDisabled(); // Slug should be disabled in edit mode
  });

  it('renders fields in create mode for new sites', () => {
    render(<SiteForm mode="create" />);
    
    // Test create mode specific elements
    expect(screen.getByTestId('site-form-header')).toHaveTextContent('Create New Site');
    expect(screen.getByTestId('site-form-submit')).toHaveTextContent('Create Site');
    expect(screen.getByLabelText(/site slug/i)).not.toBeDisabled(); // Slug should be enabled in create mode
  });

  it('renders cancel button that triggers onCancel callback', async () => {
    const mockOnCancel = jest.fn();
    const user = userEvent.setup();
    
    render(<SiteForm onCancel={mockOnCancel} />);
    
    const cancelButton = screen.getByTestId('site-form-cancel');
    await user.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

});
