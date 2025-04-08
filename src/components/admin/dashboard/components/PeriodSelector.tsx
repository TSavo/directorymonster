"use client";

import React from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/classNames';

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
      <Button
        type="button"
        variant={period === 'day' ? 'primary' : 'secondary'}
        size="sm"
        className={cn("rounded-r-none", period === 'day' ? '' : 'bg-white')}
        onClick={() => onChange('day')}
        data-testid="period-day"
        aria-pressed={period === 'day'}
      >
        Day
      </Button>
      <Button
        type="button"
        variant={period === 'week' ? 'primary' : 'secondary'}
        size="sm"
        className={cn("rounded-none border-x-0", period === 'week' ? '' : 'bg-white')}
        onClick={() => onChange('week')}
        data-testid="period-week"
        aria-pressed={period === 'week'}
      >
        Week
      </Button>
      <Button
        type="button"
        variant={period === 'month' ? 'primary' : 'secondary'}
        size="sm"
        className={cn("rounded-l-none", period === 'month' ? '' : 'bg-white')}
        onClick={() => onChange('month')}
        data-testid="period-month"
        aria-pressed={period === 'month'}
      >
        Month
      </Button>
    </div>
  );
}

export default PeriodSelector;