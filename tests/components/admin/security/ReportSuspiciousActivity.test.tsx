/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportSuspiciousActivity } from '@/components/admin/security/ReportSuspiciousActivity';

// Mock fetch
global.fetch = jest.fn();

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  ExclamationTriangleIcon: () => <span data-testid="exclamation-triangle-icon">Exclamation Triangle</span>,
  CheckCircleIcon: () => <span data-testid="check-circle-icon">Check Circle</span>
}));

describe('ReportSuspiciousActivity', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation for fetch
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
  });

  it('renders the form correctly', () => {
    render(<ReportSuspiciousActivity />);

    // Check that the form elements are rendered
    expect(screen.getByText('Activity Type')).toBeInTheDocument();
    expect(screen.getByText('IP Address (optional)')).toBeInTheDocument();
    expect(screen.getByText('Username (optional)')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();

    // Check that the submit button is rendered
    expect(screen.getByText('Submit Report')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<ReportSuspiciousActivity />);

    // Submit the form without filling in required fields
    const submitButton = screen.getByText('Submit Report');
    fireEvent.click(submitButton);

    // Check that validation errors are displayed
    await waitFor(() => {
      expect(screen.getByText('Activity type is required')).toBeInTheDocument();
      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });

    // Check that the form was not submitted
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('submits the form successfully', async () => {
    render(<ReportSuspiciousActivity />);

    // Fill in the form
    const activityTypeSelect = screen.getByLabelText('Activity Type');
    fireEvent.change(activityTypeSelect, { target: { value: 'suspicious_login' } });

    const ipInput = screen.getByLabelText('IP Address (optional)');
    fireEvent.change(ipInput, { target: { value: '192.168.1.1' } });

    const usernameInput = screen.getByLabelText('Username (optional)');
    fireEvent.change(usernameInput, { target: { value: 'user@example.com' } });

    const descriptionInput = screen.getByLabelText('Description');
    fireEvent.change(descriptionInput, { target: { value: 'Suspicious login attempt from unknown location' } });

    // Submit the form
    const submitButton = screen.getByText('Submit Report');
    fireEvent.click(submitButton);

    // Check that the form was submitted with the correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/security/report',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            activityType: 'suspicious_login',
            ip: '192.168.1.1',
            username: 'user@example.com',
            description: 'Suspicious login attempt from unknown location'
          })
        })
      );
    });

    // Check that the success message is displayed
    await waitFor(() => {
      expect(screen.getByText('Report submitted successfully')).toBeInTheDocument();
    });

    // Check that the form was reset
    expect(activityTypeSelect).toHaveValue('');
    expect(ipInput).toHaveValue('');
    expect(usernameInput).toHaveValue('');
    expect(descriptionInput).toHaveValue('');
  });

  it('handles submission errors', async () => {
    // Mock fetch to return an error
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<ReportSuspiciousActivity />);

    // Fill in the form
    const activityTypeSelect = screen.getByLabelText('Activity Type');
    fireEvent.change(activityTypeSelect, { target: { value: 'suspicious_login' } });

    const descriptionInput = screen.getByLabelText('Description');
    fireEvent.change(descriptionInput, { target: { value: 'Suspicious login attempt' } });

    // Submit the form
    const submitButton = screen.getByText('Submit Report');
    fireEvent.click(submitButton);

    // Check that the error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to submit report')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    // Check that the form was not reset
    expect(activityTypeSelect).toHaveValue('suspicious_login');
    expect(descriptionInput).toHaveValue('Suspicious login attempt');
  });

  it('handles server errors', async () => {
    // Mock fetch to return a server error
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Server error' })
    });

    render(<ReportSuspiciousActivity />);

    // Fill in the form
    const activityTypeSelect = screen.getByLabelText('Activity Type');
    fireEvent.change(activityTypeSelect, { target: { value: 'suspicious_login' } });

    const descriptionInput = screen.getByLabelText('Description');
    fireEvent.change(descriptionInput, { target: { value: 'Suspicious login attempt' } });

    // Submit the form
    const submitButton = screen.getByText('Submit Report');
    fireEvent.click(submitButton);

    // Check that the error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to submit report')).toBeInTheDocument();
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('clears validation errors when fields are edited', async () => {
    render(<ReportSuspiciousActivity />);

    // Submit the form without filling in required fields
    const submitButton = screen.getByText('Submit Report');
    fireEvent.click(submitButton);

    // Check that validation errors are displayed
    await waitFor(() => {
      expect(screen.getByText('Activity type is required')).toBeInTheDocument();
      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });

    // Fill in the activity type field
    const activityTypeSelect = screen.getByLabelText('Activity Type');
    fireEvent.change(activityTypeSelect, { target: { value: 'suspicious_login' } });

    // Check that the activity type error is cleared
    await waitFor(() => {
      expect(screen.queryByText('Activity type is required')).not.toBeInTheDocument();
    });

    // Fill in the description field
    const descriptionInput = screen.getByLabelText('Description');
    fireEvent.change(descriptionInput, { target: { value: 'Suspicious login attempt' } });

    // Check that the description error is cleared
    await waitFor(() => {
      expect(screen.queryByText('Description is required')).not.toBeInTheDocument();
    });
  });

  it('disables the submit button while submitting', async () => {
    // Mock fetch to take some time to resolve
    (global.fetch as jest.Mock).mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: () => Promise.resolve({ success: true })
          });
        }, 1000);
      });
    });

    render(<ReportSuspiciousActivity />);

    // Fill in the form
    const activityTypeSelect = screen.getByLabelText('Activity Type');
    fireEvent.change(activityTypeSelect, { target: { value: 'suspicious_login' } });

    const descriptionInput = screen.getByLabelText('Description');
    fireEvent.change(descriptionInput, { target: { value: 'Suspicious login attempt' } });

    // Submit the form
    const submitButton = screen.getByText('Submit Report');
    fireEvent.click(submitButton);

    // Check that the submit button is disabled and shows "Submitting..."
    await waitFor(() => {
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
      expect(screen.getByText('Submitting...')).toBeDisabled();
    });

    // Wait for the submission to complete
    await waitFor(() => {
      expect(screen.getByText('Submit Report')).toBeInTheDocument();
      expect(screen.getByText('Submit Report')).not.toBeDisabled();
    }, { timeout: 2000 });
  });
});
