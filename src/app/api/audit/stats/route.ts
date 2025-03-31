import { NextRequest, NextResponse } from 'next/server';
import { decode, JwtPayload } from 'jsonwebtoken';
import { withPermission } from '../../middleware/withPermission';
import AuditService from '@/lib/audit/audit-service';
import { AuditAction, AuditSeverity } from '@/lib/audit/types';
import RoleService from '@/lib/role-service';

/**
 * GET handler for retrieving audit log statistics
 * Returns counts of different event types, severity levels, etc.
 * Useful for dashboard visualizations
 * Requires 'read' permission on 'audit' resource type
 * 
 * Query parameters:
 * - days: Number of days to include in statistics (default: 30)
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  return withPermission(
    req,
    'audit' as any,
    'read',
    async (validatedReq) => {
      try {
        // Get tenant context and user info
        const tenantId = validatedReq.headers.get('x-tenant-id') as string;
        const authHeader = validatedReq.headers.get('authorization') as string;
        const token = authHeader.replace('Bearer ', '');
        const decoded = decode(token) as JwtPayload;
        const userId = decoded.userId;
        
        // Parse query parameters
        const url = new URL(validatedReq.url);
        const daysParam = url.searchParams.get('days');
        const days = daysParam ? parseInt(daysParam) : 30;
        
        // Check if user is a global admin
        const isGlobalAdmin = await RoleService.hasGlobalRole(userId);
        
        // Calculate date range
        const endDate = new Date().toISOString();
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        
        // Get events for the period
        const events = await AuditService.queryEvents(
          {
            tenantId: isGlobalAdmin ? undefined : tenantId,
            startDate,
            endDate,
            limit: 10000 // Use a large limit to get comprehensive stats
          },
          tenantId,
          isGlobalAdmin
        );
        
        // Calculate statistics
        const stats = {
          totalEvents: events.length,
          byAction: {} as Record<string, number>,
          bySeverity: {} as Record<string, number>,
          bySuccess: {
            successful: 0,
            failed: 0
          },
          byDay: {} as Record<string, number>,
          topResourceTypes: {} as Record<string, number>,
          topUsers: {} as Record<string, { count: number, name?: string }>
        };
        
        // Process events for stats
        events.forEach(event => {
          // Count by action
          if (!stats.byAction[event.action]) {
            stats.byAction[event.action] = 0;
          }
          stats.byAction[event.action]++;
          
          // Count by severity
          if (!stats.bySeverity[event.severity]) {
            stats.bySeverity[event.severity] = 0;
          }
          stats.bySeverity[event.severity]++;
          
          // Count by success
          if (event.success) {
            stats.bySuccess.successful++;
          } else {
            stats.bySuccess.failed++;
          }
          
          // Count by day
          const day = event.timestamp.split('T')[0];
          if (!stats.byDay[day]) {
            stats.byDay[day] = 0;
          }
          stats.byDay[day]++;
          
          // Count resource types
          if (event.resourceType) {
            if (!stats.topResourceTypes[event.resourceType]) {
              stats.topResourceTypes[event.resourceType] = 0;
            }
            stats.topResourceTypes[event.resourceType]++;
          }
          
          // Count by user
          if (!stats.topUsers[event.userId]) {
            stats.topUsers[event.userId] = { count: 0 };
          }
          stats.topUsers[event.userId].count++;
        });
        
        // Sort days chronologically
        const sortedDays = Object.entries(stats.byDay)
          .sort(([dayA], [dayB]) => dayA.localeCompare(dayB))
          .reduce((acc, [day, count]) => {
            acc[day] = count;
            return acc;
          }, {} as Record<string, number>);
        
        stats.byDay = sortedDays;
        
        // Sort and limit top resource types
        stats.topResourceTypes = Object.entries(stats.topResourceTypes)
          .sort(([, countA], [, countB]) => countB - countA)
          .slice(0, 10)
          .reduce((acc, [type, count]) => {
            acc[type] = count;
            return acc;
          }, {} as Record<string, number>);
        
        // Sort and limit top users
        stats.topUsers = Object.entries(stats.topUsers)
          .sort(([, a], [, b]) => b.count - a.count)
          .slice(0, 10)
          .reduce((acc, [userId, data]) => {
            acc[userId] = data;
            return acc;
          }, {} as Record<string, { count: number, name?: string }>);
        
        return NextResponse.json({ stats });
      } catch (error) {
        console.error('Error retrieving audit statistics:', error);
        return NextResponse.json(
          { error: 'Error retrieving audit statistics' },
          { status: 500 }
        );
      }
    }
  );
}
