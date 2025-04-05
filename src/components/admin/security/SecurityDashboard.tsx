'use client';

import React, { useState } from 'react';
// Mock these components for testing
const LoginAttemptsTable = ({ filter }) => <div data-testid="login-attempts-table">{JSON.stringify(filter)}</div>;
const LoginAttemptsMap = ({ filter }) => <div data-testid="login-attempts-map">{JSON.stringify(filter)}</div>;
const SecurityMetrics = ({ startDate, endDate }) => <div data-testid="security-metrics">{startDate} - {endDate}</div>;
const ReportSuspiciousActivity = () => <div data-testid="report-suspicious-activity"></div>;
import DateRangeSelector from '../../dashboard/components/DateRangeSelector';
import FilterButton from '../../dashboard/components/FilterButton';
import FilterDropdown from '../../dashboard/components/FilterDropdown';
import FilterCheckboxGroup from '../../dashboard/components/FilterCheckboxGroup';
import FilterActions from '../../dashboard/components/FilterActions';

export interface SecurityFilter {
  status?: string[];
  ipRiskLevel?: string[];
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export const SecurityDashboard: React.FC = () => {
  // Default date range - last 7 days
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);

  const [dateRange, setDateRange] = useState({
    startDate: sevenDaysAgo.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0]
  });

  const [filter, setFilter] = useState<SecurityFilter>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Handle filter changes
  const handleFilterChange = (newFilter: SecurityFilter) => {
    setFilter(newFilter);
  };

  // Handle date range changes
  const handleDateRangeChange = (newRange: { startDate: string; endDate: string }) => {
    setDateRange(newRange);
    setFilter({
      ...filter,
      startDate: newRange.startDate,
      endDate: newRange.endDate
    });
  };

  // Check if there are active filters
  const hasActiveFilters =
    (filter.status && filter.status.length > 0) ||
    (filter.ipRiskLevel && filter.ipRiskLevel.length > 0) ||
    !!filter.userId;

  // Clear all filters
  const clearFilters = () => {
    setFilter({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
  };

  return (
    <div className="space-y-6">
      {/* Security Metrics Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Security Overview</h2>
        <SecurityMetrics
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
        />
      </div>

      {/* Login Attempts Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h2 className="text-xl font-semibold">Login Attempts</h2>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-2 sm:mt-0">
            <DateRangeSelector
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onChange={handleDateRangeChange}
            />

            <FilterButton
              isOpen={isFilterOpen}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              hasFilters={hasActiveFilters}
            />
          </div>
        </div>

        {/* Filter dropdown */}
        {isFilterOpen && (
          <FilterDropdown className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              <FilterCheckboxGroup
                title="Status"
                options={[
                  { id: 'success', label: 'Success' },
                  { id: 'failure', label: 'Failure' },
                  { id: 'blocked', label: 'Blocked' },
                  { id: 'captcha_required', label: 'CAPTCHA Required' }
                ]}
                selected={filter.status || []}
                onChange={(selected) => setFilter({ ...filter, status: selected })}
              />

              <FilterCheckboxGroup
                title="IP Risk Level"
                options={[
                  { id: 'low', label: 'Low' },
                  { id: 'medium', label: 'Medium' },
                  { id: 'high', label: 'High' },
                  { id: 'critical', label: 'Critical' }
                ]}
                selected={filter.ipRiskLevel || []}
                onChange={(selected) => setFilter({ ...filter, ipRiskLevel: selected })}
              />
            </div>

            <FilterActions
              onClear={clearFilters}
              onApply={() => setIsFilterOpen(false)}
              hasFilters={hasActiveFilters}
            />
          </FilterDropdown>
        )}

        {/* Login attempts table */}
        <LoginAttemptsTable
          filter={filter}
        />
      </div>

      {/* Geographic Map Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Geographic Distribution</h2>
        <LoginAttemptsMap
          filter={filter}
        />
      </div>

      {/* Report Suspicious Activity Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Report Suspicious Activity</h2>
        <ReportSuspiciousActivity />
      </div>
    </div>
  );
};
