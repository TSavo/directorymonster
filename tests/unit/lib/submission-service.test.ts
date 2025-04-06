import { SubmissionService } from '@/lib/submission-service';
import { db } from '@/lib/db';

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    submission: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    }
  }
}));

const mockDb = jest.mocked(db);

describe('SubmissionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSubmissions', () => {
    it('should return submissions for a tenant with pagination', async () => {
      // Arrange
      const tenantId = 'tenant-123';
      const page = 1;
      const limit = 10;
      const mockSubmissions = [
        { id: 'sub-1', title: 'Submission 1', tenantId },
        { id: 'sub-2', title: 'Submission 2', tenantId }
      ];
      const mockCount = 2;

      mockDb.submission.findMany.mockResolvedValue(mockSubmissions);
      mockDb.submission.count.mockResolvedValue(mockCount);

      // Act
      const result = await SubmissionService.getSubmissions(tenantId, { page, limit });

      // Assert
      expect(mockDb.submission.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object)
      });
      expect(mockDb.submission.count).toHaveBeenCalledWith({
        where: { tenantId }
      });
      expect(result).toEqual({
        submissions: mockSubmissions,
        pagination: {
          page,
          limit,
          totalItems: mockCount,
          totalPages: 1
        }
      });
    });

    it('should apply status filter when provided', async () => {
      // Arrange
      const tenantId = 'tenant-123';
      const status = 'pending';
      const mockSubmissions = [
        { id: 'sub-1', title: 'Submission 1', tenantId, status }
      ];

      (db.submission.findMany as jest.Mock).mockResolvedValue(mockSubmissions);
      (db.submission.count as jest.Mock).mockResolvedValue(1);

      // Act
      await SubmissionService.getSubmissions(tenantId, { status });

      // Assert
      expect(db.submission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId, status }
        })
      );
    });

    it('should apply categoryId filter when provided', async () => {
      // Arrange
      const tenantId = 'tenant-123';
      const categoryId = 'cat-1';
      const mockSubmissions = [
        { id: 'sub-1', title: 'Submission 1', tenantId, categoryId }
      ];

      (db.submission.findMany as jest.Mock).mockResolvedValue(mockSubmissions);
      (db.submission.count as jest.Mock).mockResolvedValue(1);

      // Act
      await SubmissionService.getSubmissions(tenantId, { categoryId });

      // Assert
      expect(db.submission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId, categoryId }
        })
      );
    });
  });

  describe('getSubmissionById', () => {
    it('should return a submission by ID', async () => {
      // Arrange
      const id = 'sub-1';
      const tenantId = 'tenant-123';
      const mockSubmission = { id, title: 'Submission 1', tenantId };

      (db.submission.findUnique as jest.Mock).mockResolvedValue(mockSubmission);

      // Act
      const result = await SubmissionService.getSubmissionById(id, tenantId);

      // Assert
      expect(db.submission.findUnique).toHaveBeenCalledWith({
        where: { id, tenantId },
        include: expect.any(Object)
      });
      expect(result).toEqual(mockSubmission);
    });

    it('should return null if submission not found', async () => {
      // Arrange
      const id = 'non-existent';
      const tenantId = 'tenant-123';

      (db.submission.findUnique as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await SubmissionService.getSubmissionById(id, tenantId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('createSubmission', () => {
    it('should create a new submission', async () => {
      // Arrange
      const submissionData = {
        title: 'New Submission',
        description: 'Test description',
        categoryId: 'cat-1',
        tenantId: 'tenant-123',
        userId: 'user-1',
        status: 'pending'
      };
      const mockSubmission = { id: 'sub-1', ...submissionData };

      (db.submission.create as jest.Mock).mockResolvedValue(mockSubmission);

      // Act
      const result = await SubmissionService.createSubmission(submissionData);

      // Assert
      expect(db.submission.create).toHaveBeenCalledWith({
        data: submissionData,
        include: expect.any(Object)
      });
      expect(result).toEqual(mockSubmission);
    });
  });

  describe('updateSubmission', () => {
    it('should update an existing submission', async () => {
      // Arrange
      const id = 'sub-1';
      const tenantId = 'tenant-123';
      const updateData = {
        title: 'Updated Submission',
        status: 'approved'
      };
      const mockSubmission = { id, ...updateData, tenantId };

      (db.submission.update as jest.Mock).mockResolvedValue(mockSubmission);

      // Act
      const result = await SubmissionService.updateSubmission(id, tenantId, updateData);

      // Assert
      expect(db.submission.update).toHaveBeenCalledWith({
        where: { id, tenantId },
        data: updateData,
        include: expect.any(Object)
      });
      expect(result).toEqual(mockSubmission);
    });
  });

  describe('deleteSubmission', () => {
    it('should delete a submission', async () => {
      // Arrange
      const id = 'sub-1';
      const tenantId = 'tenant-123';
      const mockSubmission = { id, title: 'Submission 1', tenantId };

      (db.submission.delete as jest.Mock).mockResolvedValue(mockSubmission);

      // Act
      const result = await SubmissionService.deleteSubmission(id, tenantId);

      // Assert
      expect(db.submission.delete).toHaveBeenCalledWith({
        where: { id, tenantId }
      });
      expect(result).toEqual(mockSubmission);
    });
  });

  describe('approveSubmission', () => {
    it('should approve a submission', async () => {
      // Arrange
      const id = 'sub-1';
      const tenantId = 'tenant-123';
      const reviewerId = 'user-2';
      const reviewNotes = 'Looks good!';
      const mockSubmission = {
        id,
        title: 'Submission 1',
        tenantId,
        status: 'approved',
        reviewerId,
        reviewNotes,
        reviewedAt: expect.any(Date)
      };

      (db.submission.update as jest.Mock).mockResolvedValue(mockSubmission);

      // Act
      const result = await SubmissionService.approveSubmission(id, tenantId, reviewerId, reviewNotes);

      // Assert
      expect(db.submission.update).toHaveBeenCalledWith({
        where: { id, tenantId },
        data: {
          status: 'approved',
          reviewerId,
          reviewNotes,
          reviewedAt: expect.any(Date)
        },
        include: expect.any(Object)
      });
      expect(result).toEqual(mockSubmission);
    });
  });

  describe('rejectSubmission', () => {
    it('should reject a submission', async () => {
      // Arrange
      const id = 'sub-1';
      const tenantId = 'tenant-123';
      const reviewerId = 'user-2';
      const reviewNotes = 'Needs improvement';
      const mockSubmission = {
        id,
        title: 'Submission 1',
        tenantId,
        status: 'rejected',
        reviewerId,
        reviewNotes,
        reviewedAt: expect.any(Date)
      };

      (db.submission.update as jest.Mock).mockResolvedValue(mockSubmission);

      // Act
      const result = await SubmissionService.rejectSubmission(id, tenantId, reviewerId, reviewNotes);

      // Assert
      expect(db.submission.update).toHaveBeenCalledWith({
        where: { id, tenantId },
        data: {
          status: 'rejected',
          reviewerId,
          reviewNotes,
          reviewedAt: expect.any(Date)
        },
        include: expect.any(Object)
      });
      expect(result).toEqual(mockSubmission);
    });
  });
});
