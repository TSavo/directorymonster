import React from 'react';
import { render, screen } from '@testing-library/react';
import { Dialog } from '../DialogComponent';
import { DialogContainer } from '../DialogContainer';

// Mock the DialogContainer component
jest.mock('../DialogContainer', () => ({
  DialogContainer: jest.fn(() => <div data-testid="mock-dialog-container">Dialog Container</div>)
}));

describe('Dialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders the DialogContainer with the correct props', () => {
    const props = {
      open: true,
      onOpenChange: jest.fn(),
      trigger: <button>Open</button>,
      title: "Dialog Title",
      children: "Dialog content"
    };
    
    render(<Dialog {...props} />);
    
    expect(DialogContainer).toHaveBeenCalledWith(props, expect.anything());
    expect(screen.getByTestId('mock-dialog-container')).toBeInTheDocument();
  });
});
