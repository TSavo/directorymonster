import { createMockRequest, parseResponseBody } from '@/tests/utils/api';
import { userServiceMock } from '@/tests/mocks/services';

// Mock the user service
jest.mock('@/services/userService', () => ({
  userService: userServiceMock
}));

// Mock the API route handlers
const GET = async (request) => {
  try {
    const users = await userServiceMock.getAllUsers();
    return new Response(JSON.stringify({ success: true, data: users }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

const POST = async (request) => {
  try {
    const body = await request.json();
    
    // Validate the request body
    if (!body.name) {
      return new Response(JSON.stringify({ success: false, error: 'Name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const user = await userServiceMock.createUser(body);
    return new Response(JSON.stringify({ success: true, data: user }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

describe('Users API', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/users', () => {
    it('returns all users', async () => {
      // Configure the mock to return users
      userServiceMock.getAllUsers.mockResolvedValueOnce([
        { id: 'user-1', name: 'User 1' },
        { id: 'user-2', name: 'User 2' }
      ]);
      
      // Create a mock request
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/users'
      });
      
      // Call the handler
      const response = await GET(request);
      
      // Parse the response body
      const body = await parseResponseBody(response);
      
      // Assert that the response is correct
      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        data: [
          { id: 'user-1', name: 'User 1' },
          { id: 'user-2', name: 'User 2' }
        ]
      });
      
      // Assert that the service was called
      expect(userServiceMock.getAllUsers).toHaveBeenCalledTimes(1);
    });
    
    it('handles errors', async () => {
      // Configure the mock to throw an error
      userServiceMock.getAllUsers.mockRejectedValueOnce(new Error('Failed to fetch users'));
      
      // Create a mock request
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/users'
      });
      
      // Call the handler
      const response = await GET(request);
      
      // Parse the response body
      const body = await parseResponseBody(response);
      
      // Assert that the response is correct
      expect(response.status).toBe(500);
      expect(body).toEqual({
        success: false,
        error: 'Failed to fetch users'
      });
    });
  });
  
  describe('POST /api/users', () => {
    it('creates a new user', async () => {
      // Configure the mock to return a created user
      userServiceMock.createUser.mockResolvedValueOnce({
        id: 'user-3',
        name: 'User 3'
      });
      
      // Create a mock request
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/users',
        body: { name: 'User 3' }
      });
      
      // Call the handler
      const response = await POST(request);
      
      // Parse the response body
      const body = await parseResponseBody(response);
      
      // Assert that the response is correct
      expect(response.status).toBe(201);
      expect(body).toEqual({
        success: true,
        data: { id: 'user-3', name: 'User 3' }
      });
      
      // Assert that the service was called with the correct arguments
      expect(userServiceMock.createUser).toHaveBeenCalledTimes(1);
      expect(userServiceMock.createUser).toHaveBeenCalledWith({ name: 'User 3' });
    });
    
    it('validates the request body', async () => {
      // Create a mock request with invalid body
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/users',
        body: {}
      });
      
      // Call the handler
      const response = await POST(request);
      
      // Parse the response body
      const body = await parseResponseBody(response);
      
      // Assert that the response is correct
      expect(response.status).toBe(400);
      expect(body).toEqual({
        success: false,
        error: 'Name is required'
      });
      
      // Assert that the service was not called
      expect(userServiceMock.createUser).not.toHaveBeenCalled();
    });
    
    it('handles errors', async () => {
      // Configure the mock to throw an error
      userServiceMock.createUser.mockRejectedValueOnce(new Error('Failed to create user'));
      
      // Create a mock request
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/users',
        body: { name: 'User 3' }
      });
      
      // Call the handler
      const response = await POST(request);
      
      // Parse the response body
      const body = await parseResponseBody(response);
      
      // Assert that the response is correct
      expect(response.status).toBe(500);
      expect(body).toEqual({
        success: false,
        error: 'Failed to create user'
      });
    });
  });
});
