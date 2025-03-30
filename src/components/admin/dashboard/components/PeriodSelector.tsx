"use client";

import React from 'react';

export type TimePeriod = 'day' | 'week' | 'month';

interface PeriodSelectorProps {
  period: TimePeriod;
  onChange: (period: TimePeriod) => void;
  className?: string;
}

export function PeriodSelector({ 
  period, 
  onChange,
  className = '',
}: PeriodSelectorProps) {
  return (
    <div className={`inline-flex rounded-md shadow-sm ${className}`} role="group" aria-label="Time period selector" data-testid="period-selector">
      <button
        type="button"
        className={`px-4 py-2 text-sm font-medium rounded-l-lg ${period === 'day' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
        onClick={() => onChange('day')}
        data-testid="period-day"
        aria-pressed={period === 'day'}
      >
        Day
      </button>
      <button
        type="button"
        className={`px-4 py-2 text-sm font-medium ${period === 'week' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
        onClick={() => onChange('week')}
        data-testid="period-week"
        aria-pressed={period === 'week'}
      >
        Week
      </button>
      <button
        type="button"
        className={`px-4 py-2 text-sm font-medium rounded-r-lg ${period === 'month' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
        onClick={() => onChange('month')}
        data-testid="period-month"
        aria-pressed={period === 'month'}
      >
        Month
      </button>
    </div>
  );
}

export default PeriodSelector;