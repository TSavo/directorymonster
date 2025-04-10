import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { AdminLayoutPresentation } from '../AdminLayoutPresentation';
import { BreadcrumbProvider } from '@/components/ui/context-breadcrumbs';

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
  ContextBreadcrumbs: () => <div data-testid="mock-breadcrumbs">Breadcrumbs</div>,
  BreadcrumbProvider: ({ children }) => <div data-testid="mock-breadcrumb-provider">{children}</div>,
  useBreadcrumbs: () => ({
    items: [],
    setItems: jest.fn(),
    addItem: jest.fn(),
    removeItem: jest.fn(),
    clearItems: jest.fn()
  })
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
    cleanup();
  });

  it('renders the sidebar, header, breadcrumbs, quick actions, and children', () => {
    render(
      <BreadcrumbProvider>
        <AdminLayoutPresentation {...mockProps} />
      </BreadcrumbProvider>
    );

    expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('context-breadcrumbs')).toBeInTheDocument();
    expect(screen.getByTestId('quick-actions-menu')).toBeInTheDocument();
    expect(screen.getByTestId('mock-children')).toBeInTheDocument();
  });

  it('passes sidebarOpen state to the sidebar component when true', () => {
    render(
      <BreadcrumbProvider>
        <AdminLayoutPresentation {...mockProps} sidebarOpen={true} />
      </BreadcrumbProvider>
    );

    expect(screen.getByTestId('sidebar-open')).toHaveTextContent('true');
  });

  it('passes sidebarOpen state to the sidebar component when false', () => {
    render(
      <BreadcrumbProvider>
        <AdminLayoutPresentation {...mockProps} sidebarOpen={false} />
      </BreadcrumbProvider>
    );

    expect(screen.getByTestId('sidebar-open')).toHaveTextContent('false');
  });

  it('passes toggleSidebar function to the header component', () => {
    render(
      <BreadcrumbProvider>
        <AdminLayoutPresentation {...mockProps} />
      </BreadcrumbProvider>
    );

    const toggleButton = screen.getByTestId('toggle-sidebar-button');
    toggleButton.click();

    expect(mockProps.toggleSidebar).toHaveBeenCalledTimes(1);
  });

  it('passes closeSidebar function to the sidebar component', () => {
    render(
      <BreadcrumbProvider>
        <AdminLayoutPresentation {...mockProps} />
      </BreadcrumbProvider>
    );

    const closeButton = screen.getByTestId('close-sidebar-button');
    closeButton.click();

    expect(mockProps.closeSidebar).toHaveBeenCalledTimes(1);
  });

  it('renders the main content area with correct classes', () => {
    const { container } = render(
      <BreadcrumbProvider>
        <AdminLayoutPresentation {...mockProps} />
      </BreadcrumbProvider>
    );

    const mainContent = screen.getByTestId('admin-main-content');
    expect(mainContent).toHaveClass('flex-1');
    expect(mainContent).toHaveClass('overflow-y-auto');
    expect(mainContent).toHaveClass('bg-neutral-50');
    expect(mainContent).toHaveClass('p-4');
    expect(mainContent).toHaveClass('md:p-6');
  });

  it('renders the children with animation class', () => {
    render(
      <BreadcrumbProvider>
        <AdminLayoutPresentation {...mockProps} />
      </BreadcrumbProvider>
    );

    const childrenContainer = screen.getByTestId('mock-children').parentElement;
    expect(childrenContainer).toHaveClass('animate-fade-in');
  });
});
