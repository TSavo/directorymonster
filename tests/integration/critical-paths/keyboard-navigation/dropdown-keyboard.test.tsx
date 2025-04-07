/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithWrapper } from '../TestWrapper';

// Mock the dropdown component
const DropdownComponent = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const options = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
  const [selectedOption, setSelectedOption] = React.useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSelectedIndex(-1);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < options.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
      case ' ':
        if (selectedIndex >= 0) {
          e.preventDefault();
          setSelectedOption(options[selectedIndex]);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };
  
  const handleOptionClick = (option: string, index: number) => {
    setSelectedOption(option);
    setSelectedIndex(index);
    setIsOpen(false);
  };
  
  return (
    <div 
      ref={dropdownRef}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      data-testid="dropdown"
      aria-expanded={isOpen}
      role="combobox"
      aria-haspopup="listbox"
      aria-controls="dropdown-options"
    >
      <button 
        onClick={toggleDropdown}
        data-testid="dropdown-button"
        aria-label="Toggle dropdown"
      >
        {selectedOption || 'Select an option'}
      </button>
      
      {isOpen && (
        <ul 
          id="dropdown-options"
          data-testid="dropdown-options"
          role="listbox"
          aria-activedescendant={selectedIndex >= 0 ? `option-${selectedIndex}` : undefined}
        >
          {options.map((option, index) => (
            <li
              key={index}
              id={`option-${index}`}
              data-testid={`dropdown-option-${index}`}
              role="option"
              aria-selected={selectedIndex === index}
              onClick={() => handleOptionClick(option, index)}
              style={{ backgroundColor: selectedIndex === index ? '#eee' : 'transparent' }}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

describe('Dropdown Keyboard Navigation', () => {
  it('opens dropdown when clicking the button', async () => {
    renderWithWrapper(<DropdownComponent />);
    
    // Click the dropdown button
    const dropdownButton = screen.getByTestId('dropdown-button');
    fireEvent.click(dropdownButton);
    
    // Check that dropdown options are displayed
    await waitFor(() => {
      expect(screen.getByTestId('dropdown-options')).toBeInTheDocument();
    });
    
    // Check that all options are rendered
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
    expect(screen.getByText('Option 4')).toBeInTheDocument();
  });
  
  it('opens dropdown with Enter key', async () => {
    renderWithWrapper(<DropdownComponent />);
    
    // Focus the dropdown
    const dropdown = screen.getByTestId('dropdown');
    dropdown.focus();
    
    // Press Enter to open the dropdown
    fireEvent.keyDown(dropdown, { key: 'Enter' });
    
    // Check that dropdown options are displayed
    await waitFor(() => {
      expect(screen.getByTestId('dropdown-options')).toBeInTheDocument();
    });
  });
  
  it('opens dropdown with Space key', async () => {
    renderWithWrapper(<DropdownComponent />);
    
    // Focus the dropdown
    const dropdown = screen.getByTestId('dropdown');
    dropdown.focus();
    
    // Press Space to open the dropdown
    fireEvent.keyDown(dropdown, { key: ' ' });
    
    // Check that dropdown options are displayed
    await waitFor(() => {
      expect(screen.getByTestId('dropdown-options')).toBeInTheDocument();
    });
  });
  
  it('navigates through dropdown options with arrow keys', async () => {
    renderWithWrapper(<DropdownComponent />);
    
    // Focus the dropdown
    const dropdown = screen.getByTestId('dropdown');
    dropdown.focus();
    
    // Press Enter to open the dropdown
    fireEvent.keyDown(dropdown, { key: 'Enter' });
    
    // Check that dropdown options are displayed
    await waitFor(() => {
      expect(screen.getByTestId('dropdown-options')).toBeInTheDocument();
    });
    
    // Initially, no option is selected
    expect(screen.getByTestId('dropdown-option-0')).not.toHaveAttribute('aria-selected', 'true');
    
    // Press ArrowDown to select the first option
    fireEvent.keyDown(dropdown, { key: 'ArrowDown' });
    expect(screen.getByTestId('dropdown-option-0')).toHaveStyle({ backgroundColor: '#eee' });
    
    // Press ArrowDown again to select the second option
    fireEvent.keyDown(dropdown, { key: 'ArrowDown' });
    expect(screen.getByTestId('dropdown-option-1')).toHaveStyle({ backgroundColor: '#eee' });
    
    // Press ArrowUp to go back to the first option
    fireEvent.keyDown(dropdown, { key: 'ArrowUp' });
    expect(screen.getByTestId('dropdown-option-0')).toHaveStyle({ backgroundColor: '#eee' });
  });
  
  it('selects an option with Enter key', async () => {
    renderWithWrapper(<DropdownComponent />);
    
    // Focus the dropdown
    const dropdown = screen.getByTestId('dropdown');
    dropdown.focus();
    
    // Press Enter to open the dropdown
    fireEvent.keyDown(dropdown, { key: 'Enter' });
    
    // Check that dropdown options are displayed
    await waitFor(() => {
      expect(screen.getByTestId('dropdown-options')).toBeInTheDocument();
    });
    
    // Press ArrowDown to select the first option
    fireEvent.keyDown(dropdown, { key: 'ArrowDown' });
    
    // Press Enter to select the option
    fireEvent.keyDown(dropdown, { key: 'Enter' });
    
    // Check that the dropdown is closed
    expect(screen.queryByTestId('dropdown-options')).not.toBeInTheDocument();
    
    // Check that the selected option is displayed in the button
    expect(screen.getByTestId('dropdown-button')).toHaveTextContent('Option 1');
  });
  
  it('closes dropdown with Escape key', async () => {
    renderWithWrapper(<DropdownComponent />);
    
    // Focus the dropdown
    const dropdown = screen.getByTestId('dropdown');
    dropdown.focus();
    
    // Press Enter to open the dropdown
    fireEvent.keyDown(dropdown, { key: 'Enter' });
    
    // Check that dropdown options are displayed
    await waitFor(() => {
      expect(screen.getByTestId('dropdown-options')).toBeInTheDocument();
    });
    
    // Press Escape to close the dropdown
    fireEvent.keyDown(dropdown, { key: 'Escape' });
    
    // Check that dropdown options are no longer displayed
    expect(screen.queryByTestId('dropdown-options')).not.toBeInTheDocument();
  });
});
