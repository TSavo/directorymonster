import { renderHook } from '@testing-library/react';
import { useMainFooter } from '../useMainFooter';

describe('useMainFooter', () => {
  const mockSite = {
    id: 'site-1',
    name: 'Test Site'
  };

  it('initializes with the correct site', () => {
    const { result } = renderHook(() => useMainFooter({ site: mockSite }));
    expect(result.current.site).toEqual(mockSite);
  });

  it('returns the current year', () => {
    const { result } = renderHook(() => useMainFooter({ site: mockSite }));
    const currentYear = new Date().getFullYear();
    expect(result.current.currentYear).toBe(currentYear);
  });

  it('returns social links', () => {
    const { result } = renderHook(() => useMainFooter({ site: mockSite }));
    expect(result.current.socialLinks).toHaveLength(3);
    expect(result.current.socialLinks[0].name).toBe('Twitter');
    expect(result.current.socialLinks[1].name).toBe('Facebook');
    expect(result.current.socialLinks[2].name).toBe('Instagram');
  });

  it('returns quick links', () => {
    const { result } = renderHook(() => useMainFooter({ site: mockSite }));
    expect(result.current.quickLinks).toHaveLength(4);
    expect(result.current.quickLinks[0].name).toBe('Home');
    expect(result.current.quickLinks[0].href).toBe('/');
  });

  it('returns legal links', () => {
    const { result } = renderHook(() => useMainFooter({ site: mockSite }));
    expect(result.current.legalLinks).toHaveLength(4);
    expect(result.current.legalLinks[0].name).toBe('Privacy Policy');
    expect(result.current.legalLinks[0].href).toBe('/privacy');
  });

  it('returns contact info', () => {
    const { result } = renderHook(() => useMainFooter({ site: mockSite }));
    expect(result.current.contactInfo).toHaveLength(3);
    expect(result.current.contactInfo[0].type).toBe('email');
    expect(result.current.contactInfo[1].type).toBe('phone');
    expect(result.current.contactInfo[2].type).toBe('address');
  });
});
