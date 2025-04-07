/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SubmissionDashboard } from '@/components/admin/submissions/SubmissionDashboard';
import { SubmissionDetail } from '@/components/admin/submissions/SubmissionDetail';
import { useSubmissions } from '@/components/admin/submissions/hooks/useSubmissions';
import { useSubmission } from '@/components/admin/submissions/hooks/useSubmission';
import { useCategories } from '@/components/admin/categories/hooks/useCategories';
import { SubmissionStatus } from '@/types/submission';

// Mock the hooks
jest.mock('@/components/admin/submissions/hooks/useSubmissions');
jest.mock('@/components/admin/submissions/hooks/useSubmission');
jest.mock('@/components/admin/categories/hooks/useCategories');

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}));

describe('Submission Review Flow Integration', () => {
  const mockSubmissions = [
    {
      id: 'submission-1',
      siteId: 'site-1',
      tenantId: 'tenant-1',
      title: 'Test Submission 1',
      description: 'Test description 1',
      categoryIds: ['category-1'],
      status: SubmissionStatus.PENDING,
      userId: 'user-1',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    },
    {
      id: 'submission-2',
      siteId: 'site-1',
      tenantId: 'tenant-1',
      title: 'Test Submission 2',
      description: 'Test description 2',
      categoryIds: ['category-2'],
      status: SubmissionStatus.APPROVED,
      userId: 'user-2',
      createdAt: '2023-01-02T00:00:00.000Z',
      updatedAt: '2023-01-02T00:00:00.000Z'
    }
  ];

  const mockCategories = [
    { id: 'category-1', name: 'Category 1', slug: 'category-1' },
    { id: 'category-2', name: 'Category 2', slug: 'category-2' }
  ];

  const mockPagination = {
    page: 1,
    perPage: 10,
    total: 2,
    totalPages: 1
  };

  const mockFetchSubmissions = jest.fn();
  const mockSetPage = jest.fn();
  const mockSetFilter = jest.fn();
  const mockApproveSubmission = jest.fn().mockResolvedValue(true);
  const mockRejectSubmission = jest.fn().mockResolvedValue(true);

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useSubmissions hook
    (useSubmissions as jest.Mock).mockReturnValue({
      submissions: mockSubmissions,
      isLoading: false,
      error: null,
      pagination: mockPagination,
      fetchSubmissions: mockFetchSubmissions,
      setPage: mockSetPage,
      setFilter: mockSetFilter
    });
    
    // Mock useSubmission hook
    (useSubmission as jest.Mock).mockReturnValue({
      submission: mockSubmissions[0],
      isLoading: false,
      error: null,
      isSubmitting: false,
      fetchSubmission: jest.fn(),
      approveSubmission: mockApproveSubmission,
      rejectSubmission: mockRejectSubmission
    });
    
    // Mock useCategories hook
    (useCategories as jest.Mock).mockReturnValue({
      categories: mockCategories,
      isLoading: false,
      error: null,
      fetchCategories: jest.fn()
    });
  });

  it('filters submissions and displays details', async () => {
    // Render the dashboard
    render(<SubmissionDashboard />);
    
    // Check that submissions are displayed
    expect(screen.getByText('Test Submission 1')).toBeInTheDocument();
    expect(screen.getByText('Test Submission 2')).toBeInTheDocument();
    
    // Apply a filter
    const searchInput = screen.getByPlaceholderText('Search submissions...');
    fireEvent.change(searchInput, { target: { value: 'Test Submission 1' } });
    fireEvent.click(screen.getByText('Apply Filters'));
    
    // Check that setFilter was called with the correct filter
    expect(mockSetFilter).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'Test Submission 1'
      })
    );
    
    // Now render the detail view for the first submission
    render(<SubmissionDetail submissionId="submission-1" />);
    
    // Check that submission details are displayed
    expect(screen.getByText('Test Submission 1')).toBeInTheDocument();
    expect(screen.getByText('Test description 1')).toBeInTheDocument();
    
    // Enter review notes
    const reviewNotesInput = screen.getByLabelText('Review Notes');
    fireEvent.change(reviewNotesInput, { target: { value: 'Approved with notes' } });
    
    // Click approve button
    const approveButton = screen.getByText('Approve');
    fireEvent.click(approveButton);
    
    // Check that approveSubmission was called with the correct notes
    expect(mockApproveSubmission).toHaveBeenCalledWith('Approved with notes');
  });

  it('handles the complete review flow from pending to approved', async () => {
    // Mock a pending submission
    const pendingSubmission = {
      ...mockSubmissions[0],
      status: SubmissionStatus.PENDING
    };
    
    // Mock an approved submission (after approval)
    const approvedSubmission = {
      ...mockSubmissions[0],
      status: SubmissionStatus.APPROVED,
      reviewNotes: 'Approved with notes',
      reviewerId: 'reviewer-1',
      reviewedAt: '2023-01-02T00:00:00.000Z'
    };
    
    // First return the pending submission
    (useSubmission as jest.Mock).mockReturnValue({
      submission: pendingSubmission,
      isLoading: false,
      error: null,
      isSubmitting: false,
      fetchSubmission: jest.fn(),
      approveSubmission: jest.fn().mockImplementation(async (notes) => {
        // Update the mock to return the approved submission after approval
        (useSubmission as jest.Mock).mockReturnValue({
          submission: approvedSubmission,
          isLoading: false,
          error: null,
          isSubmitting: false,
          fetchSubmission: jest.fn(),
          approveSubmission: mockApproveSubmission,
          rejectSubmission: mockRejectSubmission
        });
        return true;
      }),
      rejectSubmission: mockRejectSubmission
    });
    
    // Render the detail view
    render(<SubmissionDetail submissionId="submission-1" />);
    
    // Check that the pending status is displayed
    expect(screen.getByText('Pending')).toBeInTheDocument();
    
    // Enter review notes
    const reviewNotesInput = screen.getByLabelText('Review Notes');
    fireEvent.change(reviewNotesInput, { target: { value: 'Approved with notes' } });
    
    // Click approve button
    const approveButton = screen.getByText('Approve');
    fireEvent.click(approveButton);
    
    // Re-render to see the updated state
    await waitFor(() => {
      // Check that the status has changed to approved
      expect(screen.getByText('Approved')).toBeInTheDocument();
      
      // Check that review notes tab is now available
      expect(screen.getByRole('tab', { name: 'Review Notes' })).toBeInTheDocument();
      
      // Check that approve/reject buttons are no longer displayed
      expect(screen.queryByText('Approve')).not.toBeInTheDocument();
      expect(screen.queryByText('Reject')).not.toBeInTheDocument();
    });
  });

  it('handles the complete review flow from pending to rejected', async () => {
    // Mock a pending submission
    const pendingSubmission = {
      ...mockSubmissions[0],
      status: SubmissionStatus.PENDING
    };
    
    // Mock a rejected submission (after rejection)
    const rejectedSubmission = {
      ...mockSubmissions[0],
      status: SubmissionStatus.REJECTED,
      reviewNotes: 'Rejected with notes',
      reviewerId: 'reviewer-1',
      reviewedAt: '2023-01-02T00:00:00.000Z'
    };
    
    // First return the pending submission
    (useSubmission as jest.Mock).mockReturnValue({
      submission: pendingSubmission,
      isLoading: false,
      error: null,
      isSubmitting: false,
      fetchSubmission: jest.fn(),
      approveSubmission: mockApproveSubmission,
      rejectSubmission: jest.fn().mockImplementation(async (notes) => {
        // Update the mock to return the rejected submission after rejection
        (useSubmission as jest.Mock).mockReturnValue({
          submission: rejectedSubmission,
          isLoading: false,
          error: null,
          isSubmitting: false,
          fetchSubmission: jest.fn(),
          approveSubmission: mockApproveSubmission,
          rejectSubmission: mockRejectSubmission
        });
        return true;
      })
    });
    
    // Render the detail view
    render(<SubmissionDetail submissionId="submission-1" />);
    
    // Check that the pending status is displayed
    expect(screen.getByText('Pending')).toBeInTheDocument();
    
    // Enter review notes
    const reviewNotesInput = screen.getByLabelText('Review Notes');
    fireEvent.change(reviewNotesInput, { target: { value: 'Rejected with notes' } });
    
    // Click reject button
    const rejectButton = screen.getByText('Reject');
    fireEvent.click(rejectButton);
    
    // Re-render to see the updated state
    await waitFor(() => {
      // Check that the status has changed to rejected
      expect(screen.getByText('Rejected')).toBeInTheDocument();
      
      // Check that review notes tab is now available
      expect(screen.getByRole('tab', { name: 'Review Notes' })).toBeInTheDocument();
      
      // Check that approve/reject buttons are no longer displayed
      expect(screen.queryByText('Approve')).not.toBeInTheDocument();
      expect(screen.queryByText('Reject')).not.toBeInTheDocument();
    });
  });

  it('handles site-specific submission review', async () => {
    const siteSlug = 'test-site';
    
    // Render the dashboard with siteSlug
    render(<SubmissionDashboard siteSlug={siteSlug} />);
    
    // Check that useSubmissions was called with the siteSlug
    expect(useSubmissions).toHaveBeenCalledWith(
      expect.objectContaining({
        siteSlug
      })
    );
    
    // Render the detail view with siteSlug
    render(<SubmissionDetail submissionId="submission-1" siteSlug={siteSlug} />);
    
    // Check that useSubmission was called with the siteSlug
    expect(useSubmission).toHaveBeenCalledWith(
      expect.objectContaining({
        siteSlug
      })
    );
  });
});
