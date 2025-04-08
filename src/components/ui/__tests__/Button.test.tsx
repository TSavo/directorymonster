import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';
import Link from 'next/link';

describe('Button', () => {
  it('renders correctly with default props', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-indigo-600'); // Primary variant
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-indigo-600');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-white');
    expect(screen.getByRole('button')).toHaveClass('border-gray-300');

    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');

    rerender(<Button variant="success">Success</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-green-600');

    rerender(<Button variant="warning">Warning</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-amber-500');

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toHaveClass('hover:bg-gray-100');

    rerender(<Button variant="link">Link</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-indigo-600');

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button')).toHaveClass('border');
    expect(screen.getByRole('button')).toHaveClass('bg-transparent');

    rerender(<Button variant="outline-primary">Outline Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('border-indigo-600');
    expect(screen.getByRole('button')).toHaveClass('text-indigo-600');

    rerender(<Button variant="outline-danger">Outline Danger</Button>);
    expect(screen.getByRole('button')).toHaveClass('border-red-600');
    expect(screen.getByRole('button')).toHaveClass('text-red-600');

    rerender(<Button variant="outline-success">Outline Success</Button>);
    expect(screen.getByRole('button')).toHaveClass('border-green-600');
    expect(screen.getByRole('button')).toHaveClass('text-green-600');

    rerender(<Button variant="outline-warning">Outline Warning</Button>);
    expect(screen.getByRole('button')).toHaveClass('border-amber-500');
    expect(screen.getByRole('button')).toHaveClass('text-amber-500');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Button size="xs">Extra Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-6');
    expect(screen.getByRole('button')).toHaveClass('text-xs');

    rerender(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-8');

    rerender(<Button size="md">Medium</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-10');
    expect(screen.getByRole('button')).toHaveClass('px-4');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-12');
    expect(screen.getByRole('button')).toHaveClass('px-6');

    rerender(<Button size="icon">Icon</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-10');
    expect(screen.getByRole('button')).toHaveClass('w-10');

    rerender(<Button size="full">Full Width</Button>);
    expect(screen.getByRole('button')).toHaveClass('w-full');
    expect(screen.getByRole('button')).toHaveClass('justify-center');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText('Loading')).toBeInTheDocument();
    expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument(); // Loading spinner
  });

  it('shows loading text when provided', () => {
    render(<Button isLoading loadingText="Saving...">Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.queryByText('Submit')).not.toBeInTheDocument();
    expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument(); // Loading spinner
  });

  it('can be disabled', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('accepts additional className', () => {
    render(<Button className="custom-class">Custom</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('works with asChild and Link', () => {
    render(
      <Button asChild>
        <Link href="/test">Link Button</Link>
      </Button>
    );
    const link = screen.getByRole('link', { name: /link button/i });
    expect(link).toHaveAttribute('href', '/test');
    expect(link).toHaveClass('bg-indigo-600'); // Should have button styling
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref Button</Button>);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.textContent).toBe('Ref Button');
  });

  it('renders with left icon', () => {
    const leftIcon = <span data-testid="left-icon">🔍</span>;
    render(<Button leftIcon={leftIcon}>Search</Button>);
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  it('renders with right icon', () => {
    const rightIcon = <span data-testid="right-icon">→</span>;
    render(<Button rightIcon={rightIcon}>Next</Button>);
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('does not show right icon when loading', () => {
    const rightIcon = <span data-testid="right-icon">→</span>;
    render(<Button rightIcon={rightIcon} isLoading>Next</Button>);
    expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument();
  });
});
