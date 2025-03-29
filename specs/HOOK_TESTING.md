# React Hook Testing Guide

This document outlines best practices and patterns for testing custom React hooks in the DirectoryMonster application.

## Table of Contents

1. [Introduction](#introduction)
2. [Testing Tools](#testing-tools)
3. [Basic Hook Testing](#basic-hook-testing)
4. [Testing Async Hooks](#testing-async-hooks)
5. [Testing Hooks with Context](#testing-hooks-with-context)
6. [Mocking Dependencies](#mocking-dependencies)
7. [Common Patterns](#common-patterns)
8. [Best Practices](#best-practices)

## Introduction

Custom React hooks encapsulate reusable stateful logic in our application. Testing hooks properly ensures they work correctly in isolation, allowing components to rely on their functionality.

## Testing Tools

DirectoryMonster uses the following tools for testing hooks:

1. **@testing-library/react-hooks**: Provides utilities for testing React hooks in isolation
2. **@testing-library/react**: For testing hooks within components
3. **Jest**: For running tests and assertions

## Basic Hook Testing

### Simple State Hooks

```typescript
// src/hooks/useCounter.ts
import { useState } from 'react';

export function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  
  const increment = () => setCount(prev => prev + 1);
  const decrement = () => setCount(prev => prev - 1);
  const reset = () => setCount(initialValue);
  
  return { count, increment, decrement, reset };
}
```

Testing this hook:

```typescript
// tests/hooks/useCounter.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useCounter } from '@/hooks/useCounter';

describe('useCounter Hook', () => {
  it('should initialize with default value', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });
  
  it('should initialize with provided value', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });
  
  it('should increment the counter', () => {
    const { result } = renderHook(() => useCounter());
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });
  
  it('should decrement the counter', () => {
    const { result } = renderHook(() => useCounter(5));
    
    act(() => {
      result.current.decrement();
    });
    
    expect(result.current.count).toBe(4);
  });
  
  it('should reset the counter', () => {
    const { result } = renderHook(() => useCounter(5));
    
    act(() => {
      result.current.increment();
      result.current.increment();
    });
    
    expect(result.current.count).toBe(7);
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.count).toBe(5);
  });
});
```

## Testing Async Hooks

### Handling API Calls

```typescript
// src/hooks/useData.ts
import { useState, useEffect } from 'react';

export function useData(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, [url]);
  
  const refetch = () => fetchData();
  
  return { data, loading, error, refetch };
}
```

Testing this async hook:

```typescript
// tests/hooks/useData.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useData } from '@/hooks/useData';

// Mock fetch
global.fetch = jest.fn();

describe('useData Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should fetch and return data successfully', async () => {
    const mockData = { id: 1, name: 'Test' };
    
    // Mock successful fetch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });
    
    const { result, waitForNextUpdate } = renderHook(() => useData('/api/test'));
    
    // Initial state
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);
    
    // Wait for the API call to resolve
    await waitForNextUpdate();
    
    // Final state after fetch
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBe(null);
    
    // Verify fetch was called correctly
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('/api/test');
  });
  
  it('should handle fetch errors', async () => {
    // Mock failed fetch
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404
    });
    
    const { result, waitForNextUpdate } = renderHook(() => useData('/api/test'));
    
    // Wait for the API call to resolve
    await waitForNextUpdate();
    
    // Error state
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe('Failed to fetch data');
  });
  
  it('should handle network errors', async () => {
    // Mock network error
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    
    const { result, waitForNextUpdate } = renderHook(() => useData('/api/test'));
    
    // Wait for the API call to resolve
    await waitForNextUpdate();
    
    // Error state
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe('Network error');
  });
  
  it('should refetch data when refetch is called', async () => {
    const initialData = { id: 1, name: 'Initial' };
    const updatedData = { id: 1, name: 'Updated' };
    
    // Mock initial fetch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => initialData
    });
    
    const { result, waitForNextUpdate } = renderHook(() => useData('/api/test'));
    
    // Wait for initial fetch
    await waitForNextUpdate();
    expect(result.current.data).toEqual(initialData);
    
    // Mock second fetch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => updatedData
    });
    
    // Call refetch
    act(() => {
      result.current.refetch();
    });
    
    // Should be loading again
    expect(result.current.loading).toBe(true);
    
    // Wait for second fetch
    await waitForNextUpdate();
    
    // Verify data was updated
    expect(result.current.data).toEqual(updatedData);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
```

## Testing Hooks with Context

Many hooks in DirectoryMonster depend on React Context. Here's how to test them:

### Context Provider Wrapper

```typescript
// Example context
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children, initialState }) => {
  const [user, setUser] = useState(initialState?.user || null);
  
  const login = (userData) => setUser(userData);
  const logout = () => setUser(null);
  
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

Testing hooks that use this context:

```typescript
// src/hooks/useAdmin.ts
import { useAuth } from '@/contexts/auth';

export function useAdmin() {
  const { user } = useAuth();
  
  const isAdmin = user && user.role === 'admin';
  const hasPermission = (permission) => user?.permissions?.includes(permission) || false;
  
  return { isAdmin, hasPermission };
}
```

Testing:

```typescript
// tests/hooks/useAdmin.test.ts
import { renderHook } from '@testing-library/react-hooks';
import { useAdmin } from '@/hooks/useAdmin';
import { AuthProvider } from '@/contexts/auth';

// Wrapper with AuthProvider
const wrapper = ({ children, initialState }) => (
  <AuthProvider initialState={initialState}>
    {children}
  </AuthProvider>
);

describe('useAdmin Hook', () => {
  it('should identify admin users correctly', () => {
    const { result } = renderHook(() => useAdmin(), {
      wrapper,
      initialProps: {
        initialState: {
          user: { id: 'user1', role: 'admin', permissions: ['edit', 'delete'] }
        }
      }
    });
    
    expect(result.current.isAdmin).toBe(true);
  });
  
  it('should identify non-admin users correctly', () => {
    const { result } = renderHook(() => useAdmin(), {
      wrapper,
      initialProps: {
        initialState: {
          user: { id: 'user2', role: 'user', permissions: ['view'] }
        }
      }
    });
    
    expect(result.current.isAdmin).toBe(false);
  });
  
  it('should handle unauthenticated state', () => {
    const { result } = renderHook(() => useAdmin(), {
      wrapper,
      initialProps: {
        initialState: { user: null }
      }
    });
    
    expect(result.current.isAdmin).toBe(false);
  });
  
  it('should check for specific permissions', () => {
    const { result } = renderHook(() => useAdmin(), {
      wrapper,
      initialProps: {
        initialState: {
          user: { id: 'user3', role: 'editor', permissions: ['edit', 'publish'] }
        }
      }
    });
    
    expect(result.current.hasPermission('edit')).toBe(true);
    expect(result.current.hasPermission('publish')).toBe(true);
    expect(result.current.hasPermission('delete')).toBe(false);
  });
});
```

## Mocking Dependencies

### External Hooks

When testing hooks that depend on other hooks, mock the dependencies:

```typescript
// src/hooks/useDarkMode.ts
import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useMediaQuery } from './useMediaQuery';

export function useDarkMode() {
  const [darkMode, setDarkMode] = useLocalStorage('darkMode', false);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  
  useEffect(() => {
    if (darkMode === null) {
      setDarkMode(prefersDarkMode);
    }
  }, [prefersDarkMode]);
  
  return [darkMode, setDarkMode];
}
```

Testing with mocked dependencies:

```typescript
// tests/hooks/useDarkMode.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useDarkMode } from '@/hooks/useDarkMode';

// Mock dependencies
jest.mock('@/hooks/useLocalStorage', () => ({
  useLocalStorage: jest.fn()
}));

jest.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: jest.fn()
}));

import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useMediaQuery } from '@/hooks/useMediaQuery';

describe('useDarkMode Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should use stored preference if available', () => {
    // Mock stored dark mode preference
    const setDarkMode = jest.fn();
    (useLocalStorage as jest.Mock).mockReturnValue([true, setDarkMode]);
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    
    const { result } = renderHook(() => useDarkMode());
    
    // Should use the stored preference (true), not the media query result (false)
    expect(result.current[0]).toBe(true);
  });
  
  it('should use system preference if no stored preference', () => {
    // Mock no stored preference but system prefers dark mode
    const setDarkMode = jest.fn();
    (useLocalStorage as jest.Mock).mockReturnValue([null, setDarkMode]);
    (useMediaQuery as jest.Mock).mockReturnValue(true);
    
    renderHook(() => useDarkMode());
    
    // Should set the dark mode based on system preference
    expect(setDarkMode).toHaveBeenCalledWith(true);
  });
  
  it('should allow toggling the dark mode', () => {
    // Mock initial state
    const setDarkMode = jest.fn();
    (useLocalStorage as jest.Mock).mockReturnValue([false, setDarkMode]);
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    
    const { result } = renderHook(() => useDarkMode());
    
    // Toggle dark mode
    act(() => {
      result.current[1](true);
    });
    
    // Should call setDarkMode with new value
    expect(setDarkMode).toHaveBeenCalledWith(true);
  });
});
```

## Common Patterns

### Testing Hook Cleanup

Test that hooks properly clean up when unmounted:

```typescript
it('should clean up resources on unmount', () => {
  // Mock a resource that needs cleanup
  const mockUnsubscribe = jest.fn();
  const mockSubscribe = jest.fn(() => mockUnsubscribe);
  
  // Mock the resource
  jest.spyOn(SomeApi, 'subscribe').mockImplementation(mockSubscribe);
  
  // Render and then unmount the hook
  const { unmount } = renderHook(() => useSubscription());
  
  // Verify subscription was made
  expect(mockSubscribe).toHaveBeenCalled();
  
  // Unmount to trigger cleanup
  unmount();
  
  // Verify unsubscribe was called
  expect(mockUnsubscribe).toHaveBeenCalled();
});
```

### Testing Hook Rerendering

Test that hooks update correctly when dependencies change:

```typescript
it('should update when dependencies change', () => {
  // Initial props
  const initialProps = { id: '1' };
  
  // Render hook with initial props
  const { result, rerender } = renderHook(
    (props) => useData(props.id),
    { initialProps }
  );
  
  // Check initial value
  expect(result.current.id).toBe('1');
  
  // Rerender with new props
  rerender({ id: '2' });
  
  // Verify hook updated with new props
  expect(result.current.id).toBe('2');
});
```

### Testing Error Boundaries

Test how hooks handle errors:

```typescript
it('should handle errors gracefully', () => {
  // Mock a function that throws
  jest.spyOn(SomeApi, 'fetchData').mockImplementation(() => {
    throw new Error('Test error');
  });
  
  // Silence error boundary console errors
  const originalError = console.error;
  console.error = jest.fn();
  
  // Render hook that will throw
  const { result } = renderHook(() => useSomeData());
  
  // Verify error state
  expect(result.error).toBeDefined();
  expect(result.error.message).toBe('Test error');
  
  // Restore console.error
  console.error = originalError;
});
```

## Best Practices

1. **Isolate Tests From Side Effects**
   - Avoid testing `useEffect` side effects directly
   - Mock external dependencies like `fetch` with specific implementations per test
   - Use `cleanup` between tests to prevent state leakage
   - Restore original function implementations in `afterEach`

2. **Handle Asynchronous Updates**
   - Use `act()` to wrap state updates
   - For async operations, use `async/await` within `act()` calls
   - Use `waitForNextUpdate()` or more modern approaches for waiting for async changes
   - Account for multiple state updates in a single operation

3. **Test Hook Behavior, Not Implementation**
   - Test return values and state updates, not internal functions
   - Focus on public API of the hook
   - Verify state changes in response to function calls
   - Test how consumers would use the hook

4. **Use Separate Hook Instances for Complex Tests**
   - Create fresh hook instances for testing multi-step operations
   - Avoid testing multiple state transitions in a single test
   - Use multiple `renderHook` calls for different scenarios

5. **Follow Common Testing Patterns**
   - Test initialization with different props
   - Test all state transitions
   - Test error handling
   - Test cleanup on unmount
   - Test performance optimizations (if applicable)
   - Test interaction with other hooks
