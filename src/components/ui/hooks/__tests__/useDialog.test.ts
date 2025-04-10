import { renderHook, act } from '@testing-library/react';
import { useDialog } from '../useDialog';

describe('useDialog', () => {
  it('initializes with defaultOpen=false by default', () => {
    const { result } = renderHook(() => useDialog());
    
    expect(result.current.isOpen).toBe(false);
  });
  
  it('initializes with provided defaultOpen value', () => {
    const { result } = renderHook(() => useDialog({ defaultOpen: true }));
    
    expect(result.current.isOpen).toBe(true);
  });
  
  it('uses controlled open state when provided', () => {
    const { result, rerender } = renderHook(
      (props) => useDialog(props),
      { initialProps: { open: true } }
    );
    
    expect(result.current.isOpen).toBe(true);
    
    rerender({ open: false });
    
    expect(result.current.isOpen).toBe(false);
  });
  
  it('calls onOpenChange when state changes', () => {
    const onOpenChange = jest.fn();
    const { result } = renderHook(() => useDialog({ onOpenChange }));
    
    act(() => {
      result.current.openDialog();
    });
    
    expect(onOpenChange).toHaveBeenCalledWith(true);
    
    act(() => {
      result.current.closeDialog();
    });
    
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
  
  it('provides openDialog function to open the dialog', () => {
    const { result } = renderHook(() => useDialog());
    
    act(() => {
      result.current.openDialog();
    });
    
    expect(result.current.isOpen).toBe(true);
  });
  
  it('provides closeDialog function to close the dialog', () => {
    const { result } = renderHook(() => useDialog({ defaultOpen: true }));
    
    act(() => {
      result.current.closeDialog();
    });
    
    expect(result.current.isOpen).toBe(false);
  });
  
  it('provides toggleDialog function to toggle the dialog state', () => {
    const { result } = renderHook(() => useDialog());
    
    // Toggle from closed to open
    act(() => {
      result.current.toggleDialog();
    });
    
    expect(result.current.isOpen).toBe(true);
    
    // Toggle from open to closed
    act(() => {
      result.current.toggleDialog();
    });
    
    expect(result.current.isOpen).toBe(false);
  });
  
  it('provides handleOpenChange function to set specific state', () => {
    const { result } = renderHook(() => useDialog());
    
    act(() => {
      result.current.handleOpenChange(true);
    });
    
    expect(result.current.isOpen).toBe(true);
    
    // Set to the same state
    act(() => {
      result.current.handleOpenChange(true);
    });
    
    expect(result.current.isOpen).toBe(true);
    
    // Set to different state
    act(() => {
      result.current.handleOpenChange(false);
    });
    
    expect(result.current.isOpen).toBe(false);
  });
});
