/**
 * Submission Type Definition
 *
 * This file provides the type definition for submissions, which are
 * user-contributed content that goes through an approval process
 * before becoming published listings.
 */

import { Listing, ListingStatus, ValidationResult, ListingMedia, createSlug } from './listing';

/**
 * Submission status enum
 */
export enum SubmissionStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  CHANGES_REQUESTED = 'changes_requested',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

/**
 * Main Submission interface
 */
export interface Submission {
  id: string;
  siteId: string;
  tenantId: string;
  title: string;
  description: string;
  content?: string;
  categoryIds: string[];
  status: SubmissionStatus | string;
  media?: ListingMedia[];
  userId: string;
  reviewerId?: string;
  reviewNotes?: string;
  reviewedAt?: string;
  customFields?: Record<string, unknown>;
  backlinkInfo?: {
    url: string;
    anchorText?: string;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Validates a submission object
 *
 * @param submission - The submission to validate
 * @returns A validation result object
 */
export function validateSubmission(submission: Submission): ValidationResult {
  const errors: string[] = [];

  // Check required fields
  if (!submission.siteId) {
    errors.push('siteId is required');
  }

  if (!submission.tenantId) {
    errors.push('tenantId is required');
  }

  if (!submission.title) {
    errors.push('title is required');
  }

  if (!submission.categoryIds || submission.categoryIds.length === 0) {
    errors.push('At least one categoryId is required');
  }

  if (!submission.userId) {
    errors.push('userId is required');
  }

  // Validate status
  const validStatuses = Object.values(SubmissionStatus);
  if (submission.status && !validStatuses.includes(submission.status as SubmissionStatus)) {
    errors.push(`status must be one of: ${validStatuses.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Transforms an approved submission into a listing
 *
 * @param submission - The approved submission to transform
 * @returns A listing object
 * @throws Error if the submission is not approved
 */
export function transformToListing(submission: Submission): Listing {
  // Ensure the submission is approved
  if (submission.status !== SubmissionStatus.APPROVED) {
    throw new Error('Only approved submissions can be transformed to listings');
  }

  // Create a new listing from the submission
  const now = new Date().toISOString();

  return {
    id: `listing-${Date.now()}`, // Generate a new ID
    siteId: submission.siteId,
    tenantId: submission.tenantId,
    title: submission.title,
    slug: createSlug(submission.title), // Use the createSlug function from listing.ts
    description: submission.description,
    content: submission.content,
    status: ListingStatus.PUBLISHED,
    categoryIds: submission.categoryIds,
    media: submission.media || [],
    backlinkInfo: submission.backlinkInfo ? {
      url: submission.backlinkInfo.url,
      anchorText: submission.backlinkInfo.anchorText,
      verified: false,
      status: 'pending'
    } : undefined,
    customFields: submission.customFields,
    submissionId: submission.id,
    userId: submission.userId,
    createdAt: now,
    updatedAt: now,
    publishedAt: now
  };
}

/**
 * Submission filters interface
 */
export interface SubmissionFilters {
  search?: string;
  status?: SubmissionStatus[];
  categoryIds?: string[];
  fromDate?: string;
  toDate?: string;
  userId?: string;
}

/**
 * Submission pagination interface
 */
export interface SubmissionPagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

/**
 * Submission API response
 */
export interface SubmissionApiResponse {
  data: Submission[];
  pagination: SubmissionPagination;
}