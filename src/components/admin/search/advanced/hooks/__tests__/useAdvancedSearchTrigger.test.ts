import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { useAdvancedSearchTrigger } from '../useAdvancedSearchTrigger';

describe('useAdvancedSearchTrigger', () => {
  const mockOnTrigger = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls onTrigger when handleTrigger is called', () => {
    const { result } = renderHook(() =>
      useAdvancedSearchTrigger({
        onTrigger: mockOnTrigger
      })
    );

    act(() => {
      result.current.handleTrigger();
    });

    expect(mockOnTrigger).toHaveBeenCalledTimes(1);
  });

  it('returns the correct accessibility attributes', () => {
    const { result } = renderHook(() =>
      useAdvancedSearchTrigger({
        onTrigger: mockOnTrigger
      })
    );

    expect(result.current.ariaLabel).toBe('Open advanced search');
  });
});
