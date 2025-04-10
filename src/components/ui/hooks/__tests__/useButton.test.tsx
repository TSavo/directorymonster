import { renderHook } from '@testing-library/react';
import { useButton } from '../useButton';

describe('useButton', () => {
  const mockRef = { current: null };
  
  it('returns the correct props for a basic button', () => {
    const { result } = renderHook(() => 
      useButton({
        children: 'Click me',
        variant: 'primary',
        size: 'md'
      }, mockRef as any)
    );

    expect(result.current.buttonProps.className).toContain('bg-indigo-600');
    expect(result.current.buttonProps.disabled).toBe(undefined);
    expect(result.current.buttonText).toBe('Click me');
    expect(result.current.shouldRenderAsChild).toBe(false);
    expect(result.current.showSpinner).toBe(false);
    expect(result.current.showLeftIcon).toBe(false);
    expect(result.current.showRightIcon).toBe(false);
  });

  it('handles loading state correctly', () => {
    const { result } = renderHook(() => 
      useButton({
        children: 'Click me',
        isLoading: true,
        loadingText: 'Loading...',
        variant: 'primary',
        size: 'md'
      }, mockRef as any)
    );

    expect(result.current.buttonProps.disabled).toBe(true);
    expect(result.current.buttonText).toBe('Loading...');
    expect(result.current.showSpinner).toBe(true);
    expect(result.current.showLeftIcon).toBe(false);
    expect(result.current.showRightIcon).toBe(false);
  });

  it('handles icons correctly', () => {
    const leftIcon = <span>Left</span>;
    const rightIcon = <span>Right</span>;
    
    const { result } = renderHook(() => 
      useButton({
        children: 'Click me',
        leftIcon,
        rightIcon,
        variant: 'primary',
        size: 'md'
      }, mockRef as any)
    );

    expect(result.current.leftIcon).toBe(leftIcon);
    expect(result.current.rightIcon).toBe(rightIcon);
    expect(result.current.showLeftIcon).toBe(true);
    expect(result.current.showRightIcon).toBe(true);
  });

  it('handles asChild correctly when children is a valid element', () => {
    const mockChild = <a href="#">Link</a>;
    
    const { result } = renderHook(() => 
      useButton({
        children: mockChild,
        asChild: true,
        variant: 'primary',
        size: 'md'
      }, mockRef as any)
    );

    expect(result.current.shouldRenderAsChild).toBe(true);
    expect(result.current.asChildProps).toBeDefined();
    expect(result.current.asChildProps?.className).toContain('bg-indigo-600');
  });

  it('handles asChild correctly when children is not a valid element', () => {
    const { result } = renderHook(() => 
      useButton({
        children: 'Not an element',
        asChild: true,
        variant: 'primary',
        size: 'md'
      }, mockRef as any)
    );

    expect(result.current.shouldRenderAsChild).toBe(false);
    expect(result.current.asChildProps).toBeUndefined();
  });

  it('applies different variants correctly', () => {
    const { result: primaryResult } = renderHook(() => 
      useButton({ variant: 'primary', children: 'Primary' }, mockRef as any)
    );
    expect(primaryResult.current.buttonProps.className).toContain('bg-indigo-600');

    const { result: secondaryResult } = renderHook(() => 
      useButton({ variant: 'secondary', children: 'Secondary' }, mockRef as any)
    );
    expect(secondaryResult.current.buttonProps.className).toContain('bg-white');

    const { result: dangerResult } = renderHook(() => 
      useButton({ variant: 'danger', children: 'Danger' }, mockRef as any)
    );
    expect(dangerResult.current.buttonProps.className).toContain('bg-red-600');
  });

  it('applies different sizes correctly', () => {
    const { result: smResult } = renderHook(() => 
      useButton({ size: 'sm', children: 'Small' }, mockRef as any)
    );
    expect(smResult.current.buttonProps.className).toContain('h-8');

    const { result: mdResult } = renderHook(() => 
      useButton({ size: 'md', children: 'Medium' }, mockRef as any)
    );
    expect(mdResult.current.buttonProps.className).toContain('h-10');

    const { result: lgResult } = renderHook(() => 
      useButton({ size: 'lg', children: 'Large' }, mockRef as any)
    );
    expect(lgResult.current.buttonProps.className).toContain('h-12');
  });

  it('combines custom className with variant classes', () => {
    const { result } = renderHook(() => 
      useButton({
        className: 'custom-class',
        variant: 'primary',
        size: 'md',
        children: 'Custom'
      }, mockRef as any)
    );

    expect(result.current.buttonProps.className).toContain('bg-indigo-600');
    expect(result.current.buttonProps.className).toContain('custom-class');
  });
});
