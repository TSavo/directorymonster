// Mock implementation of useAuth hook
export const useAuth = () => {
  return {
    user: { id: 'test-user', name: 'Test User', email: 'test@example.com', role: 'admin' },
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn()
  };
};

export default useAuth;
