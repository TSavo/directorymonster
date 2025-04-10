'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchSecurityAlerts, updateAlertStatus } from '../../../services/securityService';
import { SecurityAlert } from '../../../types/security';
import { AlertsHeader } from './alerts/AlertsHeader';
import { AlertsFilter } from './alerts/AlertsFilter';
import { AlertsList } from './alerts/AlertsList';

export const SecurityAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);

  const fetchAlerts = async (reset: boolean = true) => {
    setIsLoading(true);
    setError(null);

    try {
      const currentPage = reset ? 1 : page;
      if (reset) {
        setPage(1);
      }

      // Map activeTab to status filter
      const statusFilter = activeTab === 'all'
        ? undefined
        : activeTab === 'new'
          ? ['new']
          : activeTab === 'acknowledged'
            ? ['acknowledged']
            : activeTab === 'resolved'
              ? ['resolved']
              : undefined;

      // Map severityFilter
      const sevFilter = severityFilter ? [severityFilter] : undefined;

      const data = await fetchSecurityAlerts(
        statusFilter,
        sevFilter,
        startDate || undefined,
        endDate || undefined,
        currentPage,
        10
      );

      setAlerts(prev => reset ? data : [...prev, ...data]);
      setHasMore(data.length === 10);

      if (!reset) {
        setPage(currentPage + 1);
      }
    } catch (err) {
      console.error('Error fetching security alerts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch security alerts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleSeverityFilterChange = (value: string) => {
    setSeverityFilter(value);
    fetchAlerts();
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
  };

  const handleDateFilterChange = () => {
    fetchAlerts();
  };

  const handleLoadMore = () => {
    fetchAlerts(false);
  };

  const handleAcknowledge = async (alertId: string) => {
    await handleUpdateStatus(alertId, 'acknowledged');
  };

  const handleResolve = async (alertId: string) => {
    await handleUpdateStatus(alertId, 'resolved');
  };

  const handleDismiss = async (alertId: string) => {
    await handleUpdateStatus(alertId, 'dismissed');
  };

  const handleViewDetails = (alert: SecurityAlert) => {
    setSelectedAlert(alert);
    // In a real app, you might open a modal or navigate to a details page
    console.log('View details for alert:', alert);
  };

  const handleUpdateStatus = async (alertId: string, newStatus: string) => {
    try {
      await updateAlertStatus(alertId, newStatus);

      // Update local state
      setAlerts(prev =>
        prev.map(alert =>
          alert.id === alertId
            ? { ...alert, status: newStatus as 'new' | 'acknowledged' | 'resolved' | 'dismissed' }
            : alert
        )
      );
    } catch (err) {
      console.error('Error updating alert status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update alert status');
    }
  };

  return (
    <Card data-testid="security-alerts">
      <CardHeader>
        <CardTitle>Security Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <AlertsHeader
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          <AlertsFilter
            severityFilter={severityFilter}
            onSeverityFilterChange={handleSeverityFilterChange}
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={handleEndDateChange}
            onApplyDateFilter={handleDateFilterChange}
          />

          <AlertsList
            alerts={alerts}
            isLoading={isLoading}
            error={error}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            onAcknowledge={handleAcknowledge}
            onResolve={handleResolve}
            onDismiss={handleDismiss}
            onViewDetails={handleViewDetails}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default SecurityAlerts;
