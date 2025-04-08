import React from 'react';
import { render, screen } from '@testing-library/react';
import { AdminLayoutPresentation } from '../AdminLayoutPresentation';

// Mock the dependencies
jest.mock('../AdminSidebar', () => ({
  AdminSidebar: ({ isOpen, closeSidebar }) => (
    <div data-testid="mock-sidebar">
      <span data-testid="sidebar-open">{isOpen.toString()}</span>
      <button data-testid="close-sidebar-button" onClick={closeSidebar}>Close</button>
    </div>
  )
}));

jest.mock('../AdminHeader', () => ({
  AdminHeader: ({ toggleSidebar }) => (
    <header data-testid="mock-header">
      <button data-testid="toggle-sidebar-button" onClick={toggleSidebar}>Toggle</button>
    </header>
  )
}));

jest.mock('@/components/ui/context-breadcrumbs', () => ({
  ContextBreadcrumbs: () => <div data-testid="mock-breadcrumbs">Breadcrumbs</div>
}));

jest.mock('@/components/ui/quick-actions', () => ({
  QuickActionsMenu: () => <div data-testid="mock-quick-actions">Quick Actions</div>
}));

describe('AdminLayoutPresentation', () => {
  const mockChildren = <div data-testid="mock-children">Test Children</div>;
  const mockProps = {
    children: mockChildren,
    sidebarOpen: false,
    toggleSidebar: jest.fn(),
    closeSidebar: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the sidebar, header, breadcrumbs, quick actions, and children', () => {
    render(<AdminLayoutPresentation {...mockProps} />);
    
    expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-breadcrumbs')).toBeInTheDocument();
    expect(screen.getByTestId('mock-quick-actions')).toBeInTheDocument();
    expect(screen.getByTestId('mock-children')).toBeInTheDocument();
  });

  it('passes sidebarOpen state to the sidebar component', () => {
    render(<AdminLayoutPresentation {...mockProps} sidebarOpen={true} />);
    
    expect(screen.getByTestId('sidebar-open')).toHaveTextContent('true');
    
    render(<AdminLayoutPresentation {...mockProps} sidebarOpen={false} />);
    
    expect(screen.getByTestId('sidebar-open')).toHaveTextContent('false');
  });

  it('passes toggleSidebar function to the header component', () => {
    render(<AdminLayoutPresentation {...mockProps} />);
    
    const toggleButton = screen.getByTestId('toggle-sidebar-button');
    toggleButton.click();
    
    expect(mockProps.toggleSidebar).toHaveBeenCalledTimes(1);
  });

  it('passes closeSidebar function to the sidebar component', () => {
    render(<AdminLayoutPresentation {...mockProps} />);
    
    const closeButton = screen.getByTestId('close-sidebar-button');
    closeButton.click();
    
    expect(mockProps.closeSidebar).toHaveBeenCalledTimes(1);
  });

  it('renders the main content area with correct classes', () => {
    const { container } = render(<AdminLayoutPresentation {...mockProps} />);
    
    const mainContent = screen.getByTestId('admin-main-content');
    expect(mainContent).toHaveClass('flex-1');
    expect(mainContent).toHaveClass('overflow-y-auto');
    expect(mainContent).toHaveClass('bg-neutral-50');
    expect(mainContent).toHaveClass('p-4');
    expect(mainContent).toHaveClass('md:p-6');
  });

  it('renders the children with animation class', () => {
    render(<AdminLayoutPresentation {...mockProps} />);
    
    const childrenContainer = screen.getByTestId('mock-children').parentElement;
    expect(childrenContainer).toHaveClass('animate-fade-in');
  });
});
