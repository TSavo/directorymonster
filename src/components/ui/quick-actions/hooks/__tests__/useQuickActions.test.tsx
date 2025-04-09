import { renderHook } from '@testing-library/react';
import { getContextFromPathname } from '../useQuickActions';

// We'll only test the getContextFromPathname function for now
// since it doesn't involve React components or hooks
describe('getContextFromPathname', () => {
  it('returns the correct context for different pathnames', () => {
    expect(getContextFromPathname('/admin/users')).toBe('users');
    expect(getContextFromPathname('/admin/roles')).toBe('roles');
    expect(getContextFromPathname('/admin/sites')).toBe('sites');
    expect(getContextFromPathname('/admin/listings')).toBe('listings');
    expect(getContextFromPathname('/admin/categories')).toBe('categories');
    expect(getContextFromPathname('/admin/settings')).toBe('settings');
    expect(getContextFromPathname('/admin/dashboard')).toBe('dashboard');
    expect(getContextFromPathname('/admin')).toBe('dashboard');
  });
});
