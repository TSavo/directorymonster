import { renderHook, act } from '@testing-library/react';
import { useSiteForm } from '../useSiteForm';
import { useSites } from '../useSites';

// Mock the dependencies
jest.mock('../useSites');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn()
  })
}));
jest.mock('@/components/notifications/NotificationProvider', () => ({
  useNotificationsContext: () => ({
    showNotification: jest.fn()
  })
}));

describe('useSiteForm', () => {
  const mockSitesHook = {
    site: {
      id: 'test-id',
      name: 'Test Site',
      slug: 'test-site',
      description: 'Test description',
      domains: ['example.com'],
      theme: 'default',
      customStyles: '',
      seoTitle: 'Test SEO Title',
      seoDescription: 'Test SEO Description',
      seoKeywords: 'test, seo, keywords',
      enableCanonicalUrls: false
    },
    updateSite: jest.fn(),
    createSite: jest.fn().mockResolvedValue({ success: true, data: { id: 'new-id' } }),
    saveSite: jest.fn().mockResolvedValue({ success: true, data: { id: 'test-id' } }),
    isLoading: false,
    error: null,
    success: null,
    errors: {},
    validateSite: jest.fn().mockReturnValue(true),
    resetErrors: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSites as jest.Mock).mockReturnValue(mockSitesHook);
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useSiteForm({}));

    expect(result.current.activeStep).toBe('basic_info');
    expect(result.current.completedSteps).toEqual([]);
    expect(result.current.newDomain).toBe('');
    expect(result.current.isFirstStep).toBe(true);
    expect(result.current.isLastStep).toBe(false);
  });

  it('initializes with provided initialStep', () => {
    const { result } = renderHook(() => useSiteForm({ initialStep: 'domains' }));

    expect(result.current.activeStep).toBe('domains');
    expect(result.current.isFirstStep).toBe(false);
    expect(result.current.isLastStep).toBe(false);
  });

  it('handles input changes correctly', () => {
    const { result } = renderHook(() => useSiteForm({}));

    // Test with event object
    act(() => {
      result.current.handleChange({
        target: { name: 'name', value: 'New Site Name' }
      } as React.ChangeEvent<HTMLInputElement>);
    });
    expect(mockSitesHook.updateSite).toHaveBeenCalledWith('name', 'New Site Name');

    // Test with name/value pair
    act(() => {
      result.current.handleChange('description', 'New description');
    });
    expect(mockSitesHook.updateSite).toHaveBeenCalledWith('description', 'New description');

    // Test with newDomain
    act(() => {
      result.current.handleChange('newDomain', 'newdomain.com');
    });
    expect(result.current.newDomain).toBe('newdomain.com');
  });

  it('handles domain management correctly', () => {
    const { result } = renderHook(() => useSiteForm({}));

    // Set a new domain
    act(() => {
      result.current.handleChange('newDomain', 'newdomain.com');
    });

    // Add the domain
    act(() => {
      result.current.addDomain();
    });
    expect(mockSitesHook.updateSite).toHaveBeenCalledWith('domains', ['example.com', 'newdomain.com']);

    // Remove a domain
    act(() => {
      result.current.removeDomain('example.com');
    });
    expect(mockSitesHook.updateSite).toHaveBeenCalledWith('domains', []);
  });

  it('validates domain format', () => {
    const { result } = renderHook(() => useSiteForm({}));

    // Set an invalid domain
    act(() => {
      result.current.handleChange('newDomain', 'invalid-domain');
    });

    // Try to add the domain
    act(() => {
      result.current.addDomain();
    });
    expect(mockSitesHook.updateSite).toHaveBeenCalledWith('errors', {
      newDomain: 'Please enter a valid domain name'
    });
  });

  it('prevents adding duplicate domains', () => {
    const { result } = renderHook(() => useSiteForm({}));

    // Set a domain that already exists
    act(() => {
      result.current.handleChange('newDomain', 'example.com');
    });

    // Try to add the domain
    act(() => {
      result.current.addDomain();
    });
    expect(mockSitesHook.updateSite).toHaveBeenCalledWith('errors', {
      newDomain: 'This domain has already been added'
    });
  });

  it('handles step navigation correctly', () => {
    const { result } = renderHook(() => useSiteForm({}));

    // Navigate to next step
    act(() => {
      result.current.handleNext();
    });
    expect(result.current.activeStep).toBe('domains');
    expect(result.current.completedSteps).toContain('basic_info');

    // Navigate to previous step
    act(() => {
      result.current.handlePrevious();
    });
    expect(result.current.activeStep).toBe('basic_info');

    // Navigate to a completed step
    act(() => {
      result.current.handleStepChange('domains');
    });
    expect(result.current.activeStep).toBe('domains');

    // Try to navigate to an uncompleted step (should not change)
    act(() => {
      result.current.handleStepChange('theme');
    });
    expect(result.current.activeStep).toBe('domains');
  });

  it('handles form submission in create mode', async () => {
    const mockEvent = {
      preventDefault: jest.fn()
    } as unknown as React.FormEvent;
    
    const { result } = renderHook(() => useSiteForm({ mode: 'create' }));

    // Navigate to the last step
    act(() => {
      result.current.handleStepChange('preview');
    });

    // Submit the form
    await act(async () => {
      await result.current.handleSubmit(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockSitesHook.createSite).toHaveBeenCalled();
  });

  it('handles form submission in edit mode', async () => {
    const mockEvent = {
      preventDefault: jest.fn()
    } as unknown as React.FormEvent;
    
    const { result } = renderHook(() => useSiteForm({ 
      mode: 'edit',
      initialData: { id: 'test-id' }
    }));

    // Navigate to the last step
    act(() => {
      result.current.handleStepChange('preview');
    });

    // Submit the form
    await act(async () => {
      await result.current.handleSubmit(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockSitesHook.saveSite).toHaveBeenCalledWith('test-id');
  });
});
