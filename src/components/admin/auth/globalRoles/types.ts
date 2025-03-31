/**
 * Shared types for Global Roles management
 */
import { Role } from '@/components/admin/auth/utils/roles';

export interface GlobalRoleFormData {
  name: string;
  description: string;
  aclEntries: Array<{
    resource: {
      type: string;
      tenantId: string;
    };
    permission: string;
  }>;
}

export type GlobalRoleFormProps = {
  initialData?: Partial<Role>;
  onSubmit: (data: GlobalRoleFormData) => Promise<void>;
  onCancel: () => void;
};

export type UserAssignmentProps = {
  roleId: string;
  roleName: string;
  onClose: () => void;
};
