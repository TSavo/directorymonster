/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSubmission } from '../useSubmission';
import { SubmissionStatus } from '@/types/submission';

// Mock fetch function
global.fetch = jest.fn();

describe('useSubmission Hook', () => {
  const mockSubmission = {
    id: 'submission-1',
    siteId: 'site-1',
    tenantId: 'tenant-1',
    title: 'Test Submission',
    description: 'Test description',
    content: '<p>Test content</p>',
    categoryIds: ['category-1'],
    status: SubmissionStatus.PENDING,
    userId: 'user-1',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useSubmission({
      submissionId: 'submission-1',
      autoFetch: false
    }));

    expect(result.current.submission).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isSubmitting).toBe(false);
  });

  it('fetches submission successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ submission: mockSubmission })
    });

    const { result } = renderHook(() => useSubmission({
      submissionId: 'submission-1'
    }));

    // Initial state
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // After fetch
    expect(result.current.submission).toEqual(mockSubmission);
    expect(result.current.error).toBeNull();

    // Check that fetch was called with the correct URL
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/submissions/submission-1')
    );
  });

  it('fetches site-specific submission', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ submission: mockSubmission })
    });

    const siteSlug = 'test-site';
    const { result } = renderHook(() => useSubmission({
      submissionId: 'submission-1',
      siteSlug
    }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check that fetch was called with the correct URL
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/admin/sites/${siteSlug}/submissions/submission-1`)
    );
  });

  it('handles fetch error', async () => {
    const errorMessage = 'Failed to fetch submission';
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useSubmission({
      submissionId: 'submission-1'
    }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.submission).toBeNull();
  });

  it('approves submission successfully', async () => {
    // Mock fetch for initial load
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ submission: mockSubmission })
    });

    const { result } = renderHook(() => useSubmission({
      submissionId: 'submission-1'
    }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Mock fetch for approve action
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    // Mock fetch for refetch after approval
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        submission: { ...mockSubmission, status: SubmissionStatus.APPROVED }
      })
    });

    let success;
    await act(async () => {
      success = await result.current.approveSubmission('Approved with notes');
    });

    expect(success).toBe(true);
    expect(result.current.isSubmitting).toBe(false);

    // Check that fetch was called with the correct URL and method
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/submissions/submission-1/approve'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({ notes: 'Approved with notes' })
      })
    );
  });

  it('rejects submission successfully', async () => {
    // Mock fetch for initial load
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ submission: mockSubmission })
    });

    const { result } = renderHook(() => useSubmission({
      submissionId: 'submission-1'
    }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Mock fetch for reject action
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    // Mock fetch for refetch after rejection
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        submission: { ...mockSubmission, status: SubmissionStatus.REJECTED }
      })
    });

    let success;
    await act(async () => {
      success = await result.current.rejectSubmission('Rejected with notes');
    });

    expect(success).toBe(true);
    expect(result.current.isSubmitting).toBe(false);

    // Check that fetch was called with the correct URL and method
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/submissions/submission-1/reject'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({ notes: 'Rejected with notes' })
      })
    );
  });

  it('handles approval error', async () => {
    // Mock fetch for initial load
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ submission: mockSubmission })
    });

    const { result } = renderHook(() => useSubmission({
      submissionId: 'submission-1'
    }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Mock fetch for approve action with error
    const errorMessage = 'Failed to approve submission';
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    let success;
    await act(async () => {
      success = await result.current.approveSubmission('Approved with notes');
    });

    expect(success).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  it('handles rejection error', async () => {
    // Mock fetch for initial load
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ submission: mockSubmission })
    });

    const { result } = renderHook(() => useSubmission({
      submissionId: 'submission-1'
    }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Mock fetch for reject action with error
    const errorMessage = 'Failed to reject submission';
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    let success;
    await act(async () => {
      success = await result.current.rejectSubmission('Rejected with notes');
    });

    expect(success).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });
});
