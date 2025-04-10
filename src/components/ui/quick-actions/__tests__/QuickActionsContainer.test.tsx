import React from 'react';
import { render } from '@/tests/utils/render';
import { QuickActionsContainer } from '../QuickActionsContainer';
import { QuickActionsPresentation } from '../QuickActionsPresentation';

// Mock the useQuickActions hook
jest.mock('../hooks/useQuickActions', () => ({
  useQuickActions: jest.fn(() => ({
    open: false,
    setOpen: jest.fn(),
    filteredActions: [
      {
        id: 'action-1',
        name: 'Action 1',
        description: 'Description 1',
        icon: <div>Icon 1</div>,
        href: '/action-1'
      }
    ],
    handleSelect: jest.fn(),
    currentContext: 'dashboard'
  }))
}));

// Mock the QuickActionsPresentation component
jest.mock('../QuickActionsPresentation', () => ({
  QuickActionsPresentation: jest.fn(() => <div data-testid="mock-presentation" />)
}));

describe('QuickActionsContainer', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the presentation component with correct props', () => {
    // Render the container
    render(<QuickActionsContainer />);
    
    // Check that the presentation component was rendered with correct props
    expect(QuickActionsPresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        open: expect.any(Boolean),
        setOpen: expect.any(Function),
        filteredActions: expect.any(Array),
        handleSelect: expect.any(Function)
      }),
      expect.anything()
    );
  });

  it('passes customActions to the useQuickActions hook', () => {
    // Import the actual hook to access the mock
    const { useQuickActions } = require('../hooks/useQuickActions');
    
    // Create custom actions
    const customActions = [
      {
        id: 'custom-action',
        name: 'Custom Action',
        description: 'A custom action',
        icon: <div>Icon</div>,
        href: '/custom'
      }
    ];
    
    // Render the container with customActions
    render(<QuickActionsContainer customActions={customActions} />);
    
    // Check that useQuickActions was called with correct props
    expect(useQuickActions).toHaveBeenCalledWith(
      expect.objectContaining({
        customActions
      })
    );
  });

  it('passes initialOpen to the useQuickActions hook', () => {
    // Import the actual hook to access the mock
    const { useQuickActions } = require('../hooks/useQuickActions');
    
    // Render the container with initialOpen
    render(<QuickActionsContainer initialOpen={true} />);
    
    // Check that useQuickActions was called with correct props
    expect(useQuickActions).toHaveBeenCalledWith(
      expect.objectContaining({
        initialOpen: true
      })
    );
  });

  it('passes className to the presentation component', () => {
    // Render the container with className
    render(<QuickActionsContainer className="custom-class" />);
    
    // Check that the presentation component was rendered with correct props
    expect(QuickActionsPresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        className: 'custom-class'
      }),
      expect.anything()
    );
  });

  it('passes buttonLabel to the presentation component', () => {
    // Render the container with buttonLabel
    render(<QuickActionsContainer buttonLabel="Custom Label" />);
    
    // Check that the presentation component was rendered with correct props
    expect(QuickActionsPresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        buttonLabel: 'Custom Label'
      }),
      expect.anything()
    );
  });

  it('passes heading to the presentation component', () => {
    // Render the container with heading
    render(<QuickActionsContainer heading="Custom Heading" />);
    
    // Check that the presentation component was rendered with correct props
    expect(QuickActionsPresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        heading: 'Custom Heading'
      }),
      expect.anything()
    );
  });

  it('passes emptyMessage to the presentation component', () => {
    // Render the container with emptyMessage
    render(<QuickActionsContainer emptyMessage="Custom Empty Message" />);
    
    // Check that the presentation component was rendered with correct props
    expect(QuickActionsPresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        emptyMessage: 'Custom Empty Message'
      }),
      expect.anything()
    );
  });

  it('uses the provided actionsHook when specified', () => {
    // Create a mock actions hook
    const mockActionsHook = jest.fn(() => ({
      open: true,
      setOpen: jest.fn(),
      filteredActions: [],
      handleSelect: jest.fn(),
      currentContext: 'custom'
    }));
    
    // Render the container with the custom actions hook
    render(<QuickActionsContainer actionsHook={mockActionsHook} />);
    
    // Check that the custom actions hook was used
    expect(mockActionsHook).toHaveBeenCalled();
  });
});
