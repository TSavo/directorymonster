import { renderHook, act } from '@/tests/utils/hook';
import { useCounter } from '@/hooks/useCounter';

// Mock the useCounter hook for this example
jest.mock('@/hooks/useCounter', () => ({
  useCounter: (initialValue = 0) => {
    const [count, setCount] = React.useState(initialValue);
    
    const increment = () => setCount(prev => prev + 1);
    const decrement = () => setCount(prev => prev - 1);
    const reset = () => setCount(initialValue);
    
    return { count, increment, decrement, reset };
  }
}));

describe('useCounter Hook', () => {
  it('initializes with default value', () => {
    // Render the hook
    const { result } = renderHook(() => useCounter());
    
    // Assert that the hook initializes with the default value
    expect(result.current.count).toBe(0);
  });
  
  it('initializes with custom value', () => {
    // Render the hook with a custom initial value
    const { result } = renderHook(() => useCounter(10));
    
    // Assert that the hook initializes with the custom value
    expect(result.current.count).toBe(10);
  });
  
  it('increments the counter', () => {
    // Render the hook
    const { result } = renderHook(() => useCounter());
    
    // Call the increment function
    act(() => {
      result.current.increment();
    });
    
    // Assert that the counter was incremented
    expect(result.current.count).toBe(1);
  });
  
  it('decrements the counter', () => {
    // Render the hook
    const { result } = renderHook(() => useCounter(5));
    
    // Call the decrement function
    act(() => {
      result.current.decrement();
    });
    
    // Assert that the counter was decremented
    expect(result.current.count).toBe(4);
  });
  
  it('resets the counter', () => {
    // Render the hook
    const { result } = renderHook(() => useCounter(5));
    
    // Increment the counter
    act(() => {
      result.current.increment();
    });
    
    // Assert that the counter was incremented
    expect(result.current.count).toBe(6);
    
    // Reset the counter
    act(() => {
      result.current.reset();
    });
    
    // Assert that the counter was reset
    expect(result.current.count).toBe(5);
  });
});
