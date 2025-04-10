// Mock for extractUserIdFromRequest function
import { NextRequest } from 'next/server';

// Create mock function
export const mockExtractUserIdFromRequest = jest.fn().mockImplementation((req: NextRequest, secret: string) => {
  // Always return a valid user ID for testing
  return 'user-123';
});

export default mockExtractUserIdFromRequest;
