import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteSettings } from '@/components/admin/sites/SiteSettings';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock fetch function
global.fetch = jest.fn();

describe('SiteSettings Component - API Interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset fetch mock before each test
    (global.fetch as jest.Mock).mockReset();
  });

  it('validates and handles form submission', async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();
    const initialData = {
      id: 'site-1',
      name: 'Test Site',
      slug: 'test-site'
    };
    
    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        id: 'site-1',
        success: true
      })
    });
    
    render(<SiteSettings initialData={initialData} onSuccess={onSuccess} />);
    
    // Change settings values
    await user.click(screen.getByTestId('siteSettings-maintenanceMode'));
    await user.clear(screen.getByTestId('siteSettings-listingsPerPage'));
    await user.type(screen.getByTestId('siteSettings-listingsPerPage'), '30');
    await user.selectOptions(screen.getByTestId('siteSettings-theme'), 'blue');
    await user.type(screen.getByTestId('siteSettings-contactEmail'), 'admin@example.com');
    
    // Submit the form
    await user.click(screen.getByTestId('siteSettings-submit'));
    
    // Check if fetch was called with correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    expect(fetchCall[0]).toBe('/api/sites/site-1/settings');
    expect(fetchCall[1].method).toBe('PUT');
    
    // Check request body contains updated values
    const requestBody = JSON.parse(fetchCall[1].body);
    expect(requestBody.theme).toBe('blue');
    expect(requestBody.listingsPerPage).toBe(30);
    expect(requestBody.maintenanceMode).toBe(true);
    expect(requestBody.contactEmail).toBe('admin@example.com');
    
    // Success callback should be called
    expect(onSuccess).toHaveBeenCalledTimes(1);
    
    // Success message should be displayed
    expect(await screen.findByTestId('siteSettings-success')).toBeInTheDocument();
  });

  it('handles API errors', async () => {
    const user = userEvent.setup();
    
    // Mock failed API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Server error occurred' })
    });
    
    render(<SiteSettings initialData={{ id: 'site-1' }} />);
    
    // Submit the form
    await user.click(screen.getByTestId('siteSettings-submit'));
    
    // Error message should be displayed
    expect(await screen.findByTestId('siteSettings-error')).toBeInTheDocument();
    expect(await screen.findByText('Server error occurred')).toBeInTheDocument();
  });

  it('displays loading state during form submission', async () => {
    const user = userEvent.setup();
    
    // Mock a delayed API response
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: () => Promise.resolve({ id: 'site-1' })
          });
        }, 100);
      })
    );
    
    render(<SiteSettings initialData={{ id: 'site-1' }} />);
    
    // Submit the form
    await user.click(screen.getByTestId('siteSettings-submit'));
    
    // Loading state should be displayed
    expect(screen.getByTestId('siteSettings-submit-loading')).toBeInTheDocument();
    
    // Form controls should be disabled during loading
    expect(screen.getByTestId('siteSettings-isPublic')).toBeDisabled();
    expect(screen.getByTestId('siteSettings-theme')).toBeDisabled();
    expect(screen.getByTestId('siteSettings-listingsPerPage')).toBeDisabled();
    
    // Wait for completion
    await waitFor(() => {
      expect(screen.queryByTestId('siteSettings-submit-loading')).not.toBeInTheDocument();
    });
  });
});
