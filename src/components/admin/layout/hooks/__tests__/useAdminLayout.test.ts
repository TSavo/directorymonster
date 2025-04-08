import { renderHook, act } from '@testing-library/react';
import { useAdminLayout } from '../useAdminLayout';

// Mock the next/navigation module
jest.mock('next/navigation', () => ({
  usePathname: () => '/admin/dashboard'
}));

describe('useAdminLayout', () => {
  const mockChildren = <div>Test Children</div>;

  it('returns the provided children', () => {
    const { result } = renderHook(() => 
      useAdminLayout({
        children: mockChildren
      })
    );

    expect(result.current.children).toBe(mockChildren);
  });

  it('initializes sidebarOpen as false', () => {
    const { result } = renderHook(() => 
      useAdminLayout({
        children: mockChildren
      })
    );

    expect(result.current.sidebarOpen).toBe(false);
  });

  it('returns the current pathname', () => {
    const { result } = renderHook(() => 
      useAdminLayout({
        children: mockChildren
      })
    );

    expect(result.current.pathname).toBe('/admin/dashboard');
  });

  it('toggles the sidebar state when toggleSidebar is called', () => {
    const { result } = renderHook(() => 
      useAdminLayout({
        children: mockChildren
      })
    );

    // Initially false
    expect(result.current.sidebarOpen).toBe(false);

    // Toggle to true
    act(() => {
      result.current.toggleSidebar();
    });
    expect(result.current.sidebarOpen).toBe(true);

    // Toggle back to false
    act(() => {
      result.current.toggleSidebar();
    });
    expect(result.current.sidebarOpen).toBe(false);
  });

  it('closes the sidebar when closeSidebar is called', () => {
    const { result } = renderHook(() => 
      useAdminLayout({
        children: mockChildren
      })
    );

    // Set sidebar to open
    act(() => {
      result.current.toggleSidebar();
    });
    expect(result.current.sidebarOpen).toBe(true);

    // Close sidebar
    act(() => {
      result.current.closeSidebar();
    });
    expect(result.current.sidebarOpen).toBe(false);

    // Calling closeSidebar when already closed should keep it closed
    act(() => {
      result.current.closeSidebar();
    });
    expect(result.current.sidebarOpen).toBe(false);
  });
});
