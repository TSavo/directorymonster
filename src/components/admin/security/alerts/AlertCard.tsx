'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { SecurityAlert } from '../../../../types/security';

interface AlertCardProps {
  alert: SecurityAlert;
  onAcknowledge?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
  onViewDetails?: (alert: SecurityAlert) => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onAcknowledge,
  onResolve,
  onDismiss,
  onViewDetails
}) => {
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'low':
        return <Badge className="bg-primary-100 text-primary-800 px-2.5 py-0.5 rounded-full text-xs font-medium">Low</Badge>;
      case 'medium':
        return <Badge className="bg-accent-100 text-accent-800 px-2.5 py-0.5 rounded-full text-xs font-medium">Medium</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded-full text-xs font-medium">High</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full text-xs font-medium">Critical</Badge>;
      default:
        return <Badge className="px-2.5 py-0.5 rounded-full text-xs font-medium">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full text-xs font-medium">New</Badge>;
      case 'acknowledged':
        return <Badge className="bg-primary-100 text-primary-800 px-2.5 py-0.5 rounded-full text-xs font-medium">Acknowledged</Badge>;
      case 'resolved':
        return <Badge className="bg-success-100 text-success-800 px-2.5 py-0.5 rounded-full text-xs font-medium">Resolved</Badge>;
      case 'dismissed':
        return <Badge className="bg-neutral-100 text-neutral-800 px-2.5 py-0.5 rounded-full text-xs font-medium">Dismissed</Badge>;
      default:
        return <Badge className="px-2.5 py-0.5 rounded-full text-xs font-medium">{status}</Badge>;
    }
  };

  return (
    <div className="border border-neutral-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 bg-white animate-fade-in" data-testid="alert-card">
      <div className="flex flex-col md:flex-row justify-between mb-2">
        <div className="flex items-center space-x-2 mb-2 md:mb-0">
          <h3 className="font-semibold text-neutral-900">{alert.title}</h3>
          <div className="space-x-1">
            {getSeverityBadge(alert.severity)}
            {getStatusBadge(alert.status)}
          </div>
        </div>
        <div className="text-sm text-neutral-500 flex items-center">
          <svg className="h-4 w-4 mr-1 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
        </div>
      </div>

      <p className="text-neutral-700 mb-5 leading-relaxed">{alert.description}</p>

      <div className="space-y-2 mb-5 bg-neutral-50 p-4 rounded-lg border border-neutral-100">
        {alert.affectedUsers && alert.affectedUsers.length > 0 && (
          <div className="flex items-start">
            <svg className="h-5 w-5 mr-2 text-neutral-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <div>
              <span className="text-sm font-medium text-neutral-900">Affected Users: </span>
              <span className="text-sm text-neutral-600">
                {alert.affectedUsers.join(', ')}
              </span>
            </div>
          </div>
        )}

        {alert.relatedIPs && alert.relatedIPs.length > 0 && (
          <div className="flex items-start">
            <svg className="h-5 w-5 mr-2 text-neutral-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <div>
              <span className="text-sm font-medium text-neutral-900">Related IPs: </span>
              <span className="text-sm text-neutral-600">
                {alert.relatedIPs.join(', ')}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 justify-end">
        {alert.status === 'new' && onAcknowledge && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAcknowledge(alert.id)}
            data-testid="acknowledge-button"
            className="bg-white text-primary-600 border-primary-200 hover:bg-primary-50 hover:border-primary-300 transition-colors focus-visible"
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Acknowledge
          </Button>
        )}

        {(alert.status === 'new' || alert.status === 'acknowledged') && onResolve && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onResolve(alert.id)}
            data-testid="resolve-button"
            className="bg-white text-success-600 border-success-200 hover:bg-success-50 hover:border-success-300 transition-colors focus-visible"
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Resolve
          </Button>
        )}

        {alert.status !== 'dismissed' && onDismiss && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDismiss(alert.id)}
            data-testid="dismiss-button"
            className="bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 transition-colors focus-visible"
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Dismiss
          </Button>
        )}

        {alert.details && onViewDetails && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(alert)}
            data-testid="view-details-button"
            className="bg-white text-primary-600 border-primary-200 hover:bg-primary-50 hover:border-primary-300 transition-colors focus-visible"
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Details
          </Button>
        )}
      </div>
    </div>
  );
};

export default AlertCard;
