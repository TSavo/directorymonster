'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AlertsFilterProps {
  severityFilter: string;
  onSeverityFilterChange: (value: string) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onApplyDateFilter: () => void;
}

export const AlertsFilter: React.FC<AlertsFilterProps> = ({
  severityFilter,
  onSeverityFilterChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApplyDateFilter
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 justify-between" data-testid="alerts-filter">
      <div className="w-48">
        <select
          value={severityFilter}
          onChange={(e) => onSeverityFilterChange(e.target.value)}
          data-testid="severity-filter"
          className="w-full p-2 border rounded"
        >
          <option value="">All Severities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>
      <div className="flex space-x-2">
        <Input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="w-32"
          data-testid="start-date-input"
        />
        <span className="self-center">to</span>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="w-32"
          data-testid="end-date-input"
        />
        <Button
          variant="outline"
          onClick={onApplyDateFilter}
          data-testid="apply-date-filter"
        >
          Apply
        </Button>
      </div>
    </div>
  );
};

export default AlertsFilter;
