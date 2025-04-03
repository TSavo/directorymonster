## Description
Implement the GET /api/admin/roles API endpoint according to the specification in `specs/api/admin/GET_admin_roles.md`.

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
- `specs/api/admin/GET_admin_roles.md`
