// Script to debug the proof verification process
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Define paths
const zkpAuthDir = path.join(process.cwd(), 'circuits', 'zkp_auth');
const zkeyFile = path.join(zkpAuthDir, 'zkp_auth_no_pragma_final.zkey');
const vkeyFile = path.join(zkpAuthDir, 'verification_key.json');
const witnessFile = path.join(zkpAuthDir, 'witness_no_pragma.wtns');
const proofFile = path.join(zkpAuthDir, 'proof_no_pragma.json');
const publicFile = path.join(zkpAuthDir, 'public_no_pragma.json');
const inputFile = path.join(zkpAuthDir, 'input.json');
const wasmFile = path.join(zkpAuthDir, 'zkp_auth_no_pragma_js', 'zkp_auth_no_pragma.wasm');

// Function to check if a file exists
function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

// Function to execute a command and return the output
function executeCommand(command: string, description: string): string | null {
  try {
    console.log(`Executing: ${command}`);
    const output = execSync(command, { encoding: 'utf8' });
    console.log(output);
    return output;
  } catch (error: any) {
    console.error(`Error ${description}:`, error.message);
    if (error.stdout) console.log(`stdout: ${error.stdout}`);
    if (error.stderr) console.log(`stderr: ${error.stderr}`);
    return null;
  }
}

// Function to debug the verification process
async function debugVerification(): Promise<void> {
  console.log('Debugging the proof verification process...');
  
  // Step 1: Check if all files exist
  console.log('\nChecking if all files exist:');
  console.log(`Input file: ${fileExists(inputFile)}`);
  console.log(`WASM file: ${fileExists(wasmFile)}`);
  console.log(`Proving key: ${fileExists(zkeyFile)}`);
  console.log(`Verification key: ${fileExists(vkeyFile)}`);
  console.log(`Witness: ${fileExists(witnessFile)}`);
  console.log(`Proof: ${fileExists(proofFile)}`);
  console.log(`Public inputs: ${fileExists(publicFile)}`);
  
  // Step 2: Print the content of the input file
  if (fileExists(inputFile)) {
    console.log('\nInput file content:');
    const inputContent = fs.readFileSync(inputFile, 'utf8');
    console.log(inputContent);
  }
  
  // Step 3: Print the content of the public inputs file
  if (fileExists(publicFile)) {
    console.log('\nPublic inputs file content:');
    const publicContent = fs.readFileSync(publicFile, 'utf8');
    console.log(publicContent);
  }
  
  // Step 4: Print the content of the verification key file
  if (fileExists(vkeyFile)) {
    console.log('\nVerification key file content:');
    const vkeyContent = fs.readFileSync(vkeyFile, 'utf8');
    console.log(vkeyContent);
  }
  
  // Step 5: Regenerate the witness
  console.log('\nRegenerating the witness...');
  executeCommand(
    `npx snarkjs wtns calculate ${wasmFile} ${inputFile} ${witnessFile}`,
    'Regenerating witness'
  );
  
  // Step 6: Export the witness to JSON
  console.log('\nExporting the witness to JSON...');
  const witnessJsonFile = path.join(zkpAuthDir, 'witness_no_pragma.json');
  executeCommand(
    `npx snarkjs wtns export json ${witnessFile} ${witnessJsonFile}`,
    'Exporting witness to JSON'
  );
  
  // Step 7: Print the content of the witness JSON file
  if (fileExists(witnessJsonFile)) {
    console.log('\nWitness JSON file content (first 10 elements):');
    const witnessContent = JSON.parse(fs.readFileSync(witnessJsonFile, 'utf8'));
    console.log(witnessContent.slice(0, 10));
  }
  
  // Step 8: Regenerate the proof
  console.log('\nRegenerating the proof...');
  executeCommand(
    `npx snarkjs groth16 prove ${zkeyFile} ${witnessFile} ${proofFile} ${publicFile}`,
    'Regenerating proof'
  );
  
  // Step 9: Verify the proof
  console.log('\nVerifying the proof...');
  executeCommand(
    `npx snarkjs groth16 verify ${vkeyFile} ${publicFile} ${proofFile}`,
    'Verifying proof'
  );
  
  // Step 10: Try a different approach - generate a new verification key
  console.log('\nGenerating a new verification key...');
  const newVkeyFile = path.join(zkpAuthDir, 'verification_key_new.json');
  executeCommand(
    `npx snarkjs zkey export verificationkey ${zkeyFile} ${newVkeyFile}`,
    'Generating new verification key'
  );
  
  // Step 11: Verify the proof with the new verification key
  console.log('\nVerifying the proof with the new verification key...');
  executeCommand(
    `npx snarkjs groth16 verify ${newVkeyFile} ${publicFile} ${proofFile}`,
    'Verifying proof with new verification key'
  );
}

// Run the debug function
debugVerification().catch(console.error);
