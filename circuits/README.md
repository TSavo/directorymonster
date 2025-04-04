# ZKP Authentication System

This directory contains the Zero-Knowledge Proof (ZKP) authentication system for DirectoryMonster.

## Overview

The ZKP authentication system allows users to prove they know their password without revealing it. This is done using a zero-knowledge proof circuit that:

1. Takes the username, password, and salt as private inputs
2. Takes the salt as a public input
3. Outputs a public key derived from the inputs

The system uses the Poseidon hash function, which is efficient for zero-knowledge proofs.

## Directory Structure

- `ptau/`: Contains the Powers of Tau files used for generating proving keys
- `zkp_auth/`: Contains the ZKP authentication circuit and related files
- `poseidon_constants.circom`: Contains the constants for the Poseidon hash function

## Setup

To set up the ZKP authentication system, run:

```bash
npm run zkp:setup
```

This will:

1. Generate a secure MDS matrix for the Poseidon hash function
2. Create the ZKP authentication circuit using the circomlib Poseidon implementation
3. Compile the circuit
4. Generate the proving key
5. Export the verification key
6. Create a test input file
7. Generate a witness
8. Generate a proof
9. Verify the proof

## Docker

To run the ZKP authentication system in Docker, run:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

This will build and run the Docker container, which will set up the ZKP authentication system.

To stop the Docker container:

```bash
docker-compose -f docker-compose.dev.yml down
```

## Usage

To use the ZKP authentication system in your application, import the `src/lib/zkp` module:

```typescript
import { generateProof, verifyProof } from './src/lib/zkp';

// Generate a proof
const { proof, publicSignals } = await generateProof('username', 'password', 'salt');

// Verify a proof
const isValid = await verifyProof(proof, publicSignals);
```

## Files

- `zkp_auth.circom`: The circuit definition
- `zkp_auth.r1cs`: The R1CS constraints
- `zkp_auth.sym`: The symbols file
- `zkp_auth_js/zkp_auth.wasm`: The WebAssembly file
- `zkp_auth_final.zkey`: The proving key
- `verification_key.json`: The verification key
- `verifier.sol`: The Solidity verifier
- `input.json`: A test input file
- `witness.wtns`: A test witness
- `proof.json`: A test proof
- `public.json`: The public inputs and outputs

## References

- [Circom](https://docs.circom.io/): The language used to write the circuit
- [SnarkJS](https://github.com/iden3/snarkjs): The JavaScript library used to generate and verify proofs
- [Poseidon](https://www.poseidon-hash.info/): The hash function used in the circuit
