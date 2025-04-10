import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /click me/i }));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Button variant="default">Default</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'default');
    
    rerender(<Button variant="destructive">Destructive</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'destructive');
    
    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'outline');
    
    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'secondary');
    
    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'ghost');
    
    rerender(<Button variant="link">Link</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'link');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Button size="default">Default</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'default');
    
    rerender(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'sm');
    
    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'lg');
    
    rerender(<Button size="icon">Icon</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'icon');
  });

  it('renders in loading state', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-loading', 'true');
  });

  it('renders with loading text when provided', () => {
    render(<Button isLoading loadingText="Please wait...">Submit</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Please wait...');
  });

  it('renders with left icon', () => {
    render(<Button leftIcon={<span data-testid="left-icon-test">🔍</span>}>Search</Button>);
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('left-icon-test')).toBeInTheDocument();
  });

  it('renders with right icon', () => {
    render(<Button rightIcon={<span data-testid="right-icon-test">→</span>}>Next</Button>);
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon-test')).toBeInTheDocument();
  });

  it('renders as a div when asChild is true', () => {
    render(<Button asChild>As Child</Button>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('As Child')).toBeInTheDocument();
  });
});
