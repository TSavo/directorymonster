import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { useSearchInput } from '../useSearchInput';

describe('useSearchInput', () => {
  const mockValueChange = jest.fn();
  const mockSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with the provided initial value', () => {
    const { result } = renderHook(() =>
      useSearchInput({
        initialValue: 'test query',
        onValueChange: mockValueChange,
        onSubmit: mockSubmit
      })
    );

    expect(result.current.value).toBe('test query');
  });

  it('initializes with empty string when no initial value is provided', () => {
    const { result } = renderHook(() =>
      useSearchInput({
        onValueChange: mockValueChange,
        onSubmit: mockSubmit
      })
    );

    expect(result.current.value).toBe('');
  });

  it('calls onValueChange when handleChange is called', () => {
    const { result } = renderHook(() =>
      useSearchInput({
        onValueChange: mockValueChange,
        onSubmit: mockSubmit
      })
    );

    const mockEvent = {
      target: { value: 'new value' }
    } as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleChange(mockEvent);
    });

    expect(mockValueChange).toHaveBeenCalledWith('new value');
    expect(result.current.value).toBe('new value');
  });

  it('calls onSubmit when handleKeyDown is called with Enter key', () => {
    const { result } = renderHook(() =>
      useSearchInput({
        onValueChange: mockValueChange,
        onSubmit: mockSubmit
      })
    );

    const mockEvent = {
      key: 'Enter',
      preventDefault: jest.fn()
    } as unknown as React.KeyboardEvent<HTMLInputElement>;

    act(() => {
      result.current.handleKeyDown(mockEvent);
    });

    expect(mockSubmit).toHaveBeenCalledTimes(1);
    expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
  });

  it('does not call onSubmit when handleKeyDown is called with a key other than Enter', () => {
    const { result } = renderHook(() =>
      useSearchInput({
        onValueChange: mockValueChange,
        onSubmit: mockSubmit
      })
    );

    const mockEvent = {
      key: 'a',
      preventDefault: jest.fn()
    } as unknown as React.KeyboardEvent<HTMLInputElement>;

    act(() => {
      result.current.handleKeyDown(mockEvent);
    });

    expect(mockSubmit).not.toHaveBeenCalled();
    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
  });

  it('clears the input value when handleClear is called', () => {
    const { result } = renderHook(() =>
      useSearchInput({
        initialValue: 'test query',
        onValueChange: mockValueChange,
        onSubmit: mockSubmit
      })
    );

    expect(result.current.value).toBe('test query');

    act(() => {
      result.current.handleClear();
    });

    expect(result.current.value).toBe('');
    expect(mockValueChange).toHaveBeenCalledWith('');
  });

  it('returns the correct accessibility attributes', () => {
    const { result } = renderHook(() =>
      useSearchInput({
        onValueChange: mockValueChange,
        onSubmit: mockSubmit
      })
    );

    expect(result.current.inputId).toBe('search-input');
    expect(result.current.ariaLabel).toBe('Search');
  });
});
