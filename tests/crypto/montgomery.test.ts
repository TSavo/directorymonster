import * as fs from 'fs';
import * as path from 'path';

describe('Montgomery Curve Operations', () => {
  describe('Division by Zero Protection', () => {
    it('should check for division by zero in Edwards2Montgomery template', () => {
      // Read the circuit file
      const circuitPath = path.join(process.cwd(), 'circuits/circomlib/montgomery.circom');
      
      // Skip test if circuit file doesn't exist
      if (!fs.existsSync(circuitPath)) {
        console.warn('Circuit file not found, skipping test');
        return;
      }
      
      const circuitContent = fs.readFileSync(circuitPath, 'utf8');
      
      // Check if the Edwards2Montgomery template has division by zero protection
      const edwards2MontgomeryMatch = circuitContent.match(/template\s+Edwards2Montgomery\s*\(\s*\)\s*{[^}]*}/s);
      
      if (!edwards2MontgomeryMatch) {
        fail('Edwards2Montgomery template not found in circuit file');
        return;
      }
      
      const edwards2MontgomeryTemplate = edwards2MontgomeryMatch[0];
      
      // Check if there's a check for division by zero (1 - in[1] != 0)
      expect(edwards2MontgomeryTemplate).toContain('1 - in[1] != 0');
      
      // Check if there's a check for division by zero (in[0] != 0)
      expect(edwards2MontgomeryTemplate).toContain('in[0] != 0');
    });
    
    it('should check for division by zero in Montgomery2Edwards template', () => {
      // Read the circuit file
      const circuitPath = path.join(process.cwd(), 'circuits/circomlib/montgomery.circom');
      
      // Skip test if circuit file doesn't exist
      if (!fs.existsSync(circuitPath)) {
        console.warn('Circuit file not found, skipping test');
        return;
      }
      
      const circuitContent = fs.readFileSync(circuitPath, 'utf8');
      
      // Check if the Montgomery2Edwards template has division by zero protection
      const montgomery2EdwardsMatch = circuitContent.match(/template\s+Montgomery2Edwards\s*\(\s*\)\s*{[^}]*}/s);
      
      if (!montgomery2EdwardsMatch) {
        fail('Montgomery2Edwards template not found in circuit file');
        return;
      }
      
      const montgomery2EdwardsTemplate = montgomery2EdwardsMatch[0];
      
      // Check if there's a check for division by zero (in[1] != 0)
      expect(montgomery2EdwardsTemplate).toContain('in[1] != 0');
      
      // Check if there's a check for division by zero (in[0] + 1 != 0)
      expect(montgomery2EdwardsTemplate).toContain('in[0] + 1 != 0');
    });
    
    it('should check for division by zero in MontgomeryAdd template', () => {
      // Read the circuit file
      const circuitPath = path.join(process.cwd(), 'circuits/circomlib/montgomery.circom');
      
      // Skip test if circuit file doesn't exist
      if (!fs.existsSync(circuitPath)) {
        console.warn('Circuit file not found, skipping test');
        return;
      }
      
      const circuitContent = fs.readFileSync(circuitPath, 'utf8');
      
      // Check if the MontgomeryAdd template has division by zero protection
      const montgomeryAddMatch = circuitContent.match(/template\s+MontgomeryAdd\s*\(\s*\)\s*{[^}]*}/s);
      
      if (!montgomeryAddMatch) {
        fail('MontgomeryAdd template not found in circuit file');
        return;
      }
      
      const montgomeryAddTemplate = montgomeryAddMatch[0];
      
      // Check if there's a check for division by zero (in2[0] - in1[0] != 0)
      expect(montgomeryAddTemplate).toContain('in2[0] - in1[0] != 0');
    });
    
    it('should check for division by zero in MontgomeryDouble template', () => {
      // Read the circuit file
      const circuitPath = path.join(process.cwd(), 'circuits/circomlib/montgomery.circom');
      
      // Skip test if circuit file doesn't exist
      if (!fs.existsSync(circuitPath)) {
        console.warn('Circuit file not found, skipping test');
        return;
      }
      
      const circuitContent = fs.readFileSync(circuitPath, 'utf8');
      
      // Check if the MontgomeryDouble template has division by zero protection
      const montgomeryDoubleMatch = circuitContent.match(/template\s+MontgomeryDouble\s*\(\s*\)\s*{[^}]*}/s);
      
      if (!montgomeryDoubleMatch) {
        fail('MontgomeryDouble template not found in circuit file');
        return;
      }
      
      const montgomeryDoubleTemplate = montgomeryDoubleMatch[0];
      
      // Check if there's a check for division by zero (2*B*in[1] != 0)
      expect(montgomeryDoubleTemplate).toContain('2*B*in[1] != 0');
    });
  });
});
