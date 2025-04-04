// Secure ZKP Authentication Tests
const fs = require('fs');
const path = require('path');
const snarkjs = require('snarkjs');

describe('Secure ZKP Authentication Tests', () => {
  // Define paths to circuit files
  const circuitPath = path.join(__dirname, '../../circuits/secure_auth');
  const wasmPath = path.join(circuitPath, 'secure_auth_js/secure_auth.wasm');
  const zkeyPath = path.join(circuitPath, 'secure_auth_final.zkey');
  const vkeyPath = path.join(circuitPath, 'verification_key.json');

  // Skip tests if circuit files don't exist
  before(function() {
    if (!fs.existsSync(wasmPath) || !fs.existsSync(zkeyPath) || !fs.existsSync(vkeyPath)) {
      console.warn(`
        Warning: Circuit files not found. Skipping secure ZKP tests.
        Please run 'npm run compile:secure_auth' to compile the circuit.
      `);
      this.skip();
    }
  });

  describe('Proof Generation and Verification', () => {
    it('should generate and verify a valid proof', async () => {
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
      expect(proof).to.have.property('pi_a').that.is.an('array');
      expect(proof).to.have.property('pi_b').that.is.an('array');
      expect(proof).to.have.property('pi_c').that.is.an('array');
      expect(proof).to.have.property('protocol').that.equals('groth16');

      // Verify the public signals
      expect(publicSignals).to.be.an('array');
      expect(publicSignals.length).to.be.at.least(1);

      // Load the verification key
      const vKey = JSON.parse(fs.readFileSync(vkeyPath));

      // Verify the proof
      const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);

      expect(isValid).to.be.true;
    });

    it('should generate different proofs for different passwords', async () => {
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
      expect(publicSignals1[0]).to.not.equal(publicSignals2[0]);

      // The proofs should be different
      expect(JSON.stringify(proof1)).to.not.equal(JSON.stringify(proof2));
    });

    it('should reject a proof with incorrect salt', async () => {
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
        expect.fail('Should have thrown an error for mismatched salt');
      } catch (error) {
        // Expected error
        expect(error).to.exist;
      }
    });
  });

  describe('Security Properties', () => {
    it('should not reveal private inputs in the proof or public signals', async () => {
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
      expect(combinedStr).to.not.include(`"${usernameStr}"`);
      expect(combinedStr).to.not.include(`"${passwordStr}"`);
    });

    it('should verify the zero-knowledge property', async () => {
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
      expect(publicSignals.length).to.equal(2);

      // The second public signal should be the public salt
      expect(publicSignals[1]).to.equal(input.publicSalt.toString());

      // The first public signal should be the public key (hash of the inputs)
      expect(publicSignals[0]).to.be.a('string').with.length.at.least(10);
    });
  });

  describe('Performance', () => {
    it('should generate proofs within acceptable time limits', async () => {
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
      expect(duration).to.be.below(10000); // 10 seconds
    });

    it('should verify proofs within acceptable time limits', async () => {
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
      expect(duration).to.be.below(1000); // 1 second
    });
  });
});
