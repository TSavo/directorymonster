import { renderHook } from '@testing-library/react';
import { useMainLayout } from '../useMainLayout';

describe('useMainLayout', () => {
  const mockSite = {
    id: 'site-1',
    name: 'Test Site',
    logoUrl: 'https://example.com/logo.png'
  };

  const mockCategories = [
    { id: 'cat-1', name: 'Category 1', slug: 'category-1' },
    { id: 'cat-2', name: 'Category 2', slug: 'category-2' }
  ];

  const mockChildren = <div>Test Children</div>;

  it('returns the provided props', () => {
    const { result } = renderHook(() => 
      useMainLayout({
        site: mockSite,
        categories: mockCategories,
        children: mockChildren
      })
    );

    expect(result.current.site).toBe(mockSite);
    expect(result.current.categories).toBe(mockCategories);
    expect(result.current.children).toBe(mockChildren);
  });

  it('uses empty array as default for categories', () => {
    const { result } = renderHook(() => 
      useMainLayout({
        site: mockSite,
        children: mockChildren
      })
    );

    expect(result.current.categories).toEqual([]);
  });
});
