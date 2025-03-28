import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteForm } from '@/components/admin/sites/SiteForm';

/**
 * Validation tests for the SiteForm component
 * 
 * These tests focus on form validation behavior including:
 * - Required field validation
 * - Field format validation (e.g., slug format, URL formats)
 * - Error message display
 * - Character limits and restrictions
 */
describe('SiteForm Validation', () => {
  
  it('validates required fields and shows error messages', async () => {
    const user = userEvent.setup();
    render(<SiteForm />);
    
    // Submit form without filling required fields
    const submitButton = screen.getByTestId('site-form-submit');
    await user.click(submitButton);
    
    // Check for error messages
    expect(screen.getByTestId('site-name-error')).toBeInTheDocument();
    expect(screen.getByTestId('site-name-error')).toHaveTextContent('Site name is required');
    
    expect(screen.getByTestId('site-slug-error')).toBeInTheDocument();
    expect(screen.getByTestId('site-slug-error')).toHaveTextContent('Site slug is required');
  });

  it('validates site slug format with appropriate error messages', async () => {
    const user = userEvent.setup();
    render(<SiteForm />);
    
    // Enter invalid slug values and check validation
    const slugInput = screen.getByLabelText(/site slug/i);
    
    // Test with spaces
    await user.type(slugInput, 'invalid slug');
    await user.tab(); // Move focus to trigger validation
    
    expect(screen.getByTestId('site-slug-error')).toBeInTheDocument();
    expect(screen.getByTestId('site-slug-error')).toHaveTextContent('Slug can only contain lowercase letters, numbers, and hyphens');
    
    // Clear and test with uppercase letters
    await user.clear(slugInput);
    await user.type(slugInput, 'Invalid-Slug');
    await user.tab();
    
    expect(screen.getByTestId('site-slug-error')).toBeInTheDocument();
    expect(screen.getByTestId('site-slug-error')).toHaveTextContent('Slug can only contain lowercase letters, numbers, and hyphens');
    
    // Clear and test with special characters
    await user.clear(slugInput);
    await user.type(slugInput, 'invalid@slug');
    await user.tab();
    
    expect(screen.getByTestId('site-slug-error')).toBeInTheDocument();
    expect(screen.getByTestId('site-slug-error')).toHaveTextContent('Slug can only contain lowercase letters, numbers, and hyphens');
    
    // Test valid slug
    await user.clear(slugInput);
    await user.type(slugInput, 'valid-slug-123');
    await user.tab();
    
    expect(screen.queryByTestId('site-slug-error')).not.toBeInTheDocument();
  });

  it('validates domain format with appropriate error messages', async () => {
    const user = userEvent.setup();
    render(<SiteForm />);
    
    // Click add domain button
    const addDomainButton = screen.getByTestId('add-domain-button');
    await user.click(addDomainButton);
    
    // Enter invalid domain values
    const domainInput = screen.getByTestId('domain-input-0');
    
    // Test with invalid domain format
    await user.type(domainInput, 'not a domain');
    await user.tab();
    
    expect(screen.getByTestId('domain-error-0')).toBeInTheDocument();
    expect(screen.getByTestId('domain-error-0')).toHaveTextContent('Please enter a valid domain');
    
    // Clear and test with incomplete domain
    await user.clear(domainInput);
    await user.type(domainInput, 'example');
    await user.tab();
    
    expect(screen.getByTestId('domain-error-0')).toBeInTheDocument();
    expect(screen.getByTestId('domain-error-0')).toHaveTextContent('Please enter a valid domain');
    
    // Test valid domain
    await user.clear(domainInput);
    await user.type(domainInput, 'example.com');
    await user.tab();
    
    expect(screen.queryByTestId('domain-error-0')).not.toBeInTheDocument();
  });

  it('validates character limits for name and description fields', async () => {
    const user = userEvent.setup();
    render(<SiteForm />);
    
    // Test name character limit (50 chars)
    const nameInput = screen.getByLabelText(/site name/i);
    const longName = 'A'.repeat(51); // 51 characters
    
    await user.type(nameInput, longName);
    await user.tab();
    
    expect(screen.getByTestId('site-name-error')).toBeInTheDocument();
    expect(screen.getByTestId('site-name-error')).toHaveTextContent('Site name cannot exceed 50 characters');
    
    // Test description character limit (200 chars)
    const descriptionInput = screen.getByLabelText(/description/i);
    const longDescription = 'A'.repeat(201); // 201 characters
    
    await user.type(descriptionInput, longDescription);
    await user.tab();
    
    expect(screen.getByTestId('site-description-error')).toBeInTheDocument();
    expect(screen.getByTestId('site-description-error')).toHaveTextContent('Description cannot exceed 200 characters');
  });

  it('shows validation errors inline under each field', async () => {
    const user = userEvent.setup();
    render(<SiteForm />);
    
    // Submit empty form to trigger all validations
    const submitButton = screen.getByTestId('site-form-submit');
    await user.click(submitButton);
    
    // Get all field containers
    const nameField = screen.getByTestId('site-name-container');
    const slugField = screen.getByTestId('site-slug-container');
    
    // Check error message positioning
    expect(nameField).toContainElement(screen.getByTestId('site-name-error'));
    expect(slugField).toContainElement(screen.getByTestId('site-slug-error'));
    
    // Check error styling
    expect(screen.getByTestId('site-name-error')).toHaveClass('text-red-500');
    expect(screen.getByTestId('site-slug-error')).toHaveClass('text-red-500');
  });

  it('disables submit button when form has validation errors', async () => {
    const user = userEvent.setup();
    render(<SiteForm />);
    
    // Fill in invalid data
    const nameInput = screen.getByLabelText(/site name/i);
    const slugInput = screen.getByLabelText(/site slug/i);
    
    await user.type(nameInput, 'Test Site');
    await user.type(slugInput, 'invalid slug');
    await user.tab();
    
    // Check that submit button is disabled
    const submitButton = screen.getByTestId('site-form-submit');
    expect(submitButton).toBeDisabled();
    
    // Fix the invalid data
    await user.clear(slugInput);
    await user.type(slugInput, 'valid-slug');
    await user.tab();
    
    // Check that submit button is enabled
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('clears validation errors when fields are corrected', async () => {
    const user = userEvent.setup();
    render(<SiteForm />);
    
    // Submit empty form to trigger validations
    const submitButton = screen.getByTestId('site-form-submit');
    await user.click(submitButton);
    
    // Verify errors are shown
    expect(screen.getByTestId('site-name-error')).toBeInTheDocument();
    
    // Fix the error by entering valid data
    const nameInput = screen.getByLabelText(/site name/i);
    await user.type(nameInput, 'Valid Site Name');
    await user.tab();
    
    // Check error is cleared
    await waitFor(() => {
      expect(screen.queryByTestId('site-name-error')).not.toBeInTheDocument();
    });
  });

  it('shows help text explaining slug format requirements', async () => {
    render(<SiteForm />);
    
    // Check for help text
    expect(screen.getByTestId('site-slug-help')).toBeInTheDocument();
    expect(screen.getByTestId('site-slug-help')).toHaveTextContent(/lowercase letters, numbers, and hyphens only/i);
  });

  it('validates that slug is unique when creating a new site', async () => {
    // Mock fetch to simulate duplicate slug check
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('check-slug')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ exists: true })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
    
    const user = userEvent.setup();
    render(<SiteForm mode="create" />);
    
    // Enter a duplicate slug
    const slugInput = screen.getByLabelText(/site slug/i);
    await user.type(slugInput, 'existing-slug');
    await user.tab();
    
    // Wait for async validation
    await waitFor(() => {
      expect(screen.getByTestId('site-slug-error')).toBeInTheDocument();
      expect(screen.getByTestId('site-slug-error')).toHaveTextContent('This slug is already in use');
    });
    
    // Clean up mock
    jest.restoreAllMocks();
  });

});
