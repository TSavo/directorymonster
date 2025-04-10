import { renderHook, act } from '@testing-library/react';
import { useRoleForm } from '../useRoleForm';
import { RoleScope, RoleType } from '@/types/role';

describe('useRoleForm', () => {
  const mockRole = {
    id: '1',
    name: 'Test Role',
    description: 'Test Description',
    scope: RoleScope.TENANT,
    type: RoleType.CUSTOM,
    tenantId: 'tenant-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockSiteOptions = [
    { id: 'site-1', name: 'Site 1' },
    { id: 'site-2', name: 'Site 2' }
  ];

  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    tenantId: 'tenant-1',
    siteOptions: mockSiteOptions,
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with default values when no role is provided', () => {
    const { result } = renderHook(() => useRoleForm(defaultProps));

    expect(result.current.isEditMode).toBe(false);
    expect(result.current.selectedScope).toBe(RoleScope.TENANT);
    expect(result.current.form.getValues()).toEqual({
      name: '',
      description: '',
      scope: RoleScope.TENANT,
      siteId: undefined,
      type: RoleType.CUSTOM,
      tenantId: 'tenant-1'
    });
  });

  it('initializes with role values when a role is provided', () => {
    const { result } = renderHook(() => useRoleForm({
      ...defaultProps,
      role: mockRole
    }));

    expect(result.current.isEditMode).toBe(true);
    expect(result.current.selectedScope).toBe(RoleScope.TENANT);
    expect(result.current.form.getValues()).toEqual({
      name: 'Test Role',
      description: 'Test Description',
      scope: RoleScope.TENANT,
      siteId: undefined,
      type: RoleType.CUSTOM,
      tenantId: 'tenant-1'
    });
  });

  it('handles form submission', () => {
    const { result } = renderHook(() => useRoleForm(defaultProps));

    const formValues = {
      name: 'New Role',
      description: 'New Description',
      scope: RoleScope.TENANT,
      siteId: undefined,
      type: RoleType.CUSTOM,
      tenantId: 'tenant-1'
    };

    act(() => {
      result.current.handleSubmit(formValues);
    });

    expect(mockOnSubmit).toHaveBeenCalledWith(formValues);
  });

  it('handles scope change', () => {
    const { result } = renderHook(() => useRoleForm(defaultProps));

    // Set initial siteId
    act(() => {
      result.current.form.setValue('siteId', 'site-1');
    });

    // Change scope to GLOBAL
    act(() => {
      result.current.handleScopeChange(RoleScope.GLOBAL);
    });

    expect(result.current.selectedScope).toBe(RoleScope.GLOBAL);
    expect(result.current.form.getValues('siteId')).toBeUndefined();

    // Change scope to SITE
    act(() => {
      result.current.handleScopeChange(RoleScope.SITE);
    });

    expect(result.current.selectedScope).toBe(RoleScope.SITE);
  });
});
