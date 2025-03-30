"use client";

import React, { useState } from 'react';

export interface DateRange {
  startDate: string;
  endDate: string;
}

interface DateRangeSelectorProps {
  onChange: (range: DateRange) => void;
  initialRange?: DateRange;
  className?: string;
}

export function DateRangeSelector({
  onChange,
  initialRange,
  className = '',
}: DateRangeSelectorProps) {
  const today = new Date();
  
  // Initialize with current date if not provided
  const [startDate, setStartDate] = useState<string>(
    initialRange?.startDate || 
    new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  );
  
  const [endDate, setEndDate] = useState<string>(
    initialRange?.endDate || 
    today.toISOString().split('T')[0]
  );

  // Handle date changes
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value;
    setStartDate(newStart);
    onChange({ startDate: newStart, endDate });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = e.target.value;
    setEndDate(newEnd);
    onChange({ startDate, endDate: newEnd });
  };

  return (
    <div 
      className={`flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 ${className}`}
      data-testid="date-range-selector"
    >
      <div className="flex items-center">
        <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mr-2">
          From
        </label>
        <input
          type="date"
          id="start-date"
          data-testid="start-date-input"
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          value={startDate}
          onChange={handleStartDateChange}
          max={endDate}
        />
      </div>
      <div className="flex items-center">
        <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mr-2">
          To
        </label>
        <input
          type="date"
          id="end-date"
          data-testid="end-date-input"
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          value={endDate}
          onChange={handleEndDateChange}
          min={startDate}
          max={today.toISOString().split('T')[0]}
        />
      </div>
    </div>
  );
}

export default DateRangeSelector;