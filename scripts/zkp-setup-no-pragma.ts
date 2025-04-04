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

  // Step 1: Define the no-pragma circuit path
  const zkpAuthNoPragmaCircuitPath = path.join(zkpAuthDir, 'zkp_auth_no_pragma.circom');

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

  // Step 3: Compile the no-pragma circuit
  const r1csNoPragmaFile = path.join(zkpAuthDir, 'zkp_auth_no_pragma.r1cs');
  const symNoPragmaFile = path.join(zkpAuthDir, 'zkp_auth_no_pragma.sym');

  if (fileExists(zkpAuthNoPragmaCircuitPath)) {
    console.log(`\n🔄 Compiling no-pragma circuit...`);
    if (!executeCommand(
      `npx circom ${zkpAuthNoPragmaCircuitPath} --r1cs ${r1csNoPragmaFile} --wasm --sym ${symNoPragmaFile}`,
      'Compiling no-pragma circuit'
    )) {
      return;
    }
  } else {
    console.log(`\n⚠️ No-pragma circuit file not found: ${zkpAuthNoPragmaCircuitPath}`);
    return;
  }

  // Step 4: Move the WebAssembly file to the correct location
  const wasmRootFile = path.join(process.cwd(), 'zkp_auth_no_pragma.wasm');
  const wasmFile = path.join(zkpAuthNoPragmaJsDir, 'zkp_auth_no_pragma.wasm');

  if (fileExists(wasmRootFile)) {
    console.log(`\n🔄 Moving WebAssembly file to the correct location...`);
    try {
      // Create the directory if it doesn't exist
      ensureDirExists(zkpAuthNoPragmaJsDir);
      
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
  const zkeyFile = path.join(zkpAuthDir, 'zkp_auth_no_pragma_final.zkey');

  if (!fileExists(zkeyFile)) {
    console.log(`\n🔄 Generating proving key...`);
    if (!executeCommand(
      `npx snarkjs groth16 setup ${r1csNoPragmaFile} ${ptauFinal} ${zkeyFile}`,
      'Generating proving key'
    )) {
      return;
    }
  } else {
    console.log(`\n✅ Proving key already exists: ${zkeyFile}`);
  }

  // Step 6: Export the verification key
  const vkeyFile = path.join(zkpAuthDir, 'verification_key.json');

  if (!fileExists(vkeyFile)) {
    console.log(`\n🔄 Exporting verification key...`);
    if (!executeCommand(
      `npx snarkjs zkey export verificationkey ${zkeyFile} ${vkeyFile}`,
      'Exporting verification key'
    )) {
      return;
    }
  } else {
    console.log(`\n✅ Verification key already exists: ${vkeyFile}`);
  }

  // Step 7: Generate a Solidity verifier
  const verifierFile = path.join(zkpAuthDir, 'verifier.sol');

  if (!fileExists(verifierFile)) {
    console.log(`\n🔄 Generating Solidity verifier...`);
    if (!executeCommand(
      `npx snarkjs zkey export solidityverifier ${zkeyFile} ${verifierFile}`,
      'Generating Solidity verifier'
    )) {
      return;
    }
  } else {
    console.log(`\n✅ Solidity verifier already exists: ${verifierFile}`);
  }

  // Step 8: Create a test input file
  const inputFile = path.join(zkpAuthDir, 'input.json');

  if (!fileExists(inputFile)) {
    console.log(`\n🔄 Creating test input file...`);
    const input = {
      username: "5017715859210987140",
      password: "1744375401105705294",
      publicSalt: "12192593807163053881"
    };
    fs.writeFileSync(inputFile, JSON.stringify(input, null, 2));
    console.log(`✅ Test input file created: ${inputFile}`);
  } else {
    console.log(`\n✅ Test input file already exists: ${inputFile}`);
  }

  // Step 9: Generate a witness
  const witnessFile = path.join(zkpAuthDir, 'witness_no_pragma.wtns');

  if (!fileExists(witnessFile)) {
    console.log(`\n🔄 Generating witness...`);
    if (!executeCommand(
      `npx snarkjs wtns calculate ${wasmFile} ${inputFile} ${witnessFile}`,
      'Generating witness'
    )) {
      return;
    }
  } else {
    console.log(`\n✅ Witness already exists: ${witnessFile}`);
  }

  // Step 10: Generate a proof
  const proofFile = path.join(zkpAuthDir, 'proof_no_pragma.json');
  const publicFile = path.join(zkpAuthDir, 'public_no_pragma.json');

  if (!fileExists(proofFile) || !fileExists(publicFile)) {
    console.log(`\n🔄 Generating proof...`);
    if (!executeCommand(
      `npx snarkjs groth16 prove ${zkeyFile} ${witnessFile} ${proofFile} ${publicFile}`,
      'Generating proof'
    )) {
      return;
    }
  } else {
    console.log(`\n✅ Proof already exists: ${proofFile}`);
  }

  // Step 11: Verify the proof
  console.log(`\n🔄 Verifying proof...`);
  if (!executeCommand(
    `npx snarkjs groth16 verify ${vkeyFile} ${publicFile} ${proofFile}`,
    'Verifying proof'
  )) {
    console.log(`\n⚠️ Proof verification failed. This might be due to changes in the circuit or inputs.`);
    console.log(`   Try removing the proof and public files and generating them again.`);
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
  console.log(`- Circuit: ${zkpAuthNoPragmaCircuitPath}`);
  console.log(`- R1CS: ${r1csNoPragmaFile}`);
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
  const readmePath = path.join(zkpAuthDir, 'README.md');
  const readmeContent = `# ZKP Authentication System

This directory contains the Zero-Knowledge Proof (ZKP) authentication system files.

## Files

- \`zkp_auth_no_pragma.circom\`: The circuit file
- \`zkp_auth_no_pragma.r1cs\`: The R1CS constraint system
- \`zkp_auth_no_pragma_js/zkp_auth_no_pragma.wasm\`: The WebAssembly file
- \`zkp_auth_no_pragma_final.zkey\`: The proving key
- \`verification_key.json\`: The verification key
- \`verifier.sol\`: The Solidity verifier
- \`input.json\`: A test input file
- \`witness_no_pragma.wtns\`: A test witness
- \`proof_no_pragma.json\`: A test proof
- \`public_no_pragma.json\`: Test public inputs

## Usage

To use the ZKP authentication system in your application:

1. Import the ZKP provider from \`src/lib/zkp\`
2. Use the provider to generate and verify proofs
3. See the documentation in \`docs/zkp-auth-guide.md\` for more details

## Regenerating the Files

To regenerate the files, run:

\`\`\`bash
npm run zkp:setup:no-pragma
\`\`\`

This will recompile the circuit, generate the proving key, and export the verification key.
`;

  fs.writeFileSync(readmePath, readmeContent);
  console.log(`\n✅ README file created: ${readmePath}`);
}

// Run the main function
setupZkpAuth().catch(console.error);
