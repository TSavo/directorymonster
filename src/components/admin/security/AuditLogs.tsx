'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { fetchAuditLogs } from '../../../services/securityService';
import { AuditLogEntry } from '../../../types/security';
import { formatDistanceToNow } from 'date-fns';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [action, setAction] = useState<string>('');
  const [resource, setResource] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  const fetchLogs = async (reset: boolean = true) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const currentPage = reset ? 1 : page;
      if (reset) {
        setPage(1);
      }
      
      const data = await fetchAuditLogs(
        userId || undefined,
        action || undefined,
        resource || undefined,
        startDate || undefined,
        endDate || undefined,
        currentPage,
        10
      );
      
      setLogs(prev => reset ? data : [...prev, ...data]);
      setHasMore(data.length === 10);
      
      if (!reset) {
        setPage(currentPage + 1);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSearch = () => {
    fetchLogs();
  };

  const handleLoadMore = () => {
    fetchLogs(false);
  };

  const handleViewDetails = (log: AuditLogEntry) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return 'text-green-600';
      case 'update':
        return 'text-blue-600';
      case 'delete':
        return 'text-red-600';
      case 'view':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatChanges = (changes: { field: string; oldValue: any; newValue: any }[]) => {
    return changes.map((change, index) => (
      <div key={index} className="mb-2 pb-2 border-b border-gray-100 last:border-0">
        <div className="font-medium">{change.field}</div>
        <div className="grid grid-cols-2 gap-4 mt-1">
          <div>
            <div className="text-xs text-gray-500">Previous</div>
            <div className="text-sm bg-red-50 p-1 rounded text-red-700 line-through">
              {typeof change.oldValue === 'object' 
                ? JSON.stringify(change.oldValue) 
                : String(change.oldValue)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">New</div>
            <div className="text-sm bg-green-50 p-1 rounded text-green-700">
              {typeof change.newValue === 'object' 
                ? JSON.stringify(change.newValue) 
                : String(change.newValue)}
            </div>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="Filter by user ID or username"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>
            <div>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="view">View</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={resource} onValueChange={setResource}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Resources</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="role">Role</SelectItem>
                  <SelectItem value="permission">Permission</SelectItem>
                  <SelectItem value="listing">Listing</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="site">Site</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex space-x-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-32"
              />
              <span className="self-center">to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-32"
              />
            </div>
            <Button onClick={handleSearch}>Apply Filters</Button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-md">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-500">Loading audit logs...</p>
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No audit logs found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                      </TableCell>
                      <TableCell>{log.username}</TableCell>
                      <TableCell className={getActionColor(log.action)}>
                        {log.action}
                      </TableCell>
                      <TableCell>
                        {log.resource}
                        {log.resourceId && <span className="text-xs text-gray-500 ml-1">({log.resourceId})</span>}
                      </TableCell>
                      <TableCell>{log.ipAddress}</TableCell>
                      <TableCell>
                        {(log.changes?.length > 0 || log.details) && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewDetails(log)}
                          >
                            View Details
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {isLoading && logs.length > 0 && (
            <div className="text-center py-4">
              <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading more logs...</p>
            </div>
          )}

          {hasMore && !isLoading && (
            <div className="text-center">
              <Button variant="outline" onClick={handleLoadMore}>
                Load More
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">User</div>
                  <div>{selectedLog.username}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Time</div>
                  <div>{new Date(selectedLog.timestamp).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Action</div>
                  <div className={getActionColor(selectedLog.action)}>{selectedLog.action}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Resource</div>
                  <div>
                    {selectedLog.resource}
                    {selectedLog.resourceId && <span className="text-xs text-gray-500 ml-1">({selectedLog.resourceId})</span>}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">IP Address</div>
                  <div>{selectedLog.ipAddress}</div>
                </div>
              </div>

              {selectedLog.changes && selectedLog.changes.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-2">Changes</div>
                  <div className="border rounded-md p-3 bg-gray-50">
                    {formatChanges(selectedLog.changes)}
                  </div>
                </div>
              )}

              {selectedLog.details && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-2">Additional Details</div>
                  <div className="border rounded-md p-3 bg-gray-50 overflow-auto max-h-60">
                    <pre className="text-xs">{JSON.stringify(selectedLog.details, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AuditLogs;
