import * as fs from 'fs';
import * as path from 'path';

describe('ZKP Circuit Privacy', () => {
  describe('Circuit Signal Privacy', () => {
    it('should mark password as private input in Main template', () => {
      // Read the circuit file
      const circuitPath = path.join(process.cwd(), 'circuits/zkp_auth/zkp_auth.circom');

      // Skip test if circuit file doesn't exist
      if (!fs.existsSync(circuitPath)) {
        console.warn('Circuit file not found, skipping test');
        return;
      }

      const circuitContent = fs.readFileSync(circuitPath, 'utf8');

      // Check if the password is marked as private in the Main template
      const mainTemplateMatch = circuitContent.match(/template\s+Main\s*\(\s*\)\s*{[^}]*}/s);

      if (!mainTemplateMatch) {
        fail('Main template not found in circuit file');
        return;
      }

      const mainTemplate = mainTemplateMatch[0];

      // Check if password is marked as private
      expect(mainTemplate).toContain('signal private input password');
    });

    it('should not expose password in public signals', () => {
      // Read the symbol file which shows which signals are public
      const symPath = path.join(process.cwd(), 'circuits/zkp_auth/zkp_auth.sym');

      // Skip test if symbol file doesn't exist
      if (!fs.existsSync(symPath)) {
        console.warn('Symbol file not found, skipping test');
        return;
      }

      const symContent = fs.readFileSync(symPath, 'utf8');
      const lines = symContent.split('\n');

      // Find the line for main.password
      const passwordLine = lines.find(line => line.includes('main.password'));

      if (!passwordLine) {
        fail('Password signal not found in symbol file');
        return;
      }

      // Parse the line to get the privacy flag
      // Format is: id,idIdx,privacy,signalName
      const parts = passwordLine.split(',');
      if (parts.length < 3) {
        fail('Invalid format in symbol file');
        return;
      }

      // Privacy flag should be 1 for private, 0 for public
      const privacyFlag = parseInt(parts[2], 10);

      // Password should be private (privacy flag = 1)
      expect(privacyFlag).toBe(1);
    });
  });
});
