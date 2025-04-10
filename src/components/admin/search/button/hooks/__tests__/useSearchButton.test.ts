import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { useSearchButton } from '../useSearchButton';

describe('useSearchButton', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns isDisabled as false by default', () => {
    const { result } = renderHook(() =>
      useSearchButton({
        onClick: mockOnClick
      })
    );

    expect(result.current.isDisabled).toBe(false);
  });

  it('returns isDisabled from props when provided', () => {
    const { result } = renderHook(() =>
      useSearchButton({
        onClick: mockOnClick,
        disabled: true
      })
    );

    expect(result.current.isDisabled).toBe(true);
  });

  it('calls onClick when handleClick is called and not disabled', () => {
    const { result } = renderHook(() =>
      useSearchButton({
        onClick: mockOnClick
      })
    );

    act(() => {
      result.current.handleClick();
    });

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when handleClick is called and disabled', () => {
    const { result } = renderHook(() =>
      useSearchButton({
        onClick: mockOnClick,
        disabled: true
      })
    );

    act(() => {
      result.current.handleClick();
    });

    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('returns the correct accessibility attributes', () => {
    const { result } = renderHook(() =>
      useSearchButton({
        onClick: mockOnClick
      })
    );

    expect(result.current.ariaLabel).toBe('Search');
  });
});
