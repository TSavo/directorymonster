import { Submission, SubmissionStatus, validateSubmission, transformToListing } from '@/types/submission';
import { Listing, ListingStatus } from '@/types/listing';

describe('Submission Type', () => {
  describe('SubmissionStatus enum', () => {
    it('should have the correct status values', () => {
      expect(SubmissionStatus.PENDING).toBe('pending');
      expect(SubmissionStatus.IN_REVIEW).toBe('in_review');
      expect(SubmissionStatus.CHANGES_REQUESTED).toBe('changes_requested');
      expect(SubmissionStatus.APPROVED).toBe('approved');
      expect(SubmissionStatus.REJECTED).toBe('rejected');
      expect(SubmissionStatus.WITHDRAWN).toBe('withdrawn');
    });
  });

  describe('validateSubmission', () => {
    it('should validate a valid submission', () => {
      const validSubmission: Submission = {
        id: 'sub-123',
        title: 'Test Submission',
        description: 'This is a test submission',
        categoryIds: ['cat-123'],
        siteId: 'site-123',
        tenantId: 'tenant-123',
        userId: 'user-123',
        status: SubmissionStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = validateSubmission(validSubmission);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject a submission without required fields', () => {
      const invalidSubmission = {
        id: 'sub-123',
        // Missing title
        description: 'This is a test submission',
        // Missing categoryIds
        siteId: 'site-123',
        tenantId: 'tenant-123',
        userId: 'user-123',
        status: SubmissionStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = validateSubmission(invalidSubmission as any);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('title is required');
      expect(result.errors).toContain('At least one categoryId is required');
    });

    it('should reject a submission with invalid status', () => {
      const invalidSubmission: Submission = {
        id: 'sub-123',
        title: 'Test Submission',
        description: 'This is a test submission',
        categoryIds: ['cat-123'],
        siteId: 'site-123',
        tenantId: 'tenant-123',
        userId: 'user-123',
        status: 'invalid-status' as any,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = validateSubmission(invalidSubmission);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('status must be one of: pending, in_review, changes_requested, approved, rejected, withdrawn');
    });
  });

  describe('transformToListing', () => {
    it('should transform a submission to a listing', () => {
      const submission: Submission = {
        id: 'sub-123',
        siteId: 'site-123',
        tenantId: 'tenant-123',
        title: 'Test Submission',
        description: 'This is a test submission',
        categoryIds: ['cat-123'],
        status: SubmissionStatus.APPROVED,
        media: [
          {
            id: 'media-1',
            url: 'https://example.com/image.jpg',
            type: 'image' as any,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isPrimary: true
          }
        ],
        userId: 'user-123',
        reviewerId: 'reviewer-123',
        reviewNotes: 'Looks good!',
        reviewedAt: new Date().toISOString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const listing = transformToListing(submission);

      // Check that the listing has the correct properties
      expect(listing.id).toBeDefined();
      expect(listing.siteId).toBe(submission.siteId);
      expect(listing.tenantId).toBe(submission.tenantId);
      expect(listing.title).toBe(submission.title);
      expect(listing.description).toBe(submission.description);
      expect(listing.categoryIds).toEqual(submission.categoryIds);
      expect(listing.status).toBe(ListingStatus.PUBLISHED);
      expect(listing.media).toEqual(submission.media);
      expect(listing.userId).toBe(submission.userId);
      expect(listing.createdAt).toBeDefined();
      expect(listing.updatedAt).toBeDefined();
      expect(listing.publishedAt).toBeDefined();
    });

    it('should only transform approved submissions', () => {
      const pendingSubmission: Submission = {
        id: 'sub-123',
        siteId: 'site-123',
        tenantId: 'tenant-123',
        title: 'Test Submission',
        description: 'This is a test submission',
        categoryIds: ['cat-123'],
        status: SubmissionStatus.PENDING,
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(() => transformToListing(pendingSubmission)).toThrow(
        'Only approved submissions can be transformed to listings'
      );
    });
  });
});
