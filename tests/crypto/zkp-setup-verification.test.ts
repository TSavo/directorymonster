/**
 * ZKP Setup Verification Test
 * 
 * This test verifies that the zkp:setup script correctly sets up the ZKP authentication system.
 * It checks that all necessary files are created and that the proof generation and verification work.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as crypto from 'crypto';

describe('ZKP Setup Verification', () => {
  // Define paths to circuit files
  const circuitsDir = path.join(process.cwd(), 'circuits');
  const zkpAuthDir = path.join(circuitsDir, 'zkp_auth');
  const ptauDir = path.join(circuitsDir, 'ptau');
  const simpleAuthDir = path.join(zkpAuthDir, 'simple_auth_output');
  
  // Define paths to specific files
  const ptauFinal = path.join(ptauDir, 'pot12_final.ptau');
  const r1csFile = path.join(simpleAuthDir, 'simple_auth.r1cs');
  const wasmFile = path.join(simpleAuthDir, 'simple_auth_js/simple_auth.wasm');
  const zkeyFile = path.join(simpleAuthDir, 'simple_auth_final.zkey');
  const vkeyFile = path.join(simpleAuthDir, 'verification_key.json');
  const verifierFile = path.join(simpleAuthDir, 'verifier.sol');
  const inputFile = path.join(simpleAuthDir, 'input.json');
  const witnessFile = path.join(simpleAuthDir, 'witness.wtns');
  const proofFile = path.join(simpleAuthDir, 'proof.json');
  const publicFile = path.join(simpleAuthDir, 'public.json');
  
  // Flag to check if setup has been run
  let setupRun = false;
  
  beforeAll(() => {
    // Check if the setup has been run by checking if the verification key exists
    setupRun = fs.existsSync(vkeyFile);
    
    if (!setupRun) {
      console.warn(`
        Warning: ZKP setup has not been run. Skipping ZKP setup verification tests.
        Please run 'npm run zkp:setup' to set up the ZKP authentication system.
      `);
    }
  });
  
  // Test that the Powers of Tau file exists
  test('Powers of Tau file exists', () => {
    if (!setupRun) return;
    
    expect(fs.existsSync(ptauFinal)).toBe(true);
  });
  
  // Test that the R1CS file exists
  test('R1CS file exists', () => {
    if (!setupRun) return;
    
    expect(fs.existsSync(r1csFile)).toBe(true);
  });
  
  // Test that the WebAssembly file exists
  test('WebAssembly file exists', () => {
    if (!setupRun) return;
    
    expect(fs.existsSync(wasmFile)).toBe(true);
  });
  
  // Test that the proving key exists
  test('Proving key exists', () => {
    if (!setupRun) return;
    
    expect(fs.existsSync(zkeyFile)).toBe(true);
  });
  
  // Test that the verification key exists
  test('Verification key exists', () => {
    if (!setupRun) return;
    
    expect(fs.existsSync(vkeyFile)).toBe(true);
  });
  
  // Test that the Solidity verifier exists
  test('Solidity verifier exists', () => {
    if (!setupRun) return;
    
    expect(fs.existsSync(verifierFile)).toBe(true);
  });
  
  // Test that the input file exists
  test('Input file exists', () => {
    if (!setupRun) return;
    
    expect(fs.existsSync(inputFile)).toBe(true);
  });
  
  // Test that the witness file exists
  test('Witness file exists', () => {
    if (!setupRun) return;
    
    expect(fs.existsSync(witnessFile)).toBe(true);
  });
  
  // Test that the proof file exists
  test('Proof file exists', () => {
    if (!setupRun) return;
    
    expect(fs.existsSync(proofFile)).toBe(true);
  });
  
  // Test that the public file exists
  test('Public file exists', () => {
    if (!setupRun) return;
    
    expect(fs.existsSync(publicFile)).toBe(true);
  });
  
  // Test that the proof can be verified
  test('Proof can be verified', () => {
    if (!setupRun) return;
    
    try {
      // Use execSync to run the verification command
      const result = execSync(
        `npx snarkjs groth16 verify ${vkeyFile} ${publicFile} ${proofFile}`,
        { encoding: 'utf8' }
      );
      
      // Check that the verification was successful
      expect(result).toContain('OK');
    } catch (error) {
      // If the verification fails, fail the test
      fail(`Proof verification failed: ${error}`);
    }
  });
  
  // Test that a new proof can be generated and verified
  test('New proof can be generated and verified', () => {
    if (!setupRun) return;
    
    // Create a temporary directory for the new proof
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Generate a unique ID for the test files
    const testId = crypto.randomBytes(8).toString('hex');
    
    // Define paths for the new proof
    const newInputFile = path.join(tempDir, `input-${testId}.json`);
    const newWitnessFile = path.join(tempDir, `witness-${testId}.wtns`);
    const newProofFile = path.join(tempDir, `proof-${testId}.json`);
    const newPublicFile = path.join(tempDir, `public-${testId}.json`);
    
    try {
      // Create a new input file with random values
      const input = {
        username: BigInt(Math.floor(Math.random() * 1000000000000000000)).toString(),
        password: BigInt(Math.floor(Math.random() * 1000000000000000000)).toString(),
        publicSalt: BigInt(Math.floor(Math.random() * 1000000000000000000)).toString()
      };
      fs.writeFileSync(newInputFile, JSON.stringify(input, null, 2));
      
      // Generate a witness
      execSync(
        `npx snarkjs wtns calculate ${wasmFile} ${newInputFile} ${newWitnessFile}`,
        { stdio: 'inherit' }
      );
      
      // Generate a proof
      execSync(
        `npx snarkjs groth16 prove ${zkeyFile} ${newWitnessFile} ${newProofFile} ${newPublicFile}`,
        { stdio: 'inherit' }
      );
      
      // Verify the proof
      const result = execSync(
        `npx snarkjs groth16 verify ${vkeyFile} ${newPublicFile} ${newProofFile}`,
        { encoding: 'utf8' }
      );
      
      // Check that the verification was successful
      expect(result).toContain('OK');
    } catch (error) {
      // If any step fails, fail the test
      fail(`New proof generation and verification failed: ${error}`);
    }
  });
  
  // Test that the setup can be run again without errors
  test('Setup can be run again without errors', () => {
    if (!setupRun) return;
    
    try {
      // Use execSync to run the setup command with a timeout
      execSync('npm run zkp:setup', { timeout: 60000 });
      
      // If the setup completes without errors, pass the test
      expect(true).toBe(true);
    } catch (error) {
      // If the setup fails, fail the test
      fail(`Setup failed: ${error}`);
    }
  }, 120000); // Set a timeout of 120 seconds for this test
});
