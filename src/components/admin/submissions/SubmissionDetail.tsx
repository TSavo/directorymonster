"use client";

import React, { useState } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { Submission, SubmissionStatus } from '@/types/submission';
import { useSubmission } from './hooks/useSubmission';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface SubmissionDetailProps {
  submissionId: string;
  siteSlug?: string;
}

export function SubmissionDetail({ submissionId, siteSlug }: SubmissionDetailProps) {
  const router = useRouter();
  const [reviewNotes, setReviewNotes] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  
  const { 
    submission, 
    isLoading, 
    error, 
    approveSubmission,
    rejectSubmission,
    isSubmitting
  } = useSubmission({
    submissionId,
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

  // Handle approve submission
  const handleApprove = async () => {
    const success = await approveSubmission(reviewNotes);
    if (success) {
      // Navigate back to submissions list
      if (siteSlug) {
        router.push(`/admin/sites/${siteSlug}/submissions`);
      } else {
        router.push('/admin/submissions');
      }
    }
  };

  // Handle reject submission
  const handleReject = async () => {
    const success = await rejectSubmission(reviewNotes);
    if (success) {
      // Navigate back to submissions list
      if (siteSlug) {
        router.push(`/admin/sites/${siteSlug}/submissions`);
      } else {
        router.push('/admin/submissions');
      }
    }
  };

  // Handle back button
  const handleBack = () => {
    if (siteSlug) {
      router.push(`/admin/sites/${siteSlug}/submissions`);
    } else {
      router.push('/admin/submissions');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div data-testid="submission-loading">
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
      <Alert variant="destructive" className="my-4" data-testid="submission-error">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error}
          <div className="mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={handleBack}
            >
              Back to Submissions
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // If submission not found
  if (!submission) {
    return (
      <Alert className="my-4" data-testid="submission-not-found">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Not Found</AlertTitle>
        <AlertDescription>
          The requested submission could not be found.
          <div className="mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={handleBack}
            >
              Back to Submissions
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6" data-testid="submission-detail">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleBack}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Submissions
        </Button>
        <div>
          {getStatusBadge(submission.status)}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{submission.title}</CardTitle>
          <CardDescription>
            Submitted on {typeof submission.createdAt === 'string' 
              ? format(new Date(submission.createdAt), 'MMMM d, yyyy')
              : format(submission.createdAt, 'MMMM d, yyyy')}
            {submission.reviewedAt && (
              <> • Reviewed on {typeof submission.reviewedAt === 'string'
                ? format(new Date(submission.reviewedAt), 'MMMM d, yyyy')
                : format(submission.reviewedAt, 'MMMM d, yyyy')}
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              {submission.backlinkInfo && (
                <TabsTrigger value="backlink">Backlink</TabsTrigger>
              )}
              {submission.reviewNotes && (
                <TabsTrigger value="review">Review Notes</TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="details" className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1 text-sm text-gray-900">{submission.description}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Categories</h3>
                <div className="mt-1 flex flex-wrap gap-2">
                  {submission.categoryIds.map((categoryId) => (
                    <Badge key={categoryId} variant="secondary">{categoryId}</Badge>
                  ))}
                </div>
              </div>
              
              {submission.media && submission.media.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Media</h3>
                  <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                    {submission.media.map((media, index) => (
                      <div key={index} className="relative aspect-square overflow-hidden rounded-md">
                        <img
                          src={media.url}
                          alt={media.alt || `Image ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {submission.customFields && Object.keys(submission.customFields).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Custom Fields</h3>
                  <dl className="mt-1 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                    {Object.entries(submission.customFields).map(([key, value]) => (
                      <div key={key} className="border-t border-gray-100 pt-2">
                        <dt className="text-sm font-medium text-gray-500">{key}</dt>
                        <dd className="mt-1 text-sm text-gray-900">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="content">
              <div className="prose max-w-none">
                {submission.content ? (
                  <div dangerouslySetInnerHTML={{ __html: submission.content }} />
                ) : (
                  <p className="text-gray-500 italic">No content provided</p>
                )}
              </div>
            </TabsContent>
            
            {submission.backlinkInfo && (
              <TabsContent value="backlink">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Backlink URL</h3>
                    <a 
                      href={submission.backlinkInfo.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-1 text-sm text-blue-600 hover:underline"
                    >
                      {submission.backlinkInfo.url}
                    </a>
                  </div>
                  
                  {submission.backlinkInfo.anchorText && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Anchor Text</h3>
                      <p className="mt-1 text-sm text-gray-900">{submission.backlinkInfo.anchorText}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            )}
            
            {submission.reviewNotes && (
              <TabsContent value="review">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Review Notes</h3>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{submission.reviewNotes}</p>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
        
        {submission.status === SubmissionStatus.PENDING && (
          <CardFooter className="flex flex-col space-y-4">
            <div className="w-full">
              <label htmlFor="reviewNotes" className="block text-sm font-medium text-gray-700">
                Review Notes
              </label>
              <Textarea
                id="reviewNotes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add notes about this submission..."
                className="mt-1"
                rows={4}
              />
            </div>
            
            <div className="flex justify-end gap-2 w-full">
              <Button
                variant="outline"
                onClick={handleReject}
                disabled={isSubmitting}
                className="flex items-center gap-1"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="flex items-center gap-1"
              >
                <CheckCircle className="h-4 w-4" />
                Approve
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

export default SubmissionDetail;
