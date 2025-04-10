import React from 'react';
import { render, screen, setup } from '@/tests/utils/render';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  it('renders correctly with default props', () => {
    // Render the component with default props
    render(<Button>Click Me</Button>);
    
    // Assert that the component renders correctly
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });
  
  it('renders correctly with custom props', () => {
    // Render the component with custom props
    render(
      <Button
        variant="primary"
        size="lg"
        disabled
        className="custom-class"
        data-testid="custom-button"
      >
        Custom Button
      </Button>
    );
    
    // Assert that the component renders correctly with custom props
    const button = screen.getByRole('button');
    expect(button).toHaveClass('ui-button-primary');
    expect(button).toHaveClass('ui-button-lg');
    expect(button).toHaveClass('custom-class');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('data-testid', 'custom-button');
    expect(screen.getByText('Custom Button')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', async () => {
    // Create a mock function for onClick
    const onClick = jest.fn();
    
    // Render the component with the mock function
    const { user } = setup(<Button onClick={onClick}>Click Me</Button>);
    
    // Click the button
    await user.click(screen.getByRole('button'));
    
    // Assert that the onClick function was called
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  
  it('does not call onClick when disabled', async () => {
    // Create a mock function for onClick
    const onClick = jest.fn();
    
    // Render the component with the mock function and disabled
    const { user } = setup(<Button onClick={onClick} disabled>Click Me</Button>);
    
    // Try to click the button
    await user.click(screen.getByRole('button'));
    
    // Assert that the onClick function was not called
    expect(onClick).not.toHaveBeenCalled();
  });
});
