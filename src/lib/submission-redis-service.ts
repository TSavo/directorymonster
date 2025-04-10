/**
 * SubmissionRedisService
 * 
 * This service provides methods for managing submissions using Redis
 * for persistence at the site level.
 */

import { redisClient } from '@/lib/redis';
import { Submission, SubmissionStatus } from '@/types/submission';
import { v4 as uuidv4 } from 'uuid';

export class SubmissionRedisService {
  /**
   * Create a new submission
   * 
   * @param submission - The submission data
   * @returns The created submission
   */
  static async createSubmission(submission: Submission): Promise<Submission> {
    // Generate ID if not provided
    const id = submission.id || `sub-${uuidv4()}`;
    
    // Set default status if not provided
    const status = submission.status || SubmissionStatus.PENDING;
    
    // Set timestamps
    const now = new Date().toISOString();
    
    // Create the submission object
    const newSubmission: Submission = {
      ...submission,
      id,
      status,
      createdAt: submission.createdAt || now,
      updatedAt: now
    };
    
    // Store in Redis
    const key = `site:${submission.siteId}:submissions`;
    await redisClient.hSet(key, id, JSON.stringify(newSubmission));
    
    return newSubmission;
  }
  
  /**
   * Get a submission by ID
   * 
   * @param siteId - The site ID
   * @param id - The submission ID
   * @returns The submission or null if not found
   */
  static async getSubmission(siteId: string, id: string): Promise<Submission | null> {
    const key = `site:${siteId}:submissions`;
    const submissionJson = await redisClient.hGet(key, id);
    
    if (!submissionJson) {
      return null;
    }
    
    return JSON.parse(submissionJson);
  }
  
  /**
   * Get all submissions for a site
   * 
   * @param siteId - The site ID
   * @returns An array of submissions
   */
  static async getSubmissionsBySite(siteId: string): Promise<Submission[]> {
    const key = `site:${siteId}:submissions`;
    const submissionsMap = await redisClient.hGetAll(key);
    
    if (!submissionsMap || Object.keys(submissionsMap).length === 0) {
      return [];
    }
    
    return Object.values(submissionsMap).map(json => JSON.parse(json));
  }
  
  /**
   * Update a submission
   * 
   * @param siteId - The site ID
   * @param id - The submission ID
   * @param data - The update data
   * @returns The updated submission
   */
  static async updateSubmission(siteId: string, id: string, data: Partial<Submission>): Promise<Submission> {
    // Get the existing submission
    const submission = await this.getSubmission(siteId, id);
    
    if (!submission) {
      throw new Error('Submission not found');
    }
    
    // Update the submission
    const updatedSubmission: Submission = {
      ...submission,
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    // Store in Redis
    const key = `site:${siteId}:submissions`;
    await redisClient.hSet(key, id, JSON.stringify(updatedSubmission));
    
    return updatedSubmission;
  }
  
  /**
   * Delete a submission
   * 
   * @param siteId - The site ID
   * @param id - The submission ID
   */
  static async deleteSubmission(siteId: string, id: string): Promise<void> {
    const key = `site:${siteId}:submissions`;
    await redisClient.hDel(key, id);
  }
  
  /**
   * Approve a submission
   * 
   * @param siteId - The site ID
   * @param id - The submission ID
   * @param reviewerId - The reviewer's user ID
   * @param reviewNotes - Optional review notes
   * @returns The approved submission
   */
  static async approveSubmission(siteId: string, id: string, reviewerId: string, reviewNotes?: string): Promise<Submission> {
    return this.updateSubmission(siteId, id, {
      status: SubmissionStatus.APPROVED,
      reviewerId,
      reviewNotes,
      reviewedAt: new Date().toISOString()
    });
  }
  
  /**
   * Reject a submission
   * 
   * @param siteId - The site ID
   * @param id - The submission ID
   * @param reviewerId - The reviewer's user ID
   * @param reviewNotes - Optional review notes
   * @returns The rejected submission
   */
  static async rejectSubmission(siteId: string, id: string, reviewerId: string, reviewNotes?: string): Promise<Submission> {
    return this.updateSubmission(siteId, id, {
      status: SubmissionStatus.REJECTED,
      reviewerId,
      reviewNotes,
      reviewedAt: new Date().toISOString()
    });
  }
}
