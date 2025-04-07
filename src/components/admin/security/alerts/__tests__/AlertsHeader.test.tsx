import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AlertsHeader } from '../AlertsHeader';

describe('AlertsHeader', () => {
  const mockProps = {
    activeTab: 'all',
    onTabChange: jest.fn()
  };

  it('renders all tabs correctly', () => {
    render(<AlertsHeader {...mockProps} />);
    
    // Check that all tabs are rendered
    expect(screen.getByTestId('tab-all')).toBeInTheDocument();
    expect(screen.getByTestId('tab-new')).toBeInTheDocument();
    expect(screen.getByTestId('tab-acknowledged')).toBeInTheDocument();
    expect(screen.getByTestId('tab-resolved')).toBeInTheDocument();
  });

  it('highlights the active tab', () => {
    render(<AlertsHeader {...mockProps} />);
    
    // Check that the active tab has the correct attribute
    const allTab = screen.getByTestId('tab-all');
    expect(allTab).toHaveAttribute('data-state', 'active');
    
    // Check that other tabs are not active
    const newTab = screen.getByTestId('tab-new');
    expect(newTab).not.toHaveAttribute('data-state', 'active');
  });

  it('calls onTabChange when a tab is clicked', () => {
    render(<AlertsHeader {...mockProps} />);
    
    // Click the "New" tab
    fireEvent.click(screen.getByTestId('tab-new'));
    
    // Check that onTabChange was called with the correct value
    expect(mockProps.onTabChange).toHaveBeenCalledWith('new');
  });

  it('renders with a different active tab', () => {
    const propsWithDifferentTab = {
      ...mockProps,
      activeTab: 'new'
    };
    
    render(<AlertsHeader {...propsWithDifferentTab} />);
    
    // Check that the "New" tab is active
    const newTab = screen.getByTestId('tab-new');
    expect(newTab).toHaveAttribute('data-state', 'active');
    
    // Check that the "All" tab is not active
    const allTab = screen.getByTestId('tab-all');
    expect(allTab).not.toHaveAttribute('data-state', 'active');
  });
});
