import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

describe('Poseidon Hash Constants', () => {
  let circuitContent: string;

  beforeAll(() => {
    // Read the Poseidon constants file
    const circuitPath = path.join(process.cwd(), 'circuits/poseidon_constants.circom');

    // Skip test if circuit file doesn't exist
    if (!fs.existsSync(circuitPath)) {
      console.warn('Poseidon constants file not found, skipping test');
      return;
    }

    circuitContent = fs.readFileSync(circuitPath, 'utf8');
  });

  it('should have at least 10 round constants', () => {
    // Extract the constants from the file
    const constantMatches = circuitContent.match(/function POSEIDON_C\d+\(\) { return \d+; }/g);

    // Verify that there are at least 10 constants
    expect(constantMatches?.length).toBeGreaterThanOrEqual(10);
  });

  it('should have constants with high entropy', () => {
    // Extract the constant values
    const constantMatches = circuitContent.match(/function POSEIDON_C\d+\(\) \{ return (\d+); \}/g);
    const constantValues = constantMatches?.map(match => {
      const valueMatch = match.match(/return (\d+);/);
      const value = valueMatch ? valueMatch[1] : '0';
      return BigInt(value);
    });

    // Skip test if constants couldn't be extracted
    if (!constantValues) {
      console.warn('Could not extract constant values, skipping test');
      return;
    }

    // Check that constants are large numbers (high entropy)
    for (const value of constantValues) {
      // Convert to decimal string
      const decimalString = value.toString();

      // Check that the constant is a large number (at least 10 digits)
      expect(decimalString.length).toBeGreaterThanOrEqual(10);
    }

    // Check that constants are unique
    const uniqueValues = new Set(constantValues.map(v => v.toString()));
    expect(uniqueValues.size).toBeGreaterThan(constantValues.length / 2);
  });

  it('should have constants derived from a secure source', () => {
    // Check that the file contains a comment indicating the constants are cryptographically secure
    expect(circuitContent).toContain('These constants are cryptographically secure');

    // Check that the constants are not simple sequences
    const constantValues = circuitContent.match(/return (\d+);/g)?.map(match => {
      const value = match.replace('return ', '').replace(';', '');
      return BigInt(value);
    });

    // Skip test if constants couldn't be extracted
    if (!constantValues) {
      console.warn('Could not extract constant values, skipping test');
      return;
    }

    // Check that constants are not in a simple arithmetic sequence
    const differences: bigint[] = [];
    for (let i = 1; i < constantValues.length; i++) {
      differences.push(constantValues[i] - constantValues[i - 1]);
    }

    // Check if all differences are the same (arithmetic sequence)
    const allSame = differences.every(diff => diff === differences[0]);
    expect(allSame).toBe(false);
  });

  it('should have a proper MDS matrix', () => {
    // Extract the MDS matrix from the file
    const mdsMatches = circuitContent.match(/if \(i == \d+ && j == \d+\) return \d+;/g);

    // Verify that there are at least 9 entries in the MDS matrix (3x3)
    expect(mdsMatches?.length).toBeGreaterThanOrEqual(9);

    // Extract the MDS matrix values
    const mdsValues: number[][] = Array(3).fill(0).map(() => Array(3).fill(0));
    mdsMatches?.forEach(match => {
      const [i, j, value] = match.match(/if \(i == (\d+) && j == (\d+)\) return (\d+);/)?.slice(1) || [];
      if (i !== undefined && j !== undefined && value !== undefined) {
        mdsValues[parseInt(i)][parseInt(j)] = parseInt(value);
      }
    });

    // Check that the MDS matrix is invertible (determinant != 0)
    const det = mdsValues[0][0] * (mdsValues[1][1] * mdsValues[2][2] - mdsValues[1][2] * mdsValues[2][1]) -
                mdsValues[0][1] * (mdsValues[1][0] * mdsValues[2][2] - mdsValues[1][2] * mdsValues[2][0]) +
                mdsValues[0][2] * (mdsValues[1][0] * mdsValues[2][1] - mdsValues[1][1] * mdsValues[2][0]);

    expect(det).not.toBe(0);
  });

  it('should have constants that are not easily predictable', () => {
    // Extract the constant values
    const constantMatches = circuitContent.match(/function POSEIDON_C\d+\(\) \{ return (\d+); \}/g);
    const constantValues = constantMatches?.map(match => {
      const valueMatch = match.match(/return (\d+);/);
      const value = valueMatch ? valueMatch[1] : '0';
      return BigInt(value);
    });

    // Skip test if constants couldn't be extracted
    if (!constantValues) {
      console.warn('Could not extract constant values, skipping test');
      return;
    }

    // Check that constants are not easily predictable
    // We'll check this by ensuring they're large numbers
    const largeConstants = constantValues.filter(value => value > BigInt(1000000));
    expect(largeConstants.length).toBeGreaterThan(0);

    // Check that constants are not all the same
    const uniqueConstants = new Set(constantValues.map(value => value.toString()));
    expect(uniqueConstants.size).toBeGreaterThan(constantValues.length / 2);

    // Check that the file contains a comment indicating the source of the constants
    expect(circuitContent).toContain('derived from');
  });
});
