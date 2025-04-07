/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PermissionTemplateSelector } from '../PermissionTemplateSelector';

// Mock fetch
global.fetch = jest.fn();

describe('PermissionTemplateSelector', () => {
  const mockOnSelectTemplate = jest.fn();
  const mockScope = 'tenant';
  const mockSiteId = undefined;
  
  const mockTemplates = [
    {
      id: 'content-manager',
      name: 'Content Manager',
      description: 'Manage content across all sites',
      category: 'content',
      scope: 'tenant',
      permissions: {
        content: ['create', 'read', 'update', 'delete'],
        category: ['read']
      }
    },
    {
      id: 'user-manager',
      name: 'User Manager',
      description: 'Manage users and their roles',
      category: 'administration',
      scope: 'tenant',
      permissions: {
        user: ['create', 'read', 'update', 'delete'],
        role: ['read']
      }
    }
  ];
  
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ templates: mockTemplates }),
    });
  });

  it('renders loading state initially', () => {
    render(
      <PermissionTemplateSelector 
        onSelectTemplate={mockOnSelectTemplate} 
        scope={mockScope}
        siteId={mockSiteId}
      />
    );
    
    // Should show loading skeletons
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('fetches and displays templates', async () => {
    render(
      <PermissionTemplateSelector 
        onSelectTemplate={mockOnSelectTemplate} 
        scope={mockScope}
        siteId={mockSiteId}
      />
    );
    
    // Should fetch templates with correct params
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/roles/wizard/templates?scope=tenant'
    );
    
    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText('Content Manager')).toBeInTheDocument();
      expect(screen.getByText('User Manager')).toBeInTheDocument();
    });
    
    // Should display template descriptions
    expect(screen.getByText('Manage content across all sites')).toBeInTheDocument();
    expect(screen.getByText('Manage users and their roles')).toBeInTheDocument();
  });

  it('filters templates by category', async () => {
    render(
      <PermissionTemplateSelector 
        onSelectTemplate={mockOnSelectTemplate} 
        scope={mockScope}
        siteId={mockSiteId}
      />
    );
    
    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText('Content Manager')).toBeInTheDocument();
      expect(screen.getByText('User Manager')).toBeInTheDocument();
    });
    
    // Click the administration category button
    fireEvent.click(screen.getByText('administration'));
    
    // Should only show templates in the administration category
    expect(screen.queryByText('Content Manager')).not.toBeInTheDocument();
    expect(screen.getByText('User Manager')).toBeInTheDocument();
  });

  it('filters templates by search query', async () => {
    render(
      <PermissionTemplateSelector 
        onSelectTemplate={mockOnSelectTemplate} 
        scope={mockScope}
        siteId={mockSiteId}
      />
    );
    
    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText('Content Manager')).toBeInTheDocument();
      expect(screen.getByText('User Manager')).toBeInTheDocument();
    });
    
    // Enter a search query
    fireEvent.change(screen.getByPlaceholderText('Search templates...'), {
      target: { value: 'content' }
    });
    
    // Should only show templates matching the search query
    expect(screen.getByText('Content Manager')).toBeInTheDocument();
    expect(screen.queryByText('User Manager')).not.toBeInTheDocument();
  });

  it('selects a template when clicked', async () => {
    render(
      <PermissionTemplateSelector 
        onSelectTemplate={mockOnSelectTemplate} 
        scope={mockScope}
        siteId={mockSiteId}
      />
    );
    
    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText('Content Manager')).toBeInTheDocument();
    });
    
    // Click a template
    fireEvent.click(screen.getByText('Content Manager').closest('div')!);
    
    // Template should be selected (radio button checked)
    expect(screen.getByLabelText('template-content-manager')).toBeChecked();
  });

  it('calls onSelectTemplate when "Use Template" button is clicked', async () => {
    render(
      <PermissionTemplateSelector 
        onSelectTemplate={mockOnSelectTemplate} 
        scope={mockScope}
        siteId={mockSiteId}
      />
    );
    
    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText('Content Manager')).toBeInTheDocument();
    });
    
    // Click a template to select it
    fireEvent.click(screen.getByText('Content Manager').closest('div')!);
    
    // Click the "Use Template" button
    fireEvent.click(screen.getAllByText('Use Template')[0]);
    
    // onSelectTemplate should have been called with the selected template
    expect(mockOnSelectTemplate).toHaveBeenCalledWith(mockTemplates[0]);
  });

  it('calls onSelectTemplate when "Apply Template" button is clicked', async () => {
    render(
      <PermissionTemplateSelector 
        onSelectTemplate={mockOnSelectTemplate} 
        scope={mockScope}
        siteId={mockSiteId}
      />
    );
    
    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText('Content Manager')).toBeInTheDocument();
    });
    
    // Click a template to select it
    fireEvent.click(screen.getByText('Content Manager').closest('div')!);
    
    // Click the "Apply Template" button
    fireEvent.click(screen.getByText('Apply Template'));
    
    // onSelectTemplate should have been called with the selected template
    expect(mockOnSelectTemplate).toHaveBeenCalledWith(mockTemplates[0]);
  });

  it('opens preview dialog when eye icon is clicked', async () => {
    render(
      <PermissionTemplateSelector 
        onSelectTemplate={mockOnSelectTemplate} 
        scope={mockScope}
        siteId={mockSiteId}
      />
    );
    
    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText('Content Manager')).toBeInTheDocument();
    });
    
    // Click the eye icon
    fireEvent.click(screen.getAllByTestId('preview-button')[0]);
    
    // Preview dialog should be opened
    await waitFor(() => {
      expect(screen.getByText('Included Permissions:')).toBeInTheDocument();
    });
    
    // Should show template details
    expect(screen.getByText('Content Manager')).toBeInTheDocument();
    expect(screen.getByText('Manage content across all sites')).toBeInTheDocument();
  });

  it('handles error when fetching templates fails', async () => {
    // Mock fetch to return an error
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Failed to fetch templates' }),
    });
    
    render(
      <PermissionTemplateSelector 
        onSelectTemplate={mockOnSelectTemplate} 
        scope={mockScope}
        siteId={mockSiteId}
      />
    );
    
    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText('Failed to load permission templates')).toBeInTheDocument();
    });
  });

  it('shows empty state when no templates are available', async () => {
    // Mock fetch to return empty templates
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ templates: [] }),
    });
    
    render(
      <PermissionTemplateSelector 
        onSelectTemplate={mockOnSelectTemplate} 
        scope={mockScope}
        siteId={mockSiteId}
      />
    );
    
    // Wait for empty state to appear
    await waitFor(() => {
      expect(screen.getByText('No templates available')).toBeInTheDocument();
    });
  });
});
