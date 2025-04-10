/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react-hooks';
import { useDomainVerification } from '@/components/admin/sites/hooks/useDomainVerification';

// Mock fetch
global.fetch = jest.fn();

describe('useDomainVerification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should initialize with empty verification statuses', () => {
    const { result } = renderHook(() => useDomainVerification({ siteSlug: 'test-site' }));

    expect(result.current.verificationStatuses).toEqual([]);
    expect(result.current.isVerifying).toEqual({});
    expect(result.current.error).toBeNull();
  });

  it('should verify a domain successfully', async () => {
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
      useDomainVerification({ siteSlug: 'test-site' })
    );

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
  });

  it('should handle verification failure', async () => {
    // Mock failed verification
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: false,
        verified: false,
        errors: ['A record is not correctly configured']
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

    // Check that the domain verification failed
    expect(result.current.verificationStatuses).toContainEqual(expect.objectContaining({
      domain: 'example.com',
      status: 'failed'
    }));
  });

  it('should handle API errors', async () => {
    // Mock API error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result, waitForNextUpdate } = renderHook(() =>
      useDomainVerification({ siteSlug: 'test-site' })
    );

    // Verify a domain
    act(() => {
      result.current.verifyDomain('example.com');
    });

    // Wait for the verification to complete
    await waitForNextUpdate();

    // Check that the domain verification failed
    expect(result.current.verificationStatuses).toEqual([
      {
        domain: 'example.com',
        status: 'failed'
      }
    ]);

    // Check that the error is set
    expect(result.current.error).toBe('Network error');
  });

  it('should handle API errors for existing domain status', async () => {
    // Mock API error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result, waitForNextUpdate } = renderHook(() =>
      useDomainVerification({
        siteSlug: 'test-site',
        initialStatuses: [
          { domain: 'example.com', status: 'pending' }
        ]
      })
    );

    // Verify a domain
    act(() => {
      result.current.verifyDomain('example.com');
    });

    // Wait for the verification to complete
    await waitForNextUpdate();

    // Check that the domain verification failed and updated the existing status
    expect(result.current.verificationStatuses).toEqual([
      {
        domain: 'example.com',
        status: 'failed'
      }
    ]);

    // Check that the error is set
    expect(result.current.error).toBe('Network error');
  });

  it('should update existing domain status', async () => {
    // Mock successful verification
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        verified: true
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

    // Verify a domain
    act(() => {
      result.current.verifyDomain('example.com');
    });

    // Wait for the verification to complete
    await waitForNextUpdate();

    // Check that the domain status was updated
    expect(result.current.verificationStatuses).toEqual([
      {
        domain: 'example.com',
        status: 'verified',
        errors: undefined
      }
    ]);
  });

  it('should get domain status correctly', () => {
    const { result } = renderHook(() =>
      useDomainVerification({
        siteSlug: 'test-site',
        initialStatuses: [
          { domain: 'example.com', status: 'verified' }
        ]
      })
    );

    // Get domain status
    const status = result.current.getDomainStatus('example.com');

    // Check that the status is correct
    expect(status).toEqual({
      domain: 'example.com',
      status: 'verified'
    });

    // Check that non-existent domain returns null
    expect(result.current.getDomainStatus('non-existent.com')).toBeNull();
  });

  it('should check if domain is verifying correctly', () => {
    const { result } = renderHook(() =>
      useDomainVerification({ siteSlug: 'test-site' })
    );

    // Set a domain as verifying
    act(() => {
      result.current.verifyDomain('example.com');
    });

    // Check that the domain is verifying
    expect(result.current.isDomainVerifying('example.com')).toBe(true);
    expect(result.current.isDomainVerifying('non-existent.com')).toBe(false);
  });
});
