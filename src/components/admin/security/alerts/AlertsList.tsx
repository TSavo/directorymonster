'use client';

import React from 'react';
import { SecurityAlert } from '../../../../types/security';
import { AlertCard } from './AlertCard';

interface AlertsListProps {
  alerts: SecurityAlert[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
  onAcknowledge: (alertId: string) => void;
  onResolve: (alertId: string) => void;
  onDismiss: (alertId: string) => void;
  onViewDetails: (alert: SecurityAlert) => void;
}

export const AlertsList: React.FC<AlertsListProps> = ({
  alerts,
  isLoading,
  error,
  hasMore,
  onLoadMore,
  onAcknowledge,
  onResolve,
  onDismiss,
  onViewDetails
}) => {
  if (error) {
    return (
      <div className="bg-red-50 text-red-500 p-4 rounded-md" data-testid="alerts-error">
        {error}
      </div>
    );
  }

  if (isLoading && alerts.length === 0) {
    return (
      <div className="text-center py-8" data-testid="alerts-loading">
        <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Loading alerts...</p>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500" data-testid="alerts-empty">
        No alerts found matching your criteria
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="alerts-list">
      {alerts.map((alert) => (
        <AlertCard
          key={alert.id}
          alert={alert}
          onAcknowledge={onAcknowledge}
          onResolve={onResolve}
          onDismiss={onDismiss}
          onViewDetails={onViewDetails}
        />
      ))}
      
      {isLoading && alerts.length > 0 && (
        <div className="text-center py-4" data-testid="alerts-loading-more">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading more alerts...</p>
        </div>
      )}
      
      {hasMore && !isLoading && (
        <div className="text-center" data-testid="alerts-load-more">
          <button
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
            onClick={onLoadMore}
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default AlertsList;
