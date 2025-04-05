'use client';

import React from 'react';
import { useSecurityMetrics } from './hooks/useSecurityMetrics';
import { 
  ShieldCheckIcon, 
  ShieldExclamationIcon, 
  LockClosedIcon, 
  XCircleIcon,
  PuzzlePieceIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface SecurityMetricsProps {
  startDate: string;
  endDate: string;
}

export const SecurityMetrics: React.FC<SecurityMetricsProps> = ({ startDate, endDate }) => {
  const { metrics, isLoading, error, refetch } = useSecurityMetrics({ startDate, endDate });

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error.message}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  // Calculate success and failure rates
  const successRate = metrics ? Math.round((metrics.successfulAttempts / metrics.totalAttempts) * 100) || 0 : 0;
  const failureRate = metrics ? Math.round((metrics.failedAttempts / metrics.totalAttempts) * 100) || 0 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Total Login Attempts */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        {isLoading ? (
          <div className="animate-pulse" data-testid="metric-skeleton">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded w-1/4"></div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <LockClosedIcon className="h-5 w-5 text-blue-500 mr-2" />
                <h3 className="text-sm font-medium text-gray-700">Total Login Attempts</h3>
              </div>
              <button 
                onClick={refetch}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Refresh"
              >
                <ArrowPathIcon className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{metrics?.totalAttempts || 0}</p>
            <p className="mt-1 text-sm text-gray-500">
              Period: {startDate} to {endDate}
            </p>
          </>
        )}
      </div>

      {/* Successful Logins */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        {isLoading ? (
          <div className="animate-pulse" data-testid="metric-skeleton">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded w-1/4"></div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <ShieldCheckIcon className="h-5 w-5 text-green-500 mr-2" />
                <h3 className="text-sm font-medium text-gray-700">Successful Logins</h3>
              </div>
              <button 
                onClick={refetch}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Refresh"
              >
                <ArrowPathIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-baseline mt-2">
              <p className="text-3xl font-semibold text-gray-900">{metrics?.successfulAttempts || 0}</p>
              <p className="ml-2 text-sm font-medium text-green-600">{successRate}%</p>
            </div>
            <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-green-500 h-1.5 rounded-full" 
                style={{ width: `${successRate}%` }}
              ></div>
            </div>
          </>
        )}
      </div>

      {/* Failed Logins */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        {isLoading ? (
          <div className="animate-pulse" data-testid="metric-skeleton">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded w-1/4"></div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                <h3 className="text-sm font-medium text-gray-700">Failed Logins</h3>
              </div>
              <button 
                onClick={refetch}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Refresh"
              >
                <ArrowPathIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-baseline mt-2">
              <p className="text-3xl font-semibold text-gray-900">{metrics?.failedAttempts || 0}</p>
              <p className="ml-2 text-sm font-medium text-red-600">{failureRate}%</p>
            </div>
            <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-red-500 h-1.5 rounded-full" 
                style={{ width: `${failureRate}%` }}
              ></div>
            </div>
          </>
        )}
      </div>

      {/* Blocked Attempts */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        {isLoading ? (
          <div className="animate-pulse" data-testid="metric-skeleton">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded w-1/4"></div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <ShieldExclamationIcon className="h-5 w-5 text-orange-500 mr-2" />
                <h3 className="text-sm font-medium text-gray-700">Blocked Attempts</h3>
              </div>
              <button 
                onClick={refetch}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Refresh"
              >
                <ArrowPathIcon className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{metrics?.blockedAttempts || 0}</p>
            <p className="mt-1 text-sm text-gray-500">
              IP addresses blocked due to suspicious activity
            </p>
          </>
        )}
      </div>

      {/* CAPTCHA Challenges */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        {isLoading ? (
          <div className="animate-pulse" data-testid="metric-skeleton">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded w-1/4"></div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <PuzzlePieceIcon className="h-5 w-5 text-purple-500 mr-2" />
                <h3 className="text-sm font-medium text-gray-700">CAPTCHA Challenges</h3>
              </div>
              <button 
                onClick={refetch}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Refresh"
              >
                <ArrowPathIcon className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{metrics?.captchaRequiredCount || 0}</p>
            <p className="mt-1 text-sm text-gray-500">
              CAPTCHA verifications required
            </p>
          </>
        )}
      </div>

      {/* High Risk IPs */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        {isLoading ? (
          <div className="animate-pulse" data-testid="metric-skeleton">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded w-1/4"></div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
                <h3 className="text-sm font-medium text-gray-700">High Risk IPs</h3>
              </div>
              <button 
                onClick={refetch}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Refresh"
              >
                <ArrowPathIcon className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{metrics?.highRiskIPs || 0}</p>
            <p className="mt-1 text-sm text-gray-500">
              IP addresses with high or critical risk level
            </p>
          </>
        )}
      </div>
    </div>
  );
};
