# Bcrypt-ZKP Integration Improvements

This specification outlines improvements to the bcrypt-enhanced ZKP authentication system based on feedback from code reviews.

## Background

The bcrypt-ZKP integration PR (#308) has received feedback from automated tools (CodeRabbit, SonarQube) and human reviewers (Codegen). While the implementation is generally sound, several improvements have been identified to enhance security, performance, and code quality.

## Proposed Changes

### 1. Configurable Bcrypt Work Factor

**Current Implementation:**
```javascript
// Work factor is hardcoded to 10
const hashedPassword = bcrypt.hashSync(password, 10);
```

**Proposed Implementation:**
```javascript
// Read work factor from environment or config with fallback to reasonable default
const workFactor = parseInt(process.env.BCRYPT_WORK_FACTOR || '10', 10);
const hashedPassword = await bcrypt.hash(password, workFactor);
```

**Files to Modify:**
- `src/lib/zkp/zkp-bcrypt.ts`
- `src/lib/zkp/snark-adapter.ts`
- Any other files using hardcoded bcrypt work factors

### 2. Async Salt Generation

**Current Implementation:**
```javascript
export function generateBcryptSalt(rounds: number = 10): string {
  return bcrypt.genSaltSync(rounds);
}
```

**Proposed Implementation:**
```javascript
export async function generateBcryptSalt(rounds: number = 10): Promise<string> {
  return bcrypt.genSalt(rounds);
}
```

**Files to Modify:**
- `src/lib/zkp/zkp-bcrypt.ts`

### 3. Function Parameter Consistency

**Current Implementation:**
```javascript
publicKey = await generatePublicKey({
  username: body.username,
  password: body.password!,
  salt,
});
```

**Proposed Implementation:**
```javascript
publicKey = await generatePublicKey(
  body.username,
  body.password!,
  salt
);
```

**Files to Modify:**
- `src/app/api/auth/setup/route.ts`
- Any other files using the object parameter style

### 4. Enhanced Rate Limiting

**Current Implementation:**
Basic rate limiting without exponential backoff.

**Proposed Implementation:**
- Implement exponential backoff for repeated failed attempts
- Add IP-based blocking with configurable thresholds
- Integrate with Redis for distributed rate limiting

**Files to Modify:**
- `src/lib/auth/rate-limiter.ts` (create if doesn't exist)
- `src/app/api/auth/verify/route.ts`

### 5. CAPTCHA Integration

**Current Implementation:**
No CAPTCHA validation for repeated failed attempts.

**Proposed Implementation:**
- Add CAPTCHA requirement after configurable number of failed attempts
- Implement server-side CAPTCHA verification
- Add client-side CAPTCHA UI components

**Files to Modify:**
- `src/components/admin/auth/ZKPLogin.tsx`
- `src/app/api/auth/verify/route.ts`
- `src/lib/auth/captcha.ts` (create if doesn't exist)

### 6. Improved Concurrency Handling

**Current Implementation:**
Global lock approach that blocks concurrency.

**Proposed Implementation:**
- Replace global locks with atomic operations
- Implement a worker pool for handling authentication requests
- Use Redis for distributed locking if needed

**Files to Modify:**
- `src/lib/auth/concurrency.ts` (create if doesn't exist)
- `src/app/api/auth/verify/route.ts`

### 7. Code Duplication Reduction

Identify and refactor duplicated code, particularly in:
- Test files
- Authentication components
- ZKP utility functions

## Implementation Plan

1. Address high-priority fixes first:
   - Configurable work factor
   - Async salt generation
   - Function parameter consistency

2. Implement security enhancements:
   - Enhanced rate limiting
   - CAPTCHA integration
   - Improved concurrency handling

3. Reduce code duplication through refactoring

4. Update tests to cover all changes

5. Update documentation to reflect the improvements

## Security Considerations

- Ensure backward compatibility with existing authentication flows
- Maintain or improve the current security posture
- Verify that all security hotspots identified by SonarQube are addressed
- Add comprehensive logging for security events

## Testing Strategy

- Update existing tests to accommodate the changes
- Add new tests for the enhanced functionality
- Verify that all tests pass before merging
- Perform manual testing of the authentication flow

## Documentation Updates

- Update API documentation to reflect the changes
- Add configuration documentation for the new environment variables
- Update security documentation to describe the enhanced protections
