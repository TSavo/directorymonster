/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react-hooks';
import { useDomainVerification } from '@/components/admin/sites/hooks/useDomainVerification';

// Mock fetch
global.fetch = jest.fn();

describe('useDomainVerification Integration Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should handle the complete verification flow', async () => {
    // Mock successful verification
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        verified: true,
        message: 'Domain verified successfully'
      })
    });

    const { result, waitForNextUpdate } = renderHook(() =>
      useDomainVerification({
        siteSlug: 'test-site',
        initialStatuses: [
          { domain: 'example.com', status: 'pending' }
        ]
      })
    );

    // Initial state check
    expect(result.current.verificationStatuses).toEqual([
      { domain: 'example.com', status: 'pending' }
    ]);
    expect(result.current.isVerifying).toEqual({});
    expect(result.current.error).toBeNull();

    // Verify a domain
    act(() => {
      result.current.verifyDomain('example.com');
    });

    // Check that isVerifying is set
    expect(result.current.isVerifying['example.com']).toBe(true);

    // Wait for the verification to complete
    await waitForNextUpdate();

    // Check that the domain was verified
    expect(result.current.verificationStatuses).toEqual([
      {
        domain: 'example.com',
        status: 'verified',
        errors: undefined
      }
    ]);

    // Check that isVerifying is reset
    expect(result.current.isVerifying['example.com']).toBe(false);

    // Check that the API was called with the correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/sites/test-site/domains/verify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ domain: 'example.com' })
      }
    );

    // Verify a new domain
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: false,
        verified: false,
        errors: ['A record is not correctly configured']
      })
    });

    act(() => {
      result.current.verifyDomain('newdomain.com');
    });

    // Wait for the verification to complete
    await waitForNextUpdate();

    // Check that the new domain verification failed
    expect(result.current.verificationStatuses).toContainEqual({
      domain: 'example.com',
      status: 'verified',
      errors: undefined
    });

    expect(result.current.verificationStatuses).toContainEqual(expect.objectContaining({
      domain: 'newdomain.com',
      status: 'failed'
    }));

    // Check that the API was called with the correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/sites/test-site/domains/verify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ domain: 'newdomain.com' })
      }
    );

    // Verify the same domain again
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        verified: true,
        message: 'Domain verified successfully'
      })
    });

    act(() => {
      result.current.verifyDomain('newdomain.com');
    });

    // Wait for the verification to complete
    await waitForNextUpdate();

    // Check that the domain status was updated
    expect(result.current.verificationStatuses).toEqual([
      {
        domain: 'example.com',
        status: 'verified',
        errors: undefined
      },
      {
        domain: 'newdomain.com',
        status: 'verified',
        errors: undefined
      }
    ]);

    // Test getDomainStatus
    expect(result.current.getDomainStatus('example.com')).toEqual({
      domain: 'example.com',
      status: 'verified',
      errors: undefined
    });

    expect(result.current.getDomainStatus('newdomain.com')).toEqual({
      domain: 'newdomain.com',
      status: 'verified',
      errors: undefined
    });

    expect(result.current.getDomainStatus('nonexistent.com')).toBeNull();

    // Test isDomainVerifying
    expect(result.current.isDomainVerifying('example.com')).toBe(false);
    expect(result.current.isDomainVerifying('newdomain.com')).toBe(false);
    expect(result.current.isDomainVerifying('nonexistent.com')).toBe(false);

    // Test API error handling
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    act(() => {
      result.current.verifyDomain('error.com');
    });

    // Wait for the verification to complete
    await waitForNextUpdate();

    // Check that the error is set
    expect(result.current.error).toBe('Network error');

    // Check that the domain verification failed
    expect(result.current.verificationStatuses).toEqual([
      {
        domain: 'example.com',
        status: 'verified',
        errors: undefined
      },
      {
        domain: 'newdomain.com',
        status: 'verified',
        errors: undefined
      },
      {
        domain: 'error.com',
        status: 'failed'
      }
    ]);
  });

  it('should handle custom API endpoint', async () => {
    // Mock successful verification
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        verified: true,
        message: 'Domain verified successfully'
      })
    });

    const { result, waitForNextUpdate } = renderHook(() =>
      useDomainVerification({
        siteSlug: 'test-site',
        apiEndpoint: '/custom/api/endpoint'
      })
    );

    // Verify a domain
    act(() => {
      result.current.verifyDomain('example.com');
    });

    // Wait for the verification to complete
    await waitForNextUpdate();

    // Check that the API was called with the custom endpoint
    expect(global.fetch).toHaveBeenCalledWith(
      '/custom/api/endpoint',
      expect.any(Object)
    );
  });

  it('should handle server error responses', async () => {
    // Mock server error
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.resolve({
        error: 'Server error'
      })
    });

    const { result, waitForNextUpdate } = renderHook(() =>
      useDomainVerification({ siteSlug: 'test-site' })
    );

    // Verify a domain
    act(() => {
      result.current.verifyDomain('example.com');
    });

    // Wait for the verification to complete
    await waitForNextUpdate();

    // Check that the error is set
    expect(result.current.error).toBe('Server error');

    // Check that the domain verification failed
    expect(result.current.verificationStatuses).toEqual([
      {
        domain: 'example.com',
        status: 'failed'
      }
    ]);
  });

  it('should handle JSON parsing errors', async () => {
    // Mock invalid JSON response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.reject(new Error('Invalid JSON'))
    });

    const { result, waitForNextUpdate } = renderHook(() =>
      useDomainVerification({ siteSlug: 'test-site' })
    );

    // Verify a domain
    act(() => {
      result.current.verifyDomain('example.com');
    });

    // Wait for the verification to complete
    await waitForNextUpdate();

    // Check that the error is set
    expect(result.current.error).toBe('Invalid JSON');

    // Check that the domain verification failed
    expect(result.current.verificationStatuses).toEqual([
      {
        domain: 'example.com',
        status: 'failed'
      }
    ]);
  });
});
