import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DialogPresentation } from '../DialogPresentation';
import { Button } from '../Button';

// Mock the dialog primitive components
jest.mock('../dialog', () => ({
  Dialog: ({ children, open, onOpenChange }) => (
    <div data-testid="mock-dialog" data-open={open} onClick={() => onOpenChange(!open)}>
      {children}
    </div>
  ),
  DialogTrigger: ({ children, asChild }) => (
    <div data-testid="mock-dialog-trigger" data-as-child={asChild}>
      {children}
    </div>
  ),
  DialogContent: ({ children, className }) => (
    <div data-testid="mock-dialog-content" className={className}>
      {children}
    </div>
  ),
  DialogHeader: ({ children, className }) => (
    <div data-testid="mock-dialog-header" className={className}>
      {children}
    </div>
  ),
  DialogFooter: ({ children, className }) => (
    <div data-testid="mock-dialog-footer" className={className}>
      {children}
    </div>
  ),
  DialogTitle: ({ children }) => <div data-testid="mock-dialog-title">{children}</div>,
  DialogDescription: ({ children }) => <div data-testid="mock-dialog-description">{children}</div>,
  DialogClose: ({ className }) => <button data-testid="mock-dialog-close" className={className}>Close</button>
}));

describe('DialogPresentation', () => {
  const mockHandleOpenChange = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders a dialog with the correct open state', () => {
    render(
      <DialogPresentation
        isOpen={true}
        handleOpenChange={mockHandleOpenChange}
      >
        Dialog content
      </DialogPresentation>
    );
    
    const dialog = screen.getByTestId('mock-dialog');
    expect(dialog).toHaveAttribute('data-open', 'true');
    expect(screen.getByText('Dialog content')).toBeInTheDocument();
  });
  
  it('renders a trigger when provided', () => {
    render(
      <DialogPresentation
        isOpen={false}
        handleOpenChange={mockHandleOpenChange}
        trigger={<Button>Open Dialog</Button>}
      >
        Dialog content
      </DialogPresentation>
    );
    
    const trigger = screen.getByTestId('mock-dialog-trigger');
    expect(trigger).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open dialog/i })).toBeInTheDocument();
  });
  
  it('renders with asChild when specified', () => {
    render(
      <DialogPresentation
        isOpen={false}
        handleOpenChange={mockHandleOpenChange}
        trigger={<Button>Open Dialog</Button>}
        asChild={true}
      >
        Dialog content
      </DialogPresentation>
    );
    
    const trigger = screen.getByTestId('mock-dialog-trigger');
    expect(trigger).toHaveAttribute('data-as-child', 'true');
  });
  
  it('renders title and description when provided', () => {
    render(
      <DialogPresentation
        isOpen={true}
        handleOpenChange={mockHandleOpenChange}
        title="Dialog Title"
        description="Dialog Description"
      >
        Dialog content
      </DialogPresentation>
    );
    
    expect(screen.getByTestId('mock-dialog-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-dialog-title')).toHaveTextContent('Dialog Title');
    expect(screen.getByTestId('mock-dialog-description')).toHaveTextContent('Dialog Description');
  });
  
  it('renders footer when provided', () => {
    render(
      <DialogPresentation
        isOpen={true}
        handleOpenChange={mockHandleOpenChange}
        footer={<Button>Save</Button>}
      >
        Dialog content
      </DialogPresentation>
    );
    
    expect(screen.getByTestId('mock-dialog-footer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });
  
  it('applies custom class names when provided', () => {
    render(
      <DialogPresentation
        isOpen={true}
        handleOpenChange={mockHandleOpenChange}
        title="Dialog Title"
        footer={<Button>Save</Button>}
        contentClassName="custom-content"
        headerClassName="custom-header"
        footerClassName="custom-footer"
      >
        Dialog content
      </DialogPresentation>
    );
    
    expect(screen.getByTestId('mock-dialog-content')).toHaveClass('custom-content');
    expect(screen.getByTestId('mock-dialog-header')).toHaveClass('custom-header');
    expect(screen.getByTestId('mock-dialog-footer')).toHaveClass('custom-footer');
  });
  
  it('hides close button when showCloseButton is false', () => {
    render(
      <DialogPresentation
        isOpen={true}
        handleOpenChange={mockHandleOpenChange}
        showCloseButton={false}
      >
        Dialog content
      </DialogPresentation>
    );
    
    const closeButton = screen.getByTestId('mock-dialog-close');
    expect(closeButton).toHaveClass('hidden');
  });
});
