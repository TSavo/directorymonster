/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderForSnapshot, snapshotTest } from './setup';

// Mock the dropdown component
const DropdownComponent = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedOption, setSelectedOption] = React.useState('');
  const options = ['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5'];
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  const handleOptionClick = (option: string) => {
    setSelectedOption(option);
    setIsOpen(false);
  };
  
  return (
    <div className="dropdown-container">
      <button
        onClick={toggleDropdown}
        className="dropdown-button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        data-testid="dropdown-button"
      >
        {selectedOption || 'Select an option'}
      </button>
      
      {isOpen && (
        <ul
          className="dropdown-menu"
          role="listbox"
          aria-labelledby="dropdown-button"
          data-testid="dropdown-menu"
        >
          {options.map((option, index) => (
            <li
              key={index}
              className="dropdown-item"
              role="option"
              aria-selected={option === selectedOption}
              onClick={() => handleOptionClick(option)}
              data-testid={`dropdown-item-${index}`}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

describe('Dropdown Component Visual Regression', () => {
  it('renders the dropdown button correctly', () => {
    const container = renderForSnapshot(<DropdownComponent />);
    snapshotTest(container, 'dropdown-component-default');
  });
  
  it('renders the dropdown menu correctly when open', () => {
    const container = renderForSnapshot(<DropdownComponent />);
    
    // Click the dropdown button to open the menu
    const dropdownButton = container.querySelector('[data-testid="dropdown-button"]');
    if (dropdownButton) {
      fireEvent.click(dropdownButton);
    }
    
    snapshotTest(container, 'dropdown-component-open');
  });
  
  it('renders the selected option correctly', () => {
    const container = renderForSnapshot(<DropdownComponent />);
    
    // Click the dropdown button to open the menu
    const dropdownButton = container.querySelector('[data-testid="dropdown-button"]');
    if (dropdownButton) {
      fireEvent.click(dropdownButton);
    }
    
    // Click an option
    const option = container.querySelector('[data-testid="dropdown-item-2"]');
    if (option) {
      fireEvent.click(option);
    }
    
    snapshotTest(container, 'dropdown-component-selected');
  });
});
