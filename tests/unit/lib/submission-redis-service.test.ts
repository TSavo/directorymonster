import { SubmissionRedisService } from '@/lib/submission-redis-service';
import { Submission, SubmissionStatus } from '@/types/submission';
import { redisClient } from '@/lib/redis';

// Mock Redis client
jest.mock('@/lib/redis', () => ({
  redisClient: {
    hSet: jest.fn(),
    hGet: jest.fn(),
    hGetAll: jest.fn(),
    hDel: jest.fn(),
    exists: jest.fn(),
    keys: jest.fn()
  }
}));

describe('SubmissionRedisService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSubmission: Submission = {
    id: 'sub-123',
    siteId: 'site-123',
    tenantId: 'tenant-123',
    title: 'Test Submission',
    description: 'This is a test submission',
    categoryId: 'cat-123',
    status: SubmissionStatus.PENDING,
    userId: 'user-123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  describe('createSubmission', () => {
    it('should create a new submission in Redis', async () => {
      // Arrange
      (redisClient.hSet as jest.Mock).mockResolvedValue(1);

      // Act
      const result = await SubmissionRedisService.createSubmission(mockSubmission);

      // Assert
      expect(redisClient.hSet).toHaveBeenCalledWith(
        `site:${mockSubmission.siteId}:submissions`,
        expect.any(String),
        expect.any(String)
      );
      expect(result).toEqual(expect.objectContaining({
        id: expect.any(String),
        siteId: mockSubmission.siteId,
        tenantId: mockSubmission.tenantId,
        title: mockSubmission.title,
        status: SubmissionStatus.PENDING
      }));
    });
  });

  describe('getSubmission', () => {
    it('should retrieve a submission from Redis by ID', async () => {
      // Arrange
      const submissionJson = JSON.stringify(mockSubmission);
      (redisClient.hGet as jest.Mock).mockResolvedValue(submissionJson);

      // Act
      const result = await SubmissionRedisService.getSubmission(mockSubmission.siteId, mockSubmission.id);

      // Assert
      expect(redisClient.hGet).toHaveBeenCalledWith(
        `site:${mockSubmission.siteId}:submissions`,
        mockSubmission.id
      );
      expect(result).toEqual(mockSubmission);
    });

    it('should return null if submission does not exist', async () => {
      // Arrange
      (redisClient.hGet as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await SubmissionRedisService.getSubmission(mockSubmission.siteId, 'non-existent-id');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getSubmissionsBySite', () => {
    it('should retrieve all submissions for a site', async () => {
      // Arrange
      const submissions = {
        'sub-123': JSON.stringify(mockSubmission),
        'sub-456': JSON.stringify({...mockSubmission, id: 'sub-456', title: 'Another Submission'})
      };
      (redisClient.hGetAll as jest.Mock).mockResolvedValue(submissions);

      // Act
      const result = await SubmissionRedisService.getSubmissionsBySite(mockSubmission.siteId);

      // Assert
      expect(redisClient.hGetAll).toHaveBeenCalledWith(
        `site:${mockSubmission.siteId}:submissions`
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockSubmission);
      expect(result[1].id).toBe('sub-456');
    });

    it('should return an empty array if no submissions exist', async () => {
      // Arrange
      (redisClient.hGetAll as jest.Mock).mockResolvedValue({});

      // Act
      const result = await SubmissionRedisService.getSubmissionsBySite(mockSubmission.siteId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('updateSubmission', () => {
    it('should update an existing submission', async () => {
      // Arrange
      const existingSubmission = {...mockSubmission};
      const updatedData = {
        title: 'Updated Title',
        description: 'Updated description'
      };
      const expectedSubmission = {
        ...existingSubmission,
        ...updatedData,
        updatedAt: expect.any(String)
      };

      (redisClient.hGet as jest.Mock).mockResolvedValue(JSON.stringify(existingSubmission));
      (redisClient.hSet as jest.Mock).mockResolvedValue(1);

      // Act
      const result = await SubmissionRedisService.updateSubmission(
        mockSubmission.siteId,
        mockSubmission.id,
        updatedData
      );

      // Assert
      expect(redisClient.hGet).toHaveBeenCalledWith(
        `site:${mockSubmission.siteId}:submissions`,
        mockSubmission.id
      );
      expect(redisClient.hSet).toHaveBeenCalledWith(
        `site:${mockSubmission.siteId}:submissions`,
        mockSubmission.id,
        expect.any(String)
      );
      expect(result).toEqual(expect.objectContaining({
        id: mockSubmission.id,
        title: updatedData.title,
        description: updatedData.description
      }));
    });

    it('should throw an error if submission does not exist', async () => {
      // Arrange
      (redisClient.hGet as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        SubmissionRedisService.updateSubmission('site-123', 'non-existent-id', { title: 'New Title' })
      ).rejects.toThrow('Submission not found');
    });
  });

  describe('deleteSubmission', () => {
    it('should delete a submission', async () => {
      // Arrange
      (redisClient.hDel as jest.Mock).mockResolvedValue(1);

      // Act
      await SubmissionRedisService.deleteSubmission(mockSubmission.siteId, mockSubmission.id);

      // Assert
      expect(redisClient.hDel).toHaveBeenCalledWith(
        `site:${mockSubmission.siteId}:submissions`,
        mockSubmission.id
      );
    });
  });

  describe('approveSubmission', () => {
    it('should approve a submission and update its status', async () => {
      // Arrange
      const existingSubmission = {...mockSubmission};
      const reviewerId = 'reviewer-123';
      const reviewNotes = 'Looks good!';
      
      (redisClient.hGet as jest.Mock).mockResolvedValue(JSON.stringify(existingSubmission));
      (redisClient.hSet as jest.Mock).mockResolvedValue(1);

      // Act
      const result = await SubmissionRedisService.approveSubmission(
        mockSubmission.siteId,
        mockSubmission.id,
        reviewerId,
        reviewNotes
      );

      // Assert
      expect(redisClient.hGet).toHaveBeenCalledWith(
        `site:${mockSubmission.siteId}:submissions`,
        mockSubmission.id
      );
      expect(redisClient.hSet).toHaveBeenCalledWith(
        `site:${mockSubmission.siteId}:submissions`,
        mockSubmission.id,
        expect.any(String)
      );
      expect(result).toEqual(expect.objectContaining({
        id: mockSubmission.id,
        status: SubmissionStatus.APPROVED,
        reviewerId,
        reviewNotes,
        reviewedAt: expect.any(String)
      }));
    });
  });

  describe('rejectSubmission', () => {
    it('should reject a submission and update its status', async () => {
      // Arrange
      const existingSubmission = {...mockSubmission};
      const reviewerId = 'reviewer-123';
      const reviewNotes = 'Needs improvement';
      
      (redisClient.hGet as jest.Mock).mockResolvedValue(JSON.stringify(existingSubmission));
      (redisClient.hSet as jest.Mock).mockResolvedValue(1);

      // Act
      const result = await SubmissionRedisService.rejectSubmission(
        mockSubmission.siteId,
        mockSubmission.id,
        reviewerId,
        reviewNotes
      );

      // Assert
      expect(redisClient.hGet).toHaveBeenCalledWith(
        `site:${mockSubmission.siteId}:submissions`,
        mockSubmission.id
      );
      expect(redisClient.hSet).toHaveBeenCalledWith(
        `site:${mockSubmission.siteId}:submissions`,
        mockSubmission.id,
        expect.any(String)
      );
      expect(result).toEqual(expect.objectContaining({
        id: mockSubmission.id,
        status: SubmissionStatus.REJECTED,
        reviewerId,
        reviewNotes,
        reviewedAt: expect.any(String)
      }));
    });
  });
});
