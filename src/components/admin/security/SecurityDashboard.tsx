'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { SecurityMetrics } from './SecurityMetrics';
import { LoginAttemptsTable } from './LoginAttemptsTable';
import { LoginAttemptsMap } from './LoginAttemptsMap';
import { ReportSuspiciousActivity } from './ReportSuspiciousActivity';
import { UserActivityTracker } from './UserActivityTracker';
import { SecurityAlerts } from './SecurityAlerts';
import { AuditLogs } from './AuditLogs';
import { TwoFactorAuthentication } from './TwoFactorAuthentication';

export interface SecurityFilter {
  status?: string[];
  ipRiskLevel?: string[];
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export const SecurityDashboard: React.FC = () => {
  // State for filter
  const [filter, setFilter] = useState<SecurityFilter>({
    status: [],
    ipRiskLevel: [],
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
    endDate: new Date().toISOString().split('T')[0], // today
  });

  // Handle filter changes
  const handleFilterChange = (key: keyof SecurityFilter, value: any) => {
    setFilter(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle status filter change
  const handleStatusChange = (value: string) => {
    let newStatus: string[];

    if (value === 'all') {
      newStatus = [];
    } else if (value === 'success') {
      newStatus = ['success'];
    } else if (value === 'failure') {
      newStatus = ['failure'];
    } else if (value === 'blocked') {
      newStatus = ['blocked'];
    } else {
      newStatus = [];
    }

    handleFilterChange('status', newStatus);
  };

  // Handle risk level filter change
  const handleRiskLevelChange = (value: string) => {
    let newRiskLevel: string[];

    if (value === 'all') {
      newRiskLevel = [];
    } else if (value === 'low') {
      newRiskLevel = ['low'];
    } else if (value === 'medium') {
      newRiskLevel = ['medium'];
    } else if (value === 'high') {
      newRiskLevel = ['high', 'critical'];
    } else {
      newRiskLevel = [];
    }

    handleFilterChange('ipRiskLevel', newRiskLevel);
  };

  // Handle date range change
  const handleDateRangeChange = (value: string) => {
    const today = new Date();
    let startDate: Date;

    if (value === 'today') {
      startDate = today;
    } else if (value === 'yesterday') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 1);
    } else if (value === 'last7days') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
    } else if (value === 'last30days') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 30);
    } else if (value === 'last90days') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 90);
    } else {
      // Default to last 7 days
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
    }

    handleFilterChange('startDate', startDate.toISOString().split('T')[0]);
    handleFilterChange('endDate', today.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6" data-testid="security-dashboard">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold" data-testid="security-dashboard-heading">Security Dashboard</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Security Filters</CardTitle>
          <CardDescription>Filter security data by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                onValueChange={handleStatusChange}
                defaultValue="all"
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="success">Successful</SelectItem>
                  <SelectItem value="failure">Failed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="riskLevel">Risk Level</Label>
              <Select
                onValueChange={handleRiskLevelChange}
                defaultValue="all"
              >
                <SelectTrigger id="riskLevel">
                  <SelectValue placeholder="All Risk Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High & Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dateRange">Date Range</Label>
              <Select
                onValueChange={handleDateRangeChange}
                defaultValue="last7days"
              >
                <SelectTrigger id="dateRange">
                  <SelectValue placeholder="Last 7 Days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last7days">Last 7 Days</SelectItem>
                  <SelectItem value="last30days">Last 30 Days</SelectItem>
                  <SelectItem value="last90days">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="userId">User ID/Email</Label>
              <Input
                id="userId"
                placeholder="Filter by user"
                value={filter.userId || ''}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filter.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filter.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 w-full">
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="attempts">Login Attempts</TabsTrigger>
          <TabsTrigger value="map">Geo Map</TabsTrigger>
          <TabsTrigger value="activity">User Activity</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="2fa">Two-Factor</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Metrics</CardTitle>
              <CardDescription>Overview of security metrics for the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <SecurityMetrics
                startDate={filter.startDate || ''}
                endDate={filter.endDate || ''}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attempts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Login Attempts</CardTitle>
              <CardDescription>Detailed view of login attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <LoginAttemptsTable filter={filter} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
              <CardDescription>Map view of login attempts by location</CardDescription>
            </CardHeader>
            <CardContent>
              <LoginAttemptsMap filter={filter} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <UserActivityTracker userId={filter.userId} />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <SecurityAlerts />
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <AuditLogs />
        </TabsContent>

        <TabsContent value="2fa" className="space-y-4">
          <TwoFactorAuthentication userId={filter.userId} />
        </TabsContent>

        <TabsContent value="report" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Suspicious Activity</CardTitle>
              <CardDescription>Report any suspicious activity you've noticed</CardDescription>
            </CardHeader>
            <CardContent>
              <ReportSuspiciousActivity />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
