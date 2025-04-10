import { renderHook, act } from '@testing-library/react';
import { useMainHeader } from '../useMainHeader';

// Mock the useAuth hook
jest.mock('@/components/admin/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    isAuthenticated: true,
    user: { id: 'user-1', name: 'Test User' }
  }))
}));

// Mock the usePublicTenantSite hook
jest.mock('@/contexts/PublicTenantSiteContext', () => ({
  usePublicTenantSite: jest.fn(() => ({
    tenants: [
      { id: 'tenant-1', name: 'Tenant 1' },
      { id: 'tenant-2', name: 'Tenant 2' }
    ],
    sites: [
      { id: 'site-1', name: 'Site 1' },
      { id: 'site-2', name: 'Site 2' }
    ],
    currentTenantId: 'tenant-1',
    currentSiteId: 'site-1',
    setCurrentTenantId: jest.fn(),
    setCurrentSiteId: jest.fn()
  }))
}));

describe('useMainHeader', () => {
  // Mock window.scrollY
  const originalScrollY = window.scrollY;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 0
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: originalScrollY
    });
  });

  it('returns the correct initial state', () => {
    // Render the hook
    const { result } = renderHook(() => useMainHeader());

    // Check initial state
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual({ id: 'user-1', name: 'Test User' });
    expect(result.current.isScrolled).toBe(false);
    expect(result.current.mobileMenuOpen).toBe(false);
    expect(result.current.tenantMenuOpen).toBe(false);
    expect(result.current.siteMenuOpen).toBe(false);
    expect(result.current.tenants).toHaveLength(2);
    expect(result.current.sites).toHaveLength(2);
    expect(result.current.currentTenantId).toBe('tenant-1');
    expect(result.current.currentSiteId).toBe('site-1');
    expect(result.current.currentTenant).toEqual({ id: 'tenant-1', name: 'Tenant 1' });
    expect(result.current.currentSite).toEqual({ id: 'site-1', name: 'Site 1' });
    expect(result.current.hasMultipleTenants).toBe(true);
    expect(result.current.hasMultipleSites).toBe(true);
    expect(typeof result.current.toggleMobileMenu).toBe('function');
    expect(typeof result.current.toggleTenantMenu).toBe('function');
    expect(typeof result.current.toggleSiteMenu).toBe('function');
    expect(typeof result.current.handleSelectTenant).toBe('function');
    expect(typeof result.current.handleSelectSite).toBe('function');
  });

  it('initializes with custom initial values', () => {
    // Create custom initial values
    const initialValues = {
      initialMobileMenuOpen: true,
      initialTenantMenuOpen: true,
      initialSiteMenuOpen: true
    };

    // Render the hook with initial values
    const { result } = renderHook(() => useMainHeader(initialValues));

    // Check that state is initialized with initial values
    expect(result.current.mobileMenuOpen).toBe(initialValues.initialMobileMenuOpen);
    expect(result.current.tenantMenuOpen).toBe(initialValues.initialTenantMenuOpen);
    expect(result.current.siteMenuOpen).toBe(initialValues.initialSiteMenuOpen);
  });

  it('updates isScrolled when window.scrollY changes', () => {
    // Render the hook
    const { result } = renderHook(() => useMainHeader());

    // Check initial state
    expect(result.current.isScrolled).toBe(false);

    // Simulate scroll event
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 20
    });

    // Trigger scroll event
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    // Check that isScrolled was updated
    expect(result.current.isScrolled).toBe(true);
  });

  it('toggles mobile menu when toggleMobileMenu is called', () => {
    // Render the hook
    const { result } = renderHook(() => useMainHeader());

    // Check initial state
    expect(result.current.mobileMenuOpen).toBe(false);

    // Toggle mobile menu
    act(() => {
      result.current.toggleMobileMenu();
    });

    // Check that mobileMenuOpen was toggled
    expect(result.current.mobileMenuOpen).toBe(true);

    // Toggle mobile menu again
    act(() => {
      result.current.toggleMobileMenu();
    });

    // Check that mobileMenuOpen was toggled back
    expect(result.current.mobileMenuOpen).toBe(false);
  });

  it('toggles tenant menu when toggleTenantMenu is called', () => {
    // Render the hook
    const { result } = renderHook(() => useMainHeader());

    // Check initial state
    expect(result.current.tenantMenuOpen).toBe(false);
    expect(result.current.siteMenuOpen).toBe(false);

    // Toggle tenant menu
    act(() => {
      result.current.toggleTenantMenu();
    });

    // Check that tenantMenuOpen was toggled
    expect(result.current.tenantMenuOpen).toBe(true);

    // Toggle site menu
    act(() => {
      result.current.toggleSiteMenu();
    });

    // Check that tenantMenuOpen was closed and siteMenuOpen was opened
    expect(result.current.tenantMenuOpen).toBe(false);
    expect(result.current.siteMenuOpen).toBe(true);
  });

  it('toggles site menu when toggleSiteMenu is called', () => {
    // Render the hook
    const { result } = renderHook(() => useMainHeader());

    // Check initial state
    expect(result.current.siteMenuOpen).toBe(false);
    expect(result.current.tenantMenuOpen).toBe(false);

    // Toggle site menu
    act(() => {
      result.current.toggleSiteMenu();
    });

    // Check that siteMenuOpen was toggled
    expect(result.current.siteMenuOpen).toBe(true);

    // Toggle tenant menu
    act(() => {
      result.current.toggleTenantMenu();
    });

    // Check that siteMenuOpen was closed and tenantMenuOpen was opened
    expect(result.current.siteMenuOpen).toBe(false);
    expect(result.current.tenantMenuOpen).toBe(true);
  });

  it('calls setCurrentTenantId and closes tenant menu when handleSelectTenant is called', () => {
    // Get the mocked setCurrentTenantId function
    const { usePublicTenantSite } = require('@/contexts/PublicTenantSiteContext');
    const mockSetCurrentTenantId = jest.fn();
    usePublicTenantSite.mockReturnValueOnce({
      tenants: [
        { id: 'tenant-1', name: 'Tenant 1' },
        { id: 'tenant-2', name: 'Tenant 2' }
      ],
      sites: [
        { id: 'site-1', name: 'Site 1' },
        { id: 'site-2', name: 'Site 2' }
      ],
      currentTenantId: 'tenant-1',
      currentSiteId: 'site-1',
      setCurrentTenantId: mockSetCurrentTenantId,
      setCurrentSiteId: jest.fn()
    });

    // Render the hook with tenant menu open
    const { result } = renderHook(() => useMainHeader({ initialTenantMenuOpen: true }));

    // Check initial state
    expect(result.current.tenantMenuOpen).toBe(true);

    // Call handleSelectTenant
    act(() => {
      result.current.handleSelectTenant('tenant-2');
    });

    // Check that setCurrentTenantId was called with the correct tenant ID
    expect(mockSetCurrentTenantId).toHaveBeenCalledWith('tenant-2');

    // Check that tenant menu was closed
    expect(result.current.tenantMenuOpen).toBe(false);
  });

  it('calls setCurrentSiteId and closes site menu when handleSelectSite is called', () => {
    // Get the mocked setCurrentSiteId function
    const { usePublicTenantSite } = require('@/contexts/PublicTenantSiteContext');
    const mockSetCurrentSiteId = jest.fn();
    usePublicTenantSite.mockReturnValueOnce({
      tenants: [
        { id: 'tenant-1', name: 'Tenant 1' },
        { id: 'tenant-2', name: 'Tenant 2' }
      ],
      sites: [
        { id: 'site-1', name: 'Site 1' },
        { id: 'site-2', name: 'Site 2' }
      ],
      currentTenantId: 'tenant-1',
      currentSiteId: 'site-1',
      setCurrentTenantId: jest.fn(),
      setCurrentSiteId: mockSetCurrentSiteId
    });

    // Render the hook with site menu open
    const { result } = renderHook(() => useMainHeader({ initialSiteMenuOpen: true }));

    // Check initial state
    expect(result.current.siteMenuOpen).toBe(true);

    // Call handleSelectSite
    act(() => {
      result.current.handleSelectSite('site-2');
    });

    // Check that setCurrentSiteId was called with the correct site ID
    expect(mockSetCurrentSiteId).toHaveBeenCalledWith('site-2');

    // Check that site menu was closed
    expect(result.current.siteMenuOpen).toBe(false);
  });

  it('correctly identifies when there are not multiple tenants', () => {
    // Mock usePublicTenantSite to return only one tenant
    const { usePublicTenantSite } = require('@/contexts/PublicTenantSiteContext');
    usePublicTenantSite.mockReturnValueOnce({
      tenants: [{ id: 'tenant-1', name: 'Tenant 1' }],
      sites: [
        { id: 'site-1', name: 'Site 1' },
        { id: 'site-2', name: 'Site 2' }
      ],
      currentTenantId: 'tenant-1',
      currentSiteId: 'site-1',
      setCurrentTenantId: jest.fn(),
      setCurrentSiteId: jest.fn()
    });

    // Render the hook
    const { result } = renderHook(() => useMainHeader());

    // Check that hasMultipleTenants is false
    expect(result.current.hasMultipleTenants).toBe(false);

    // Check that hasMultipleSites is still true
    expect(result.current.hasMultipleSites).toBe(true);
  });

  it('correctly identifies when there are not multiple sites', () => {
    // Mock usePublicTenantSite to return only one site
    const { usePublicTenantSite } = require('@/contexts/PublicTenantSiteContext');
    usePublicTenantSite.mockReturnValueOnce({
      tenants: [
        { id: 'tenant-1', name: 'Tenant 1' },
        { id: 'tenant-2', name: 'Tenant 2' }
      ],
      sites: [{ id: 'site-1', name: 'Site 1' }],
      currentTenantId: 'tenant-1',
      currentSiteId: 'site-1',
      setCurrentTenantId: jest.fn(),
      setCurrentSiteId: jest.fn()
    });

    // Render the hook
    const { result } = renderHook(() => useMainHeader());

    // Check that hasMultipleSites is false
    expect(result.current.hasMultipleSites).toBe(false);

    // Check that hasMultipleTenants is still true
    expect(result.current.hasMultipleTenants).toBe(true);
  });
});
