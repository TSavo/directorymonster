/**
 * ZKP mock for authentication tests
 */

/**
 * Setup ZKP mock for authentication tests
 */
export function setupZkpMock() {
  // Create a mock function with additional methods
  const mockVerifyProof = jest.fn().mockImplementation(async ({ proof, publicSignals, publicKey }) => {
    // Only return true for testuser with correct public key
    if (publicKey === 'test-public-key') {
      return true;
    }
    return false;
  });

  // Add the mockResolvedValueOnce method
  mockVerifyProof.mockResolvedValueOnce = jest.fn().mockImplementation((value) => {
    return mockVerifyProof.mockImplementationOnce(() => Promise.resolve(value));
  });

  // Add the mockRejectedValueOnce method
  mockVerifyProof.mockRejectedValueOnce = jest.fn().mockImplementation((error) => {
    return mockVerifyProof.mockImplementationOnce(() => Promise.reject(error));
  });

  // Mock the ZKP library
  jest.mock('@/lib/zkp', () => ({
    verifyProof: mockVerifyProof,
    generateSalt: jest.fn().mockReturnValue('mock-salt'),
    derivePublicKey: jest.fn().mockReturnValue('mock-public-key'),
    generateProof: jest.fn().mockResolvedValue({
      proof: {
        pi_a: ['1', '2', '3'],
        pi_b: [['4', '5'], ['6', '7']],
        pi_c: ['8', '9', '10'],
        protocol: 'groth16',
        curve: 'bn128'
      },
      publicSignals: ['11', '12', '13']
    }),
  }));
}

/**
 * Reset ZKP mock for authentication tests
 */
export function resetZkpMock() {
  const { verifyProof } = require('@/lib/zkp');

  // Reset the mock implementation
  (verifyProof as jest.Mock).mockImplementation(async ({ proof, publicSignals, publicKey }) => {
    // Only return true for testuser with correct public key
    if (publicKey === 'test-public-key') {
      return true;
    }
    return false;
  });

  // Reset the mockResolvedValueOnce method
  (verifyProof as any).mockResolvedValueOnce = jest.fn().mockImplementation((value) => {
    return (verifyProof as jest.Mock).mockImplementationOnce(() => Promise.resolve(value));
  });

  // Reset the mockRejectedValueOnce method
  (verifyProof as any).mockRejectedValueOnce = jest.fn().mockImplementation((error) => {
    return (verifyProof as jest.Mock).mockImplementationOnce(() => Promise.reject(error));
  });
}
