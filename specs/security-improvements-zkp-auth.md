# Security Improvements for ZKP Authentication System

## Overview

This specification outlines critical security improvements required for the Zero-Knowledge Proof (ZKP) authentication system. These changes address cryptographic weaknesses, implementation issues, and security best practices to ensure a robust and secure authentication mechanism.

## 1. Password Hashing Improvements

### Current Implementation
The current implementation in `src/lib/zkp.ts` uses SHA-256 for password hashing:

```typescript
// File: src/lib/zkp.ts
export async function generatePublicKey(username: string, password: string, salt: string): Promise<string> {
  const combined = `${username}:${password}:${salt}`;
  return crypto.createHash('sha256').update(combined).digest('hex');
}
```

This is also used in `src/lib/zkp/mock-adapter.ts`:

```typescript
// File: src/lib/zkp/mock-adapter.ts
derivePublicKey(input: ZKPInput): string {
  const { username, password, salt } = input;
  // Create a hash of the credentials
  const combined = `${username}:${password}:${salt}`;
  return crypto.createHash('sha256').update(combined).digest('hex');
}
```

### Required Changes
Replace SHA-256 with bcrypt for password hashing in both files:

```typescript
// File: src/lib/zkp.ts
import * as bcrypt from 'bcrypt';

export async function generatePublicKey(username: string, password: string, salt: string): Promise<string> {
  const combined = `${username}:${password}`;
  const saltRounds = 12;
  return await bcrypt.hash(combined, salt, saltRounds);
}
```

```typescript
// File: src/lib/zkp/mock-adapter.ts
import * as bcrypt from 'bcrypt';

derivePublicKey(input: ZKPInput): string {
  const { username, password, salt } = input;
  const combined = `${username}:${password}`;
  const saltRounds = 12;
  return bcrypt.hashSync(combined, salt, saltRounds);
}
```

Alternatively, use PBKDF2 with high iteration count:

```typescript
// File: src/lib/zkp.ts
import util from 'util';
import { pbkdf2 } from 'crypto';
const pbkdf2Async = util.promisify(pbkdf2);

export async function generatePublicKey(username: string, password: string, salt: string): Promise<string> {
  const combined = `${username}:${password}`;
  // Example PBKDF2 usage: 100k iterations
  const derivedKey = await pbkdf2Async(combined, salt, 100000, 32, 'sha256');
  return derivedKey.toString('hex');
}
```

## 2. Poseidon Hash Implementation

### Current Implementation
The current implementation in `circuits/zkp_auth/poseidon_no_pragma.circom` uses simple constants (`i*j + 1`) in the Poseidon hash function:

```circom
// File: circuits/zkp_auth/poseidon_no_pragma.circom
// Get constants
var C[nRoundsF+nRoundsP][t];
for (var i = 0; i < nRoundsF+nRoundsP; i++) {
    for (var j = 0; j < t; j++) {
        C[i][j] = i*j + 1; // Simple constant generation
    }
}
```

This is also present in `circuits/simple_poseidon.circom`.

### Required Changes
Replace with cryptographically secure constants by creating a new file `circuits/poseidon_constants.circom` with the secure constants:

```circom
// File: circuits/poseidon_constants.circom
// Secure Poseidon constants for t=3 (2 inputs + 1 output)
// These constants should be generated using a secure process
// See: https://eprint.iacr.org/2019/458.pdf

function getConstants(round, position) {
    // Pre-computed secure constants from a trusted source
    // These should be replaced with actual secure constants
    var SECURE_CONSTANTS = [
        // Round 0
        [0x123456789abcdef0, 0x234567890abcdef1, 0x34567890abcdef12],
        // Round 1
        [0x4567890abcdef123, 0x567890abcdef1234, 0x67890abcdef12345],
        // ... more rounds ...
    ];

    return SECURE_CONSTANTS[round][position];
}
```

Then update both `circuits/zkp_auth/poseidon_no_pragma.circom` and `circuits/simple_poseidon.circom`:

```circom
// File: circuits/zkp_auth/poseidon_no_pragma.circom
// Include the constants
include "../../poseidon_constants.circom";

// Get constants from the secure source
var C[nRoundsF+nRoundsP][t];
for (var i = 0; i < nRoundsF+nRoundsP; i++) {
    for (var j = 0; j < t; j++) {
        C[i][j] = getConstants(i, j); // Use pre-computed secure constants
    }
}
```

## 3. Integrity Check Implementation

### Current Implementation
The current implementation in `scripts/test-zkp-inputs.js` only checks for file existence:

```javascript
// File: scripts/test-zkp-inputs.js
if (!fs.existsSync(wasmPath) || !fs.existsSync(zkeyPath)) {
  console.error('ZKP authentication system not set up. Please run `npm run zkp:setup` first.');
  process.exit(1);
}
```

### Required Changes
Implement integrity checks using checksums in `scripts/test-zkp-inputs.js`:

```javascript
// File: scripts/test-zkp-inputs.js
const crypto = require('crypto');

function verifyFileIntegrity(filePath, expectedChecksum) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return false;
  }

  const fileContent = fs.readFileSync(filePath);
  const actualChecksum = crypto.createHash('sha256').update(fileContent).digest('hex');

  return actualChecksum === expectedChecksum;
}

// Check WASM file
const wasmChecksumPath = `${wasmPath}.sha256`;
if (!fs.existsSync(wasmChecksumPath)) {
  console.error(`Checksum file not found: ${wasmChecksumPath}`);
  process.exit(1);
}
const wasmExpectedChecksum = fs.readFileSync(wasmChecksumPath, 'utf8').trim();
if (!verifyFileIntegrity(wasmPath, wasmExpectedChecksum)) {
  console.error(`Integrity check failed for: ${wasmPath}`);
  process.exit(1);
}

// Check zkey file
const zkeyChecksumPath = `${zkeyPath}.sha256`;
if (!fs.existsSync(zkeyChecksumPath)) {
  console.error(`Checksum file not found: ${zkeyChecksumPath}`);
  process.exit(1);
}
const zkeyExpectedChecksum = fs.readFileSync(zkeyChecksumPath, 'utf8').trim();
if (!verifyFileIntegrity(zkeyPath, zkeyExpectedChecksum)) {
  console.error(`Integrity check failed for: ${zkeyPath}`);
  process.exit(1);
}
```

Also, add a new script to generate checksums in `scripts/generate-zkp-checksums.js`:

```javascript
// File: scripts/generate-zkp-checksums.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Paths to the ZKP files
const circuitsDir = path.join(process.cwd(), 'circuits/zkp_auth/simple_auth_output');
const wasmPath = path.join(circuitsDir, 'simple_auth_js/simple_auth.wasm');
const zkeyPath = path.join(circuitsDir, 'simple_auth_final.zkey');

// Generate checksum for a file
function generateChecksum(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileContent).digest('hex');
}

// Generate and save checksums
const wasmChecksum = generateChecksum(wasmPath);
fs.writeFileSync(`${wasmPath}.sha256`, wasmChecksum);
console.log(`Generated checksum for ${wasmPath}`);

const zkeyChecksum = generateChecksum(zkeyPath);
fs.writeFileSync(`${zkeyPath}.sha256`, zkeyChecksum);
console.log(`Generated checksum for ${zkeyPath}`);

console.log('Checksums generated successfully.');
```

Update `package.json` to include the new script:

```json
// File: package.json
"scripts": {
  // ... existing scripts
  "zkp:checksums": "node scripts/generate-zkp-checksums.js",
  // ... existing scripts
}
```

## 4. Hash Truncation Fix

### Current Implementation
The current implementation in `scripts/update-zkp-implementation.js` truncates SHA-256 hashes to 64 bits:

```javascript
// File: scripts/update-zkp-implementation.js
username: BigInt('0x' + crypto.createHash('sha256').update(username).digest('hex')) % BigInt(2**64),
password: BigInt('0x' + crypto.createHash('sha256').update(password).digest('hex')) % BigInt(2**64),
publicSalt: BigInt('0x' + crypto.createHash('sha256').update(salt).digest('hex')) % BigInt(2**64)
```

### Required Changes
Update `scripts/update-zkp-implementation.js` to use full hash or more appropriate approach:

```javascript
// File: scripts/update-zkp-implementation.js
// Use full hash without truncation
username: BigInt('0x' + crypto.createHash('sha256').update(username).digest('hex')),
password: BigInt('0x' + crypto.createHash('sha256').update(password).digest('hex')),
publicSalt: BigInt('0x' + crypto.createHash('sha256').update(salt).digest('hex'))
```

If the circuit cannot handle the full hash size, implement a more secure approach:

```javascript
// File: scripts/update-zkp-implementation.js
// If circuit size constraints require smaller values, use a more secure approach
// that preserves more bits of entropy
function secureHash(input, bits = 128) {
  const hash = crypto.createHash('sha256').update(input).digest('hex');
  // Take the first 'bits' bits of the hash (bits/4 hex characters)
  const truncated = hash.substring(0, bits/4);
  return BigInt('0x' + truncated);
}

username: secureHash(username),
password: secureHash(password),
publicSalt: secureHash(salt)
```

## 5. Privacy in ZKP Circuits

### Current Implementation
In both `circuits/zkp_auth/zkp_auth.sym` and `circuits/zkp_auth_fixed/zkp_auth_fixed.sym`, password is defined as a public signal:

```
// File: circuits/zkp_auth/zkp_auth.sym
1,2,0,main.publicSalt
2,3,0,main.username
3,4,0,main.password
4,1,0,main.publicKey
```

### Required Changes
Update the circuit definition in `circuits/zkp_auth/zkp_auth.circom` and `circuits/zkp_auth_fixed/zkp_auth_fixed.circom` to make password a private signal:

```circom
// File: circuits/zkp_auth/zkp_auth.circom
// Simple authentication template
template SimpleAuth() {
    // Private inputs (known only to the prover)
    signal private input username;
    signal private input password;

    // Public inputs (known to both prover and verifier)
    signal input publicSalt;

    // Public outputs (result of the computation)
    signal output publicKey;

    // ... rest of the circuit ...
}
```

After updating the circuit, recompile it to generate new `.sym` files with the correct privacy settings.

## 6. TypeScript Reserved Keyword Fix

### Current Implementation
In `src/types/snarkjs.d.ts`, function named "new" causes TypeScript parse errors:

```typescript
// File: src/types/snarkjs.d.ts
export namespace powersOfTau {
  export function new(
    curve: string,
    power: number,
    outputFile: string,
    verbose: boolean
  ): Promise<void>;

  // ... other functions ...
}
```

### Required Changes
Update `src/types/snarkjs.d.ts` to rename the function and avoid the reserved keyword:

```typescript
// File: src/types/snarkjs.d.ts
export namespace powersOfTau {
  export function createPowersOfTau(
    curve: string,
    power: number,
    outputFile: string,
    verbose: boolean
  ): Promise<void>;

  // ... other functions ...
}
```

Also update any code that calls this function, such as in `scripts/zkp-setup.js` or similar files.

## 7. HTTP Headers Fix

### Current Implementation
In `src/lib/rate-limit.ts`, headers are incorrectly set on the request object:

```typescript
// File: src/lib/rate-limit.ts
// Add rate limit headers to the response
req.headers.set('X-RateLimit-Limit', limit.toString());
req.headers.set('X-RateLimit-Remaining', (limit - (currentCount + 1)).toString());
```

### Required Changes
Update `src/lib/rate-limit.ts` to set headers on the response object:

```typescript
// File: src/lib/rate-limit.ts
// Create headers for rate limit information
const headers = new Headers();
headers.set('X-RateLimit-Limit', limit.toString());
headers.set('X-RateLimit-Remaining', (limit - (currentCount + 1)).toString());

// These headers will be returned with the final response
// Modify the handler function to include these headers in the response
const originalResponse = await handler(req, params);
const responseHeaders = new Headers(originalResponse.headers);

// Add rate limit headers to the response
for (const [key, value] of headers.entries()) {
  responseHeaders.set(key, value);
}

// Return a new response with the updated headers
return new NextResponse(originalResponse.body, {
  status: originalResponse.status,
  statusText: originalResponse.statusText,
  headers: responseHeaders
});
```

## 8. Poseidon Round Parameters

### Current Implementation
In `circuits/simple_poseidon.circom` and other Poseidon implementations, there are insufficient round parameters:

```circom
// File: circuits/simple_poseidon.circom
var nRoundsF = 4;
var nRoundsP = 3;
```

### Required Changes
Update all Poseidon implementations to use recommended values:

```circom
// File: circuits/simple_poseidon.circom
var nRoundsF = 8;
var nRoundsP = 57;
```

Also update `circuits/zkp_auth/poseidon_no_pragma.circom` and any other files that define Poseidon round parameters.

## 9. Division by Zero Protection

### Current Implementation
In `circuits/circomlib/montgomery.circom`, there is no protection against division by zero:

```circom
// File: circuits/circomlib/montgomery.circom
template Edwards2Montgomery() {
    signal input in[2];
    signal output out[2];

    out[0] <-- (1 + in[1]) / (1 - in[1]);
    out[1] <-- out[0] / in[0];

    out[0] * (1-in[1]) === (1 + in[1]);
    out[1] * in[0] === out[0];
}
```

### Required Changes
Update `circuits/circomlib/montgomery.circom` to add constraints that prevent division by zero:

```circom
// File: circuits/circomlib/montgomery.circom
template Edwards2Montgomery() {
    signal input in[2];
    signal output out[2];

    // Ensure denominators are non-zero
    signal nonZeroDenom1;
    nonZeroDenom1 <-- 1 / (1 - in[1]);
    (1 - in[1]) * nonZeroDenom1 === 1;

    signal nonZeroDenom2;
    nonZeroDenom2 <-- 1 / in[0];
    in[0] * nonZeroDenom2 === 1;

    // Now perform the divisions
    out[0] <-- (1 + in[1]) / (1 - in[1]);
    out[1] <-- out[0] / in[0];

    // Original constraints
    out[0] * (1-in[1]) === (1 + in[1]);
    out[1] * in[0] === out[0];
}
```

## Implementation Timeline

1. **Phase 1: Critical Security Fixes**
   - Replace SHA-256 with bcrypt for password hashing
   - Fix privacy issues in ZKP circuits
   - Fix TypeScript reserved keyword issues

2. **Phase 2: Cryptographic Improvements**
   - Implement proper Poseidon hash constants
   - Fix hash truncation issues
   - Increase Poseidon round parameters

3. **Phase 3: Implementation Improvements**
   - Add integrity checks for cryptographic files
   - Fix HTTP headers implementation
   - Add division by zero protection

## Testing Requirements

1. **Security Testing**
   - Verify bcrypt implementation with different password strengths
   - Test integrity checks with valid and invalid checksums
   - Verify privacy of sensitive information in ZKP proofs

2. **Functional Testing**
   - Ensure authentication still works after all changes
   - Test edge cases for all fixed issues
   - Verify backward compatibility with existing user accounts

3. **Performance Testing**
   - Measure impact of bcrypt on authentication performance
   - Evaluate increased Poseidon rounds on proof generation time
   - Benchmark full hash vs. truncated hash performance

### Running Tests

All tests can be run with the simplified command:

```bash
npm run test
```

Security-specific tests can be run with:

```bash
npm run test:crypto:security
```

Specific tests can be run with:

```bash
npx jest tests/crypto/file-name.test.ts
```

## Security Considerations

1. **Migration Strategy**
   - Existing user passwords need to be migrated from SHA-256 to bcrypt
   - Consider a phased approach where users are migrated upon next login

2. **Backward Compatibility**
   - Maintain support for both old and new hashing methods during transition
   - Implement a flag in user records to indicate hashing method used

3. **Key Management**
   - Ensure secure storage of cryptographic keys and constants
   - Implement proper key rotation procedures

## Conclusion

These security improvements address critical vulnerabilities in the current ZKP authentication system. Implementing these changes will significantly enhance the security posture of the application and protect user credentials against various attack vectors.
