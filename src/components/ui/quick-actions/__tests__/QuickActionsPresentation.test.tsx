import React from 'react';
import { render, screen, setup } from '@/tests/utils/render';
import { QuickActionsPresentation } from '../QuickActionsPresentation';

// Mock the UI components
jest.mock('@/components/ui/command', () => ({
  Command: ({ children }) => <div data-testid="mock-command">{children}</div>,
  CommandEmpty: ({ children }) => <div data-testid="mock-command-empty">{children}</div>,
  CommandGroup: ({ children, heading }) => <div data-testid="mock-command-group" data-heading={heading}>{children}</div>,
  CommandInput: ({ placeholder }) => <input data-testid="mock-command-input" placeholder={placeholder} />,
  CommandItem: ({ children, onSelect }) => (
    <button data-testid="mock-command-item" onClick={onSelect}>
      {children}
    </button>
  ),
  CommandList: ({ children }) => <div data-testid="mock-command-list">{children}</div>
}));

jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children, open, onOpenChange }) => (
    <div data-testid="mock-popover" data-open={open} data-onchange={onOpenChange}>
      {children}
    </div>
  ),
  PopoverContent: ({ children, className, align, side, sideOffset, alignOffset, forceMount }) => (
    <div 
      data-testid="mock-popover-content" 
      data-class={className}
      data-align={align}
      data-side={side}
      data-side-offset={sideOffset}
      data-align-offset={alignOffset}
      data-force-mount={forceMount}
    >
      {children}
    </div>
  ),
  PopoverTrigger: ({ children, asChild }) => (
    <div data-testid="mock-popover-trigger" data-as-child={asChild}>
      {children}
    </div>
  )
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, variant, size, className, onClick }) => (
    <button 
      data-testid="mock-button" 
      data-variant={variant}
      data-size={size}
      data-class={className}
      onClick={onClick}
    >
      {children}
    </button>
  )
}));

describe('QuickActionsPresentation', () => {
  // Default props for testing
  const defaultProps = {
    open: false,
    setOpen: jest.fn(),
    filteredActions: [
      {
        id: 'action-1',
        name: 'Action 1',
        description: 'Description 1',
        icon: <div>Icon 1</div>,
        href: '/action-1'
      },
      {
        id: 'action-2',
        name: 'Action 2',
        description: 'Description 2',
        icon: <div>Icon 2</div>,
        shortcut: '⌘A'
      }
    ],
    handleSelect: jest.fn()
  };

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with default props', () => {
    // Render the component
    render(<QuickActionsPresentation {...defaultProps} />);
    
    // Check that the component is rendered
    expect(screen.getByTestId('mock-popover')).toBeInTheDocument();
    expect(screen.getByTestId('mock-button')).toBeInTheDocument();
    expect(screen.getByTestId('mock-command-input')).toBeInTheDocument();
    expect(screen.getByTestId('mock-command-group')).toBeInTheDocument();
    
    // Check default button label
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    
    // Check default heading
    expect(screen.getByTestId('mock-command-group')).toHaveAttribute('data-heading', 'Quick Actions');
  });

  it('renders with custom props', () => {
    // Render the component with custom props
    render(
      <QuickActionsPresentation 
        {...defaultProps} 
        buttonLabel="Custom Label"
        heading="Custom Heading"
        emptyMessage="Custom Empty Message"
        className="custom-class"
      />
    );
    
    // Check custom button label
    expect(screen.getByText('Custom Label')).toBeInTheDocument();
    
    // Check custom heading
    expect(screen.getByTestId('mock-command-group')).toHaveAttribute('data-heading', 'Custom Heading');
    
    // Check custom empty message
    expect(screen.getByTestId('mock-command-empty')).toHaveTextContent('Custom Empty Message');
    
    // Check custom class
    expect(screen.getByTestId('mock-button')).toHaveAttribute('data-class', expect.stringContaining('custom-class'));
  });

  it('renders filtered actions', () => {
    // Render the component
    render(<QuickActionsPresentation {...defaultProps} />);
    
    // Check that actions are rendered
    const actionItems = screen.getAllByTestId('mock-command-item');
    expect(actionItems).toHaveLength(2);
    
    // Check action content
    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.getByText('Description 1')).toBeInTheDocument();
    expect(screen.getByText('Action 2')).toBeInTheDocument();
    expect(screen.getByText('Description 2')).toBeInTheDocument();
  });

  it('renders shortcuts when provided', () => {
    // Render the component
    render(<QuickActionsPresentation {...defaultProps} />);
    
    // Check that shortcut is rendered
    expect(screen.getByText('⌘A')).toBeInTheDocument();
  });

  it('calls setOpen when button is clicked', async () => {
    // Render the component
    const { user } = setup(<QuickActionsPresentation {...defaultProps} />);
    
    // Click the button
    await user.click(screen.getByTestId('mock-button'));
    
    // Check that setOpen was called with true
    expect(defaultProps.setOpen).toHaveBeenCalledWith(true);
  });

  it('calls handleSelect when an action is selected', async () => {
    // Render the component
    const { user } = setup(<QuickActionsPresentation {...defaultProps} />);
    
    // Click the first action
    await user.click(screen.getAllByTestId('mock-command-item')[0]);
    
    // Check that handleSelect was called with the correct action
    expect(defaultProps.handleSelect).toHaveBeenCalledWith(defaultProps.filteredActions[0]);
  });
});
