# PowerShell script to create GitHub issues for role API specifications

# GET /api/admin/roles
gh issue create --title "Implement GET /api/admin/roles API" --body "## Description
Implement the GET /api/admin/roles API endpoint according to the specification in \`specs/api/admin/GET_admin_roles.md\`.

## Requirements
- Retrieve all roles for the current tenant with filtering and sorting options
- Include user counts for each role
- Support filtering by type and scope
- Support sorting by different fields
- Implement proper tenant isolation

## Acceptance Criteria
- API endpoint follows the specification exactly
- All query parameters are supported
- Proper error handling is implemented
- Tenant isolation is enforced
- Unit tests cover all scenarios in the specification
- Integration tests verify the API works end-to-end

## Related Specifications
- \`specs/api/admin/GET_admin_roles.md\`"

# POST /api/admin/roles
gh issue create --title "Implement POST /api/admin/roles API" --body "## Description
Implement the POST /api/admin/roles API endpoint according to the specification in \`specs/api/admin/POST_admin_roles.md\`.

## Requirements
- Create a new role with specified name, description, and permissions
- Support both tenant-wide and site-specific roles
- Validate role data for completeness and correctness
- Prevent duplicate role names within the same tenant
- Return the created role with its assigned ID

## Acceptance Criteria
- API endpoint follows the specification exactly
- All required fields are validated
- Proper error handling is implemented
- Tenant isolation is enforced
- Duplicate role names are prevented
- Unit tests cover all scenarios in the specification
- Integration tests verify the API works end-to-end

## Related Specifications
- \`specs/api/admin/POST_admin_roles.md\`"

# GET /api/admin/roles/{id}
gh issue create --title "Implement GET /api/admin/roles/{id} API" --body "## Description
Implement the GET /api/admin/roles/{id} API endpoint according to the specification in \`specs/api/admin/GET_admin_roles_id.md\`.

## Requirements
- Return detailed information about a specific role
- Include all permissions associated with the role
- Include usage statistics (e.g., number of users assigned to the role)
- Indicate whether the role can be modified
- Implement proper tenant isolation

## Acceptance Criteria
- API endpoint follows the specification exactly
- All role details are returned correctly
- User count is calculated accurately
- Proper error handling is implemented
- Tenant isolation is enforced
- Unit tests cover all scenarios in the specification
- Integration tests verify the API works end-to-end

## Related Specifications
- \`specs/api/admin/GET_admin_roles_id.md\`"

# PUT /api/admin/roles/{id}
gh issue create --title "Implement PUT /api/admin/roles/{id} API" --body "## Description
Implement the PUT /api/admin/roles/{id} API endpoint according to the specification in \`specs/api/admin/PUT_admin_roles_id.md\`.

## Requirements
- Update an existing role's name, description, and permissions
- Validate role data for completeness and correctness
- Prevent duplicate role names within the same tenant
- Return the updated role with its complete details
- Prevent modification of system roles

## Acceptance Criteria
- API endpoint follows the specification exactly
- All required fields are validated
- Proper error handling is implemented
- Tenant isolation is enforced
- System roles cannot be modified
- Duplicate role names are prevented
- Unit tests cover all scenarios in the specification
- Integration tests verify the API works end-to-end

## Related Specifications
- \`specs/api/admin/PUT_admin_roles_id.md\`"

# DELETE /api/admin/roles/{id}
gh issue create --title "Implement DELETE /api/admin/roles/{id} API" --body "## Description
Implement the DELETE /api/admin/roles/{id} API endpoint according to the specification in \`specs/api/admin/DELETE_admin_roles_id.md\`.

## Requirements
- Delete a specific role by its ID
- Prevent deletion of system roles
- Prevent deletion of roles that are assigned to users
- Return success confirmation upon successful deletion
- Implement proper tenant isolation

## Acceptance Criteria
- API endpoint follows the specification exactly
- System roles cannot be deleted
- Roles assigned to users cannot be deleted
- Proper error handling is implemented
- Tenant isolation is enforced
- Unit tests cover all scenarios in the specification
- Integration tests verify the API works end-to-end

## Related Specifications
- \`specs/api/admin/DELETE_admin_roles_id.md\`"

# GET /api/admin/users/{id}/roles
gh issue create --title "Implement GET /api/admin/users/{id}/roles API" --body "## Description
Implement the GET /api/admin/users/{id}/roles API endpoint according to the specification in \`specs/api/admin/GET_admin_users_id_roles.md\`.

## Requirements
- Return all roles assigned to a specific user
- Include detailed information about each role
- Filter roles by tenant context
- Support pagination for users with many roles
- Implement proper tenant isolation

## Acceptance Criteria
- API endpoint follows the specification exactly
- All roles assigned to the user are returned
- Filtering and pagination work correctly
- Proper error handling is implemented
- Tenant isolation is enforced
- Unit tests cover all scenarios in the specification
- Integration tests verify the API works end-to-end

## Related Specifications
- \`specs/api/admin/GET_admin_users_id_roles.md\`"

# POST /api/admin/users/{id}/roles
gh issue create --title "Implement POST /api/admin/users/{id}/roles API" --body "## Description
Implement the POST /api/admin/users/{id}/roles API endpoint according to the specification in \`specs/api/admin/POST_admin_users_id_roles.md\`.

## Requirements
- Assign multiple roles to a specific user in a single operation
- Validate that all roles exist and belong to the tenant
- Support both tenant-wide and site-specific role assignments
- Return success confirmation upon successful assignment
- Implement proper tenant isolation

## Acceptance Criteria
- API endpoint follows the specification exactly
- All roles are validated before assignment
- Proper error handling is implemented
- Tenant isolation is enforced
- Unit tests cover all scenarios in the specification
- Integration tests verify the API works end-to-end

## Related Specifications
- \`specs/api/admin/POST_admin_users_id_roles.md\`"

# POST /api/admin/users/{id}/roles/{roleId}
gh issue create --title "Implement POST /api/admin/users/{id}/roles/{roleId} API" --body "## Description
Implement the POST /api/admin/users/{id}/roles/{roleId} API endpoint according to the specification in \`specs/api/admin/POST_admin_users_id_roles_roleId.md\`.

## Requirements
- Assign a specific role to a user
- Validate that the role exists and belongs to the tenant
- Support both tenant-wide and site-specific role assignments
- Return success confirmation upon successful assignment
- Implement proper tenant isolation

## Acceptance Criteria
- API endpoint follows the specification exactly
- Role is validated before assignment
- Proper error handling is implemented
- Tenant isolation is enforced
- Unit tests cover all scenarios in the specification
- Integration tests verify the API works end-to-end

## Related Specifications
- \`specs/api/admin/POST_admin_users_id_roles_roleId.md\`"

# DELETE /api/admin/users/{id}/roles/{roleId}
gh issue create --title "Implement DELETE /api/admin/users/{id}/roles/{roleId} API" --body "## Description
Implement the DELETE /api/admin/users/{id}/roles/{roleId} API endpoint according to the specification in \`specs/api/admin/DELETE_admin_users_id_roles_roleId.md\`.

## Requirements
- Remove a specific role from a user
- Validate that the role exists and belongs to the tenant
- Prevent removal of the user's last role
- Return success confirmation upon successful removal
- Implement proper tenant isolation

## Acceptance Criteria
- API endpoint follows the specification exactly
- Role is validated before removal
- User's last role cannot be removed
- Proper error handling is implemented
- Tenant isolation is enforced
- Unit tests cover all scenarios in the specification
- Integration tests verify the API works end-to-end

## Related Specifications
- \`specs/api/admin/DELETE_admin_users_id_roles_roleId.md\`"

# GET /api/admin/roles/predefined
gh issue create --title "Implement GET /api/admin/roles/predefined API" --body "## Description
Implement the GET /api/admin/roles/predefined API endpoint according to the specification in \`specs/api/admin/GET_admin_roles_predefined.md\`.

## Requirements
- Return all predefined role templates
- Group templates by type (tenant-wide and site-specific)
- Include detailed permission information for each template
- Implement proper authentication and authorization

## Acceptance Criteria
- API endpoint follows the specification exactly
- All predefined role templates are returned
- Templates are grouped correctly
- Proper error handling is implemented
- Authentication and authorization are enforced
- Unit tests cover all scenarios in the specification
- Integration tests verify the API works end-to-end

## Related Specifications
- \`specs/api/admin/GET_admin_roles_predefined.md\`"

# POST /api/admin/roles/predefined
gh issue create --title "Implement POST /api/admin/roles/predefined API" --body "## Description
Implement the POST /api/admin/roles/predefined API endpoint according to the specification in \`specs/api/admin/POST_admin_roles_predefined.md\`.

## Requirements
- Create predefined roles in the tenant
- Support creating tenant-wide roles, site-specific roles, or both
- Prevent duplicate role creation
- Return the created roles with their assigned IDs
- Implement proper tenant isolation

## Acceptance Criteria
- API endpoint follows the specification exactly
- All role types are supported
- Duplicate roles are handled correctly
- Proper error handling is implemented
- Tenant isolation is enforced
- Unit tests cover all scenarios in the specification
- Integration tests verify the API works end-to-end

## Related Specifications
- \`specs/api/admin/POST_admin_roles_predefined.md\`"

# GET /api/admin/roles/predefined/{roleName}
gh issue create --title "Implement GET /api/admin/roles/predefined/{roleName} API" --body "## Description
Implement the GET /api/admin/roles/predefined/{roleName} API endpoint according to the specification in \`specs/api/admin/GET_admin_roles_predefined_roleName.md\`.

## Requirements
- Return a specific predefined role template by name
- Include detailed permission information for the template
- Implement proper authentication and authorization

## Acceptance Criteria
- API endpoint follows the specification exactly
- Correct role template is returned
- Proper error handling is implemented
- Authentication and authorization are enforced
- Unit tests cover all scenarios in the specification
- Integration tests verify the API works end-to-end

## Related Specifications
- \`specs/api/admin/GET_admin_roles_predefined_roleName.md\`"

# POST /api/admin/roles/predefined/{roleName}
gh issue create --title "Implement POST /api/admin/roles/predefined/{roleName} API" --body "## Description
Implement the POST /api/admin/roles/predefined/{roleName} API endpoint according to the specification in \`specs/api/admin/POST_admin_roles_predefined_roleName.md\`.

## Requirements
- Create a specific predefined role in the tenant
- Support both tenant-wide and site-specific roles
- Prevent duplicate role creation
- Return the created role with its assigned ID
- Implement proper tenant isolation

## Acceptance Criteria
- API endpoint follows the specification exactly
- Both tenant-wide and site-specific roles are supported
- Site ID is required for site-specific roles
- Duplicate roles are handled correctly
- Proper error handling is implemented
- Tenant isolation is enforced
- Unit tests cover all scenarios in the specification
- Integration tests verify the API works end-to-end

## Related Specifications
- \`specs/api/admin/POST_admin_roles_predefined_roleName.md\`"
