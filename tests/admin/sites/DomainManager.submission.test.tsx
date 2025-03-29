import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DomainManager } from '@/components/admin/sites/DomainManager';

// Import our custom mock router
import { mockRouter, useRouter, resetMocks } from './__mocks__/nextNavigation';

// Mock the Next.js navigation module
jest.mock('next/navigation', () => ({
  useRouter: () => useRouter(),
}));

// Mock fetch API
global.fetch = jest.fn();

describe('DomainManager Submission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetMocks(); // Reset our custom mock router
    (global.fetch as jest.Mock).mockReset();
  });

  it('submits the form with valid data', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ id: '123', slug: 'test-site' })
    });
    
    const user = userEvent.setup();
    const onSuccess = jest.fn();
    
    render(<DomainManager onSuccess={onSuccess} />);
    
    // Fill in form with valid data
    await user.type(screen.getByLabelText(/name/i), 'Test Site');
    await user.type(screen.getByLabelText(/slug/i), 'test-site');
    await user.type(screen.getByLabelText(/description/i), 'This is a test site');
    await user.type(screen.getByPlaceholderText(/enter domain/i), 'test.com');
    await user.click(screen.getByText(/\\+ add/i));
    
    // Submit the form
    await user.click(screen.getByTestId('domainManager-submit'));
    
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
    
    render(<DomainManager />);
    
    // Fill in form with valid data
    await user.type(screen.getByLabelText(/name/i), 'Test Site');
    await user.type(screen.getByLabelText(/slug/i), 'test-site');
    await user.type(screen.getByPlaceholderText(/enter domain/i), 'test.com');
    await user.click(screen.getByText(/\\+ add/i));
    
    // Submit the form
    await user.click(screen.getByTestId('domainManager-submit'));
    
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
    
    render(<DomainManager mode="edit" initialData={initialData} />);
    
    // Update some fields
    await user.clear(screen.getByLabelText(/name/i));
    await user.type(screen.getByLabelText(/name/i), 'Updated Name');
    
    // Submit the form
    await user.click(screen.getByTestId('domainManager-submit'));
    
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
    
    render(<DomainManager />);
    
    // Fill in form with valid data
    await user.type(screen.getByLabelText(/name/i), 'Test Site');
    await user.type(screen.getByLabelText(/slug/i), 'test-site');
    await user.type(screen.getByPlaceholderText(/enter domain/i), 'test.com');
    await user.click(screen.getByText(/\\+ add/i));
    
    // Submit the form
    await user.click(screen.getByTestId('domainManager-submit'));
    
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
    
    render(<DomainManager />);
    
    // Fill in form with valid data
    await user.type(screen.getByLabelText(/name/i), 'Test Site');
    await user.type(screen.getByLabelText(/slug/i), 'test-site');
    await user.type(screen.getByPlaceholderText(/enter domain/i), 'test.com');
    await user.click(screen.getByText(/\\+ add/i));
    
    // Submit the form
    await user.click(screen.getByTestId('domainManager-submit'));
    
    // Check loading state is displayed
    expect(screen.getByTestId('domainManager-submit-loading')).toBeInTheDocument();
    
    // Wait for completion
    await waitFor(() => {
      expect(screen.queryByTestId('domainManager-submit-loading')).not.toBeInTheDocument();
    });
  });
});
