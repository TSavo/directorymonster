/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { SubmissionDashboard } from '@/components/admin/submissions/SubmissionDashboard';
import { SubmissionDetail } from '@/components/admin/submissions/SubmissionDetail';
import { SubmissionStatus } from '@/types/submission';

// Mock the fetch function
global.fetch = jest.fn();

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/admin/submissions'
  }),
  usePathname: () => '/admin/submissions'
}));

// Mock the auth context
jest.mock('@/components/admin/auth/AuthProvider', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin'
    }
  })
}));

describe('Submission Review E2E Test', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock fetch for submissions list
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/admin/submissions')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            submissions: mockSubmissions,
            pagination: {
              page: 1,
              perPage: 10,
              total: 2,
              totalPages: 1
            }
          })
        });
      }
      
      if (url.includes('/api/admin/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            categories: mockCategories
          })
        });
      }
      
      if (url.includes('/api/admin/submissions/submission-1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            submission: mockSubmissions[0]
          })
        });
      }
      
      if (url.includes('/api/admin/submissions/submission-1/approve')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true
          })
        });
      }
      
      return Promise.reject(new Error('Not found'));
    });
  });

  it('renders the submission dashboard in the admin layout', async () => {
    render(
      <AdminLayout>
        <SubmissionDashboard />
      </AdminLayout>
    );
    
    // Wait for submissions to load
    await waitFor(() => {
      expect(screen.getByText('Test Submission 1')).toBeInTheDocument();
      expect(screen.getByText('Test Submission 2')).toBeInTheDocument();
    });
    
    // Check that the admin layout is rendered
    expect(screen.getByText('Submissions')).toBeInTheDocument();
  });

  it('navigates from dashboard to detail view', async () => {
    // Mock router push function
    const mockPush = jest.fn();
    require('next/navigation').useRouter = () => ({
      push: mockPush,
      pathname: '/admin/submissions'
    });
    
    render(<SubmissionDashboard />);
    
    // Wait for submissions to load
    await waitFor(() => {
      expect(screen.getByText('Test Submission 1')).toBeInTheDocument();
    });
    
    // Open the dropdown menu for the first submission
    const actionButtons = screen.getAllByLabelText('Actions');
    fireEvent.click(actionButtons[0]);
    
    // Click on "View Details"
    fireEvent.click(screen.getByText('View Details'));
    
    // Check that router.push was called with the correct URL
    expect(mockPush).toHaveBeenCalledWith('/admin/submissions/submission-1');
  });

  it('approves a submission and updates its status', async () => {
    // First mock fetch to return the pending submission
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/admin/submissions/submission-1') && !url.includes('/approve')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            submission: mockSubmissions[0]
          })
        });
      }
      
      if (url.includes('/api/admin/submissions/submission-1/approve')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true
          })
        });
      }
      
      return Promise.reject(new Error('Not found'));
    });
    
    render(<SubmissionDetail submissionId="submission-1" />);
    
    // Wait for submission to load
    await waitFor(() => {
      expect(screen.getByText('Test Submission 1')).toBeInTheDocument();
    });
    
    // Enter review notes
    const reviewNotesInput = screen.getByLabelText('Review Notes');
    fireEvent.change(reviewNotesInput, { target: { value: 'Approved with notes' } });
    
    // Now update the mock to return the approved submission after approval
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/admin/submissions/submission-1') && !url.includes('/approve')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            submission: {
              ...mockSubmissions[0],
              status: SubmissionStatus.APPROVED,
              reviewNotes: 'Approved with notes',
              reviewerId: 'user-1',
              reviewedAt: '2023-01-02T00:00:00.000Z'
            }
          })
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true
        })
      });
    });
    
    // Click approve button
    const approveButton = screen.getByText('Approve');
    fireEvent.click(approveButton);
    
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

  it('filters submissions by status and category', async () => {
    render(<SubmissionDashboard />);
    
    // Wait for submissions to load
    await waitFor(() => {
      expect(screen.getByText('Test Submission 1')).toBeInTheDocument();
    });
    
    // Open status dropdown
    fireEvent.click(screen.getByText('Status'));
    
    // Select 'Pending' status
    fireEvent.click(screen.getByText('Pending'));
    
    // Expand to show advanced filters
    fireEvent.click(screen.getByText('Expand'));
    
    // Check category checkbox
    const categoryCheckbox = screen.getByLabelText('Category 1');
    fireEvent.click(categoryCheckbox);
    
    // Mock fetch for filtered results
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/admin/submissions') && 
          url.includes('status=pending') && 
          url.includes('categoryId=category-1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            submissions: [mockSubmissions[0]],
            pagination: {
              page: 1,
              perPage: 10,
              total: 1,
              totalPages: 1
            }
          })
        });
      }
      
      return Promise.reject(new Error('Not found'));
    });
    
    // Click apply button
    fireEvent.click(screen.getByText('Apply Filters'));
    
    // Check that fetch was called with the correct URL
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/admin\/submissions\?.*status=pending.*categoryId=category-1/)
    );
  });
});
