import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SEOSettings } from '@/components/admin/sites/SEOSettings';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock fetch function
global.fetch = jest.fn();

describe('SEOSettings Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('renders correctly with default values', () => {
    render(<SEOSettings initialData={{ id: 'site-1' }} />);
    
    // Check if component renders
    expect(screen.getByTestId('seoSettings-header')).toBeInTheDocument();
    expect(screen.getByTestId('seoSettings-seoTitle')).toHaveValue('');
    expect(screen.getByTestId('seoSettings-seoDescription')).toHaveValue('');
    expect(screen.getByTestId('seoSettings-enableCanonicalUrls')).toBeChecked();
  });

  it('renders with provided initial data', () => {
    const initialData = {
      id: 'site-1',
      name: 'Test Site',
      seoTitle: 'Test SEO Title',
      seoDescription: 'Test SEO Description',
      twitterCard: 'summary_large_image'
    };
    
    render(<SEOSettings initialData={initialData} />);
    
    expect(screen.getByText('Test Site')).toBeInTheDocument();
    expect(screen.getByTestId('seoSettings-seoTitle')).toHaveValue('Test SEO Title');
    expect(screen.getByTestId('seoSettings-seoDescription')).toHaveValue('Test SEO Description');
    expect(screen.getByTestId('seoSettings-twitterCard')).toHaveValue('summary_large_image');
  });

  it('validates form fields and shows error messages', async () => {
    const user = userEvent.setup();
    
    render(<SEOSettings initialData={{ id: 'site-1' }} />);
    
    // Set invalid values
    await user.type(screen.getByTestId('seoSettings-seoTitle'), 'A'.repeat(65));
    await user.type(screen.getByTestId('seoSettings-twitterSite'), 'without-at-symbol');
    
    // Submit the form
    await user.click(screen.getByTestId('seoSettings-submit'));
    
    // Check for validation errors
    expect(screen.getByText('SEO title should be 60 characters or less')).toBeInTheDocument();
    expect(screen.getByText('Twitter handle should start with @')).toBeInTheDocument();
    
    // Fetch should not be called due to validation errors
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('calls API on successful form submission', async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();
    
    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'site-1', success: true })
    });
    
    render(<SEOSettings initialData={{ id: 'site-1' }} onSuccess={onSuccess} />);
    
    // Fill form with valid data
    await user.type(screen.getByTestId('seoSettings-seoTitle'), 'Valid SEO Title');
    await user.type(screen.getByTestId('seoSettings-twitterSite'), '@validhandle');
    
    // Submit the form
    await user.click(screen.getByTestId('seoSettings-submit'));
    
    // Verify API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/sites/site-1/seo',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });
    
    // Success callback should be called
    expect(onSuccess).toHaveBeenCalledTimes(1);
    
    // Success message should appear
    expect(await screen.findByTestId('seoSettings-success')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock error API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Server error occurred' })
    });
    
    render(<SEOSettings initialData={{ id: 'site-1' }} />);
    
    // Submit the form
    await user.click(screen.getByTestId('seoSettings-submit'));
    
    // Error message should appear
    expect(await screen.findByTestId('seoSettings-error')).toBeInTheDocument();
    expect(screen.getByText('Server error occurred')).toBeInTheDocument();
  });

  it('calls cancel callback when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();
    
    render(<SEOSettings initialData={{ id: 'site-1' }} onCancel={onCancel} />);
    
    // Click cancel button
    await user.click(screen.getByTestId('seoSettings-cancel'));
    
    // Cancel callback should be called
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
