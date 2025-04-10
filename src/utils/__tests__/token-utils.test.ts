import { decodeToken } from '../token-utils';

describe('decodeToken', () => {
  // Valid JWT token with payload { "user": { "id": "123", "name": "Test User" } }
  const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiMTIzIiwibmFtZSI6IlRlc3QgVXNlciJ9LCJpYXQiOjE1MTYyMzkwMjJ9.sNMELrRHdLOGV4UHzRvxh8nviVawjCa9QLuWU1qJyPE';
  
  // Invalid tokens
  const invalidFormatToken = 'not.a.valid.token';
  const invalidBase64Token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.!@#$%^&*().sNMELrRHdLOGV4UHzRvxh8nviVawjCa9QLuWU1qJyPE';
  const incompleteToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
  
  it('should decode a valid JWT token', () => {
    const decoded = decodeToken(validToken);
    expect(decoded).toEqual({
      user: { id: '123', name: 'Test User' },
      iat: 1516239022
    });
  });
  
  it('should return null for invalid token format', () => {
    const decoded = decodeToken(invalidFormatToken);
    expect(decoded).toBeNull();
  });
  
  it('should return null for invalid base64 encoding', () => {
    const decoded = decodeToken(invalidBase64Token);
    expect(decoded).toBeNull();
  });
  
  it('should return null for incomplete token', () => {
    const decoded = decodeToken(incompleteToken);
    expect(decoded).toBeNull();
  });
  
  it('should return null for undefined token', () => {
    const decoded = decodeToken(undefined as unknown as string);
    expect(decoded).toBeNull();
  });
  
  it('should return null for null token', () => {
    const decoded = decodeToken(null as unknown as string);
    expect(decoded).toBeNull();
  });
  
  it('should return null for empty string token', () => {
    const decoded = decodeToken('');
    expect(decoded).toBeNull();
  });
});
