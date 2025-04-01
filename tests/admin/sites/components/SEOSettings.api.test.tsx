import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SEOSettings } from '@/components/admin/sites/SEOSettings';
import '@testing-library/jest-dom';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock fetch function
global.fetch = jest.fn();

describe('SEOSettings API Interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('submits form data to API with correct values', async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();

    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'site-1', success: true })
    });

    render(<SEOSettings initialData={{ id: 'site-1' }} onSuccess={onSuccess} />);

    // Fill in form data
    await user.type(screen.getByTestId('seoSettings-seoTitle'), 'Test Title');
    await user.type(screen.getByTestId('seoSettings-seoDescription'), 'Test Description');
    await user.type(screen.getByTestId('seoSettings-twitterSite'), '@testhandle');

    // Add a noindex page
    await user.type(screen.getByTestId('seoSettings-newNoindexPage'), '/test-path');
    await user.click(screen.getByTestId('seoSettings-addNoindexPage'));

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
          }),
          body: expect.any(String)
        })
      );

      // Verify data sent to API
      const sentData = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(sentData).toEqual(
        expect.objectContaining({
          id: 'site-1',
          seoTitle: 'Test Title',
          seoDescription: 'Test Description',
          twitterSite: '@testhandle',
          noindexPages: ['/test-path'],
          enableCanonicalUrls: true
        })
      );
    });

    // Success callback should be called
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith({ id: 'site-1', success: true });

    // Success message should be displayed
    expect(screen.getByTestId('seoSettings-success')).toBeInTheDocument();
    expect(screen.getByText('SEO settings updated successfully')).toBeInTheDocument();
  });

  it('handles API errors properly', async () => {
    const user = userEvent.setup();

    // Mock error API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Database connection error' })
    });

    render(<SEOSettings initialData={{ id: 'site-1' }} />);

    // Submit the form
    await user.click(screen.getByTestId('seoSettings-submit'));

    // Verify API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    // Error message should be displayed
    expect(screen.getByTestId('seoSettings-error')).toBeInTheDocument();
    expect(screen.getByText('Database connection error')).toBeInTheDocument();

    // Success message should not be displayed
    expect(screen.queryByTestId('seoSettings-success')).not.toBeInTheDocument();
  });

  it('handles network errors gracefully', async () => {
    const user = userEvent.setup();

    // Mock network error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<SEOSettings initialData={{ id: 'site-1' }} />);

    // Submit the form
    await user.click(screen.getByTestId('seoSettings-submit'));

    // Error message should be displayed
    await waitFor(() => {
      expect(screen.getByTestId('seoSettings-error')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('uses the provided API endpoint', async () => {
    const user = userEvent.setup();
    const customEndpoint = '/api/custom/sites';

    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    render(<SEOSettings initialData={{ id: 'site-1' }} apiEndpoint={customEndpoint} />);

    // Submit the form
    await user.click(screen.getByTestId('seoSettings-submit'));

    // Verify custom API endpoint was used
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `${customEndpoint}/site-1/seo`,
        expect.any(Object)
      );
    });
  });
});
