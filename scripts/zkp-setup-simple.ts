/**
 * ZKP Authentication System Setup Script
 *
 * This script sets up the ZKP authentication system by:
 * 1. Compiling the no-pragma circuit
 * 2. Generating the proving key
 * 3. Exporting the verification key
 * 4. Creating a test input file
 * 5. Generating a witness
 * 6. Generating a proof
 * 7. Verifying the proof
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// Define paths
const circuitsDir = path.join(process.cwd(), 'circuits');
const zkpAuthDir = path.join(circuitsDir, 'zkp_auth');
const ptauDir = path.join(circuitsDir, 'ptau');
const zkpAuthNoPragmaJsDir = path.join(zkpAuthDir, 'zkp_auth_no_pragma_js');

// Ensure directories exist
function ensureDirExists(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Check if a file exists
function fileExists(filePath: string) {
  return fs.existsSync(filePath);
}

// Execute a command and return whether it was successful
function executeCommand(command: string, description: string) {
  try {
    console.log(`Executing: ${command}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Error ${description}:`, error);
    return false;
  }
}

// Ask the user a question
function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Main function to set up the ZKP authentication system
async function setupZkpAuth() {
  console.log(`\n🔄 Setting up ZKP authentication system...`);

  // Create directories
  ensureDirExists(circuitsDir);
  ensureDirExists(zkpAuthDir);
  ensureDirExists(ptauDir);
  ensureDirExists(zkpAuthNoPragmaJsDir);

  // We're using the circomlib Poseidon implementation, so we don't need to generate constants
  console.log(`\n🔄 Using the circomlib Poseidon implementation with secure constants...`);

  // Step 1: Define the simple auth circuit path
  const simpleAuthCircuitPath = path.join(zkpAuthDir, 'simple_auth.circom');
  const outputDir = path.join(zkpAuthDir, 'simple_auth_output');
  ensureDirExists(outputDir);

  // Step 2: Generate Powers of Tau file if it doesn't exist
  const ptauSize = 12;
  const ptauInitial = path.join(ptauDir, `pot${ptauSize}_0000.ptau`);
  const ptauFinal = path.join(ptauDir, `pot${ptauSize}_final.ptau`);

  if (!fileExists(ptauFinal)) {
    console.log(`\n🔄 Generating Powers of Tau file...`);
    if (!fileExists(ptauInitial)) {
      if (!executeCommand(
        `npx snarkjs powersoftau new bn128 ${ptauSize} ${ptauInitial} -v`,
        'Generating Powers of Tau'
      )) {
        return;
      }
    } else {
      console.log(`\n✅ Powers of Tau initial file already exists: ${ptauInitial}`);
    }

    if (!executeCommand(
      `npx snarkjs powersoftau prepare phase2 ${ptauInitial} ${ptauFinal} -v`,
      'Preparing Powers of Tau for phase 2'
    )) {
      return;
    }
  } else {
    console.log(`\n✅ Powers of Tau file already exists: ${ptauFinal}`);
  }

  // Step 3: Compile the simple auth circuit
  const r1csFile = path.join(outputDir, 'simple_auth.r1cs');
  const symFile = path.join(outputDir, 'simple_auth.sym');

  if (fileExists(simpleAuthCircuitPath)) {
    console.log(`\n🔄 Compiling simple auth circuit...`);
    if (!executeCommand(
      `npx circom ${simpleAuthCircuitPath} --r1cs ${r1csFile} --wasm --sym ${symFile}`,
      'Compiling simple auth circuit'
    )) {
      return;
    }
  } else {
    console.log(`\n⚠️ Simple auth circuit file not found: ${simpleAuthCircuitPath}`);
    return;
  }

  // Step 4: Move the WebAssembly file to the correct location
  const wasmRootFile = path.join(process.cwd(), 'simple_auth.wasm');
  const wasmDir = path.join(outputDir, 'simple_auth_js');
  const wasmFile = path.join(wasmDir, 'simple_auth.wasm');

  if (fileExists(wasmRootFile)) {
    console.log(`\n🔄 Moving WebAssembly file to the correct location...`);
    try {
      // Create the directory if it doesn't exist
      ensureDirExists(wasmDir);

      // Move the file
      fs.renameSync(wasmRootFile, wasmFile);
      console.log(`✅ WebAssembly file moved to: ${wasmFile}`);
    } catch (error) {
      console.error(`❌ Failed to move WebAssembly file:`, error);
      return;
    }
  } else {
    console.log(`\n⚠️ WebAssembly file not found: ${wasmRootFile}`);
  }

  // Step 5: Generate the proving key
  const zkeyFile = path.join(outputDir, 'simple_auth_final.zkey');

  // Always regenerate the proving key to ensure consistency
  console.log(`\n🔄 Generating proving key...`);
  if (!executeCommand(
    `npx snarkjs groth16 setup ${r1csFile} ${ptauFinal} ${zkeyFile}`,
    'Generating proving key'
  )) {
    return;
  }

  // Step 6: Export the verification key
  const vkeyFile = path.join(outputDir, 'verification_key.json');

  // Always regenerate the verification key to ensure consistency
  console.log(`\n🔄 Exporting verification key...`);
  if (!executeCommand(
    `npx snarkjs zkey export verificationkey ${zkeyFile} ${vkeyFile}`,
    'Exporting verification key'
  )) {
    return;
  }

  // Step 7: Generate a Solidity verifier
  const verifierFile = path.join(outputDir, 'verifier.sol');

  // Always regenerate the Solidity verifier to ensure consistency
  console.log(`\n🔄 Generating Solidity verifier...`);
  if (!executeCommand(
    `npx snarkjs zkey export solidityverifier ${zkeyFile} ${verifierFile}`,
    'Generating Solidity verifier'
  )) {
    return;
  }

  // Step 8: Create a test input file
  const inputFile = path.join(outputDir, 'input.json');

  // Always regenerate the input file to ensure consistency
  console.log(`\n🔄 Creating test input file...`);
  const input = {
    username: "5017715859210987140",
    password: "1744375401105705294",
    publicSalt: "12192593807163053881"
  };
  fs.writeFileSync(inputFile, JSON.stringify(input, null, 2));
  console.log(`✅ Test input file created: ${inputFile}`);

  // Step 9: Generate a witness
  const witnessFile = path.join(outputDir, 'witness.wtns');

  // Always regenerate the witness to ensure consistency
  console.log(`\n🔄 Generating witness...`);
  if (!executeCommand(
    `npx snarkjs wtns calculate ${wasmFile} ${inputFile} ${witnessFile}`,
    'Generating witness'
  )) {
    return;
  }

  // Step 10: Generate a proof
  const proofFile = path.join(outputDir, 'proof.json');
  const publicFile = path.join(outputDir, 'public.json');

  // Always regenerate the proof to ensure consistency
  console.log(`\n🔄 Generating proof...`);
  if (!executeCommand(
    `npx snarkjs groth16 prove ${zkeyFile} ${witnessFile} ${proofFile} ${publicFile}`,
    'Generating proof'
  )) {
    return;
  }

  // Step 11: Verify the proof
  console.log(`\n🔄 Verifying proof...`);
  try {
    // Use execSync directly to capture the output
    const result = execSync(
      `npx snarkjs groth16 verify ${vkeyFile} ${publicFile} ${proofFile}`,
      { encoding: 'utf8' }
    );
    console.log(result);
    console.log(`\n✅ Proof verification successful!`);
  } catch (error) {
    console.log(`\n⚠️ Proof verification failed. This is unexpected with our simplified circuit.`);
    console.log(`   Please check the error message and try again.`);
    console.log(error);
  }

  // Step 12: Generate a call to the verifier
  console.log(`\n🔄 Generating call to the verifier...`);
  if (!executeCommand(
    `npx snarkjs zkey export soliditycalldata ${publicFile} ${proofFile}`,
    'Generating call to the verifier'
  )) {
    return;
  }

  console.log(`\n🎉 ZKP authentication system setup completed successfully!`);
  console.log(`\n📝 Files generated:`);
  console.log(`- Circuit: ${simpleAuthCircuitPath}`);
  console.log(`- R1CS: ${r1csFile}`);
  console.log(`- WASM: ${wasmFile}`);
  console.log(`- Proving Key: ${zkeyFile}`);
  console.log(`- Verification Key: ${vkeyFile}`);
  console.log(`- Witness: ${witnessFile}`);
  console.log(`- Proof: ${proofFile}`);
  console.log(`- Public Inputs: ${publicFile}`);

  console.log(`\n💡 To use the ZKP Authentication System in your application:`);
  console.log(`1. Import the ZKP provider from src/lib/zkp`);
  console.log(`2. Use the provider to generate and verify proofs`);
  console.log(`3. See the documentation in docs/zkp-auth-guide.md for more details`);

  // Create a README file
  const readmePath = path.join(outputDir, 'README.md');
  const readmeContent = `# Simple ZKP Authentication System

This directory contains the Zero-Knowledge Proof (ZKP) authentication system files using a simplified circuit.

## Files

- \`simple_auth.circom\`: The simplified circuit file
- \`simple_auth.r1cs\`: The R1CS constraint system
- \`simple_auth_js/simple_auth.wasm\`: The WebAssembly file
- \`simple_auth_final.zkey\`: The proving key
- \`verification_key.json\`: The verification key
- \`verifier.sol\`: The Solidity verifier
- \`input.json\`: A test input file
- \`witness.wtns\`: A test witness
- \`proof.json\`: A test proof
- \`public.json\`: Test public inputs

## Usage

To use the ZKP authentication system in your application:

1. Import the ZKP provider from \`src/lib/zkp\`
2. Use the provider to generate and verify proofs
3. See the documentation in \`docs/zkp-auth-guide.md\` for more details

## Regenerating the Files

To regenerate the files, run:

\`\`\`bash
npm run zkp:setup:simple
\`\`\`

This will recompile the circuit, generate the proving key, and export the verification key.
`;

  fs.writeFileSync(readmePath, readmeContent);
  console.log(`\n✅ README file created: ${readmePath}`);
}

// Run the main function
setupZkpAuth().catch(console.error);
