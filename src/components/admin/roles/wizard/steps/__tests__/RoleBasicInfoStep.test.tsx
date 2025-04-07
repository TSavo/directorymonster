/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RoleBasicInfoStep } from '../RoleBasicInfoStep';

// Mock fetch
global.fetch = jest.fn();

describe('RoleBasicInfoStep', () => {
  const mockData = {
    name: '',
    description: '',
    scope: 'tenant' as const,
    siteId: undefined
  };
  
  const mockOnUpdate = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        sites: [
          { id: 'site-1', name: 'Main Site', slug: 'main', domain: 'example.com' },
          { id: 'site-2', name: 'Blog', slug: 'blog', domain: 'blog.example.com' }
        ]
      }),
    });
  });

  it('renders the form fields', () => {
    render(<RoleBasicInfoStep data={mockData} onUpdate={mockOnUpdate} />);
    
    // Check that all form fields are rendered
    expect(screen.getByLabelText(/Role Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Role Scope/i)).toBeInTheDocument();
    
    // Radio buttons for scope
    expect(screen.getByLabelText(/Tenant-wide/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Site-specific/i)).toBeInTheDocument();
    
    // Site selector should not be rendered initially (tenant scope)
    expect(screen.queryByText(/Select Site/i)).not.toBeInTheDocument();
  });

  it('updates name when input changes', () => {
    render(<RoleBasicInfoStep data={mockData} onUpdate={mockOnUpdate} />);
    
    // Get the name input
    const nameInput = screen.getByLabelText(/Role Name/i);
    
    // Change the input value
    fireEvent.change(nameInput, { target: { value: 'Test Role' } });
    
    // onUpdate should have been called with the new name
    expect(mockOnUpdate).toHaveBeenCalledWith({ name: 'Test Role' });
  });

  it('updates description when textarea changes', () => {
    render(<RoleBasicInfoStep data={mockData} onUpdate={mockOnUpdate} />);
    
    // Get the description textarea
    const descriptionTextarea = screen.getByLabelText(/Description/i);
    
    // Change the textarea value
    fireEvent.change(descriptionTextarea, { target: { value: 'Test Description' } });
    
    // onUpdate should have been called with the new description
    expect(mockOnUpdate).toHaveBeenCalledWith({ description: 'Test Description' });
  });

  it('updates scope when radio button changes', () => {
    render(<RoleBasicInfoStep data={mockData} onUpdate={mockOnUpdate} />);
    
    // Get the site-specific radio button
    const siteRadio = screen.getByLabelText(/Site-specific/i);
    
    // Click the radio button
    fireEvent.click(siteRadio);
    
    // onUpdate should have been called with the new scope
    expect(mockOnUpdate).toHaveBeenCalledWith({ 
      scope: 'site', 
      siteId: undefined 
    });
  });

  it('shows site selector when scope is site', async () => {
    // Render with site scope
    render(
      <RoleBasicInfoStep 
        data={{ ...mockData, scope: 'site' }} 
        onUpdate={mockOnUpdate} 
      />
    );
    
    // Site selector should be rendered
    expect(screen.getByText(/Select Site/i)).toBeInTheDocument();
    
    // Should fetch sites
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/sites');
    
    // Wait for sites to load
    await waitFor(() => {
      expect(screen.getByText(/Select a site/i)).toBeInTheDocument();
    });
  });

  it('updates siteId when site is selected', async () => {
    // Render with site scope
    render(
      <RoleBasicInfoStep 
        data={{ ...mockData, scope: 'site' }} 
        onUpdate={mockOnUpdate} 
      />
    );
    
    // Wait for sites to load
    await waitFor(() => {
      expect(screen.getByText(/Select a site/i)).toBeInTheDocument();
    });
    
    // Open the select dropdown
    fireEvent.click(screen.getByText(/Select a site/i));
    
    // Wait for options to appear
    await waitFor(() => {
      expect(screen.getByText(/Main Site/i)).toBeInTheDocument();
    });
    
    // Select a site
    fireEvent.click(screen.getByText(/Main Site/i));
    
    // onUpdate should have been called with the new siteId
    expect(mockOnUpdate).toHaveBeenCalledWith({ siteId: 'site-1' });
  });

  it('handles error when fetching sites fails', async () => {
    // Mock fetch to return an error
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Failed to fetch sites' }),
    });
    
    // Render with site scope
    render(
      <RoleBasicInfoStep 
        data={{ ...mockData, scope: 'site' }} 
        onUpdate={mockOnUpdate} 
      />
    );
    
    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(/Failed to load sites/i)).toBeInTheDocument();
    });
  });
});
