import React from 'react';
import { render } from '@testing-library/react';
import { BreadcrumbsContainer } from '../BreadcrumbsContainer';
import { useBreadcrumbs } from '../hooks/useBreadcrumbs';
import { BreadcrumbsPresentation } from '../BreadcrumbsPresentation';

// Mock the dependencies
jest.mock('../hooks/useBreadcrumbs');
jest.mock('../BreadcrumbsPresentation', () => ({
  BreadcrumbsPresentation: jest.fn(() => <div data-testid="mock-presentation" />)
}));

describe('BreadcrumbsContainer', () => {
  const mockBreadcrumbItems = [
    { href: '/admin', label: 'Admin' },
    { href: '/admin/users', label: 'Users' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls useBreadcrumbs with the correct props', () => {
    (useBreadcrumbs as jest.Mock).mockReturnValue({
      breadcrumbItems: mockBreadcrumbItems,
      shouldRender: true
    });

    render(<BreadcrumbsContainer pathname="/admin/users" />);
    expect(useBreadcrumbs).toHaveBeenCalledWith({ pathname: '/admin/users' });
  });

  it('renders BreadcrumbsPresentation with the correct props when shouldRender is true', () => {
    (useBreadcrumbs as jest.Mock).mockReturnValue({
      breadcrumbItems: mockBreadcrumbItems,
      shouldRender: true
    });

    render(<BreadcrumbsContainer pathname="/admin/users" />);
    expect(BreadcrumbsPresentation).toHaveBeenCalledWith(
      { breadcrumbItems: mockBreadcrumbItems },
      expect.anything()
    );
  });

  it('returns null when shouldRender is false', () => {
    (useBreadcrumbs as jest.Mock).mockReturnValue({
      breadcrumbItems: [],
      shouldRender: false
    });

    const { container } = render(<BreadcrumbsContainer pathname="/admin" />);
    expect(container).toBeEmptyDOMElement();
    expect(BreadcrumbsPresentation).not.toHaveBeenCalled();
  });
});
