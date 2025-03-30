// Mock for Next.js headers
export function headers() {
  return new Headers({
    'x-tenant-id': 'test-tenant-id',
    'x-tenant-slug': 'test-tenant',
    'x-tenant-name': 'Test Tenant',
    'x-hostname': 'test.example.com',
  });
}