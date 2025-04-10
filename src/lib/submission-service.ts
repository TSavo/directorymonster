import { db } from '@/lib/db';

interface SubmissionFilter {
  page?: number;
  limit?: number;
  status?: string;
  categoryId?: string;
}

export class SubmissionService {
  /**
   * Get submissions for a tenant with optional filtering and pagination
   * 
   * @param tenantId - The tenant ID
   * @param filter - Optional filter parameters
   * @returns Submissions and pagination metadata
   */
  static async getSubmissions(tenantId: string, filter: SubmissionFilter = {}) {
    const { page = 1, limit = 10, status, categoryId } = filter;
    const offset = (page - 1) * limit;
    
    // Prepare filter
    const where: any = { tenantId };
    
    if (status) {
      where.status = status;
    }
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    // Get submissions
    const submissions = await db.submission.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    // Get total count
    const totalItems = await db.submission.count({ where });
    
    return {
      submissions,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    };
  }
  
  /**
   * Get a submission by ID
   * 
   * @param id - The submission ID
   * @param tenantId - The tenant ID
   * @returns The submission or null if not found
   */
  static async getSubmissionById(id: string, tenantId: string) {
    return db.submission.findUnique({
      where: { id, tenantId },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }
  
  /**
   * Create a new submission
   * 
   * @param data - The submission data
   * @returns The created submission
   */
  static async createSubmission(data: any) {
    return db.submission.create({
      data,
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }
  
  /**
   * Update an existing submission
   * 
   * @param id - The submission ID
   * @param tenantId - The tenant ID
   * @param data - The update data
   * @returns The updated submission
   */
  static async updateSubmission(id: string, tenantId: string, data: any) {
    return db.submission.update({
      where: { id, tenantId },
      data,
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }
  
  /**
   * Delete a submission
   * 
   * @param id - The submission ID
   * @param tenantId - The tenant ID
   * @returns The deleted submission
   */
  static async deleteSubmission(id: string, tenantId: string) {
    return db.submission.delete({
      where: { id, tenantId }
    });
  }
  
  /**
   * Approve a submission
   * 
   * @param id - The submission ID
   * @param tenantId - The tenant ID
   * @param reviewerId - The reviewer's user ID
   * @param reviewNotes - Optional review notes
   * @returns The approved submission
   */
  static async approveSubmission(id: string, tenantId: string, reviewerId: string, reviewNotes?: string) {
    return db.submission.update({
      where: { id, tenantId },
      data: {
        status: 'approved',
        reviewerId,
        reviewNotes,
        reviewedAt: new Date()
      },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }
  
  /**
   * Reject a submission
   * 
   * @param id - The submission ID
   * @param tenantId - The tenant ID
   * @param reviewerId - The reviewer's user ID
   * @param reviewNotes - Optional review notes
   * @returns The rejected submission
   */
  static async rejectSubmission(id: string, tenantId: string, reviewerId: string, reviewNotes?: string) {
    return db.submission.update({
      where: { id, tenantId },
      data: {
        status: 'rejected',
        reviewerId,
        reviewNotes,
        reviewedAt: new Date()
      },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }
}
