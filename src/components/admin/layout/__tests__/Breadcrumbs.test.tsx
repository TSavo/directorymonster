import React from 'react';
import { render } from '@testing-library/react';
import { Breadcrumbs } from '../Breadcrumbs';
import { BreadcrumbsContainer } from '../BreadcrumbsContainer';

// Mock the container component
jest.mock('../BreadcrumbsContainer', () => ({
  BreadcrumbsContainer: jest.fn(() => <div data-testid="mock-container" />)
}));

describe('Breadcrumbs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the container component', () => {
    render(<Breadcrumbs pathname="/admin/users" />);
    expect(BreadcrumbsContainer).toHaveBeenCalled();
  });

  it('passes pathname prop to the container component', () => {
    render(<Breadcrumbs pathname="/admin/users" />);
    expect(BreadcrumbsContainer).toHaveBeenCalledWith(
      { pathname: '/admin/users' },
      expect.anything()
    );
  });
});
