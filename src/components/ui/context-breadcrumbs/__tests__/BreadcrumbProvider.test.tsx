/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, act } from '@testing-library/react';
import { BreadcrumbProvider, useBreadcrumbs } from '../BreadcrumbProvider';

// Mock the usePathname hook
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// Test component that uses the useBreadcrumbs hook
const TestComponent = () => {
  const { items, addItem, removeItem, clearItems } = useBreadcrumbs();
  
  return (
    <div>
      <div data-testid="breadcrumb-items">
        {JSON.stringify(items)}
      </div>
      <button 
        data-testid="add-item" 
        onClick={() => addItem({ label: 'Test', href: '/test' })}
      >
        Add Item
      </button>
      <button 
        data-testid="remove-item" 
        onClick={() => removeItem('/test')}
      >
        Remove Item
      </button>
      <button 
        data-testid="clear-items" 
        onClick={() => clearItems()}
      >
        Clear Items
      </button>
    </div>
  );
};

describe('BreadcrumbProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generates breadcrumbs from path', () => {
    // Mock the usePathname hook to return a path
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/admin/users/123');
    
    const { getByTestId } = render(
      <BreadcrumbProvider>
        <TestComponent />
      </BreadcrumbProvider>
    );
    
    // Check that breadcrumbs are generated from the path
    const breadcrumbItems = JSON.parse(getByTestId('breadcrumb-items').textContent || '[]');
    
    expect(breadcrumbItems).toHaveLength(3);
    expect(breadcrumbItems[0].label).toBe('Dashboard');
    expect(breadcrumbItems[0].href).toBe('/admin');
    expect(breadcrumbItems[1].label).toBe('Users');
    expect(breadcrumbItems[1].href).toBe('/admin/users');
    expect(breadcrumbItems[2].label).toBe('123');
    expect(breadcrumbItems[2].href).toBe('/admin/users/123');
  });

  it('adds a breadcrumb item', () => {
    // Mock the usePathname hook to return a path
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/admin');
    
    const { getByTestId } = render(
      <BreadcrumbProvider>
        <TestComponent />
      </BreadcrumbProvider>
    );
    
    // Get initial breadcrumb items
    const initialItems = JSON.parse(getByTestId('breadcrumb-items').textContent || '[]');
    
    // Add a breadcrumb item
    act(() => {
      getByTestId('add-item').click();
    });
    
    // Check that the item was added
    const updatedItems = JSON.parse(getByTestId('breadcrumb-items').textContent || '[]');
    
    expect(updatedItems).toHaveLength(initialItems.length + 1);
    expect(updatedItems[updatedItems.length - 1].label).toBe('Test');
    expect(updatedItems[updatedItems.length - 1].href).toBe('/test');
  });

  it('removes a breadcrumb item', () => {
    // Mock the usePathname hook to return a path
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/admin');
    
    const { getByTestId } = render(
      <BreadcrumbProvider>
        <TestComponent />
      </BreadcrumbProvider>
    );
    
    // Add a breadcrumb item
    act(() => {
      getByTestId('add-item').click();
    });
    
    // Get breadcrumb items after adding
    const itemsAfterAdd = JSON.parse(getByTestId('breadcrumb-items').textContent || '[]');
    
    // Remove the breadcrumb item
    act(() => {
      getByTestId('remove-item').click();
    });
    
    // Check that the item was removed
    const itemsAfterRemove = JSON.parse(getByTestId('breadcrumb-items').textContent || '[]');
    
    expect(itemsAfterRemove).toHaveLength(itemsAfterAdd.length - 1);
    expect(itemsAfterRemove.find((item: any) => item.href === '/test')).toBeUndefined();
  });

  it('clears all breadcrumb items', () => {
    // Mock the usePathname hook to return a path
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/admin/users');
    
    const { getByTestId } = render(
      <BreadcrumbProvider>
        <TestComponent />
      </BreadcrumbProvider>
    );
    
    // Get initial breadcrumb items
    const initialItems = JSON.parse(getByTestId('breadcrumb-items').textContent || '[]');
    expect(initialItems.length).toBeGreaterThan(0);
    
    // Clear all breadcrumb items
    act(() => {
      getByTestId('clear-items').click();
    });
    
    // Check that all items were cleared
    const clearedItems = JSON.parse(getByTestId('breadcrumb-items').textContent || '[]');
    expect(clearedItems).toHaveLength(0);
  });

  it('updates breadcrumbs when path changes', () => {
    // Mock the usePathname hook to return a path
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/admin/users');
    
    const { getByTestId, rerender } = render(
      <BreadcrumbProvider>
        <TestComponent />
      </BreadcrumbProvider>
    );
    
    // Get initial breadcrumb items
    const initialItems = JSON.parse(getByTestId('breadcrumb-items').textContent || '[]');
    
    // Change the path
    usePathname.mockReturnValue('/admin/roles');
    
    // Rerender to trigger the useEffect
    rerender(
      <BreadcrumbProvider>
        <TestComponent />
      </BreadcrumbProvider>
    );
    
    // Check that breadcrumbs were updated
    const updatedItems = JSON.parse(getByTestId('breadcrumb-items').textContent || '[]');
    
    expect(updatedItems).not.toEqual(initialItems);
    expect(updatedItems[1].label).toBe('Roles');
    expect(updatedItems[1].href).toBe('/admin/roles');
  });

  it('throws an error when useBreadcrumbs is used outside of BreadcrumbProvider', () => {
    // Suppress console.error for this test
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useBreadcrumbs must be used within a BreadcrumbProvider');
    
    // Restore console.error
    console.error = originalConsoleError;
  });
});
