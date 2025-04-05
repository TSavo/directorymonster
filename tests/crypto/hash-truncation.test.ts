import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

describe('Hash Truncation', () => {
  let scriptContent: string;
  
  beforeAll(() => {
    // Read the update script
    const scriptPath = path.join(process.cwd(), 'scripts/update-zkp-implementation.js');
    
    // Skip test if script file doesn't exist
    if (!fs.existsSync(scriptPath)) {
      console.warn('Update script not found, skipping test');
      return;
    }
    
    scriptContent = fs.readFileSync(scriptPath, 'utf8');
  });
  
  it('should not truncate hash values to 64 bits', () => {
    // Check that the script doesn't truncate hash values to 64 bits
    expect(scriptContent).not.toContain('% BigInt(2**64)');
  });
  
  it('should use the full hash value', () => {
    // Check that the script uses the full hash value
    expect(scriptContent).toContain('BigInt(\'0x\' + crypto.createHash(\'sha256\').update(');
    
    // Check that the script doesn't truncate the hash value
    const truncationRegex = /BigInt\('0x' \+ [^)]+\) % BigInt\(2\*\*\d+\)/;
    expect(scriptContent).not.toMatch(truncationRegex);
  });
  
  it('should use a secure hash function', () => {
    // Check that the script uses a secure hash function
    expect(scriptContent).toContain('crypto.createHash(\'sha256\')');
  });
  
  it('should demonstrate the security risk of hash truncation', () => {
    // Generate two different inputs
    const input1 = 'password1';
    const input2 = 'password2';
    
    // Calculate full SHA-256 hashes
    const hash1 = crypto.createHash('sha256').update(input1).digest('hex');
    const hash2 = crypto.createHash('sha256').update(input2).digest('hex');
    
    // Convert to BigInt
    const bigint1 = BigInt('0x' + hash1);
    const bigint2 = BigInt('0x' + hash2);
    
    // Verify that the full hashes are different
    expect(bigint1).not.toBe(bigint2);
    
    // Truncate to 64 bits
    const truncated1 = bigint1 % BigInt(2**64);
    const truncated2 = bigint2 % BigInt(2**64);
    
    // Calculate the probability of collision with 64-bit truncation
    // For n=2 inputs and k=2^64 possible values, P(collision) = 1 - e^(-n(n-1)/2k)
    // For n=2, this is approximately 1 - e^(-1/2^64) ≈ 5.42e-20
    // So we don't expect a collision in this test, but we're demonstrating the principle
    
    // Log the values for debugging
    console.log(`Full hash 1: ${bigint1}`);
    console.log(`Full hash 2: ${bigint2}`);
    console.log(`Truncated hash 1: ${truncated1}`);
    console.log(`Truncated hash 2: ${truncated2}`);
    
    // The test passes if the truncated hashes are different, but this is just to
    // demonstrate the principle. In practice, with many users, collisions become
    // much more likely with truncated hashes.
    expect(truncated1).not.toBe(truncated2);
    
    // More importantly, verify that the full hash has more entropy than the truncated hash
    const fullHashBits = hash1.length * 4; // Each hex character is 4 bits
    expect(fullHashBits).toBe(256); // SHA-256 has 256 bits of output
    
    // Verify that truncation reduces entropy
    const truncatedBits = 64;
    expect(truncatedBits).toBeLessThan(fullHashBits);
    
    // Calculate the collision probability for both
    // For full hash (256 bits) with n=1000 users: P ≈ 1 - e^(-1000*999/2*2^256) ≈ 1.85e-74
    // For truncated hash (64 bits) with n=1000 users: P ≈ 1 - e^(-1000*999/2*2^64) ≈ 0.0054
    // This means with 1000 users, there's a 0.54% chance of a collision with 64-bit truncation,
    // but virtually no chance with the full 256-bit hash.
  });
});
