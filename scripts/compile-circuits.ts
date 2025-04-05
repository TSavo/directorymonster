#!/usr/bin/env ts-node
/**
 * Circuit Compilation Script
 *
 * This script automates the process of compiling circom circuits, generating proving keys,
 * and exporting verification keys for use in the ZKP authentication system.
 *
 * Usage:
 *   npx ts-node scripts/compile-circuits.ts [--circuit <circuit-name>] [--ptau <ptau-size>]
 *
 * Options:
 *   --circuit <circuit-name>  Name of the circuit to compile (default: "auth")
 *   --ptau <ptau-size>        Size of the Powers of Tau file (default: 12)
 *
 * Example:
 *   npx ts-node scripts/compile-circuits.ts --circuit auth --ptau 14
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// Parse command line arguments
const args = process.argv.slice(2);
let circuitName = 'auth';
let ptauSize = 12;

console.log('Command line arguments:', args);

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--circuit' && i + 1 < args.length) {
    circuitName = args[i + 1];
    i++;
  } else if (args[i] === '--ptau' && i + 1 < args.length) {
    ptauSize = parseInt(args[i + 1], 10);
    i++;
  }
}

console.log(`Using circuit: ${circuitName}, ptau size: ${ptauSize}`);

// Define paths
const circuitsDir = path.join(process.cwd(), 'circuits');
const circuitDir = path.join(circuitsDir, circuitName);
const ptauDir = path.join(circuitsDir, 'ptau');
const circuitWasmDir = path.join(circuitDir, `${circuitName}_js`);

// Create directories if they don't exist
function ensureDirExists(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

ensureDirExists(circuitsDir);
ensureDirExists(circuitDir);
ensureDirExists(ptauDir);
ensureDirExists(circuitWasmDir);

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

// Main function to compile the circuit
async function compileCircuit() {
  console.log(`\n🔧 Starting compilation of ${circuitName} circuit with ptau size ${ptauSize}`);

  // Step 1: Check if the circuit file exists
  const circuitFile = path.join(circuitsDir, `${circuitName}.circom`);
  if (!fileExists(circuitFile)) {
    console.error(`❌ Circuit file not found: ${circuitFile}`);
    console.log('Please create the circuit file first.');
    return;
  }

  // Step 2: Generate Powers of Tau file if it doesn't exist
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

  // Step 3: Compile the circuit
  const r1csFile = path.join(circuitDir, `${circuitName}.r1cs`);
  const symFile = path.join(circuitDir, `${circuitName}.sym`);

  if (!fileExists(r1csFile) || !fileExists(symFile)) {
    console.log(`\n🔄 Compiling circuit...`);
    if (!executeCommand(
      `npx circom ${circuitFile} --r1cs ${r1csFile} --wasm --sym ${symFile}`,
      'Compiling circuit'
    )) {
      return;
    }
  } else {
    console.log(`\n✅ Circuit already compiled: ${r1csFile}`);
  }

  // Step 4: Generate the proving key
  const zkeyFile = path.join(circuitDir, `${circuitName}_final.zkey`);

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

  // Step 5: Export the verification key
  const vkeyFile = path.join(circuitDir, 'verification_key.json');

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

  // Step 6: Check if the WebAssembly file was created in the correct location
  const wasmFile = path.join(circuitWasmDir, `${circuitName}.wasm`);
  const wasmRootFile = path.join(process.cwd(), `${circuitName}.wasm`);

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

  if (!fileExists(wasmFile)) {
    console.error(`❌ WebAssembly file not found: ${wasmFile}`);
    console.log('Please check the circom compilation output.');
    return;
  } else {
    console.log(`\n✅ WebAssembly file exists: ${wasmFile}`);
  }

  // Step 7: Generate a simple test input
  const inputFile = path.join(circuitDir, 'input.json');

  if (!fileExists(inputFile)) {
    console.log(`\n🔄 Generating test input...`);
    try {
      // Read the circuit file to determine the inputs
      const circuitContent = fs.readFileSync(circuitFile, 'utf8');

      // Simple parsing to find input signals
      const inputSignals: string[] = [];
      const lines = circuitContent.split('\n');
      for (const line of lines) {
        const match = line.match(/signal\s+input\s+([a-zA-Z0-9_]+);/);
        if (match) {
          inputSignals.push(match[1]);
        }
      }

      // Generate a simple input JSON
      const input: Record<string, number> = {};
      for (const signal of inputSignals) {
        input[signal] = 5; // Default value
      }

      fs.writeFileSync(inputFile, JSON.stringify(input, null, 2));
      console.log(`✅ Test input generated: ${inputFile}`);
    } catch (error) {
      console.error(`❌ Failed to generate test input:`, error);
      return;
    }
  } else {
    console.log(`\n✅ Test input already exists: ${inputFile}`);
  }

  // Step 8: Generate a witness file
  const witnessFile = path.join(circuitDir, 'witness.wtns');

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

  // Step 9: Generate a test proof
  const proofFile = path.join(circuitDir, 'proof.json');
  const publicFile = path.join(circuitDir, 'public.json');

  if (!fileExists(proofFile) || !fileExists(publicFile)) {
    console.log(`\n🔄 Generating test proof...`);
    if (!executeCommand(
      `npx snarkjs groth16 prove ${zkeyFile} ${witnessFile} ${proofFile} ${publicFile}`,
      'Generating test proof'
    )) {
      return;
    }
  } else {
    console.log(`\n✅ Test proof already exists: ${proofFile}`);
  }

  // Step 10: Verify the test proof
  console.log(`\n🔄 Verifying test proof...`);
  if (!executeCommand(
    `npx snarkjs groth16 verify ${vkeyFile} ${publicFile} ${proofFile}`,
    'Verifying test proof'
  )) {
    return;
  }

  console.log(`\n🎉 Circuit compilation and setup completed successfully!`);
  console.log(`\nCircuit files are located in: ${circuitDir}`);
  console.log(`WebAssembly file: ${wasmFile}`);
  console.log(`Proving key: ${zkeyFile}`);
  console.log(`Verification key: ${vkeyFile}`);

  // Step 11: Update the ZKP implementation to use the new circuit
  console.log(`\n🔄 Updating ZKP implementation...`);
  const zkpIndexFile = path.join(process.cwd(), 'src', 'lib', 'zkp', 'index.js');

  if (fileExists(zkpIndexFile)) {
    try {
      let zkpContent = fs.readFileSync(zkpIndexFile, 'utf8');

      // Update the paths to the circuit files
      zkpContent = zkpContent.replace(
        /const circuitWasmPath = path\.join\([^)]+\);/,
        `const circuitWasmPath = path.join(__dirname, '../../../circuits/${circuitName}/${circuitName}_js/${circuitName}.wasm');`
      );

      zkpContent = zkpContent.replace(
        /const zkeyPath = path\.join\([^)]+\);/,
        `const zkeyPath = path.join(__dirname, '../../../circuits/${circuitName}/${circuitName}_final.zkey');`
      );

      zkpContent = zkpContent.replace(
        /const vKeyPath = path\.join\([^)]+\);/,
        `const vKeyPath = path.join(__dirname, '../../../circuits/${circuitName}/verification_key.json');`
      );

      // Update the input format for the circuit
      const inputContent = fs.readFileSync(inputFile, 'utf8');
      const inputJson = JSON.parse(inputContent);

      const inputStr = JSON.stringify(inputJson, null, 6);

      zkpContent = zkpContent.replace(
        /const input = \{[^}]+\};/s,
        `const input = ${inputStr};`
      );

      fs.writeFileSync(zkpIndexFile, zkpContent);
      console.log(`✅ ZKP implementation updated: ${zkpIndexFile}`);
    } catch (error) {
      console.error(`❌ Failed to update ZKP implementation:`, error);
    }
  } else {
    console.log(`⚠️ ZKP implementation file not found: ${zkpIndexFile}`);
  }

  console.log(`\n🚀 All done! You can now use the ZKP system with the ${circuitName} circuit.`);
}

// Run the main function
compileCircuit().catch(console.error);
