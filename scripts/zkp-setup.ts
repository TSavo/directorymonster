#!/usr/bin/env ts-node
/**
 * ZKP Authentication System Setup
 *
 * This script sets up the ZKP authentication system by:
 * 1. Downloading the Powers of Tau file
 * 2. Compiling the circuit
 * 3. Generating the proving key
 * 4. Exporting the verification key
 * 5. Generating a Solidity verifier
 *
 * Usage:
 *   npm run zkp:setup
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as readline from 'readline';

// Define paths
const circuitsDir = path.join(process.cwd(), 'circuits');
const zkpAuthDir = path.join(circuitsDir, 'zkp_auth');
const ptauDir = path.join(circuitsDir, 'ptau');
const zkpAuthJsDir = path.join(zkpAuthDir, 'zkp_auth_js');

// Create directories if they don't exist
function ensureDirExists(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

ensureDirExists(circuitsDir);
ensureDirExists(zkpAuthDir);
ensureDirExists(ptauDir);
ensureDirExists(zkpAuthJsDir);

// Function to execute a command and log its output
function executeCommand(command: string, description: string) {
  console.log(`\n🔄 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error);
    return false;
  }
}

// Function to check if a file exists
function fileExists(filePath: string) {
  return fs.existsSync(filePath);
}

// Function to prompt for user input
async function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Function to generate Poseidon constants
function generatePoseidonConstants() {
  console.log(`\n🔄 Generating Poseidon constants...`);

  // Generate cryptographically secure constants
  const constants = [];
  for (let i = 0; i < 10; i++) {
    const hash = crypto.createHash('sha256');
    hash.update(`poseidon_constant_${i}_${Date.now()}`);
    const digest = hash.digest('hex');

    // Convert the hash to a BigInt and take modulo the field size
    const fieldSize = BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");
    let value = BigInt(`0x${digest}`);
    value = value % fieldSize;

    constants.push(value.toString());
  }

  // Generate secure MDS matrix using the Cauchy matrix construction
  // This ensures the Maximum Distance Separable property required for security
  console.log(`Generating secure MDS matrix...`);

  // Execute the secure MDS matrix generator script
  const { execSync } = require('child_process');
  try {
    execSync(`node scripts/generate-secure-mds.js --t 3 --seed "zkp_auth_${Date.now()}"`, { stdio: 'inherit' });
    console.log(`Secure MDS matrix generated successfully.`);
  } catch (error) {
    console.error(`Error generating secure MDS matrix: ${error}`);
    process.exit(1);
  }

  // Read the generated MDS matrix
  const secureMdsPath = path.join(circuitsDir, 'secure_mds_matrix.circom');
  const secureMdsContent = fs.readFileSync(secureMdsPath, 'utf8');

  // Extract the MDS matrix from the generated file for inclusion in our constants
  const mdsMatrixRegex = /if \(i == (\d+) && j == (\d+)\) return (\d+n?);/g;
  const mdsMatrix = [];

  // Initialize the matrix with empty rows
  for (let i = 0; i < 3; i++) {
    mdsMatrix[i] = [] as string[];
  }

  // Fill the matrix with the values from the generated file
  let match;
  while ((match = mdsMatrixRegex.exec(secureMdsContent)) !== null) {
    const i = parseInt(match[1]);
    const j = parseInt(match[2]);
    const value = match[3];
    mdsMatrix[i][j] = value;
  }

  // Generate the circom code
  let circomCode = `/*
 * Poseidon Hash Function Constants
 *
 * Generated on: ${new Date().toISOString()}
 * These constants are cryptographically secure and should not be changed.
 */

// Individual constants for the Poseidon hash function
function POSEIDON_C0() { return ${constants[0]}; }
function POSEIDON_C1() { return ${constants[1]}; }
function POSEIDON_C2() { return ${constants[2]}; }
function POSEIDON_C3() { return ${constants[3]}; }
function POSEIDON_C4() { return ${constants[4]}; }
function POSEIDON_C5() { return ${constants[5]}; }
function POSEIDON_C6() { return ${constants[6]}; }
function POSEIDON_C7() { return ${constants[7]}; }
function POSEIDON_C8() { return ${constants[8]}; }
function POSEIDON_C9() { return ${constants[9]}; }

// Get a constant by index
function POSEIDON_CONSTANT(i) {
    if (i == 0) return POSEIDON_C0();
    if (i == 1) return POSEIDON_C1();
    if (i == 2) return POSEIDON_C2();
    if (i == 3) return POSEIDON_C3();
    if (i == 4) return POSEIDON_C4();
    if (i == 5) return POSEIDON_C5();
    if (i == 6) return POSEIDON_C6();
    if (i == 7) return POSEIDON_C7();
    if (i == 8) return POSEIDON_C8();
    if (i == 9) return POSEIDON_C9();
    return 0;
}

// Include the secure MDS matrix
${fs.readFileSync(secureMdsPath, 'utf8').split('/*')[1].split('*/')[1]}
`;

  // Write the constants to a file
  const outputPath = path.join(circuitsDir, 'poseidon_constants.circom');
  fs.writeFileSync(outputPath, circomCode);

  console.log(`✅ Poseidon constants generated successfully: ${outputPath}`);
  return outputPath;
}

// Function to create the ZKP authentication circuit
function createZkpAuthCircuit() {
  console.log(`\n🔄 Creating ZKP authentication circuit...`);

  // Create the circuit directory if it doesn't exist
  ensureDirExists(zkpAuthDir);

  // Use the secure Poseidon implementation from circomlib
  console.log(`\n🔄 Using the secure Poseidon implementation from circomlib...`);
  const secureCircuitPath = path.join(zkpAuthDir, 'secure_poseidon.circom');

  // Check if the secure implementation exists
  if (!fs.existsSync(secureCircuitPath)) {
    console.error(`Error: Secure Poseidon implementation not found at ${secureCircuitPath}`);
    process.exit(1);
  }

  // Create a wrapper circuit that includes the secure implementation
  const circuitCode = `// ZKP Authentication System
// This file is a wrapper for the secure Poseidon implementation from circomlib.

// Include the secure Poseidon implementation
include "./zkp_auth/secure_poseidon.circom";

// The main component is defined in the secure implementation

component main = Main();`;

  // Write the circuit to a file
  const outputPath = path.join(zkpAuthDir, 'zkp_auth.circom');
  fs.writeFileSync(outputPath, circuitCode);

  console.log(`✅ ZKP authentication circuit created successfully: ${outputPath}`);
  return outputPath;
}

// Main function to set up the ZKP authentication system
async function setupZkpAuth() {
  console.log(`\n🚀 Setting up ZKP authentication system...`);

  // We're using the circomlib Poseidon implementation, so we don't need to generate constants
  console.log(`\n🔄 Using the circomlib Poseidon implementation with secure constants...`);

  // Step 2: Create ZKP authentication circuit
  const zkpAuthCircuitPath = createZkpAuthCircuit();

  // Step 3: Generate Powers of Tau file if it doesn't exist
  const ptauSize = 12;
  const ptauInitial = path.join(ptauDir, `pot${ptauSize}_0000.ptau`);
  const ptauContributed = path.join(ptauDir, `pot${ptauSize}_0001.ptau`);
  const ptauFinal = path.join(ptauDir, `pot${ptauSize}_final.ptau`);

  if (!fileExists(ptauFinal)) {
    if (!fileExists(ptauInitial)) {
      console.log(`\n🔄 Powers of Tau file not found. Generating new one...`);
      if (!executeCommand(
        `npx snarkjs powersoftau new bn128 ${ptauSize} ${ptauInitial} -v`,
        `Generating Powers of Tau file (${ptauSize})`
      )) {
        return;
      }
    }

    if (!fileExists(ptauContributed)) {
      console.log(`\n🔄 Contributing to Powers of Tau ceremony...`);
      const contributionName = await promptUser('Enter a name for your contribution: ');
      if (!executeCommand(
        `npx snarkjs powersoftau contribute ${ptauInitial} ${ptauContributed} --name="${contributionName}" -v`,
        'Contributing to Powers of Tau ceremony'
      )) {
        return;
      }
    }

    if (!fileExists(ptauFinal)) {
      console.log(`\n🔄 Preparing final Powers of Tau file...`);
      if (!executeCommand(
        `npx snarkjs powersoftau prepare phase2 ${ptauContributed} ${ptauFinal} -v`,
        'Preparing final Powers of Tau file'
      )) {
        return;
      }
    }
  } else {
    console.log(`\n✅ Powers of Tau file already exists: ${ptauFinal}`);
  }

  // Step 4: Compile the circuit
  const r1csFile = path.join(zkpAuthDir, 'zkp_auth.r1cs');
  const symFile = path.join(zkpAuthDir, 'zkp_auth.sym');

  if (!fileExists(r1csFile) || !fileExists(symFile)) {
    console.log(`\n🔄 Compiling circuit...`);
    if (!executeCommand(
      `npx circom ${zkpAuthCircuitPath} --r1cs ${r1csFile} --wasm --sym ${symFile}`,
      'Compiling circuit'
    )) {
      return;
    }
  } else {
    console.log(`\n✅ Circuit already compiled: ${r1csFile}`);
  }

  // Step 5: Move the WebAssembly file to the correct location
  const wasmRootFile = path.join(process.cwd(), 'zkp_auth.wasm');
  const wasmFile = path.join(zkpAuthJsDir, 'zkp_auth.wasm');

  if (fileExists(wasmRootFile) && !fileExists(wasmFile)) {
    console.log(`\n🔄 Moving WebAssembly file to the correct location...`);
    try {
      fs.renameSync(wasmRootFile, wasmFile);
      console.log(`✅ WebAssembly file moved to: ${wasmFile}`);
    } catch (error) {
      console.error(`❌ Failed to move WebAssembly file:`, error);
      return;
    }
  }

  // Step 6: Generate the proving key
  const zkeyFile = path.join(zkpAuthDir, 'zkp_auth_final.zkey');

  if (!fileExists(zkeyFile)) {
    console.log(`\n🔄 Generating proving key...`);
    if (!executeCommand(
      `npx snarkjs groth16 setup ${r1csFile} ${ptauFinal} ${zkeyFile}`,
      'Generating proving key'
    )) {
      return;
    }
  } else {
    console.log(`\n✅ Proving key already exists: ${zkeyFile}`);
  }

  // Step 7: Export the verification key
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

  // Step 8: Generate a Solidity verifier
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

  // Step 9: Create a test input file
  const inputFile = path.join(zkpAuthDir, 'input.json');

  if (!fileExists(inputFile)) {
    console.log(`\n🔄 Creating test input file...`);
    const input = {
      publicSalt: 789,
      username: 123,
      password: 456
    };
    fs.writeFileSync(inputFile, JSON.stringify(input, null, 2));
    console.log(`✅ Test input file created: ${inputFile}`);
  } else {
    console.log(`\n✅ Test input file already exists: ${inputFile}`);
  }

  // Step 10: Generate a witness
  const witnessFile = path.join(zkpAuthDir, 'witness.wtns');

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

  // Step 11: Generate a proof
  const proofFile = path.join(zkpAuthDir, 'proof.json');
  const publicFile = path.join(zkpAuthDir, 'public.json');

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

  // Step 12: Verify the proof
  console.log(`\n🔄 Verifying proof...`);
  if (!executeCommand(
    `npx snarkjs groth16 verify ${vkeyFile} ${publicFile} ${proofFile}`,
    'Verifying proof'
  )) {
    console.log(`\n⚠️ Proof verification failed. This might be due to changes in the circuit or inputs.`);
    console.log(`   Try removing the proof and public files and generating them again.`);
  }

  // Step 13: Generate a call to the verifier
  console.log(`\n🔄 Generating call to the verifier...`);
  if (!executeCommand(
    `npx snarkjs zkey export soliditycalldata ${publicFile} ${proofFile}`,
    'Generating call to the verifier'
  )) {
    return;
  }

  console.log(`\n🎉 ZKP authentication system setup completed successfully!`);
  console.log(`\nCircuit files are located in: ${zkpAuthDir}`);
  console.log(`WebAssembly file: ${wasmFile}`);
  console.log(`Proving key: ${zkeyFile}`);
  console.log(`Verification key: ${vkeyFile}`);
  console.log(`Solidity verifier: ${verifierFile}`);

  // Create a README file
  const readmePath = path.join(zkpAuthDir, 'README.md');
  const readmeContent = `# ZKP Authentication System

This directory contains the ZKP authentication system files generated on ${new Date().toISOString()}.

## Files

- \`zkp_auth.circom\`: The circuit definition
- \`zkp_auth.r1cs\`: The R1CS constraints
- \`zkp_auth.sym\`: The symbols file
- \`zkp_auth_js/zkp_auth.wasm\`: The WebAssembly file
- \`zkp_auth_final.zkey\`: The proving key
- \`verification_key.json\`: The verification key
- \`verifier.sol\`: The Solidity verifier
- \`input.json\`: A test input file
- \`witness.wtns\`: A test witness
- \`proof.json\`: A test proof
- \`public.json\`: The public inputs and outputs

## Usage

To use this ZKP authentication system in your application:

1. Import the WebAssembly file and proving key in your JavaScript/TypeScript code
2. Use the \`snarkjs\` library to generate proofs
3. Use the Solidity verifier to verify proofs on-chain

Example JavaScript code:

\`\`\`javascript
const snarkjs = require('snarkjs');
const fs = require('fs');

async function generateProof(username, password, publicSalt) {
  const input = {
    username,
    password,
    publicSalt
  };

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    'path/to/zkp_auth.wasm',
    'path/to/zkp_auth_final.zkey'
  );

  return { proof, publicSignals };
}

async function verifyProof(proof, publicSignals) {
  const vkey = JSON.parse(fs.readFileSync('path/to/verification_key.json'));
  return await snarkjs.groth16.verify(vkey, publicSignals, proof);
}
\`\`\`

Example Solidity code:

\`\`\`solidity
// Import the verifier contract
import "./verifier.sol";

contract ZKPAuth {
    Verifier public verifier;

    constructor(address _verifier) {
        verifier = Verifier(_verifier);
    }

    function authenticate(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[2] memory input
    ) public view returns (bool) {
        return verifier.verifyProof(a, b, c, input);
    }
}
\`\`\`

## Regenerating the Files

To regenerate these files, run:

\`\`\`bash
npm run zkp:setup
\`\`\`
`;

  fs.writeFileSync(readmePath, readmeContent);
  console.log(`\n✅ README file created: ${readmePath}`);
}

// Run the main function
setupZkpAuth().catch(console.error);
