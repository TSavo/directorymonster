/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdvancedSearchDialog } from '../AdvancedSearchDialog';

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('AdvancedSearchDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the default trigger button', () => {
    render(<AdvancedSearchDialog />);
    
    // Check that the button is rendered
    expect(screen.getByText('Advanced Search')).toBeInTheDocument();
  });

  it('renders custom trigger when provided', () => {
    render(
      <AdvancedSearchDialog>
        <button>Custom Trigger</button>
      </AdvancedSearchDialog>
    );
    
    // Check that the custom trigger is rendered
    expect(screen.getByText('Custom Trigger')).toBeInTheDocument();
    
    // Default trigger should not be rendered
    expect(screen.queryByText('Advanced Search')).not.toBeInTheDocument();
  });

  it('opens the dialog when trigger is clicked', async () => {
    render(<AdvancedSearchDialog />);
    
    // Click the trigger button
    fireEvent.click(screen.getByText('Advanced Search'));
    
    // Check that the dialog is opened
    await waitFor(() => {
      expect(screen.getByText('Advanced Search')).toBeInTheDocument(); // Dialog title
      expect(screen.getByText('Search across the system with advanced filtering options.')).toBeInTheDocument();
    });
  });

  it('updates search query when input changes', async () => {
    render(<AdvancedSearchDialog />);
    
    // Click the trigger button to open the dialog
    fireEvent.click(screen.getByText('Advanced Search'));
    
    // Wait for the dialog to open
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });
    
    // Enter a search query
    fireEvent.change(screen.getByPlaceholderText('Search...'), {
      target: { value: 'test query' }
    });
    
    // Search button should be enabled
    expect(screen.getByText('Search').closest('button')).not.toBeDisabled();
  });

  it('disables search button when query is empty', async () => {
    render(<AdvancedSearchDialog />);
    
    // Click the trigger button to open the dialog
    fireEvent.click(screen.getByText('Advanced Search'));
    
    // Wait for the dialog to open
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });
    
    // Search button should be disabled initially
    expect(screen.getByText('Search').closest('button')).toBeDisabled();
  });

  it('changes search scope when radio button is clicked', async () => {
    render(<AdvancedSearchDialog />);
    
    // Click the trigger button to open the dialog
    fireEvent.click(screen.getByText('Advanced Search'));
    
    // Wait for the dialog to open
    await waitFor(() => {
      expect(screen.getByLabelText('All')).toBeInTheDocument();
    });
    
    // Click the "Users" radio button
    fireEvent.click(screen.getByLabelText('Users'));
    
    // "Users" radio button should be checked
    expect(screen.getByLabelText('Users')).toBeChecked();
    
    // "All" radio button should not be checked
    expect(screen.getByLabelText('All')).not.toBeChecked();
  });

  it('toggles filters visibility when filter button is clicked', async () => {
    render(<AdvancedSearchDialog />);
    
    // Click the trigger button to open the dialog
    fireEvent.click(screen.getByText('Advanced Search'));
    
    // Wait for the dialog to open
    await waitFor(() => {
      expect(screen.getByText('Show Filters')).toBeInTheDocument();
    });
    
    // Filters should not be visible initially
    expect(screen.queryByText('User Filters')).not.toBeInTheDocument();
    
    // Click the "Show Filters" button
    fireEvent.click(screen.getByText('Show Filters'));
    
    // Filters should now be visible
    await waitFor(() => {
      expect(screen.getByText('User Filters')).toBeInTheDocument();
    });
    
    // Button text should change to "Hide Filters"
    expect(screen.getByText('Hide Filters')).toBeInTheDocument();
  });

  it('adds a filter when filter option is selected', async () => {
    render(<AdvancedSearchDialog />);
    
    // Click the trigger button to open the dialog
    fireEvent.click(screen.getByText('Advanced Search'));
    
    // Wait for the dialog to open
    await waitFor(() => {
      expect(screen.getByText('Show Filters')).toBeInTheDocument();
    });
    
    // Click the "Show Filters" button
    fireEvent.click(screen.getByText('Show Filters'));
    
    // Wait for filters to be visible
    await waitFor(() => {
      expect(screen.getByText('User Filters')).toBeInTheDocument();
    });
    
    // Open the status select
    fireEvent.click(screen.getByText('Status'));
    
    // Wait for options to appear
    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
    
    // Select "Active" status
    fireEvent.click(screen.getByText('Active'));
    
    // Filter badge should be added
    await waitFor(() => {
      expect(screen.getByText('Status: active')).toBeInTheDocument();
    });
  });

  it('removes a filter when filter badge X is clicked', async () => {
    render(<AdvancedSearchDialog />);
    
    // Click the trigger button to open the dialog
    fireEvent.click(screen.getByText('Advanced Search'));
    
    // Wait for the dialog to open
    await waitFor(() => {
      expect(screen.getByText('Show Filters')).toBeInTheDocument();
    });
    
    // Click the "Show Filters" button
    fireEvent.click(screen.getByText('Show Filters'));
    
    // Wait for filters to be visible
    await waitFor(() => {
      expect(screen.getByText('User Filters')).toBeInTheDocument();
    });
    
    // Open the status select
    fireEvent.click(screen.getByText('Status'));
    
    // Select "Active" status
    fireEvent.click(screen.getByText('Active'));
    
    // Wait for filter badge to appear
    await waitFor(() => {
      expect(screen.getByText('Status: active')).toBeInTheDocument();
    });
    
    // Click the X button on the filter badge
    fireEvent.click(screen.getByTestId('remove-filter'));
    
    // Filter badge should be removed
    await waitFor(() => {
      expect(screen.queryByText('Status: active')).not.toBeInTheDocument();
    });
  });

  it('clears all filters when "Clear Filters" is clicked', async () => {
    render(<AdvancedSearchDialog />);
    
    // Click the trigger button to open the dialog
    fireEvent.click(screen.getByText('Advanced Search'));
    
    // Wait for the dialog to open
    await waitFor(() => {
      expect(screen.getByText('Show Filters')).toBeInTheDocument();
    });
    
    // Click the "Show Filters" button
    fireEvent.click(screen.getByText('Show Filters'));
    
    // Wait for filters to be visible
    await waitFor(() => {
      expect(screen.getByText('User Filters')).toBeInTheDocument();
    });
    
    // Add two filters
    // Open the status select
    fireEvent.click(screen.getByText('Status'));
    fireEvent.click(screen.getByText('Active'));
    
    // Open the role select
    fireEvent.click(screen.getByText('Role'));
    fireEvent.click(screen.getByText('Admin'));
    
    // Wait for filter badges to appear
    await waitFor(() => {
      expect(screen.getByText('Status: active')).toBeInTheDocument();
      expect(screen.getByText('Role: admin')).toBeInTheDocument();
    });
    
    // Click "Clear Filters"
    fireEvent.click(screen.getByText('Clear Filters'));
    
    // Filter badges should be removed
    await waitFor(() => {
      expect(screen.queryByText('Status: active')).not.toBeInTheDocument();
      expect(screen.queryByText('Role: admin')).not.toBeInTheDocument();
    });
  });

  it('navigates to search results page when form is submitted', async () => {
    const { useRouter } = require('next/navigation');
    const mockPush = jest.fn();
    useRouter.mockImplementation(() => ({
      push: mockPush,
    }));
    
    render(<AdvancedSearchDialog />);
    
    // Click the trigger button to open the dialog
    fireEvent.click(screen.getByText('Advanced Search'));
    
    // Wait for the dialog to open
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });
    
    // Enter a search query
    fireEvent.change(screen.getByPlaceholderText('Search...'), {
      target: { value: 'test query' }
    });
    
    // Change scope to "Users"
    fireEvent.click(screen.getByLabelText('Users'));
    
    // Add a filter
    fireEvent.click(screen.getByText('Show Filters'));
    await waitFor(() => {
      expect(screen.getByText('User Filters')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Status'));
    fireEvent.click(screen.getByText('Active'));
    
    // Submit the form
    fireEvent.click(screen.getByText('Search').closest('button')!);
    
    // Check that router.push was called with the correct URL
    expect(mockPush).toHaveBeenCalledWith(
      '/admin/search?q=test%20query&scope=users&userStatus=active'
    );
  });
});
