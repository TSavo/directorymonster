import { apiRequest, apiGet, apiPost, apiPut, apiDelete, apiPatch } from '../../src/lib/api-client';
import { fetchWithRetry } from '../../src/utils/api';

// Mock the fetchWithRetry function
jest.mock('../../src/utils/api', () => ({
  fetchWithRetry: jest.fn()
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
    removeItem: (key: string) => { delete store[key]; }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('API Client', () => {
  beforeEach(() => {
    // Reset mocks and localStorage
    jest.clearAllMocks();
    localStorageMock.clear();
    
    // Mock fetchWithRetry to return a successful response
    (fetchWithRetry as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });
  });
  
  describe('apiRequest', () => {
    it('should make a request without context when includeContext is false', async () => {
      // Set tenant and site in localStorage
      localStorageMock.setItem('currentTenantId', 'tenant-1');
      localStorageMock.setItem('tenant-1_currentSiteId', 'site-1');
      
      // Make request with includeContext=false
      await apiRequest('/api/test', { includeContext: false });
      
      // Verify that fetchWithRetry was called without tenant and site headers
      expect(fetchWithRetry).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        headers: expect.any(Headers)
      }));
      
      const headers = (fetchWithRetry as jest.Mock).mock.calls[0][1].headers;
      expect(headers.has('x-tenant-id')).toBe(false);
      expect(headers.has('x-site-id')).toBe(false);
    });
    
    it('should include tenant and site context in headers when available', async () => {
      // Set tenant and site in localStorage
      localStorageMock.setItem('currentTenantId', 'tenant-1');
      localStorageMock.setItem('tenant-1_currentSiteId', 'site-1');
      
      // Make request
      await apiRequest('/api/test');
      
      // Verify that fetchWithRetry was called with tenant and site headers
      expect(fetchWithRetry).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        headers: expect.any(Headers)
      }));
      
      const headers = (fetchWithRetry as jest.Mock).mock.calls[0][1].headers;
      expect(headers.get('x-tenant-id')).toBe('tenant-1');
      expect(headers.get('x-site-id')).toBe('site-1');
    });
    
    it('should not include site context when not available', async () => {
      // Set only tenant in localStorage
      localStorageMock.setItem('currentTenantId', 'tenant-1');
      
      // Make request
      await apiRequest('/api/test');
      
      // Verify that fetchWithRetry was called with tenant header but no site header
      const headers = (fetchWithRetry as jest.Mock).mock.calls[0][1].headers;
      expect(headers.get('x-tenant-id')).toBe('tenant-1');
      expect(headers.has('x-site-id')).toBe(false);
    });
    
    it('should not include tenant context when not available', async () => {
      // Make request with no context in localStorage
      await apiRequest('/api/test');
      
      // Verify that fetchWithRetry was called without tenant and site headers
      const headers = (fetchWithRetry as jest.Mock).mock.calls[0][1].headers;
      expect(headers.has('x-tenant-id')).toBe(false);
      expect(headers.has('x-site-id')).toBe(false);
    });
    
    it('should pass retry options to fetchWithRetry', async () => {
      // Make request with retry options
      await apiRequest('/api/test', {
        retryOptions: {
          maxRetries: 5,
          initialDelay: 100,
          maxDelay: 1000,
          backoffFactor: 1.5
        }
      });
      
      // Verify that fetchWithRetry was called with retry options
      expect(fetchWithRetry).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        retryOptions: {
          maxRetries: 5,
          initialDelay: 100,
          maxDelay: 1000,
          backoffFactor: 1.5
        }
      }));
    });
  });
  
  describe('apiGet', () => {
    it('should make a GET request', async () => {
      // Make GET request
      await apiGet('/api/test');
      
      // Verify that fetchWithRetry was called with GET method
      expect(fetchWithRetry).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        method: 'GET'
      }));
    });
  });
  
  describe('apiPost', () => {
    it('should make a POST request with JSON data', async () => {
      // Make POST request with data
      const data = { name: 'Test', value: 123 };
      await apiPost('/api/test', data);
      
      // Verify that fetchWithRetry was called with POST method and JSON data
      expect(fetchWithRetry).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        method: 'POST',
        headers: expect.any(Headers),
        body: JSON.stringify(data)
      }));
      
      const headers = (fetchWithRetry as jest.Mock).mock.calls[0][1].headers;
      expect(headers.get('Content-Type')).toBe('application/json');
    });
  });
  
  describe('apiPut', () => {
    it('should make a PUT request with JSON data', async () => {
      // Make PUT request with data
      const data = { name: 'Test', value: 123 };
      await apiPut('/api/test', data);
      
      // Verify that fetchWithRetry was called with PUT method and JSON data
      expect(fetchWithRetry).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        method: 'PUT',
        headers: expect.any(Headers),
        body: JSON.stringify(data)
      }));
      
      const headers = (fetchWithRetry as jest.Mock).mock.calls[0][1].headers;
      expect(headers.get('Content-Type')).toBe('application/json');
    });
  });
  
  describe('apiDelete', () => {
    it('should make a DELETE request', async () => {
      // Make DELETE request
      await apiDelete('/api/test');
      
      // Verify that fetchWithRetry was called with DELETE method
      expect(fetchWithRetry).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        method: 'DELETE'
      }));
    });
  });
  
  describe('apiPatch', () => {
    it('should make a PATCH request with JSON data', async () => {
      // Make PATCH request with data
      const data = { name: 'Test', value: 123 };
      await apiPatch('/api/test', data);
      
      // Verify that fetchWithRetry was called with PATCH method and JSON data
      expect(fetchWithRetry).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        method: 'PATCH',
        headers: expect.any(Headers),
        body: JSON.stringify(data)
      }));
      
      const headers = (fetchWithRetry as jest.Mock).mock.calls[0][1].headers;
      expect(headers.get('Content-Type')).toBe('application/json');
    });
  });
});
