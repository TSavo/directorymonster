import { setupMocks, mockUser, mockTenant } from './setup';

describe('Permission Guard - Setup', () => {
  it('should setup mocks correctly', () => {
    // Call the setup function
    setupMocks();
    
    // Verify the mock data
    expect(mockUser).toBeDefined();
    expect(mockUser.id).toBe('user-123');
    expect(mockTenant).toBeDefined();
    expect(mockTenant.id).toBe('tenant-456');
  });
});
