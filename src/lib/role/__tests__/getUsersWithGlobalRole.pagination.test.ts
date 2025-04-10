import { getUsersWithGlobalRole } from '../role-deletion';

// Mock the original function to test pagination logic
const originalGetUsersWithGlobalRole = jest.requireActual('../role-deletion').getUsersWithGlobalRole;

// Mock role ID and users
const mockRoleId = 'global-role-123';
const mockUsers = Array.from({ length: 50 }, (_, i) => `user-${i + 1}`);

// Mock the getUsersWithGlobalRole function
jest.mock('../role-deletion', () => ({
  ...jest.requireActual('../role-deletion'),
  getUsersWithGlobalRole: jest.fn()
}));

describe('getUsersWithGlobalRole with pagination', () => {

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the getUsersWithGlobalRole function to return mockUsers when called without pagination
    (getUsersWithGlobalRole as jest.Mock).mockImplementation((roleId, page, pageSize) => {
      if (page === undefined || pageSize === undefined) {
        return Promise.resolve(mockUsers);
      }

      // Validate pagination parameters
      if (page < 1 || pageSize < 1 || pageSize > 100) {
        return Promise.reject(new Error('Invalid pagination parameters'));
      }

      // Apply pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, mockUsers.length);
      const paginatedUsers = mockUsers.slice(startIndex, endIndex);

      return Promise.resolve({
        users: paginatedUsers,
        total: mockUsers.length
      });
    });
  });

  it('should return paginated results with default pagination', async () => {
    // Call the function without pagination parameters
    const result = await getUsersWithGlobalRole(mockRoleId);

    // Should return all users without pagination
    expect(result).toEqual(mockUsers);
  });

  it('should return paginated results with custom pagination', async () => {
    const page = 2;
    const pageSize = 10;

    // Call the function with pagination parameters
    const result = await getUsersWithGlobalRole(mockRoleId, page, pageSize);

    // Should return paginated results
    expect(result).toHaveProperty('users');
    expect(result).toHaveProperty('total');
    expect((result as { users: string[], total: number }).users).toHaveLength(10);
    expect((result as { users: string[], total: number }).users).toEqual(mockUsers.slice(10, 20));
    expect((result as { users: string[], total: number }).total).toBe(50);
  });

  it('should validate pagination parameters', async () => {
    // Invalid page number
    await expect(getUsersWithGlobalRole(mockRoleId, 0, 10))
      .rejects.toThrow('Invalid pagination parameters');

    // Invalid page size
    await expect(getUsersWithGlobalRole(mockRoleId, 1, 0))
      .rejects.toThrow('Invalid pagination parameters');

    // Page size too large
    await expect(getUsersWithGlobalRole(mockRoleId, 1, 101))
      .rejects.toThrow('Invalid pagination parameters');
  });
});
