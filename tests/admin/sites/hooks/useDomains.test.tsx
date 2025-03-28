import { renderHook, act } from '@testing-library/react';
import { useDomains } from '@/components/admin/sites/hooks';

// Mock fetch function
global.fetch = jest.fn();

describe('useDomains Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset fetch mock before each test
    (global.fetch as jest.Mock).mockReset();
  });

  it('initializes with empty domains array by default', () => {
    const { result } = renderHook(() => useDomains());
    
    expect(result.current.domains).toEqual([]);
    expect(result.current.domainInput).toBe('');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.success).toBeNull();
    expect(result.current.errors).toEqual({});
  });

  it('initializes with provided domains', () => {
    const initialDomains = ['example.com', 'test.com'];
    const { result } = renderHook(() => useDomains({ initialDomains }));
    
    expect(result.current.domains).toEqual(initialDomains);
  });

  it('allows changing domain input', () => {
    const { result } = renderHook(() => useDomains());
    
    act(() => {
      result.current.handleInputChange({
        target: { name: 'domainInput', value: 'example.com' }
      } as React.ChangeEvent<HTMLInputElement>);
    });
    
    expect(result.current.domainInput).toBe('example.com');
  });

  it('validates and adds valid domains', () => {
    const { result } = renderHook(() => useDomains());
    
    // Set valid domain input
    act(() => {
      result.current.setDomainInput('example.com');
    });
    
    // Add domain
    act(() => {
      result.current.addDomain();
    });
    
    // Check domain was added
    expect(result.current.domains).toContain('example.com');
    
    // Input should be cleared after adding
    expect(result.current.domainInput).toBe('');
  });

  it('validates and rejects invalid domains', () => {
    const { result } = renderHook(() => useDomains());
    
    // Set invalid domain input
    act(() => {
      result.current.setDomainInput('invalid');
    });
    
    // Try to add domain
    act(() => {
      result.current.addDomain();
    });
    
    // Check domain was not added
    expect(result.current.domains).not.toContain('invalid');
    
    // Error should be set
    expect(result.current.errors.domainInput).toBe('Invalid domain format');
  });

  it('prevents adding duplicate domains', () => {
    const initialDomains = ['example.com'];
    const { result } = renderHook(() => useDomains({ initialDomains }));
    
    // Set duplicate domain input
    act(() => {
      result.current.setDomainInput('example.com');
    });
    
    // Try to add duplicate domain
    act(() => {
      result.current.addDomain();
    });
    
    // Check domain count didn't change
    expect(result.current.domains.length).toBe(1);
    
    // Error should be set
    expect(result.current.errors.domainInput).toBe('Domain already exists');
  });

  it('allows removing domains', () => {
    const initialDomains = ['example.com', 'test.com'];
    const { result } = renderHook(() => useDomains({ initialDomains }));
    
    // Remove a domain
    act(() => {
      result.current.removeDomain('example.com');
    });
    
    // Check domain was removed
    expect(result.current.domains).not.toContain('example.com');
    expect(result.current.domains).toContain('test.com');
    expect(result.current.domains.length).toBe(1);
  });

  it('validates domains before submission', () => {
    const { result } = renderHook(() => useDomains());
    
    // Try to submit without domains
    act(() => {
      result.current.validateDomains();
    });
    
    // Error should be set
    expect(result.current.errors.domains).toBe('At least one domain is required');
    
    // Add a domain and try again
    act(() => {
      result.current.setDomainInput('example.com');
      result.current.addDomain();
    });
    
    // Validate again
    let isValid;
    act(() => {
      isValid = result.current.validateDomains();
    });
    
    // Should be valid now
    expect(isValid).toBe(true);
    expect(result.current.errors.domains).toBeUndefined();
  });

  it('submits domains to API successfully', async () => {
    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'site-1', domains: ['example.com'] })
    });
    
    const initialDomains = ['example.com'];
    const { result } = renderHook(() => useDomains({ initialDomains }));
    
    // Submit domains
    let submitResult;
    await act(async () => {
      submitResult = await result.current.submitDomains('site-1', {}, 'PUT');
    });
    
    // Check loading state was properly managed
    expect(result.current.isLoading).toBe(false);
    
    // Check success message was set
    expect(result.current.success).toBe('Domain settings updated successfully');
    
    // Check submit result
    expect(submitResult.success).toBe(true);
    expect(submitResult.data).toEqual({ id: 'site-1', domains: ['example.com'] });
    
    // Verify fetch was called correctly
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/domain-manager/site-1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          domains: ['example.com'],
          id: 'site-1'
        })
      })
    );
  });

  it('handles API errors during submission', async () => {
    // Mock failed API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Domain validation failed' })
    });
    
    const initialDomains = ['example.com'];
    const { result } = renderHook(() => useDomains({ initialDomains }));
    
    // Submit domains
    let submitResult;
    await act(async () => {
      submitResult = await result.current.submitDomains('site-1');
    });
    
    // Check loading state was properly managed
    expect(result.current.isLoading).toBe(false);
    
    // Check error message was set
    expect(result.current.error).toBe('Domain validation failed');
    
    // Check submit result
    expect(submitResult.success).toBe(false);
  });

  it('handles network errors during submission', async () => {
    // Mock network error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    const initialDomains = ['example.com'];
    const { result } = renderHook(() => useDomains({ initialDomains }));
    
    // Submit domains
    let submitResult;
    await act(async () => {
      submitResult = await result.current.submitDomains('site-1');
    });
    
    // Check loading state was properly managed
    expect(result.current.isLoading).toBe(false);
    
    // Check error message was set
    expect(result.current.error).toBe('Network error');
    
    // Check submit result
    expect(submitResult.success).toBe(false);
    expect(submitResult.error).toBeDefined();
  });

  it('clears errors on input change', () => {
    const { result } = renderHook(() => useDomains());
    
    // Set an error
    act(() => {
      result.current.setDomainInput('invalid');
      result.current.addDomain();
    });
    
    // Check error is set
    expect(result.current.errors.domainInput).toBe('Invalid domain format');
    
    // Change input
    act(() => {
      result.current.handleInputChange({
        target: { name: 'domainInput', value: 'example.com' }
      } as React.ChangeEvent<HTMLInputElement>);
    });
    
    // Error should be cleared
    expect(result.current.errors.domainInput).toBeUndefined();
  });

  it('uses custom validation when provided', () => {
    // Custom validation that only allows .org domains
    const customValidation = (domain: string) => {
      if (!domain.endsWith('.org')) {
        return 'Only .org domains are allowed';
      }
      return true;
    };
    
    const { result } = renderHook(() => 
      useDomains({ customValidation })
    );
    
    // Try to add a non-.org domain
    act(() => {
      result.current.setDomainInput('example.com');
      result.current.addDomain();
    });
    
    // Check error is set with custom message
    expect(result.current.errors.domainInput).toBe('Only .org domains are allowed');
    expect(result.current.domains.length).toBe(0);
    
    // Try to add a .org domain
    act(() => {
      result.current.setDomainInput('example.org');
      result.current.addDomain();
    });
    
    // Check domain was added
    expect(result.current.domains).toContain('example.org');
  });

  it('allows resetting errors and status', () => {
    const { result } = renderHook(() => useDomains());
    
    // Set error and success states
    act(() => {
      result.current.setDomainInput('invalid');
      result.current.addDomain();
    });
    
    // Reset errors
    act(() => {
      result.current.resetErrors();
    });
    
    // Check errors were reset
    expect(result.current.errors).toEqual({});
    
    // Reset status
    act(() => {
      result.current.resetStatus();
    });
    
    // Check status was reset
    expect(result.current.error).toBeNull();
    expect(result.current.success).toBeNull();
  });
});
