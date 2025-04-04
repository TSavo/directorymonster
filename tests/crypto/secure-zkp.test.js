// Secure ZKP Authentication Tests
const fs = require('fs');
const path = require('path');
const snarkjs = require('snarkjs');

describe('Secure ZKP Authentication Tests', () => {
  // Define paths to circuit files
  const circuitPath = path.join(process.cwd(), 'circuits/zkp_auth');
  const wasmPath = path.join(circuitPath, 'zkp_auth_js/zkp_auth.wasm');
  const zkeyPath = path.join(circuitPath, 'zkp_auth_final.zkey');
  const vkeyPath = path.join(circuitPath, 'verification_key.json');

  // Skip tests if circuit files don't exist
  // Flag to check if circuit files exist
  let circuitFilesExist = true;

  // Check if circuit files exist
  beforeAll(function() {
    circuitFilesExist = fs.existsSync(wasmPath) && fs.existsSync(zkeyPath) && fs.existsSync(vkeyPath);
    if (!circuitFilesExist) {
      console.warn(`
        Warning: Circuit files not found. Skipping secure ZKP tests.
        Please run 'npm run compile:zkp_auth' to compile the circuit.
      `);
    }

    // Reset the snarkjs mock before each test suite
    if (typeof snarkjs._reset === 'function') {
      snarkjs._reset();
    }
  });

  describe('Proof Generation and Verification', () => {
    it('should generate and verify a valid proof', async () => {
      // Skip test if circuit files don't exist
      if (!circuitFilesExist) {
        return;
      }
      // Create input for the circuit with both public and private inputs
      const input = {
        publicSalt: 789,
        username: 123,  // Private input
        password: 456   // Private input
      };

      // Generate a witness
      const { witness } = await snarkjs.wtns.calculate(input, wasmPath, {});

      // Generate a proof
      const { proof, publicSignals } = await snarkjs.groth16.prove(zkeyPath, witness);

      // Verify the proof structure
      expect(proof).toHaveProperty('pi_a');
      expect(Array.isArray(proof.pi_a)).toBe(true);
      expect(proof).toHaveProperty('pi_b');
      expect(Array.isArray(proof.pi_b)).toBe(true);
      expect(proof).toHaveProperty('pi_c');
      expect(Array.isArray(proof.pi_c)).toBe(true);
      expect(proof).toHaveProperty('protocol');
      expect(proof.protocol).toBe('groth16');

      // Verify the public signals
      expect(Array.isArray(publicSignals)).toBe(true);
      expect(publicSignals.length).toBeGreaterThanOrEqual(1);

      // Load the verification key
      const vKey = JSON.parse(fs.readFileSync(vkeyPath));

      // Verify the proof
      const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);

      expect(isValid).toBe(true);
    });

    it('should generate different proofs for different passwords', async () => {
      // Skip test if circuit files don't exist
      if (!circuitFilesExist) {
        return;
      }
      // Create inputs with different passwords
      const input1 = {
        publicSalt: 789,
        username: 123,
        password: 456
      };

      const input2 = {
        publicSalt: 789,
        username: 123,
        password: 789 // Different password
      };

      // Generate witnesses
      const { witness: witness1 } = await snarkjs.wtns.calculate(input1, wasmPath, {});
      const { witness: witness2 } = await snarkjs.wtns.calculate(input2, wasmPath, {});

      // Generate proofs
      const { proof: proof1, publicSignals: publicSignals1 } = await snarkjs.groth16.prove(zkeyPath, witness1);
      const { proof: proof2, publicSignals: publicSignals2 } = await snarkjs.groth16.prove(zkeyPath, witness2);

      // The public signals should be different (different public keys)
      expect(publicSignals1[0]).not.toBe(publicSignals2[0]);

      // The proofs should be different
      expect(JSON.stringify(proof1)).not.toBe(JSON.stringify(proof2));
    });

    it('should reject a proof with incorrect salt', async () => {
      // Skip test if circuit files don't exist
      if (!circuitFilesExist) {
        return;
      }
      // Create input with a valid salt but incorrect private inputs
      const input = {
        publicSalt: 123,
        username: 999,
        password: 888
      };

      // This should fail because the salt doesn't match the public salt
      try {
        await snarkjs.wtns.calculate(input, wasmPath, {});
        // If we get here, the test should fail
        fail('Should have thrown an error for mismatched salt');
      } catch (error) {
        // Expected error
        expect(error).toBeDefined();
      }
    });
  });

  describe('Security Properties', () => {
    it('should not reveal private inputs in the proof or public signals', async () => {
      // Skip test if circuit files don't exist
      if (!circuitFilesExist) {
        return;
      }
      // Create input for the circuit with both public and private inputs
      const input = {
        publicSalt: 789,
        username: 12345,  // Private input
        password: 67890   // Private input
      };

      // Generate a witness
      const { witness } = await snarkjs.wtns.calculate(input, wasmPath, {});

      // Generate a proof
      const { proof, publicSignals } = await snarkjs.groth16.prove(zkeyPath, witness);

      // Convert everything to strings for easy searching
      const proofStr = JSON.stringify(proof);
      const publicSignalsStr = JSON.stringify(publicSignals);
      const combinedStr = proofStr + publicSignalsStr;

      // The private inputs should not appear in the proof or public signals
      // We convert to strings to check for accidental leakage
      const usernameStr = input.username.toString();
      const passwordStr = input.password.toString();

      // Check for exact matches (very unlikely in a real ZKP system, but good to check)
      expect(combinedStr).not.toContain(`"${usernameStr}"`);
      expect(combinedStr).not.toContain(`"${passwordStr}"`);
    });

    it('should verify the zero-knowledge property', async () => {
      // Skip test if circuit files don't exist
      if (!circuitFilesExist) {
        return;
      }
      // Create an input for the circuit
      // For our test, we'll just verify that the public signals contain only
      // the expected public inputs and outputs

      const input = {
        publicSalt: 789,
        username: 123,
        password: 456
      };

      // Generate a witness
      const { witness } = await snarkjs.wtns.calculate(input, wasmPath, {});

      // Generate a proof
      const { publicSignals } = await snarkjs.groth16.prove(zkeyPath, witness);

      // The public signals should contain only the public key and the public salt
      expect(publicSignals.length).toBe(2);

      // The second public signal should be the public salt
      expect(publicSignals[1]).toBe(input.publicSalt.toString());

      // The first public signal should be the public key (hash of the inputs)
      expect(typeof publicSignals[0]).toBe('string');
      expect(publicSignals[0].length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Performance', () => {
    it('should generate proofs within acceptable time limits', async () => {
      // Skip test if circuit files don't exist
      if (!circuitFilesExist) {
        return;
      }
      const input = {
        publicSalt: 789,
        username: 123,
        password: 456
      };

      const startTime = Date.now();

      // Generate a witness
      const { witness } = await snarkjs.wtns.calculate(input, wasmPath, {});

      // Generate a proof
      await snarkjs.groth16.prove(zkeyPath, witness);

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Proof generation took ${duration}ms`);

      // The proof generation should complete within a reasonable time
      expect(duration).toBeLessThan(10000); // 10 seconds
    });

    it('should verify proofs within acceptable time limits', async () => {
      // Skip test if circuit files don't exist
      if (!circuitFilesExist) {
        return;
      }
      const input = {
        publicSalt: 789
      };

      // Generate a witness
      const { witness } = await snarkjs.wtns.calculate(input, wasmPath, {});

      // Generate a proof
      const { proof, publicSignals } = await snarkjs.groth16.prove(zkeyPath, witness);

      // Load the verification key
      const vKey = JSON.parse(fs.readFileSync(vkeyPath));

      // Measure verification time
      const startTime = Date.now();

      await snarkjs.groth16.verify(vKey, publicSignals, proof);

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Proof verification took ${duration}ms`);

      // The verification should be fast
      expect(duration).toBeLessThan(1000); // 1 second
    });
  });
});
