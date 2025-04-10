import React from 'react';
import { render, screen } from '@testing-library/react';
import { DialogContainer } from '../DialogContainer';
import { useDialog } from '../hooks/useDialog';
import { DialogPresentation } from '../DialogPresentation';

// Mock the useDialog hook
jest.mock('../hooks/useDialog', () => ({
  useDialog: jest.fn()
}));

// Mock the DialogPresentation component
jest.mock('../DialogPresentation', () => ({
  DialogPresentation: jest.fn(() => <div data-testid="mock-dialog-presentation">Dialog Presentation</div>)
}));

describe('DialogContainer', () => {
  const mockUseDialogReturn = {
    isOpen: true,
    openDialog: jest.fn(),
    closeDialog: jest.fn(),
    toggleDialog: jest.fn(),
    handleOpenChange: jest.fn()
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useDialog as jest.Mock).mockReturnValue(mockUseDialogReturn);
  });
  
  it('calls useDialog with the correct props', () => {
    const onOpenChange = jest.fn();
    
    render(
      <DialogContainer
        defaultOpen={true}
        open={true}
        onOpenChange={onOpenChange}
      >
        Dialog content
      </DialogContainer>
    );
    
    expect(useDialog).toHaveBeenCalledWith({
      defaultOpen: true,
      open: true,
      onOpenChange
    });
  });
  
  it('renders DialogPresentation with the correct props', () => {
    const trigger = <button>Open</button>;
    
    render(
      <DialogContainer
        trigger={trigger}
        asChild={true}
        title="Dialog Title"
        description="Dialog Description"
        footer={<button>Save</button>}
        contentClassName="custom-content"
        headerClassName="custom-header"
        footerClassName="custom-footer"
        showCloseButton={false}
      >
        Dialog content
      </DialogContainer>
    );
    
    expect(DialogPresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        isOpen: mockUseDialogReturn.isOpen,
        handleOpenChange: mockUseDialogReturn.handleOpenChange,
        trigger,
        asChild: true,
        title: "Dialog Title",
        description: "Dialog Description",
        contentClassName: "custom-content",
        headerClassName: "custom-header",
        footerClassName: "custom-footer",
        showCloseButton: false,
        children: "Dialog content"
      }),
      expect.anything()
    );
  });
  
  it('renders the DialogPresentation component', () => {
    render(
      <DialogContainer>
        Dialog content
      </DialogContainer>
    );
    
    expect(screen.getByTestId('mock-dialog-presentation')).toBeInTheDocument();
  });
});
