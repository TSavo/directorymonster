// This is a TypeScript compilation test
// It doesn't actually run any tests, but it will fail to compile if there are TypeScript errors

// Import the type definitions
import { powersOfTau } from 'snarkjs';

describe('snarkjs TypeScript definitions', () => {
  it('should not use reserved keywords as function names', () => {
    // This is just a placeholder test that will always pass
    // The real test is whether this file compiles without errors
    expect(true).toBe(true);

    // TypeScript compilation would fail if we tried to use the 'new' function directly
    // But we can check that the createPowersOfTau function type exists
    // This is just for documentation, not actual testing
    type CreatePowersOfTauFn = typeof powersOfTau.createPowersOfTau;
  });
});
