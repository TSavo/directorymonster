/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithWrapper } from '../TestWrapper';

// Mock the modal component
const ModalComponent = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const modalRef = React.useRef<HTMLDivElement>(null);
  const [focusableElements, setFocusableElements] = React.useState<HTMLElement[]>([]);
  const [focusIndex, setFocusIndex] = React.useState(0);
  
  const openModal = () => {
    setIsOpen(true);
  };
  
  const closeModal = () => {
    setIsOpen(false);
  };
  
  React.useEffect(() => {
    if (isOpen && modalRef.current) {
      // Get all focusable elements in the modal
      const elements = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      setFocusableElements(Array.from(elements));
      
      // Focus the first element
      if (elements.length > 0) {
        elements[0].focus();
        setFocusIndex(0);
      }
      
      // Add event listener for Escape key
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          closeModal();
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen]);
  
  const handleTabKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && focusableElements.length > 0) {
      e.preventDefault();
      
      const nextIndex = e.shiftKey
        ? (focusIndex - 1 + focusableElements.length) % focusableElements.length
        : (focusIndex + 1) % focusableElements.length;
      
      focusableElements[nextIndex].focus();
      setFocusIndex(nextIndex);
    }
  };
  
  return (
    <div>
      <button onClick={openModal} data-testid="open-modal-button">Open Modal</button>
      
      {isOpen && (
        <div
          ref={modalRef}
          data-testid="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onKeyDown={handleTabKey}
        >
          <div data-testid="modal-content">
            <h2 id="modal-title">Modal Title</h2>
            <p>Modal content goes here.</p>
            
            <div>
              <input type="text" placeholder="Name" data-testid="modal-input" />
              <select data-testid="modal-select">
                <option>Option 1</option>
                <option>Option 2</option>
              </select>
              <button data-testid="modal-button">Submit</button>
              <button onClick={closeModal} data-testid="close-modal-button">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

describe('Modal Keyboard Navigation', () => {
  it('opens modal when clicking the button', async () => {
    renderWithWrapper(<ModalComponent />);
    
    // Click the open modal button
    const openButton = screen.getByTestId('open-modal-button');
    fireEvent.click(openButton);
    
    // Check that modal is displayed
    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
    
    // Check that modal content is rendered
    expect(screen.getByText('Modal Title')).toBeInTheDocument();
    expect(screen.getByText('Modal content goes here.')).toBeInTheDocument();
  });
  
  it('closes modal when clicking the close button', async () => {
    renderWithWrapper(<ModalComponent />);
    
    // Click the open modal button
    const openButton = screen.getByTestId('open-modal-button');
    fireEvent.click(openButton);
    
    // Check that modal is displayed
    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
    
    // Click the close modal button
    const closeButton = screen.getByTestId('close-modal-button');
    fireEvent.click(closeButton);
    
    // Check that modal is no longer displayed
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });
  
  it('closes modal with Escape key', async () => {
    renderWithWrapper(<ModalComponent />);
    
    // Click the open modal button
    const openButton = screen.getByTestId('open-modal-button');
    fireEvent.click(openButton);
    
    // Check that modal is displayed
    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
    
    // Press Escape to close the modal
    fireEvent.keyDown(screen.getByTestId('modal'), { key: 'Escape' });
    
    // Check that modal is no longer displayed
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });
  
  it('traps focus within the modal', async () => {
    renderWithWrapper(<ModalComponent />);
    
    // Click the open modal button
    const openButton = screen.getByTestId('open-modal-button');
    fireEvent.click(openButton);
    
    // Check that modal is displayed
    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
    
    // Get all focusable elements in the modal
    const input = screen.getByTestId('modal-input');
    const select = screen.getByTestId('modal-select');
    const button = screen.getByTestId('modal-button');
    const closeButton = screen.getByTestId('close-modal-button');
    
    // Check that the first element is focused
    expect(document.activeElement).toBe(input);
    
    // Press Tab to move to the next element
    fireEvent.keyDown(input, { key: 'Tab' });
    expect(document.activeElement).toBe(select);
    
    // Press Tab to move to the next element
    fireEvent.keyDown(select, { key: 'Tab' });
    expect(document.activeElement).toBe(button);
    
    // Press Tab to move to the next element
    fireEvent.keyDown(button, { key: 'Tab' });
    expect(document.activeElement).toBe(closeButton);
    
    // Press Tab to cycle back to the first element
    fireEvent.keyDown(closeButton, { key: 'Tab' });
    expect(document.activeElement).toBe(input);
    
    // Press Shift+Tab to move to the last element
    fireEvent.keyDown(input, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(closeButton);
  });
});
