import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteForm } from '@/components/admin/sites/SiteForm';
import { useRouter } from 'next/navigation';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('SiteForm Submission', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('submits the form with valid data', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ id: '123', slug: 'test-site' })
    });

    const user = userEvent.setup();
    const onSuccess = jest.fn();

    render(<SiteForm onSuccess={onSuccess} />);

    // Fill in form with valid data
    await user.type(screen.getByTestId('siteForm-name'), 'Test Site');
    await user.type(screen.getByTestId('siteForm-slug'), 'test-site');
    await user.type(screen.getByTestId('siteForm-description'), 'This is a test site');
    // Skip domain and add button as they don't exist in the current component

    // Submit the form using the next button
    await user.click(screen.getByTestId('next-button'));

    // Verify fetch was called with correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/sites',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            name: 'Test Site',
            slug: 'test-site',
            description: 'This is a test site',
            domains: ['test.com']
          })
        })
      );
    });

    // Check success callback was called
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({
      id: '123',
      slug: 'test-site'
    }));

    // Check success message is displayed
    expect(await screen.findByText(/site created successfully/i)).toBeInTheDocument();

    // Verify that router.push was called after timeout
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/admin/sites/test-site');
    }, { timeout: 2000 });
  });

  it('handles API errors', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValueOnce({ error: 'API error message' })
    });

    const user = userEvent.setup();

    render(<SiteForm />);

    // Fill in form with valid data
    await user.type(screen.getByTestId('siteForm-name'), 'Test Site');
    await user.type(screen.getByTestId('siteForm-slug'), 'test-site');
    // Skip domain and add button as they don't exist in the current component

    // Submit the form using the next button
    await user.click(screen.getByTestId('next-button'));

    // Check error message is displayed
    expect(await screen.findByText(/API error message/i)).toBeInTheDocument();
  });

  it('uses PUT for edit mode and correct endpoint', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ id: '123', slug: 'test-site' })
    });

    const user = userEvent.setup();
    const initialData = {
      id: '123',
      name: 'Initial Name',
      slug: 'initial-slug',
      description: 'Initial description',
      domains: ['initial.com']
    };

    render(<SiteForm mode="edit" initialData={initialData} />);

    // Update some fields
    await user.clear(screen.getByTestId('siteForm-name'));
    await user.type(screen.getByTestId('siteForm-name'), 'Updated Name');

    // Submit the form using the next button
    await user.click(screen.getByTestId('next-button'));

    // Verify fetch was called with PUT method and correct URL
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/sites/123',
        expect.objectContaining({
          method: 'PUT'
        })
      );
    });

    // Check success message for edit mode
    expect(await screen.findByText(/site updated successfully/i)).toBeInTheDocument();
  });

  it('handles network errors during submission', async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

    const user = userEvent.setup();

    render(<SiteForm />);

    // Fill in form with valid data
    await user.type(screen.getByTestId('siteForm-name'), 'Test Site');
    await user.type(screen.getByTestId('siteForm-slug'), 'test-site');
    // Skip domain and add button as they don't exist in the current component

    // Submit the form using the next button
    await user.click(screen.getByTestId('next-button'));

    // Check error message is displayed
    expect(await screen.findByText(/network error/i)).toBeInTheDocument();
  });

  it('shows loading state during submission', async () => {
    // Create a delayed promise to keep the loading state visible
    global.fetch = jest.fn().mockImplementationOnce(() =>
      new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: () => Promise.resolve({ id: '123', slug: 'test-site' })
          });
        }, 100);
      })
    );

    const user = userEvent.setup();

    render(<SiteForm />);

    // Fill in form with valid data
    await user.type(screen.getByTestId('siteForm-name'), 'Test Site');
    await user.type(screen.getByTestId('siteForm-slug'), 'test-site');
    // Skip domain and add button as they don't exist in the current component

    // Submit the form using the next button
    await user.click(screen.getByTestId('next-button'));

    // Check loading state is displayed
    expect(screen.getByTestId('siteForm-submit-loading')).toBeInTheDocument();

    // Wait for completion
    await waitFor(() => {
      expect(screen.queryByTestId('siteForm-submit-loading')).not.toBeInTheDocument();
    });
  });
});
