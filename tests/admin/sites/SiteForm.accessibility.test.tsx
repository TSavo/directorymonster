import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteForm } from '@/components/admin/sites/SiteForm';

/**
 * Accessibility tests for the SiteForm component
 * 
 * These tests focus on accessibility features including:
 * - Keyboard navigation and focus management
 * - ARIA attributes and roles
 * - Form label associations
 * - Error message announcements
 * - Focus trapping during modal dialogs
 * - Screen reader compatibility
 */
describe('SiteForm Accessibility', () => {
  
  it('has proper form field labels associated with inputs', () => {
    render(<SiteForm />);
    
    // Test explicit label associations using htmlFor/id
    const nameLabel = screen.getByText(/site name/i);
    const nameInput = screen.getByLabelText(/site name/i);
    expect(nameLabel).toHaveAttribute('for', nameInput.id);
    
    const slugLabel = screen.getByText(/site slug/i);
    const slugInput = screen.getByLabelText(/site slug/i);
    expect(slugLabel).toHaveAttribute('for', slugInput.id);
    
    const descriptionLabel = screen.getByText(/description/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    expect(descriptionLabel).toHaveAttribute('for', descriptionInput.id);
  });

  it('supports keyboard navigation through all form fields', async () => {
    const user = userEvent.setup();
    render(<SiteForm />);
    
    // Get all focusable elements
    const nameInput = screen.getByLabelText(/site name/i);
    const slugInput = screen.getByLabelText(/site slug/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const addDomainButton = screen.getByTestId('add-domain-button');
    const submitButton = screen.getByTestId('site-form-submit');
    const cancelButton = screen.getByTestId('site-form-cancel');
    
    // Start with first input
    nameInput.focus();
    expect(document.activeElement).toBe(nameInput);
    
    // Tab to next input
    await user.tab();
    expect(document.activeElement).toBe(slugInput);
    
    // Tab to next input
    await user.tab();
    expect(document.activeElement).toBe(descriptionInput);
    
    // Tab to add domain button
    await user.tab();
    expect(document.activeElement).toBe(addDomainButton);
    
    // Tab to submit button
    await user.tab();
    expect(document.activeElement).toBe(submitButton);
    
    // Tab to cancel button
    await user.tab();
    expect(document.activeElement).toBe(cancelButton);
  });

  it('maintains focus order that matches visual layout', async () => {
    const user = userEvent.setup();
    render(<SiteForm />);
    
    // Add a domain to check focus order with dynamic fields
    await user.click(screen.getByTestId('add-domain-button'));
    
    // Get focusable elements
    const nameInput = screen.getByLabelText(/site name/i);
    const slugInput = screen.getByLabelText(/site slug/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const domainInput = screen.getByTestId('domain-input-0');
    const removeDomainButton = screen.getByTestId('remove-domain-button-0');
    const addDomainButton = screen.getByTestId('add-domain-button');
    const submitButton = screen.getByTestId('site-form-submit');
    const cancelButton = screen.getByTestId('site-form-cancel');
    
    // Check tab order
    nameInput.focus();
    
    await user.tab();
    expect(document.activeElement).toBe(slugInput);
    
    await user.tab();
    expect(document.activeElement).toBe(descriptionInput);
    
    await user.tab();
    expect(document.activeElement).toBe(domainInput);
    
    await user.tab();
    expect(document.activeElement).toBe(removeDomainButton);
    
    await user.tab();
    expect(document.activeElement).toBe(addDomainButton);
    
    await user.tab();
    expect(document.activeElement).toBe(submitButton);
    
    await user.tab();
    expect(document.activeElement).toBe(cancelButton);
  });

  it('has appropriate ARIA attributes for form fields', () => {
    render(<SiteForm />);
    
    // Check for ARIA attributes on inputs
    const nameInput = screen.getByLabelText(/site name/i);
    expect(nameInput).toHaveAttribute('aria-required', 'true');
    
    const slugInput = screen.getByLabelText(/site slug/i);
    expect(slugInput).toHaveAttribute('aria-required', 'true');
    
    // Check for ARIA attributes on form
    const form = screen.getByTestId('site-form');
    expect(form).toHaveAttribute('role', 'form');
    expect(form).toHaveAttribute('aria-labelledby', expect.any(String));
    
    // Check for ARIA attribute on form header
    const header = screen.getByTestId('site-form-header');
    expect(header.id).toBe(form.getAttribute('aria-labelledby'));
  });

  it('announces validation errors to screen readers', async () => {
    const user = userEvent.setup();
    render(<SiteForm />);
    
    // Submit empty form to trigger validations
    await user.click(screen.getByTestId('site-form-submit'));
    
    // Check that error messages have appropriate ARIA attributes
    const nameError = screen.getByTestId('site-name-error');
    expect(nameError).toHaveAttribute('role', 'alert');
    expect(nameError).toHaveAttribute('aria-live', 'assertive');
    
    const slugError = screen.getByTestId('site-slug-error');
    expect(slugError).toHaveAttribute('role', 'alert');
    expect(slugError).toHaveAttribute('aria-live', 'assertive');
    
    // Check that inputs are linked to their error messages
    const nameInput = screen.getByLabelText(/site name/i);
    expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    expect(nameInput).toHaveAttribute('aria-describedby', nameError.id);
    
    const slugInput = screen.getByLabelText(/site slug/i);
    expect(slugInput).toHaveAttribute('aria-invalid', 'true');
    expect(slugInput).toHaveAttribute('aria-describedby', slugError.id);
  });

  it('provides clear focus indication on all interactive elements', async () => {
    const user = userEvent.setup();
    render(<SiteForm />);
    
    // Check focus styles on inputs
    const nameInput = screen.getByLabelText(/site name/i);
    nameInput.focus();
    expect(nameInput).toHaveClass('focus:ring-2', 'focus:border-blue-500');
    
    // Check focus styles on buttons
    const submitButton = screen.getByTestId('site-form-submit');
    submitButton.focus();
    expect(submitButton).toHaveClass('focus:ring-2', 'focus:outline-none');
    
    const cancelButton = screen.getByTestId('site-form-cancel');
    cancelButton.focus();
    expect(cancelButton).toHaveClass('focus:ring-2', 'focus:outline-none');
  });

  it('uses semantic HTML elements appropriate for form structure', () => {
    render(<SiteForm />);
    
    // Check form element
    const form = screen.getByTestId('site-form');
    expect(form.tagName).toBe('FORM');
    
    // Check fieldsets for logical grouping
    expect(screen.getByTestId('site-form-basic-info').tagName).toBe('FIELDSET');
    const basicInfoLegend = within(screen.getByTestId('site-form-basic-info')).getByRole('group');
    expect(basicInfoLegend.tagName).toBe('LEGEND');
    
    // Check button elements
    const submitButton = screen.getByTestId('site-form-submit');
    expect(submitButton.tagName).toBe('BUTTON');
    expect(submitButton).toHaveAttribute('type', 'submit');
    
    const cancelButton = screen.getByTestId('site-form-cancel');
    expect(cancelButton.tagName).toBe('BUTTON');
    expect(cancelButton).toHaveAttribute('type', 'button');
  });

  it('supports form submission via keyboard (Enter key)', async () => {
    // Mock fetch
    global.fetch = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, site: { id: '123' } })
      });
    });
    
    const user = userEvent.setup();
    render(<SiteForm />);
    
    // Fill form with valid data
    await user.type(screen.getByLabelText(/site name/i), 'Test Site');
    await user.type(screen.getByLabelText(/site slug/i), 'test-site');
    await user.type(screen.getByLabelText(/description/i), 'Test description');
    
    // Press Enter to submit
    await user.type(screen.getByLabelText(/description/i), '{Enter}');
    
    // Check that form was submitted
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    
    // Clean up
    jest.restoreAllMocks();
  });

  it('ensures dynamically added form elements are properly accessible', async () => {
    const user = userEvent.setup();
    render(<SiteForm />);
    
    // Add a domain field
    await user.click(screen.getByTestId('add-domain-button'));
    
    // Check accessibility of dynamically added field
    const domainInput = screen.getByTestId('domain-input-0');
    const domainLabel = screen.getByTestId('domain-label-0');
    
    // Check label association
    expect(domainLabel).toHaveAttribute('for', domainInput.id);
    
    // Check ARIA attributes
    expect(domainInput).toHaveAttribute('aria-label', expect.stringContaining('Domain'));
    
    // Check remove button accessibility
    const removeButton = screen.getByTestId('remove-domain-button-0');
    expect(removeButton).toHaveAttribute('aria-label', expect.stringContaining('Remove domain'));
  });

  it('uses appropriate button types for form actions', () => {
    render(<SiteForm />);
    
    // Submit button should be type="submit"
    const submitButton = screen.getByTestId('site-form-submit');
    expect(submitButton).toHaveAttribute('type', 'submit');
    
    // Cancel button should be type="button"
    const cancelButton = screen.getByTestId('site-form-cancel');
    expect(cancelButton).toHaveAttribute('type', 'button');
    
    // Add domain button should be type="button"
    const addDomainButton = screen.getByTestId('add-domain-button');
    expect(addDomainButton).toHaveAttribute('type', 'button');
  });

  it('properly manages focus when adding and removing domain fields', async () => {
    const user = userEvent.setup();
    render(<SiteForm />);
    
    // Add a domain field
    const addDomainButton = screen.getByTestId('add-domain-button');
    await user.click(addDomainButton);
    
    // Focus should move to the new input
    const domainInput = screen.getByTestId('domain-input-0');
    expect(document.activeElement).toBe(domainInput);
    
    // Remove the domain field
    const removeButton = screen.getByTestId('remove-domain-button-0');
    await user.click(removeButton);
    
    // Focus should return to the add button
    expect(document.activeElement).toBe(addDomainButton);
  });

  it('allows navigation via screen reader landmarks', () => {
    render(<SiteForm />);
    
    // Check for appropriate landmarks
    expect(screen.getByTestId('site-form')).toHaveAttribute('role', 'form');
    
    // Header should be a heading with appropriate level
    const header = screen.getByTestId('site-form-header');
    expect(header.tagName).toBe('H1');
    
    // Check for section headings
    const basicInfoHeading = screen.getByText(/basic information/i);
    expect(basicInfoHeading.tagName).toMatch(/^H[2-3]$/); // Should be H2 or H3
    
    const descriptionHeading = screen.getByText(/description/i);
    expect(descriptionHeading.tagName).toMatch(/^H[2-3]$/); // Should be H2 or H3
    
    const domainsHeading = screen.getByText(/domains/i);
    expect(domainsHeading.tagName).toMatch(/^H[2-3]$/); // Should be H2 or H3
  });

});
