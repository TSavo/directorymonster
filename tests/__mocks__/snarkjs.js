// Mock implementation of snarkjs
const defaultProof = {
  pi_a: ['1', '2', '3'],
  pi_b: [['4', '5'], ['6', '7']],
  pi_c: ['8', '9', '10'],
  protocol: 'groth16'
};

const defaultPublicSignals = ['12345', '67890'];

// Store input-specific proofs and signals for tests that need different values
const proofStore = new Map();
const signalStore = new Map();

// Counter to generate unique proofs for different inputs
let proofCounter = 0;

// Mock implementation with more control for tests
const snarkjsMock = {
  groth16: {
    // Mock prove function that returns different proofs based on input
    prove: jest.fn().mockImplementation((zkeyPath, witness) => {
      // Generate a unique proof for this witness
      const witnessKey = JSON.stringify(witness);
      proofCounter++;

      // Create a unique proof for this input
      const uniqueProof = {
        ...defaultProof,
        pi_a: [proofCounter.toString(), '2', '3']
      };

      // Store the proof and signals for this input
      proofStore.set(witnessKey, uniqueProof);
      signalStore.set(witnessKey, [...defaultPublicSignals]);

      return Promise.resolve({
        proof: uniqueProof,
        publicSignals: signalStore.get(witnessKey)
      });
    }),

    // Mock fullProve function that returns different proofs based on input
    fullProve: jest.fn().mockImplementation((input, wasmPath, zkeyPath) => {
      // Generate a unique proof for this input
      const inputKey = JSON.stringify(input);
      proofCounter++;

      // Create a unique proof for this input
      const uniqueProof = {
        ...defaultProof,
        pi_a: [proofCounter.toString(), '2', '3']
      };

      // Store the proof and signals for this input
      proofStore.set(inputKey, uniqueProof);
      signalStore.set(inputKey, [...defaultPublicSignals]);

      return Promise.resolve({
        proof: uniqueProof,
        publicSignals: signalStore.get(inputKey)
      });
    }),

    // Mock verify function that checks if the proof is valid
    verify: jest.fn().mockImplementation((vKey, publicSignals, proof) => {
      // For tests that need to verify invalid proofs
      if (proof.pi_a && proof.pi_a[0] === 'invalid') {
        return Promise.resolve(false);
      }

      // For tests that need to verify tampered public signals
      if (publicSignals && publicSignals[0] === 'tampered') {
        return Promise.resolve(false);
      }

      // Default to valid proof
      return Promise.resolve(true);
    })
  },

  plonk: {
    fullProve: jest.fn().mockResolvedValue({
      proof: 'mock-proof',
      publicSignals: ['12345', '67890']
    }),
    verify: jest.fn().mockResolvedValue(true)
  },

  wtns: {
    calculate: jest.fn().mockResolvedValue(true)
  },

  // Helper methods for tests
  _reset: () => {
    proofStore.clear();
    signalStore.clear();
    proofCounter = 0;
    snarkjsMock.groth16.prove.mockClear();
    snarkjsMock.groth16.fullProve.mockClear();
    snarkjsMock.groth16.verify.mockClear();
  },

  _setVerifyResult: (result) => {
    snarkjsMock.groth16.verify.mockResolvedValue(result);
  }
};

module.exports = snarkjsMock;
