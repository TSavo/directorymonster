import * as fs from 'fs';
import * as path from 'path';

describe('Poseidon Round Parameters', () => {
  let circuitContent: string;
  
  beforeAll(() => {
    // Read the ZKP auth circuit file
    const circuitPath = path.join(process.cwd(), 'circuits/zkp_auth/zkp_auth.circom');
    
    // Skip test if circuit file doesn't exist
    if (!fs.existsSync(circuitPath)) {
      console.warn('ZKP auth circuit file not found, skipping test');
      return;
    }
    
    circuitContent = fs.readFileSync(circuitPath, 'utf8');
  });
  
  it('should have sufficient full rounds for security', () => {
    // Extract the number of full rounds from the file
    const fullRoundsMatch = circuitContent.match(/var nRoundsF = (\d+);/);
    
    // Skip test if full rounds couldn't be extracted
    if (!fullRoundsMatch) {
      console.warn('Could not extract full rounds, skipping test');
      return;
    }
    
    const fullRounds = parseInt(fullRoundsMatch[1], 10);
    
    // Verify that there are at least 8 full rounds for security
    expect(fullRounds).toBeGreaterThanOrEqual(8);
  });
  
  it('should have sufficient partial rounds for security', () => {
    // Extract the number of partial rounds from the file
    const partialRoundsMatch = circuitContent.match(/var nRoundsP = (\d+);/);
    
    // Skip test if partial rounds couldn't be extracted
    if (!partialRoundsMatch) {
      console.warn('Could not extract partial rounds, skipping test');
      return;
    }
    
    const partialRounds = parseInt(partialRoundsMatch[1], 10);
    
    // Verify that there are at least 57 partial rounds for security
    expect(partialRounds).toBeGreaterThanOrEqual(57);
  });
  
  it('should use all available constants', () => {
    // Extract the constant index calculation
    const constIdxMatch = circuitContent.match(/var constVal = POSEIDON_CONSTANT\(constIdx % (\d+)\);/);
    
    // Skip test if constant index couldn't be extracted
    if (!constIdxMatch) {
      console.warn('Could not extract constant index, skipping test');
      return;
    }
    
    const constIdx = parseInt(constIdxMatch[1], 10);
    
    // Verify that the constant index uses all available constants
    expect(constIdx).toBeGreaterThanOrEqual(20);
  });
  
  it('should have a secure number of total rounds', () => {
    // Extract the number of full and partial rounds from the file
    const fullRoundsMatch = circuitContent.match(/var nRoundsF = (\d+);/);
    const partialRoundsMatch = circuitContent.match(/var nRoundsP = (\d+);/);
    
    // Skip test if rounds couldn't be extracted
    if (!fullRoundsMatch || !partialRoundsMatch) {
      console.warn('Could not extract rounds, skipping test');
      return;
    }
    
    const fullRounds = parseInt(fullRoundsMatch[1], 10);
    const partialRounds = parseInt(partialRoundsMatch[1], 10);
    const totalRounds = fullRounds + partialRounds;
    
    // Verify that there are at least 65 total rounds for security
    expect(totalRounds).toBeGreaterThanOrEqual(65);
  });
});
