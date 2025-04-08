import { renderHook } from '@testing-library/react';
import { useBreadcrumbs } from '../useBreadcrumbs';

describe('useBreadcrumbs', () => {
  it('returns shouldRender as false for admin root path', () => {
    const { result } = renderHook(() => 
      useBreadcrumbs({
        pathname: '/admin'
      })
    );

    expect(result.current.shouldRender).toBe(false);
    expect(result.current.breadcrumbItems).toEqual([]);
  });

  it('returns correct breadcrumb items for a simple path', () => {
    const { result } = renderHook(() => 
      useBreadcrumbs({
        pathname: '/admin/users'
      })
    );

    expect(result.current.shouldRender).toBe(true);
    expect(result.current.breadcrumbItems).toEqual([
      { href: '/admin', label: 'Admin' },
      { href: '/admin/users', label: 'Users' }
    ]);
  });

  it('returns correct breadcrumb items for a nested path', () => {
    const { result } = renderHook(() => 
      useBreadcrumbs({
        pathname: '/admin/sites/123/settings'
      })
    );

    expect(result.current.shouldRender).toBe(true);
    expect(result.current.breadcrumbItems).toEqual([
      { href: '/admin', label: 'Admin' },
      { href: '/admin/sites', label: 'Sites' },
      { href: '/admin/sites/123', label: '123' },
      { href: '/admin/sites/123/settings', label: 'Settings' }
    ]);
  });

  it('formats labels correctly with hyphens and capitalization', () => {
    const { result } = renderHook(() => 
      useBreadcrumbs({
        pathname: '/admin/user-management/create-user'
      })
    );

    expect(result.current.shouldRender).toBe(true);
    expect(result.current.breadcrumbItems).toEqual([
      { href: '/admin', label: 'Admin' },
      { href: '/admin/user-management', label: 'User Management' },
      { href: '/admin/user-management/create-user', label: 'Create User' }
    ]);
  });
});
