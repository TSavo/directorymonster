import { renderHook, act } from '@/tests/utils/hook';
import { useSearch } from '../useSearch';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

describe('useSearch', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the correct initial state', () => {
    // Render the hook
    const { result } = renderHook(() => useSearch({ siteId: 'site-1' }));
    
    // Check initial state
    expect(result.current.searchTerm).toBe('');
    expect(typeof result.current.setSearchTerm).toBe('function');
    expect(typeof result.current.handleSearch).toBe('function');
    expect(result.current.isSearching).toBe(false);
  });

  it('initializes with initialSearchTerm when provided', () => {
    // Render the hook with initialSearchTerm
    const { result } = renderHook(() => useSearch({ 
      siteId: 'site-1', 
      initialSearchTerm: 'initial query' 
    }));
    
    // Check that searchTerm is initialized with initialSearchTerm
    expect(result.current.searchTerm).toBe('initial query');
  });

  it('updates searchTerm when setSearchTerm is called', () => {
    // Render the hook
    const { result } = renderHook(() => useSearch({ siteId: 'site-1' }));
    
    // Update searchTerm
    act(() => {
      result.current.setSearchTerm('new query');
    });
    
    // Check that searchTerm was updated
    expect(result.current.searchTerm).toBe('new query');
  });

  it('navigates to search page when handleSearch is called with non-empty searchTerm', () => {
    // Render the hook
    const { result } = renderHook(() => useSearch({ siteId: 'site-1' }));
    
    // Update searchTerm
    act(() => {
      result.current.setSearchTerm('test query');
    });
    
    // Create a mock event
    const mockEvent = {
      preventDefault: jest.fn()
    };
    
    // Call handleSearch
    act(() => {
      result.current.handleSearch(mockEvent as unknown as React.FormEvent);
    });
    
    // Check that preventDefault was called
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    
    // Check that router.push was called with the correct URL
    expect(mockPush).toHaveBeenCalledWith('/search?q=test%20query&site=site-1');
    
    // Check that isSearching is true
    expect(result.current.isSearching).toBe(true);
  });

  it('does not navigate when handleSearch is called with empty searchTerm', () => {
    // Render the hook
    const { result } = renderHook(() => useSearch({ siteId: 'site-1' }));
    
    // Create a mock event
    const mockEvent = {
      preventDefault: jest.fn()
    };
    
    // Call handleSearch with empty searchTerm
    act(() => {
      result.current.handleSearch(mockEvent as unknown as React.FormEvent);
    });
    
    // Check that preventDefault was called
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    
    // Check that router.push was not called
    expect(mockPush).not.toHaveBeenCalled();
    
    // Check that isSearching is still false
    expect(result.current.isSearching).toBe(false);
  });

  it('trims whitespace from searchTerm before checking if it is empty', () => {
    // Render the hook
    const { result } = renderHook(() => useSearch({ siteId: 'site-1' }));
    
    // Update searchTerm to whitespace
    act(() => {
      result.current.setSearchTerm('   ');
    });
    
    // Create a mock event
    const mockEvent = {
      preventDefault: jest.fn()
    };
    
    // Call handleSearch
    act(() => {
      result.current.handleSearch(mockEvent as unknown as React.FormEvent);
    });
    
    // Check that preventDefault was called
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    
    // Check that router.push was not called
    expect(mockPush).not.toHaveBeenCalled();
  });
});
