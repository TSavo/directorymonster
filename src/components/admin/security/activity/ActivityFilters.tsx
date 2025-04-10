'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ActivityFiltersProps {
  startDate: string;
  endDate: string;
  actionType: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onActionTypeChange: (value: string) => void;
  onApplyFilters: () => void;
}

export const ActivityFilters: React.FC<ActivityFiltersProps> = ({
  startDate,
  endDate,
  actionType,
  onStartDateChange,
  onEndDateChange,
  onActionTypeChange,
  onApplyFilters
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-end" data-testid="activity-filters">
      <div className="flex space-x-2 items-center">
        <div>
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full p-2 border rounded"
            data-testid="start-date-input"
            role="textbox"
          />
        </div>
        <div>
          <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full p-2 border rounded"
            data-testid="end-date-input"
            role="textbox"
          />
        </div>
      </div>
      <div>
        <label htmlFor="action-type" className="block text-sm font-medium text-gray-700 mb-1">
          Action Type
        </label>
        <select
          id="action-type"
          value={actionType}
          onChange={(e) => onActionTypeChange(e.target.value)}
          className="w-full p-2 border rounded"
          data-testid="action-type-select"
        >
          <option value="">All Actions</option>
          <option value="login">Login</option>
          <option value="logout">Logout</option>
          <option value="password_change">Password Change</option>
          <option value="profile_update">Profile Update</option>
          <option value="settings_change">Settings Change</option>
          <option value="data_access">Data Access</option>
        </select>
      </div>
      <Button onClick={onApplyFilters} data-testid="apply-filters-button">
        Apply
      </Button>
    </div>
  );
};

export default ActivityFilters;
