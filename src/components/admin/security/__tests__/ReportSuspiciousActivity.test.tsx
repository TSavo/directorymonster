import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportSuspiciousActivity } from '../ReportSuspiciousActivity';

describe('ReportSuspiciousActivity', () => {
  // Mock fetch for API calls
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true })
    });
  });

  test('renders the report form with all fields', () => {
    render(<ReportSuspiciousActivity />);

    // Check for form fields
    expect(screen.getByLabelText('Activity Type')).toBeInTheDocument();
    expect(screen.getByLabelText('IP Address (optional)')).toBeInTheDocument();
    expect(screen.getByLabelText('Username (optional)')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByText('Submit Report')).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    render(<ReportSuspiciousActivity />);

    // Submit without filling required fields
    fireEvent.click(screen.getByText('Submit Report'));

    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText('Activity type is required')).toBeInTheDocument();
      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });
  });

  test('submits the form with valid data', async () => {
    render(<ReportSuspiciousActivity />);

    // Fill out the form
    fireEvent.change(screen.getByLabelText('Activity Type'), {
      target: { value: 'suspicious_login' }
    });

    fireEvent.change(screen.getByLabelText('IP Address (optional)'), {
      target: { value: '192.168.1.1' }
    });

    fireEvent.change(screen.getByLabelText('Username (optional)'), {
      target: { value: 'testuser' }
    });

    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Suspicious login attempt from unknown location' }
    });

    // Submit the form
    fireEvent.click(screen.getByText('Submit Report'));

    // Verify API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/security/report',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('suspicious_login'),
        })
      );
    });

    // Check for success message
    await waitFor(() => {
      expect(screen.getByText('Report submitted successfully')).toBeInTheDocument();
    });
  });

  test('handles API errors', async () => {
    // Mock API error
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({
        error: 'Failed to submit report'
      })
    });

    render(<ReportSuspiciousActivity />);

    // Fill out the form
    fireEvent.change(screen.getByLabelText('Activity Type'), {
      target: { value: 'suspicious_login' }
    });

    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Suspicious login attempt' }
    });

    // Submit the form
    fireEvent.click(screen.getByText('Submit Report'));

    // Check for error message
    await waitFor(() => {
      expect(screen.getAllByText('Failed to submit report')[0]).toBeInTheDocument();
    });
  });

  test('resets form after successful submission', async () => {
    render(<ReportSuspiciousActivity />);

    // Fill out the form
    fireEvent.change(screen.getByLabelText('Activity Type'), {
      target: { value: 'suspicious_login' }
    });

    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Suspicious login attempt' }
    });

    // Submit the form
    fireEvent.click(screen.getByText('Submit Report'));

    // Check that form is reset
    await waitFor(() => {
      expect(screen.getByLabelText('Activity Type')).toHaveValue('');
      expect(screen.getByLabelText('Description')).toHaveValue('');
    });
  });

  test('displays different activity type options', () => {
    render(<ReportSuspiciousActivity />);

    // Open the dropdown
    fireEvent.click(screen.getByLabelText('Activity Type'));

    // Check for activity type options
    expect(screen.getByText('Suspicious Login')).toBeInTheDocument();
    expect(screen.getByText('Unauthorized Access')).toBeInTheDocument();
    expect(screen.getByText('Brute Force Attempt')).toBeInTheDocument();
    expect(screen.getByText('Account Compromise')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });
});
