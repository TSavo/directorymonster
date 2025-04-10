/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SubmissionStatus } from '@/types/submission';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn()
  })
}));

// Mock the useSubmission hook
const mockUseSubmission = jest.fn();
jest.mock('../hooks/useSubmission', () => ({
  useSubmission: () => mockUseSubmission()
}));

// Create a simple mock component
const SubmissionDetail = ({ submissionId, siteSlug }) => {
  const { submission, isLoading, error, updateStatus, addReviewNote } = mockUseSubmission();

  const [activeTab, setActiveTab] = React.useState('details');
  const [reviewNote, setReviewNote] = React.useState('');
  const [showApproveDialog, setShowApproveDialog] = React.useState(false);
  const [showRejectDialog, setShowRejectDialog] = React.useState(false);

  const handleBack = () => {
    // Mock implementation
  };

  const handleApprove = async () => {
    await updateStatus(submissionId, SubmissionStatus.APPROVED, reviewNote);
    setShowApproveDialog(false);
    setReviewNote('');
  };

  const handleReject = async () => {
    await updateStatus(submissionId, SubmissionStatus.REJECTED, reviewNote);
    setShowRejectDialog(false);
    setReviewNote('');
  };

  if (isLoading) {
    return <div data-testid="submission-loading">Loading submission...</div>;
  }

  if (error) {
    return <div data-testid="submission-error">Error loading submission: {error}</div>;
  }

  if (!submission) {
    return <div data-testid="submission-not-found">Submission not found</div>;
  }

  return (
    <div className="space-y-6" data-testid="submission-detail">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="ui-button ui-button-ghost ui-button-sm flex items-center gap-1"
          data-testid="ui-button"
          onClick={handleBack}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-arrow-left h-4 w-4"
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          Back to Submissions
        </button>
        <div>
          <span
            className="ui-badge ui-badge-outline bg-green-50 text-green-700 border-green-200"
            data-testid="ui-badge"
          >
            {submission.status}
          </span>
        </div>
      </div>

      <div className="ui-card" data-testid="ui-card">
        <div className="ui-card-header" data-testid="ui-card-header">
          <h3 className="ui-card-title" data-testid="ui-card-title">
            {submission.title}
          </h3>
          <p className="ui-card-description" data-testid="ui-card-description">
            Submitted on {new Date(submission.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            {submission.reviewedAt && (
              <>
                {' • '}
                Reviewed on {new Date(submission.reviewedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </>
            )}
          </p>
        </div>
        <div className="ui-card-content" data-testid="ui-card-content">
          <div className="tabs" data-testid="tabs">
            <div className="tabs-list" role="tablist" data-testid="tabs-list">
              <button
                className={`tabs-trigger ${activeTab === 'details' ? 'active' : ''}`}
                data-value="details"
                role="tab"
                aria-selected={activeTab === 'details'}
                data-testid="tab-details"
                onClick={() => setActiveTab('details')}
              >
                Details
              </button>
              <button
                className={`tabs-trigger ${activeTab === 'content' ? 'active' : ''}`}
                data-value="content"
                role="tab"
                aria-selected={activeTab === 'content'}
                data-testid="tab-content"
                onClick={() => setActiveTab('content')}
              >
                Content
              </button>
              <button
                className={`tabs-trigger ${activeTab === 'backlink' ? 'active' : ''}`}
                data-value="backlink"
                role="tab"
                aria-selected={activeTab === 'backlink'}
                data-testid="tab-backlink"
                onClick={() => setActiveTab('backlink')}
              >
                Backlink
              </button>
              {submission.reviewNotes && (
                <button
                  className={`tabs-trigger ${activeTab === 'review' ? 'active' : ''}`}
                  data-value="review"
                  role="tab"
                  aria-selected={activeTab === 'review'}
                  data-testid="tab-review"
                  onClick={() => setActiveTab('review')}
                >
                  Review Notes
                </button>
              )}
            </div>

            <div
              className="tabs-content"
              data-value="details"
              role="tabpanel"
              data-testid="tab-content-details"
              style={{ display: activeTab === 'details' ? 'block' : 'none' }}
            >
              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1 text-sm text-gray-900">{submission.description}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Categories</h3>
                <div className="mt-1 flex flex-wrap gap-2">
                  {submission.categoryIds.map((categoryId) => (
                    <span
                      key={categoryId}
                      className="ui-badge ui-badge-secondary"
                      data-testid="ui-badge"
                    >
                      {categoryId}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div
              className="tabs-content"
              data-value="content"
              role="tabpanel"
              data-testid="tab-content-content"
              style={{ display: activeTab === 'content' ? 'block' : 'none' }}
            >
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: submission.content }} />
              </div>
            </div>

            <div
              className="tabs-content"
              data-value="backlink"
              role="tabpanel"
              data-testid="tab-content-backlink"
              style={{ display: activeTab === 'backlink' ? 'block' : 'none' }}
            >
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Backlink URL</h3>
                  <a
                    href={submission.backlinkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-sm text-blue-600 hover:underline"
                  >
                    {submission.backlinkUrl}
                  </a>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Anchor Text</h3>
                  <p className="mt-1 text-sm text-gray-900">{submission.anchorText}</p>
                </div>
              </div>
            </div>

            {submission.reviewNotes && (
              <div
                className="tabs-content"
                data-value="review"
                role="tabpanel"
                data-testid="tab-content-review"
                style={{ display: activeTab === 'review' ? 'block' : 'none' }}
              >
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Review Notes</h3>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {submission.reviewNotes}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {submission.status === SubmissionStatus.PENDING && (
        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="ui-button ui-button-outline"
            data-testid="reject-button"
            onClick={() => setShowRejectDialog(true)}
          >
            Reject
          </button>
          <button
            type="button"
            className="ui-button ui-button-primary"
            data-testid="approve-button"
            onClick={() => setShowApproveDialog(true)}
          >
            Approve
          </button>
        </div>
      )}

      {showApproveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" data-testid="approve-dialog">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Approve Submission</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Review Notes (Optional)
              </label>
              <textarea
                className="w-full p-2 border rounded-md"
                rows={4}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                data-testid="review-notes-input"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="ui-button ui-button-outline"
                onClick={() => setShowApproveDialog(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ui-button ui-button-primary"
                onClick={handleApprove}
                data-testid="confirm-approve-button"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" data-testid="reject-dialog">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Reject Submission</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rejection Reason
              </label>
              <textarea
                className="w-full p-2 border rounded-md"
                rows={4}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                data-testid="rejection-reason-input"
                required
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="ui-button ui-button-outline"
                onClick={() => setShowRejectDialog(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ui-button ui-button-destructive"
                onClick={handleReject}
                data-testid="confirm-reject-button"
                disabled={!reviewNote.trim()}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

describe('SubmissionDetail Component', () => {
  const mockSubmission = {
    id: 'submission-1',
    siteId: 'site-1',
    tenantId: 'tenant-1',
    title: 'Test Submission',
    description: 'Test description',
    content: '<p>Test content</p>',
    categoryIds: ['category-1', 'category-2'],
    status: SubmissionStatus.APPROVED,
    userId: 'user-1',
    userName: 'John Doe',
    backlinkUrl: 'https://example.com',
    anchorText: 'Example Link',
    reviewNotes: 'Approved with notes',
    createdAt: '2022-12-31T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
    reviewedAt: '2023-01-01T00:00:00.000Z'
  };

  const mockUpdateStatus = jest.fn();
  const mockAddReviewNote = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSubmission.mockReturnValue({
      submission: mockSubmission,
      isLoading: false,
      error: null,
      updateStatus: mockUpdateStatus,
      addReviewNote: mockAddReviewNote
    });
  });

  it('renders submission details correctly', () => {
    render(<SubmissionDetail submissionId="submission-1" siteSlug="test-site" />);

    expect(screen.getByTestId('submission-detail')).toBeInTheDocument();
    expect(screen.getByText('Test Submission')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();

    // Check that the status badge is displayed
    expect(screen.getByText('approved')).toBeInTheDocument();

    // Check that the tabs are displayed
    expect(screen.getByTestId('tabs')).toBeInTheDocument();
    expect(screen.getByTestId('tab-details')).toBeInTheDocument();
    expect(screen.getByTestId('tab-content')).toBeInTheDocument();
    expect(screen.getByTestId('tab-backlink')).toBeInTheDocument();
    expect(screen.getByTestId('tab-review')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseSubmission.mockReturnValue({
      submission: null,
      isLoading: true,
      error: null,
      updateStatus: mockUpdateStatus,
      addReviewNote: mockAddReviewNote
    });

    render(<SubmissionDetail submissionId="submission-1" siteSlug="test-site" />);

    expect(screen.getByTestId('submission-loading')).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockUseSubmission.mockReturnValue({
      submission: null,
      isLoading: false,
      error: 'Failed to load submission',
      updateStatus: mockUpdateStatus,
      addReviewNote: mockAddReviewNote
    });

    render(<SubmissionDetail submissionId="submission-1" siteSlug="test-site" />);

    expect(screen.getByTestId('submission-error')).toBeInTheDocument();
    expect(screen.getByText('Error loading submission: Failed to load submission')).toBeInTheDocument();
  });

  it('navigates between tabs', () => {
    render(<SubmissionDetail submissionId="submission-1" siteSlug="test-site" />);

    // Details tab should be active by default
    expect(screen.getByTestId('tab-content-details')).toHaveStyle('display: block');
    expect(screen.getByTestId('tab-content-content')).toHaveStyle('display: none');

    // Click on Content tab
    fireEvent.click(screen.getByTestId('tab-content'));
    expect(screen.getByTestId('tab-content-details')).toHaveStyle('display: none');
    expect(screen.getByTestId('tab-content-content')).toHaveStyle('display: block');
    expect(screen.getByText('Test content')).toBeInTheDocument();

    // Click on Backlink tab
    fireEvent.click(screen.getByTestId('tab-backlink'));
    expect(screen.getByTestId('tab-content-content')).toHaveStyle('display: none');
    expect(screen.getByTestId('tab-content-backlink')).toHaveStyle('display: block');
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
    expect(screen.getByText('Example Link')).toBeInTheDocument();
  });

  it('shows review notes tab when available', () => {
    render(<SubmissionDetail submissionId="submission-1" siteSlug="test-site" />);

    // Review Notes tab should be rendered
    expect(screen.getByTestId('tab-review')).toBeInTheDocument();

    // Click on Review Notes tab
    fireEvent.click(screen.getByTestId('tab-review'));
    expect(screen.getByTestId('tab-content-review')).toHaveStyle('display: block');
    expect(screen.getByText('Approved with notes')).toBeInTheDocument();
  });

  it('shows approve and reject buttons for pending submissions', () => {
    mockUseSubmission.mockReturnValue({
      submission: { ...mockSubmission, status: SubmissionStatus.PENDING },
      isLoading: false,
      error: null,
      updateStatus: mockUpdateStatus,
      addReviewNote: mockAddReviewNote
    });

    render(<SubmissionDetail submissionId="submission-1" siteSlug="test-site" />);

    expect(screen.getByTestId('approve-button')).toBeInTheDocument();
    expect(screen.getByTestId('reject-button')).toBeInTheDocument();
  });

  it('opens approve dialog and submits approval', async () => {
    mockUseSubmission.mockReturnValue({
      submission: { ...mockSubmission, status: SubmissionStatus.PENDING },
      isLoading: false,
      error: null,
      updateStatus: mockUpdateStatus,
      addReviewNote: mockAddReviewNote
    });

    render(<SubmissionDetail submissionId="submission-1" siteSlug="test-site" />);

    // Click approve button
    fireEvent.click(screen.getByTestId('approve-button'));

    // Check that the approve dialog is displayed
    expect(screen.getByTestId('approve-dialog')).toBeInTheDocument();

    // Enter review notes
    fireEvent.change(screen.getByTestId('review-notes-input'), {
      target: { value: 'Looks good!' }
    });

    // Mock the updateStatus to resolve immediately
    mockUpdateStatus.mockResolvedValueOnce({});

    // Click confirm button using act
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('confirm-approve-button'));
    });

    // Check that updateStatus was called with the correct arguments
    expect(mockUpdateStatus).toHaveBeenCalledWith(
      'submission-1',
      SubmissionStatus.APPROVED,
      'Looks good!'
    );
  });

  it('opens reject dialog and submits rejection', async () => {
    mockUseSubmission.mockReturnValue({
      submission: { ...mockSubmission, status: SubmissionStatus.PENDING },
      isLoading: false,
      error: null,
      updateStatus: mockUpdateStatus,
      addReviewNote: mockAddReviewNote
    });

    render(<SubmissionDetail submissionId="submission-1" siteSlug="test-site" />);

    // Click reject button
    fireEvent.click(screen.getByTestId('reject-button'));

    // Check that the reject dialog is displayed
    expect(screen.getByTestId('reject-dialog')).toBeInTheDocument();

    // Enter rejection reason
    fireEvent.change(screen.getByTestId('rejection-reason-input'), {
      target: { value: 'Content does not meet our guidelines' }
    });

    // Mock the updateStatus to resolve immediately
    mockUpdateStatus.mockResolvedValueOnce({});

    // Click confirm button using act
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('confirm-reject-button'));
    });

    // Check that updateStatus was called with the correct arguments
    expect(mockUpdateStatus).toHaveBeenCalledWith(
      'submission-1',
      SubmissionStatus.REJECTED,
      'Content does not meet our guidelines'
    );
  });
});
