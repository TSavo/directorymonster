/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SubmissionDetail } from '../SubmissionDetail';
import { useSubmission } from '../hooks/useSubmission';
import { SubmissionStatus } from '@/types/submission';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}));

// Mock the useSubmission hook
jest.mock('../hooks/useSubmission');

describe('SubmissionDetail Component', () => {
  const mockSubmission = {
    id: 'submission-1',
    siteId: 'site-1',
    tenantId: 'tenant-1',
    title: 'Test Submission',
    description: 'Test description',
    content: '<p>Test content</p>',
    categoryIds: ['category-1', 'category-2'],
    status: SubmissionStatus.PENDING,
    userId: 'user-1',
    backlinkInfo: {
      url: 'https://example.com',
      anchorText: 'Example Link'
    },
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z'
  };

  const mockApproveSubmission = jest.fn().mockResolvedValue(true);
  const mockRejectSubmission = jest.fn().mockResolvedValue(true);
  const mockFetchSubmission = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    (useSubmission as jest.Mock).mockReturnValue({
      submission: mockSubmission,
      isLoading: false,
      error: null,
      isSubmitting: false,
      fetchSubmission: mockFetchSubmission,
      approveSubmission: mockApproveSubmission,
      rejectSubmission: mockRejectSubmission
    });
  });

  it('renders submission details correctly', () => {
    render(<SubmissionDetail submissionId="submission-1" />);
    
    // Check that the submission title is rendered
    expect(screen.getByText('Test Submission')).toBeInTheDocument();
    
    // Check that the submission date is rendered
    expect(screen.getByText(/Submitted on January 1, 2023/)).toBeInTheDocument();
    
    // Check that the status badge is rendered
    expect(screen.getByText('Pending')).toBeInTheDocument();
    
    // Check that the description is rendered
    expect(screen.getByText('Test description')).toBeInTheDocument();
    
    // Check that the categories are rendered
    expect(screen.getAllByText(/category-/)).toHaveLength(2);
    
    // Check that the tabs are rendered
    expect(screen.getByRole('tab', { name: 'Details' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Content' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Backlink' })).toBeInTheDocument();
  });

  it('renders loading state', () => {
    (useSubmission as jest.Mock).mockReturnValue({
      submission: null,
      isLoading: true,
      error: null,
      isSubmitting: false,
      fetchSubmission: mockFetchSubmission,
      approveSubmission: mockApproveSubmission,
      rejectSubmission: mockRejectSubmission
    });
    
    render(<SubmissionDetail submissionId="submission-1" />);
    
    expect(screen.getByTestId('submission-loading')).toBeInTheDocument();
  });

  it('renders error state', () => {
    const errorMessage = 'Failed to fetch submission';
    (useSubmission as jest.Mock).mockReturnValue({
      submission: null,
      isLoading: false,
      error: errorMessage,
      isSubmitting: false,
      fetchSubmission: mockFetchSubmission,
      approveSubmission: mockApproveSubmission,
      rejectSubmission: mockRejectSubmission
    });
    
    render(<SubmissionDetail submissionId="submission-1" />);
    
    expect(screen.getByTestId('submission-error')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('renders not found state', () => {
    (useSubmission as jest.Mock).mockReturnValue({
      submission: null,
      isLoading: false,
      error: null,
      isSubmitting: false,
      fetchSubmission: mockFetchSubmission,
      approveSubmission: mockApproveSubmission,
      rejectSubmission: mockRejectSubmission
    });
    
    render(<SubmissionDetail submissionId="submission-1" />);
    
    expect(screen.getByTestId('submission-not-found')).toBeInTheDocument();
    expect(screen.getByText('The requested submission could not be found.')).toBeInTheDocument();
  });

  it('switches tabs correctly', () => {
    render(<SubmissionDetail submissionId="submission-1" />);
    
    // Default tab should be 'Details'
    expect(screen.getByText('Description')).toBeInTheDocument();
    
    // Click on 'Content' tab
    fireEvent.click(screen.getByRole('tab', { name: 'Content' }));
    expect(screen.getByText('Test content')).toBeInTheDocument();
    
    // Click on 'Backlink' tab
    fireEvent.click(screen.getByRole('tab', { name: 'Backlink' }));
    expect(screen.getByText('Backlink URL')).toBeInTheDocument();
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
    expect(screen.getByText('Anchor Text')).toBeInTheDocument();
    expect(screen.getByText('Example Link')).toBeInTheDocument();
  });

  it('handles approve submission', async () => {
    render(<SubmissionDetail submissionId="submission-1" />);
    
    // Enter review notes
    const reviewNotesInput = screen.getByLabelText('Review Notes');
    fireEvent.change(reviewNotesInput, { target: { value: 'Approved with notes' } });
    
    // Click approve button
    const approveButton = screen.getByText('Approve');
    fireEvent.click(approveButton);
    
    // Check that approveSubmission was called with the correct notes
    expect(mockApproveSubmission).toHaveBeenCalledWith('Approved with notes');
  });

  it('handles reject submission', async () => {
    render(<SubmissionDetail submissionId="submission-1" />);
    
    // Enter review notes
    const reviewNotesInput = screen.getByLabelText('Review Notes');
    fireEvent.change(reviewNotesInput, { target: { value: 'Rejected with notes' } });
    
    // Click reject button
    const rejectButton = screen.getByText('Reject');
    fireEvent.click(rejectButton);
    
    // Check that rejectSubmission was called with the correct notes
    expect(mockRejectSubmission).toHaveBeenCalledWith('Rejected with notes');
  });

  it('disables buttons when submitting', () => {
    (useSubmission as jest.Mock).mockReturnValue({
      submission: mockSubmission,
      isLoading: false,
      error: null,
      isSubmitting: true,
      fetchSubmission: mockFetchSubmission,
      approveSubmission: mockApproveSubmission,
      rejectSubmission: mockRejectSubmission
    });
    
    render(<SubmissionDetail submissionId="submission-1" />);
    
    // Check that approve and reject buttons are disabled
    const approveButton = screen.getByText('Approve');
    const rejectButton = screen.getByText('Reject');
    expect(approveButton).toBeDisabled();
    expect(rejectButton).toBeDisabled();
  });

  it('does not show approve/reject buttons for non-pending submissions', () => {
    (useSubmission as jest.Mock).mockReturnValue({
      submission: {
        ...mockSubmission,
        status: SubmissionStatus.APPROVED
      },
      isLoading: false,
      error: null,
      isSubmitting: false,
      fetchSubmission: mockFetchSubmission,
      approveSubmission: mockApproveSubmission,
      rejectSubmission: mockRejectSubmission
    });
    
    render(<SubmissionDetail submissionId="submission-1" />);
    
    // Approve and reject buttons should not be rendered
    expect(screen.queryByText('Approve')).not.toBeInTheDocument();
    expect(screen.queryByText('Reject')).not.toBeInTheDocument();
  });

  it('shows review notes tab when available', () => {
    (useSubmission as jest.Mock).mockReturnValue({
      submission: {
        ...mockSubmission,
        status: SubmissionStatus.APPROVED,
        reviewNotes: 'Approved with notes',
        reviewerId: 'reviewer-1',
        reviewedAt: '2023-01-02T00:00:00.000Z'
      },
      isLoading: false,
      error: null,
      isSubmitting: false,
      fetchSubmission: mockFetchSubmission,
      approveSubmission: mockApproveSubmission,
      rejectSubmission: mockRejectSubmission
    });
    
    render(<SubmissionDetail submissionId="submission-1" />);
    
    // Review Notes tab should be rendered
    expect(screen.getByRole('tab', { name: 'Review Notes' })).toBeInTheDocument();
    
    // Click on Review Notes tab
    fireEvent.click(screen.getByRole('tab', { name: 'Review Notes' }));
    
    // Review notes should be rendered
    expect(screen.getByText('Approved with notes')).toBeInTheDocument();
  });

  it('passes siteSlug to useSubmission', () => {
    const siteSlug = 'test-site';
    
    render(<SubmissionDetail submissionId="submission-1" siteSlug={siteSlug} />);
    
    // Check that useSubmission was called with the siteSlug
    expect(useSubmission).toHaveBeenCalledWith(
      expect.objectContaining({
        siteSlug
      })
    );
  });
});
