import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { useSearchBar } from '../useSearchBar';

// Mock setTimeout
jest.useFakeTimers();

describe('useSearchBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
  });

  it('initializes with the provided initial search term', () => {
    const { result } = renderHook(() =>
      useSearchBar({
        initialSearchTerm: 'test query'
      })
    );

    expect(result.current.searchTerm).toBe('test query');
  });

  it('initializes with empty string when no initial search term is provided', () => {
    const { result } = renderHook(() => useSearchBar());

    expect(result.current.searchTerm).toBe('');
  });

  it('initializes with isSearching as false', () => {
    const { result } = renderHook(() => useSearchBar());

    expect(result.current.isSearching).toBe(false);
  });

  it('updates searchTerm when handleSearchTermChange is called', () => {
    const { result } = renderHook(() => useSearchBar());

    act(() => {
      result.current.handleSearchTermChange('new search term');
    });

    expect(result.current.searchTerm).toBe('new search term');
  });

  it('sets isSearching to true and logs when handleSearchSubmit is called with non-empty search term', () => {
    const { result } = renderHook(() =>
      useSearchBar({
        initialSearchTerm: 'test query'
      })
    );

    act(() => {
      result.current.handleSearchSubmit();
    });

    expect(result.current.isSearching).toBe(true);
    expect(console.log).toHaveBeenCalledWith('Search submitted:', 'test query');
  });

  it('does not set isSearching to true or log when handleSearchSubmit is called with empty search term', () => {
    const { result } = renderHook(() => useSearchBar());

    act(() => {
      result.current.handleSearchSubmit();
    });

    expect(result.current.isSearching).toBe(false);
    expect(console.log).not.toHaveBeenCalled();
  });

  it('resets isSearching to false after a delay when handleSearchSubmit is called', () => {
    const { result } = renderHook(() =>
      useSearchBar({
        initialSearchTerm: 'test query'
      })
    );

    act(() => {
      result.current.handleSearchSubmit();
    });

    expect(result.current.isSearching).toBe(true);

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.isSearching).toBe(false);
  });

  it('logs when handleAdvancedSearchOpen is called', () => {
    const { result } = renderHook(() => useSearchBar());

    act(() => {
      result.current.handleAdvancedSearchOpen();
    });

    expect(console.log).toHaveBeenCalledWith('Advanced search opened');
  });
});
