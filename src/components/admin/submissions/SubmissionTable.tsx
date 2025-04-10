"use client";

import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Submission, SubmissionStatus } from '@/types/submission';
import { useSubmissions } from './hooks/useSubmissions';
import { SubmissionFilters } from '@/types/submission';
import { useRouter } from 'next/navigation';

interface SubmissionTableProps {
  siteSlug?: string;
  filter?: SubmissionFilters;
}

export function SubmissionTable({ siteSlug, filter = {} }: SubmissionTableProps) {
  const router = useRouter();
  const { 
    submissions, 
    isLoading, 
    error, 
    pagination, 
    fetchSubmissions,
    setPage
  } = useSubmissions({
    initialFilter: filter,
    siteSlug,
    autoFetch: true
  });

  // Function to get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case SubmissionStatus.PENDING:
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case SubmissionStatus.IN_REVIEW:
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">In Review</Badge>;
      case SubmissionStatus.CHANGES_REQUESTED:
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Changes Requested</Badge>;
      case SubmissionStatus.APPROVED:
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case SubmissionStatus.REJECTED:
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      case SubmissionStatus.WITHDRAWN:
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Withdrawn</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Function to view submission details
  const viewSubmission = (id: string) => {
    if (siteSlug) {
      router.push(`/admin/sites/${siteSlug}/submissions/${id}`);
    } else {
      router.push(`/admin/submissions/${id}`);
    }
  };

  // Loading state
  if (isLoading && !submissions.length) {
    return (
      <div data-testid="submissions-loading">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 my-4" data-testid="submissions-error">
        <div className="flex">
          <div className="flex-shrink-0">
            <XCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{error}</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Please try again later or contact support if the problem persists.</p>
            </div>
            <div className="mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => fetchSubmissions()}
                data-testid="retry-button"
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!submissions.length) {
    return (
      <div className="text-center py-10 border rounded-md bg-gray-50" data-testid="submissions-empty">
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No submissions found</h3>
        <p className="mt-1 text-sm text-gray-500">No submissions found matching the current filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="submissions-table">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Submitted By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((submission) => (
              <TableRow key={submission.id}>
                <TableCell className="font-medium">{submission.title}</TableCell>
                <TableCell>{submission.userId}</TableCell>
                <TableCell>
                  {typeof submission.createdAt === 'string' 
                    ? format(new Date(submission.createdAt), 'MMM d, yyyy')
                    : format(submission.createdAt, 'MMM d, yyyy')}
                </TableCell>
                <TableCell>{getStatusBadge(submission.status)}</TableCell>
                <TableCell>
                  {submission.categoryIds.length > 0 
                    ? submission.categoryIds.length > 1 
                      ? `${submission.categoryIds.length} categories` 
                      : '1 category'
                    : 'None'}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => viewSubmission(submission.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      {submission.status === SubmissionStatus.PENDING && (
                        <>
                          <DropdownMenuItem onClick={() => router.push(`/admin/submissions/${submission.id}/review`)}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Review
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/admin/submissions/${submission.id}/approve`)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/admin/submissions/${submission.id}/reject`)}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-gray-500">
            Showing {(pagination.page - 1) * pagination.perPage + 1} to{' '}
            {Math.min(pagination.page * pagination.perPage, pagination.total)} of{' '}
            {pagination.total} submissions
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubmissionTable;
