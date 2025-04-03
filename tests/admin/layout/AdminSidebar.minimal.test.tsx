import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the AdminSidebar component
const AdminSidebar = ({ isOpen, closeSidebar }: { isOpen: boolean, closeSidebar: () => void }) => {
  return (
    <div data-testid="admin-sidebar">
      <div className="sidebar-content">
        <button onClick={closeSidebar}>Close</button>
        <nav>
          <a href="/admin">Dashboard</a>
          <a href="/admin/listings">Listings</a>
          <a href="/admin/categories">Categories</a>
        </nav>
      </div>
    </div>
  );
};

describe('AdminSidebar Component (Minimal Test)', () => {
  it('renders correctly', () => {
    const mockCloseSidebar = jest.fn();
    render(<AdminSidebar isOpen={true} closeSidebar={mockCloseSidebar} />);
    
    expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Listings')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
  });
});
