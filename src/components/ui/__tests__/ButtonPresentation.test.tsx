import React from 'react';
import { render, screen } from '@testing-library/react';
import { ButtonPresentation } from '../ButtonPresentation';

describe('ButtonPresentation', () => {
  const mockButtonProps = {
    className: 'test-class',
    disabled: false,
    'data-testid': 'test-button'
  };

  it('renders a button with the correct props', () => {
    render(
      <ButtonPresentation
        buttonProps={mockButtonProps}
        showSpinner={false}
        showLeftIcon={false}
        showRightIcon={false}
        buttonText="Click me"
      />
    );
    
    const button = screen.getByTestId('test-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('test-class');
    expect(button).not.toBeDisabled();
    expect(button).toHaveTextContent('Click me');
  });

  it('renders a loading spinner when showSpinner is true', () => {
    render(
      <ButtonPresentation
        buttonProps={mockButtonProps}
        showSpinner={true}
        showLeftIcon={false}
        showRightIcon={false}
        buttonText="Loading"
      />
    );
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByTestId('test-button')).toHaveTextContent('Loading');
  });

  it('renders a left icon when showLeftIcon is true', () => {
    render(
      <ButtonPresentation
        buttonProps={mockButtonProps}
        showSpinner={false}
        showLeftIcon={true}
        showRightIcon={false}
        buttonText="With Icon"
        leftIcon={<span>Left</span>}
      />
    );
    
    const leftIconContainer = screen.getByTestId('left-icon');
    expect(leftIconContainer).toBeInTheDocument();
    expect(leftIconContainer).toHaveTextContent('Left');
  });

  it('renders a right icon when showRightIcon is true', () => {
    render(
      <ButtonPresentation
        buttonProps={mockButtonProps}
        showSpinner={false}
        showLeftIcon={false}
        showRightIcon={true}
        buttonText="With Icon"
        rightIcon={<span>Right</span>}
      />
    );
    
    const rightIconContainer = screen.getByTestId('right-icon');
    expect(rightIconContainer).toBeInTheDocument();
    expect(rightIconContainer).toHaveTextContent('Right');
  });

  it('does not render icons when spinner is shown', () => {
    render(
      <ButtonPresentation
        buttonProps={mockButtonProps}
        showSpinner={true}
        showLeftIcon={true}
        showRightIcon={true}
        buttonText="Loading"
        leftIcon={<span>Left</span>}
        rightIcon={<span>Right</span>}
      />
    );
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument();
  });

  it('passes additional props to the button element', () => {
    const mockPropsWithExtra = {
      ...mockButtonProps,
      'aria-label': 'Test Button',
      onClick: jest.fn()
    };

    render(
      <ButtonPresentation
        buttonProps={mockPropsWithExtra}
        showSpinner={false}
        showLeftIcon={false}
        showRightIcon={false}
        buttonText="Click me"
      />
    );
    
    const button = screen.getByTestId('test-button');
    expect(button).toHaveAttribute('aria-label', 'Test Button');
  });

  it('renders a disabled button when disabled is true', () => {
    render(
      <ButtonPresentation
        buttonProps={{ ...mockButtonProps, disabled: true }}
        showSpinner={false}
        showLeftIcon={false}
        showRightIcon={false}
        buttonText="Disabled"
      />
    );
    
    expect(screen.getByTestId('test-button')).toBeDisabled();
  });
});
