import { NextRequest, NextResponse } from 'next/server';
import { withACL } from '@/lib/middleware/withACL';
import { withTenant } from '@/lib/middleware/withTenant';
import { RoleScope } from '@/types/role';

interface PermissionTemplate {
  id: string;
  name: string;
  description: string;
  permissions: Record<string, string[]>;
  category: string;
  scope: RoleScope;
  siteId?: string;
}

/**
 * GET /api/admin/roles/wizard/templates
 * 
 * Get permission templates for role creation
 * 
 * @param req - The request object
 * @returns A response with the permission templates
 */
export const GET = withACL(
  withTenant(async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const scope = searchParams.get('scope') as RoleScope || 'tenant';
      const siteId = searchParams.get('siteId') || undefined;
      
      // Filter templates based on scope
      const filteredTemplates = PERMISSION_TEMPLATES.filter(template => {
        if (template.scope !== scope) {
          return false;
        }
        
        // For site-specific templates, check if siteId matches or is undefined (generic template)
        if (scope === 'site' && template.siteId && template.siteId !== siteId) {
          return false;
        }
        
        return true;
      });
      
      return NextResponse.json({ templates: filteredTemplates });
    } catch (error) {
      console.error('Error fetching permission templates:', error);
      return NextResponse.json(
        { error: 'Failed to fetch permission templates' },
        { status: 500 }
      );
    }
  }),
  { resource: 'role', action: 'read' }
);

// Mock permission templates
const PERMISSION_TEMPLATES: PermissionTemplate[] = [
  {
    id: 'content-manager',
    name: 'Content Manager',
    description: 'Manage content across all sites',
    category: 'content',
    scope: 'tenant',
    permissions: {
      content: ['create', 'read', 'update', 'delete'],
      category: ['read'],
      listing: ['read', 'update']
    }
  },
  {
    id: 'content-editor',
    name: 'Content Editor',
    description: 'Create and edit content, but cannot delete',
    category: 'content',
    scope: 'tenant',
    permissions: {
      content: ['create', 'read', 'update'],
      category: ['read'],
      listing: ['read', 'update']
    }
  },
  {
    id: 'content-viewer',
    name: 'Content Viewer',
    description: 'View-only access to content',
    category: 'content',
    scope: 'tenant',
    permissions: {
      content: ['read'],
      category: ['read'],
      listing: ['read']
    }
  },
  {
    id: 'site-admin',
    name: 'Site Administrator',
    description: 'Full control over site configuration',
    category: 'administration',
    scope: 'site',
    permissions: {
      site: ['read', 'update'],
      content: ['create', 'read', 'update', 'delete'],
      category: ['create', 'read', 'update', 'delete'],
      listing: ['create', 'read', 'update', 'delete'],
      setting: ['read', 'update']
    }
  },
  {
    id: 'site-editor',
    name: 'Site Editor',
    description: 'Edit site content and listings',
    category: 'content',
    scope: 'site',
    permissions: {
      site: ['read'],
      content: ['create', 'read', 'update'],
      category: ['read'],
      listing: ['create', 'read', 'update']
    }
  },
  {
    id: 'user-manager',
    name: 'User Manager',
    description: 'Manage users and their roles',
    category: 'administration',
    scope: 'tenant',
    permissions: {
      user: ['create', 'read', 'update', 'delete'],
      role: ['read']
    }
  },
  {
    id: 'role-manager',
    name: 'Role Manager',
    description: 'Manage roles and permissions',
    category: 'administration',
    scope: 'tenant',
    permissions: {
      role: ['create', 'read', 'update', 'delete'],
      user: ['read']
    }
  },
  {
    id: 'system-admin',
    name: 'System Administrator',
    description: 'Full control over the entire system',
    category: 'administration',
    scope: 'tenant',
    permissions: {
      user: ['create', 'read', 'update', 'delete'],
      role: ['create', 'read', 'update', 'delete'],
      site: ['create', 'read', 'update', 'delete'],
      category: ['create', 'read', 'update', 'delete'],
      listing: ['create', 'read', 'update', 'delete'],
      content: ['create', 'read', 'update', 'delete'],
      setting: ['create', 'read', 'update', 'delete'],
      tenant: ['read', 'update'],
      audit: ['read']
    }
  },
  {
    id: 'listing-manager',
    name: 'Listing Manager',
    description: 'Manage listings and categories',
    category: 'content',
    scope: 'tenant',
    permissions: {
      listing: ['create', 'read', 'update', 'delete'],
      category: ['read', 'update']
    }
  },
  {
    id: 'auditor',
    name: 'Auditor',
    description: 'View-only access to audit logs and user activities',
    category: 'security',
    scope: 'tenant',
    permissions: {
      audit: ['read'],
      user: ['read'],
      role: ['read']
    }
  }
];
