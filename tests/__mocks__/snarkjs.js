// Mock implementation of snarkjs
module.exports = {
  groth16: {
    fullProve: jest.fn().mockResolvedValue({
      proof: {
        pi_a: ['1', '2', '3'],
        pi_b: [['4', '5'], ['6', '7']],
        pi_c: ['8', '9', '10'],
        protocol: 'groth16'
      },
      publicSignals: ['12345', '67890']
    }),
    verify: jest.fn().mockResolvedValue(true)
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
  }
};
