import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatisticCard from '../../../../src/components/admin/dashboard/components/StatisticCard';

describe('StatisticCard Component', () => {
  const mockIcon = (
    <svg data-testid="mock-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );

  it('renders with title and value correctly', () => {
    render(<StatisticCard title="Test Title" value={1234} />);
    
    expect(screen.getByTestId('statistic-card')).toBeInTheDocument();
    expect(screen.getByTestId('statistic-card-title')).toHaveTextContent('Test Title');
    expect(screen.getByTestId('statistic-card-value')).toHaveTextContent('1234');
  });

  it('displays the change value when provided', () => {
    const change = { value: 42, isPositive: true };
    render(<StatisticCard title="Test Title" value={1234} change={change} />);
    
    const changeElement = screen.getByTestId('statistic-card-change');
    expect(changeElement).toBeInTheDocument();
    expect(changeElement).toHaveTextContent('+42');
    expect(changeElement).toHaveTextContent('from previous period');
  });

  it('displays negative change correctly', () => {
    const change = { value: 42, isPositive: false };
    render(<StatisticCard title="Test Title" value={1234} change={change} />);
    
    const changeElement = screen.getByTestId('statistic-card-change');
    expect(changeElement).toBeInTheDocument();
    expect(changeElement).toHaveTextContent('-42');
  });

  it('renders with an icon when provided', () => {
    render(<StatisticCard title="Test Title" value={1234} icon={mockIcon} />);
    
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('displays loading skeleton when isLoading is true', () => {
    render(<StatisticCard title="Test Title" value={1234} isLoading={true} />);
    
    expect(screen.getByTestId('statistic-card-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('statistic-card-value')).not.toBeInTheDocument();
  });

  it('applies additional className when provided', () => {
    render(<StatisticCard title="Test Title" value={1234} className="custom-class" />);
    
    expect(screen.getByTestId('statistic-card')).toHaveClass('custom-class');
  });

  it('sets aria-busy attribute when loading', () => {
    render(<StatisticCard title="Test Title" value={1234} isLoading={true} />);
    
    expect(screen.getByTestId('statistic-card')).toHaveAttribute('aria-busy', 'true');
  });

  it('correctly formats string values', () => {
    render(<StatisticCard title="Test Title" value="String Value" />);
    
    expect(screen.getByTestId('statistic-card-value')).toHaveTextContent('String Value');
  });
});
